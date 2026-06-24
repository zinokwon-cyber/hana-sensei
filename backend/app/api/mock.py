"""Mock API endpoints — only active when MOCK_MODE=true.
Allows running the full UI without real OpenAI / Azure / AWS credentials.
"""
import uuid
import base64
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user_id
from app.models.user import User
from app.models.emoji import Emoji
from app.schemas.user import TokenResponse, UserResponse
from app.schemas.emoji import EmojiGenerateRequest, EmojiResponse

router = APIRouter(prefix="/mock", tags=["Mock (dev only)"])

MOCK_USERS = [
    {"email": "demo@3top.co.kr", "name": "데모 사용자", "azure_oid": "mock-oid-001"},
    {"email": "admin@3top.co.kr", "name": "관리자", "azure_oid": "mock-oid-002"},
]

_STYLE_CFG = {
    "기본":  {"color": "#6B4E9A", "bg": "#F5F0FF", "icon": "&#x1F4BC;"},
    "귀여움": {"color": "#D63384", "bg": "#FFF0F7", "icon": "&#x2665;"},
    "집중":  {"color": "#2C73D2", "bg": "#F0F4FF", "icon": "&#x25CE;"},
    "행복":  {"color": "#E67E00", "bg": "#FFF8F0", "icon": "&#x2605;"},
}


def mock_image_url(title: str, style: str) -> str:
    cfg = _STYLE_CFG.get(style, _STYLE_CFG["기본"])
    color, bg, icon = cfg["color"], cfg["bg"], cfg["icon"]
    display = title[:10] if len(title) > 10 else title

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">'
        f'<rect width="400" height="400" rx="60" fill="{bg}"/>'
        f'<circle cx="200" cy="155" r="95" fill="{color}" opacity="0.12"/>'
        f'<text x="200" y="170" font-size="96" text-anchor="middle"'
        f' dominant-baseline="middle" font-family="serif">{icon}</text>'
        f'<rect x="40" y="268" width="320" height="68" rx="14" fill="{color}"/>'
        f'<text x="200" y="308" font-size="36" font-weight="bold" fill="white"'
        f' text-anchor="middle" dominant-baseline="middle"'
        f' font-family="Arial,Helvetica,sans-serif">{display}</text>'
        f'<text x="200" y="368" font-size="20" fill="{color}" text-anchor="middle"'
        f' opacity="0.55" font-family="Arial,Helvetica,sans-serif">3TOP Buddy · {style}</text>'
        f'</svg>'
    )
    encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"


@router.post("/login", response_model=TokenResponse)
async def mock_login(
    user_index: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Log in as a mock user without Azure AD. user_index=0 for demo, 1 for admin."""
    user_data = MOCK_USERS[user_index % len(MOCK_USERS)]

    result = await db.execute(select(User).where(User.azure_oid == user_data["azure_oid"]))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=uuid.uuid4(),
            email=user_data["email"],
            name=user_data["name"],
            azure_oid=user_data["azure_oid"],
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/emojis/generate", response_model=EmojiResponse)
async def mock_generate(
    request: EmojiGenerateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Generate a placeholder emoji without calling OpenAI or S3."""
    emoji_id = uuid.uuid4()
    image_url = mock_image_url(request.title, request.style)
    prompt = f"[MOCK] 3TOP Buddy doing '{request.title}' in style '{request.style}'"

    emoji = Emoji(
        id=emoji_id,
        user_id=uuid.UUID(user_id),
        title=request.title,
        prompt=prompt,
        image_url=image_url,
        style=request.style,
    )
    db.add(emoji)
    await db.flush()
    await db.refresh(emoji)

    return EmojiResponse.model_validate(emoji)
