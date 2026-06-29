from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user_id
from app.models.user import User
from app.schemas.user import TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

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
