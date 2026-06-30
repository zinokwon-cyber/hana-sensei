import math
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.emoji import Emoji
from app.models.user import User
from app.schemas.admin import (
    AdminDashboardResponse,
    AdminEmojiItem,
    AdminEmojiListResponse,
    AdminUserItem,
    AdminUserListResponse,
    DailyReportItem,
    HourlyReportItem,
    StyleReportItem,
    WeekdayReportItem,
)

router = APIRouter(prefix="/admin", tags=["Admin"])

_WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"]


async def require_admin(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


@router.get("/dashboard", response_model=AdminDashboardResponse)
async def get_dashboard(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)

    total_users = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    total_emojis = (await db.execute(select(func.count()).select_from(Emoji))).scalar() or 0
    today_emojis = (
        await db.execute(
            select(func.count()).select_from(Emoji).where(Emoji.created_at >= today_start)
        )
    ).scalar() or 0
    this_week_emojis = (
        await db.execute(
            select(func.count()).select_from(Emoji).where(Emoji.created_at >= week_start)
        )
    ).scalar() or 0

    return AdminDashboardResponse(
        total_users=total_users,
        total_emojis=total_emojis,
        today_emojis=today_emojis,
        this_week_emojis=this_week_emojis,
    )


@router.get("/reports/daily", response_model=list[DailyReportItem])
async def get_daily_report(
    days: int = Query(30, ge=7, le=90),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        await db.execute(
            select(
                func.date(Emoji.created_at).label("d"),
                func.count().label("count"),
            )
            .where(Emoji.created_at >= since)
            .group_by(func.date(Emoji.created_at))
            .order_by(func.date(Emoji.created_at))
        )
    ).all()
    return [DailyReportItem(date=str(r.d), count=r.count) for r in rows]


@router.get("/reports/by-weekday", response_model=list[WeekdayReportItem])
async def get_weekday_report(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    # PostgreSQL ISODOW: 1=Mon … 7=Sun → normalize to 0-indexed
    rows = (
        await db.execute(
            select(
                (func.extract("isodow", Emoji.created_at) - 1).label("wd"),
                func.count().label("count"),
            )
            .group_by("wd")
            .order_by("wd")
        )
    ).all()
    data = {int(r.wd): r.count for r in rows}
    return [
        WeekdayReportItem(weekday=i, weekday_label=_WEEKDAY_LABELS[i], count=data.get(i, 0))
        for i in range(7)
    ]


@router.get("/reports/by-hour", response_model=list[HourlyReportItem])
async def get_hourly_report(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(
                func.extract("hour", Emoji.created_at).label("h"),
                func.count().label("count"),
            )
            .group_by("h")
            .order_by("h")
        )
    ).all()
    data = {int(r.h): r.count for r in rows}
    return [HourlyReportItem(hour=h, count=data.get(h, 0)) for h in range(24)]


@router.get("/reports/by-style", response_model=list[StyleReportItem])
async def get_style_report(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(Emoji.style, func.count().label("count"))
            .group_by(Emoji.style)
            .order_by(func.count().desc())
        )
    ).all()
    total = sum(r.count for r in rows)
    return [
        StyleReportItem(
            style=r.style,
            count=r.count,
            percentage=round(r.count / total * 100, 1) if total > 0 else 0.0,
        )
        for r in rows
    ]


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    emoji_sub = (
        select(Emoji.user_id, func.count().label("cnt"))
        .group_by(Emoji.user_id)
        .subquery()
    )
    base_q = select(User, func.coalesce(emoji_sub.c.cnt, 0).label("emoji_count")).outerjoin(
        emoji_sub, User.id == emoji_sub.c.user_id
    )
    if search:
        base_q = base_q.where(
            User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )

    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar() or 0
    rows = (
        await db.execute(
            base_q.order_by(User.created_at.desc()).offset((page - 1) * size).limit(size)
        )
    ).all()

    items = [
        AdminUserItem(
            id=u.id,
            email=u.email,
            name=u.name,
            is_admin=u.is_admin,
            created_at=u.created_at,
            emoji_count=cnt,
        )
        for u, cnt in rows
    ]
    return AdminUserListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=max(1, math.ceil(total / size)),
    )


@router.get("/emojis", response_model=AdminEmojiListResponse)
async def list_all_emojis(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(
        Emoji,
        User.name.label("user_name"),
        User.email.label("user_email"),
    ).join(User, Emoji.user_id == User.id)
    if search:
        base_q = base_q.where(
            Emoji.title.ilike(f"%{search}%")
            | User.name.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
        )

    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar() or 0
    rows = (
        await db.execute(
            base_q.order_by(Emoji.created_at.desc()).offset((page - 1) * size).limit(size)
        )
    ).all()

    items = [
        AdminEmojiItem(
            id=e.id,
            user_id=e.user_id,
            user_name=user_name,
            user_email=user_email,
            title=e.title,
            style=e.style,
            image_url=e.image_url,
            created_at=e.created_at,
        )
        for e, user_name, user_email in rows
    ]
    return AdminEmojiListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=max(1, math.ceil(total / size)),
    )


@router.delete("/emojis/{emoji_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_emoji_admin(
    emoji_id: str,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Emoji).where(Emoji.id == emoji_id))
    emoji = result.scalar_one_or_none()
    if not emoji:
        raise HTTPException(status_code=404, detail="Emoji not found")
    await db.delete(emoji)


@router.patch("/users/{user_id}/admin")
async def toggle_user_admin(
    user_id: str,
    is_admin: bool,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if str(current_admin.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot modify own admin status")
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_admin = is_admin
    return {"id": str(target.id), "is_admin": target.is_admin}
