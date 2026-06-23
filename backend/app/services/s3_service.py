import uuid
import boto3
from botocore.exceptions import ClientError
from io import BytesIO

from app.core.config import settings

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
)


def get_public_url(s3_key: str) -> str:
    if settings.S3_BASE_URL:
        return f"{settings.S3_BASE_URL.rstrip('/')}/{s3_key}"
    return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"


async def upload_emoji_image(
    image_bytes: bytes,
    user_id: str,
    emoji_id: str,
) -> str:
    """Upload PNG image bytes to S3 and return the public URL."""
    s3_key = f"emojis/{user_id}/{emoji_id}.png"

    s3_client.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=s3_key,
        Body=BytesIO(image_bytes),
        ContentType="image/png",
        CacheControl="max-age=31536000",
    )

    return get_public_url(s3_key)


async def delete_emoji_image(image_url: str) -> None:
    """Delete emoji image from S3 given its public URL."""
    try:
        if settings.S3_BASE_URL:
            s3_key = image_url.replace(settings.S3_BASE_URL.rstrip("/") + "/", "")
        else:
            base = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/"
            s3_key = image_url.replace(base, "")

        s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=s3_key)
    except ClientError:
        pass  # Log and continue; S3 delete failures are non-critical
