import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user_id
from app.models.user import User
from app.schemas.user import TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{h}"


def _verify_password(password: str, hashed: str) -> bool:
    try:
        salt, h = hashed.split(":", 1)
        return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == h
    except Exception:
        return False


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str


class LoginPasswordRequest(BaseModel):
    email: EmailStr
    password: str

MICROSOFT_GRAPH_ME_URL = "https://graph.microsoft.com/v1.0/me"


@router.post("/login", response_model=TokenResponse)
async def login_with_azure(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Exchange Azure AD authorization code for JWT access token."""
    token_url = f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}/oauth2/v2.0/token"

    # Exchange code for tokens with Microsoft
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            token_url,
            data={
                "client_id": settings.AZURE_CLIENT_ID,
                "client_secret": settings.AZURE_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.AZURE_REDIRECT_URI,
                "grant_type": "authorization_code",
                "scope": "openid profile email User.Read",
            },
        )

    if token_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to authenticate with Microsoft",
        )

    token_data = token_response.json()
    ms_access_token = token_data.get("access_token")

    # Fetch user profile from Microsoft Graph
    async with httpx.AsyncClient() as client:
        profile_response = await client.get(
            MICROSOFT_GRAPH_ME_URL,
            headers={"Authorization": f"Bearer {ms_access_token}"},
        )

    if profile_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to fetch user profile from Microsoft",
        )

    profile = profile_response.json()
    azure_oid = profile.get("id")
    email = profile.get("mail") or profile.get("userPrincipalName", "")
    name = profile.get("displayName", email.split("@")[0])

    if not azure_oid or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incomplete profile data from Microsoft",
        )

    # Upsert user
    result = await db.execute(select(User).where(User.azure_oid == azure_oid))
    user = result.scalar_one_or_none()

    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

    if user:
        user.name = name
        user.azure_oid = azure_oid
    else:
        user = User(email=email, name=name, azure_oid=azure_oid)
        db.add(user)

    if settings.ADMIN_EMAILS and email in settings.ADMIN_EMAILS:
        user.is_admin = True

    await db.flush()
    await db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=TokenResponse)
async def register(
    req: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new account with email and password."""
    if settings.ALLOWED_EMAIL_DOMAINS:
        domain = req.email.split("@")[-1]
        if domain not in settings.ALLOWED_EMAIL_DOMAINS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"이 이메일 도메인은 가입이 허용되지 않습니다: @{domain}",
            )

    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 가입된 이메일입니다.")

    if len(req.password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="비밀번호는 8자 이상이어야 합니다.")

    is_admin = bool(settings.ADMIN_EMAILS and req.email in settings.ADMIN_EMAILS)
    user = User(
        email=req.email,
        name=req.name,
        password_hash=_hash_password(req.password),
        is_admin=is_admin,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login-password", response_model=TokenResponse)
async def login_with_password(
    req: LoginPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not _verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )

    if settings.ADMIN_EMAILS and req.email in settings.ADMIN_EMAILS:
        user.is_admin = True

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)
