"""Initial seed script - creates sample users and demo emoji records."""
import asyncio
import uuid
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.models.user import User
from app.models.emoji import Emoji

DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

DEMO_USERS = [
    {
        "email": "admin@3top.co.kr",
        "name": "관리자",
        "azure_oid": "demo-azure-oid-001",
    },
    {
        "email": "employee1@3top.co.kr",
        "name": "김직원",
        "azure_oid": "demo-azure-oid-002",
    },
]

DEMO_EMOJIS = [
    {
        "title": "회의중",
        "style": "기본",
        "prompt": "Demo prompt - 3TOP Buddy in meeting",
        "image_url": "https://placehold.co/512x512/6B4E9A/white?text=회의중",
    },
    {
        "title": "출장중",
        "style": "귀여움",
        "prompt": "Demo prompt - 3TOP Buddy on business trip",
        "image_url": "https://placehold.co/512x512/3E5CB8/white?text=출장중",
    },
    {
        "title": "휴가중",
        "style": "행복",
        "prompt": "Demo prompt - 3TOP Buddy on vacation",
        "image_url": "https://placehold.co/512x512/2C73D2/white?text=휴가중",
    },
]


async def seed():
    async with SessionLocal() as session:
        # Create demo users
        created_users = []
        for user_data in DEMO_USERS:
            user = User(
                id=uuid.uuid4(),
                email=user_data["email"],
                name=user_data["name"],
                azure_oid=user_data["azure_oid"],
            )
            session.add(user)
            created_users.append(user)
            print(f"Created user: {user.email}")

        await session.flush()

        # Create demo emojis for first user
        admin_user = created_users[0]
        for emoji_data in DEMO_EMOJIS:
            emoji = Emoji(
                id=uuid.uuid4(),
                user_id=admin_user.id,
                title=emoji_data["title"],
                style=emoji_data["style"],
                prompt=emoji_data["prompt"],
                image_url=emoji_data["image_url"],
            )
            session.add(emoji)
            print(f"Created emoji: {emoji.title}")

        await session.commit()
        print("\nSeed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
