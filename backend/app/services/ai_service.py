import base64
from openai import AsyncOpenAI

from app.core.config import settings

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


STYLE_MODIFIERS = {
    "기본": "neutral expression, standard pose, professional look",
    "귀여움": "extra cute, big sparkly eyes, wide smile, cheerful, adorable",
    "집중": "focused expression, determined look, concentration, serious but friendly",
    "행복": "very happy, celebrating, joyful, excited, big grin, arms raised",
}

STATUS_CONTEXT = {
    "회의중": "sitting in a meeting, holding papers or tablet",
    "출장중": "carrying a travel bag or suitcase, on the move",
    "프로젝트중": "working on a laptop, surrounded by project notes",
    "외근중": "outside the office, business casual outdoor setting",
    "휴가중": "relaxing, vacation mode, sunglasses or beach hat",
    "고객미팅중": "handshake pose or greeting gesture, professional meeting",
    "제안서작성중": "writing or typing intensely, focused on a document",
}


def build_prompt(title: str, style: str) -> str:
    style_mod = STYLE_MODIFIERS.get(style, STYLE_MODIFIERS["기본"])
    context = STATUS_CONTEXT.get(title, f"doing {title} activity")

    return (
        f"A cute corporate mascot character called '3TOP Buddy' as a sticker emoji. "
        f"The character is round and cute with an AI assistant vibe, friendly expression, "
        f"and consistent design. "
        f"Character is {context}. "
        f"Style: {style_mod}. "
        f"Brand colors: primary purple #6B4E9A, primary blue #3E5CB8, accent blue #2C73D2. "
        f"The character wears or incorporates these brand colors. "
        f"Completely transparent background. "
        f"Sticker style with clean outlines. "
        f"No text, no words, no letters anywhere in the image. "
        f"Single character centered in frame. "
        f"Kakao emoticon quality, high detail, clean vector-like illustration. "
        f"512x512 pixel equivalent composition."
    )


async def generate_emoji_image(title: str, style: str) -> tuple[bytes, str]:
    """Generate emoji image using OpenAI DALL-E and return (image_bytes, prompt)."""
    prompt = build_prompt(title, style)

    response = await _get_client().images.generate(
        model=settings.OPENAI_IMAGE_MODEL,
        prompt=prompt,
        size=settings.OPENAI_IMAGE_SIZE,
        quality=settings.OPENAI_IMAGE_QUALITY,
        n=1,
        response_format="b64_json",
    )

    image_b64 = response.data[0].b64_json
    image_bytes = base64.b64decode(image_b64)

    return image_bytes, prompt
