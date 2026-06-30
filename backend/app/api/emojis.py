import uuid
import math
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

logger = logging.getLogger(__name__)

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.emoji import Emoji
from app.schemas.emoji import EmojiGenerateRequest, EmojiResponse, EmojiListResponse
from app.services.ai_service import generate_emoji_image
from app.services.s3_service import upload_emoji_image, delete_emoji_image

router = APIRouter(prefix="/emojis", tags=["Emojis"])


@router.post("/generate", response_model=EmojiResponse, status_code=status.HTTP_201_CREATED)
async def generate_emoji(
    request: EmojiGenerateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new emoji using AI and store in MinIO/S3."""
    emoji_id = str(uuid.uuid4())

    try:
        image_bytes, prompt = await generate_emoji_image(request.title, request.style)
    except Exception as e:
        logger.error("Image generation failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
        )

    try:
        image_url = await upload_emoji_image(image_bytes, user_id, emoji_id)
    except Exception as e:
        logger.error("Image upload failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="이미지 저장에 실패했습니다. 스토리지 설정을 확인해주세요.",
        )

    emoji = Emoji(
        id=uuid.UUID(emoji_id),
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


@router.get("", response_model=EmojiListResponse)
async def list_emojis(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=12, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List authenticated user's emojis with pagination."""
    offset = (page - 1) * size

    count_result = await db.execute(
        select(func.count()).select_from(Emoji).where(Emoji.user_id == user_id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Emoji)
        .where(Emoji.user_id == user_id)
        .order_by(Emoji.created_at.desc())
        .offset(offset)
        .limit(size)
    )
    emojis = result.scalars().all()

    return EmojiListResponse(
        items=[EmojiResponse.model_validate(e) for e in emojis],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1,
    )


@router.get("/{emoji_id}", response_model=EmojiResponse)
async def get_emoji(
    emoji_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get a single emoji by ID (must belong to authenticated user)."""
    result = await db.execute(
        select(Emoji).where(Emoji.id == emoji_id, Emoji.user_id == user_id)
    )
    emoji = result.scalar_one_or_none()
    if not emoji:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emoji not found")
    return EmojiResponse.model_validate(emoji)


@router.delete("/{emoji_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_emoji(
    emoji_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete an emoji (must belong to authenticated user)."""
    result = await db.execute(
        select(Emoji).where(Emoji.id == emoji_id, Emoji.user_id == user_id)
    )
    emoji = result.scalar_one_or_none()
    if not emoji:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emoji not found")

    image_url = emoji.image_url
    await db.delete(emoji)
    await db.flush()

    # Delete from S3 (non-blocking failure)
    await delete_emoji_image(image_url)
