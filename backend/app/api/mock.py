"""Mock API endpoints — only active when MOCK_MODE=true.
Allows running the full UI without real OpenAI / Azure / AWS credentials.
"""
import uuid
import math
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
    {"email": "demo@3top.co.kr", "name": "데모 사용자", "azure_oid": "mock-oid-001", "is_admin": False},
    {"email": "admin@3top.co.kr", "name": "관리자", "azure_oid": "mock-oid-002", "is_admin": True},
]

_STYLE_CFG = {
    "기본":  {"color": "#6B4E9A", "bg": "#F5F0FF"},
    "귀여움": {"color": "#D63384", "bg": "#FFF0F7"},
    "집중":  {"color": "#2C73D2", "bg": "#F0F4FF"},
    "행복":  {"color": "#E67E00", "bg": "#FFF8F0"},
}

# SVG path shapes — one per keyword, font-independent
_TITLE_SHAPES: list[tuple[str, str]] = [
    ("회의",   '<rect x="130" y="110" width="140" height="100" rx="12" fill="{c}" opacity="0.8"/>'
               '<polygon points="160,210 200,240 240,210" fill="{c}" opacity="0.8"/>'),
    ("미팅",   '<circle cx="160" cy="150" r="38" fill="{c}" opacity="0.75"/>'
               '<circle cx="240" cy="150" r="38" fill="{c}" opacity="0.75"/>'),
    ("출장",   '<polygon points="200,90 310,230 90,230" fill="{c}" opacity="0.8"/>'),
    ("외근",   '<circle cx="200" cy="160" r="65" fill="none" stroke="{c}" stroke-width="18" opacity="0.8"/>'
               '<polygon points="200,100 245,160 155,160" fill="{c}" opacity="0.8"/>'),
    ("휴가",   '<circle cx="200" cy="160" r="52" fill="{c}" opacity="0.8"/>'
               + "".join(
                   f'<line x1="200" y1="160" x2="{int(200+95*math.cos(math.radians(a)))}"'
                   f' y2="{int(160+95*math.sin(math.radians(a)))}"'
                   f' stroke="{{c}}" stroke-width="14" stroke-linecap="round" opacity="0.6"/>'
                   for a in range(0, 360, 45)
               )),
    ("프로젝트", '<rect x="110" y="110" width="60" height="60" rx="8" fill="{c}" opacity="0.8"/>'
                '<rect x="185" y="110" width="105" height="60" rx="8" fill="{c}" opacity="0.5"/>'
                '<rect x="110" y="185" width="105" height="60" rx="8" fill="{c}" opacity="0.5"/>'
                '<rect x="230" y="185" width="60" height="60" rx="8" fill="{c}" opacity="0.8"/>'),
    ("제안서",  '<rect x="130" y="95" width="140" height="175" rx="10" fill="{c}" opacity="0.8"/>'
               '<rect x="148" y="128" width="104" height="12" rx="4" fill="white" opacity="0.9"/>'
               '<rect x="148" y="155" width="104" height="12" rx="4" fill="white" opacity="0.9"/>'
               '<rect x="148" y="182" width="80"  height="12" rx="4" fill="white" opacity="0.9"/>'),
    ("작성",   '<rect x="145" y="95"  width="110" height="145" rx="8" fill="{c}" opacity="0.7"/>'
               '<line x1="162" y1="130" x2="238" y2="130" stroke="white" stroke-width="10" stroke-linecap="round"/>'
               '<line x1="162" y1="155" x2="238" y2="155" stroke="white" stroke-width="10" stroke-linecap="round"/>'
               '<line x1="162" y1="180" x2="210" y2="180" stroke="white" stroke-width="10" stroke-linecap="round"/>'
               '<line x1="195" y1="230" x2="270" y2="155" stroke="{c}" stroke-width="16" stroke-linecap="round"/>'
               '<polygon points="265,148 280,175 252,170" fill="{c}" opacity="0.9"/>'),
    ("고객",   '<circle cx="175" cy="140" r="42" fill="{c}" opacity="0.8"/>'
               '<path d="M95 240 Q175 195 255 240" fill="{c}" opacity="0.8"/>'
               '<circle cx="250" cy="148" r="34" fill="{c}" opacity="0.55"/>'
               '<path d="M185 240 Q250 205 315 240" fill="{c}" opacity="0.5"/>'),
    ("집중",   '<circle cx="200" cy="160" r="80" fill="none" stroke="{c}" stroke-width="16" opacity="0.8"/>'
               '<circle cx="200" cy="160" r="52" fill="none" stroke="{c}" stroke-width="14" opacity="0.6"/>'
               '<circle cx="200" cy="160" r="24" fill="{c}" opacity="0.9"/>'),
    ("개발",   '<polygon points="155,120 130,160 155,200" fill="{c}" opacity="0.8"/>'
               '<polygon points="245,120 270,160 245,200" fill="{c}" opacity="0.8"/>'
               '<line x1="175" y1="195" x2="225" y2="125" stroke="{c}" stroke-width="16"'
               ' stroke-linecap="round" opacity="0.7"/>'),
]

_FALLBACK_SHAPES = [
    '<polygon points="200,95 285,250 115,250" fill="{c}" opacity="0.8"/>',
    '<rect x="120" y="110" width="160" height="100" rx="16" fill="{c}" opacity="0.8"/>',
    '<circle cx="200" cy="160" r="75" fill="{c}" opacity="0.8"/>',
    '<polygon points="200,95 305,165 265,270 135,270 95,165" fill="{c}" opacity="0.8"/>',
    '<circle cx="200" cy="160" r="80" fill="none" stroke="{c}" stroke-width="24" opacity="0.8"/>'
    '<circle cx="200" cy="160" r="36" fill="{c}" opacity="0.9"/>',
    '<rect x="120" y="120" width="72" height="72" rx="10" fill="{c}" opacity="0.8"/>'
    '<rect x="208" y="120" width="72" height="72" rx="10" fill="{c}" opacity="0.5"/>'
    '<rect x="120" y="208" width="72" height="72" rx="10" fill="{c}" opacity="0.5"/>'
    '<rect x="208" y="208" width="72" height="72" rx="10" fill="{c}" opacity="0.8"/>',
]


def _pick_shape(title: str) -> str:
    for keyword, shape in _TITLE_SHAPES:
        if keyword in title:
            return shape
    return _FALLBACK_SHAPES[abs(hash(title)) % len(_FALLBACK_SHAPES)]


def _style_deco(style: str, color: str) -> str:
    """Return style-specific background decoration that makes each style visually distinct."""
    if style == "귀여움":
        # Floating bubble circles around the shape
        return (
            f'<circle cx="98"  cy="95"  r="30" fill="{color}" opacity="0.22"/>'
            f'<circle cx="312" cy="82"  r="22" fill="{color}" opacity="0.18"/>'
            f'<circle cx="325" cy="235" r="26" fill="{color}" opacity="0.2"/>'
            f'<circle cx="85"  cy="248" r="19" fill="{color}" opacity="0.17"/>'
            f'<circle cx="200" cy="58"  r="15" fill="{color}" opacity="0.14"/>'
        )
    elif style == "집중":
        # Crosshair + concentric rings — radar feel
        return (
            f'<circle cx="200" cy="160" r="170" fill="none" stroke="{color}" stroke-width="3" opacity="0.1"/>'
            f'<circle cx="200" cy="160" r="135" fill="none" stroke="{color}" stroke-width="2" opacity="0.08"/>'
            f'<line x1="200" y1="0"  x2="200" y2="320" stroke="{color}" stroke-width="2" opacity="0.09"/>'
            f'<line x1="30"  y1="160" x2="370" y2="160" stroke="{color}" stroke-width="2" opacity="0.09"/>'
        )
    elif style == "행복":
        # 4-point sparkle stars at corners
        def _star(cx: int, cy: int, r: int, op: float) -> str:
            pts = []
            for i in range(8):
                a = math.radians(i * 45 - 90)
                radius = r if i % 2 == 0 else r * 0.42
                pts.append(f"{int(cx + radius * math.cos(a))},{int(cy + radius * math.sin(a))}")
            return f'<polygon points="{" ".join(pts)}" fill="{color}" opacity="{op}"/>'
        return _star(105, 88, 32, 0.42) + _star(302, 74, 24, 0.35) + _star(318, 238, 28, 0.38) + _star(88, 252, 20, 0.3)
    else:  # 기본
        # Subtle soft halo — understated, professional
        return f'<circle cx="200" cy="160" r="155" fill="{color}" opacity="0.07"/>'


def mock_image_url(title: str, style: str) -> str:
    cfg = _STYLE_CFG.get(style, _STYLE_CFG["기본"])
    color, bg = cfg["color"], cfg["bg"]
    display = title[:10] if len(title) > 10 else title
    shape = _pick_shape(title).replace("{c}", color)
    deco = _style_deco(style, color)

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">'
        f'<rect width="400" height="400" rx="60" fill="{bg}"/>'
        f'{deco}'
        f'{shape}'
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
            is_admin=user_data.get("is_admin", False),
        )
        db.add(user)
    else:
        user.is_admin = user_data.get("is_admin", False)

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
