"""Mock API endpoints — only active when MOCK_MODE=true.
Allows running the full UI without real OpenAI / Azure / AWS credentials.
"""
import uuid
import random
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

# Placeholder emoji images using picsum (random but deterministic by seed)
PLACEHOLDER_COLORS = ["6B4E9A", "3E5CB8", "2C73D2", "8B6DBF", "4A8EE8"]


def mock_image_url(title: str, style: str) -> str:
    seed = abs(hash(title + style)) % 1000
    color = PLACEHOLDER_COLORS[seed % len(PLACEHOLDER_COLORS)]
    label = f"{title}+({style})"
    return f"https://placehold.co/512x512/{color}/ffffff?text={label}"


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
