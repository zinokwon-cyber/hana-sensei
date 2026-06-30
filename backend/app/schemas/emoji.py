from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List


class EmojiGenerateRequest(BaseModel):
    title: str
    style: str = "기본"


class EmojiResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    prompt: str
    image_url: str
    style: str
    created_at: datetime

    class Config:
        from_attributes = True


class EmojiListResponse(BaseModel):
    items: List[EmojiResponse]
    total: int
    page: int
    size: int
    pages: int
