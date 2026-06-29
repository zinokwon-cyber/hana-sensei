from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_emojis: int
    today_emojis: int
    this_week_emojis: int


class DailyReportItem(BaseModel):
    date: str
    count: int


class WeekdayReportItem(BaseModel):
    weekday: int
    weekday_label: str
    count: int


class HourlyReportItem(BaseModel):
    hour: int
    count: int


class StyleReportItem(BaseModel):
    style: str
    count: int
    percentage: float


class AdminUserItem(BaseModel):
    id: UUID
    email: str
    name: str
    is_admin: bool
    created_at: datetime
    emoji_count: int


class AdminUserListResponse(BaseModel):
    items: list[AdminUserItem]
    total: int
    page: int
    size: int
    pages: int


class AdminEmojiItem(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    user_email: str
    title: str
    style: str
    image_url: str
    created_at: datetime


class AdminEmojiListResponse(BaseModel):
    items: list[AdminEmojiItem]
    total: int
    page: int
    size: int
    pages: int
