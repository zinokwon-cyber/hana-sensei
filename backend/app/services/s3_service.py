import asyncio
import boto3
from botocore.exceptions import ClientError
from io import BytesIO
from typing import TYPE_CHECKING

from app.core.config import settings

if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client

_s3_client = None


def _get_s3():
    global _s3_client
    if _s3_client is None:
        if settings.STORAGE_PROVIDER == "minio":
            _s3_client = boto3.client(
                "s3",
                endpoint_url=settings.MINIO_ENDPOINT,
                aws_access_key_id=settings.MINIO_ROOT_USER,
                aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
                region_name="us-east-1",
            )
        else:
            _s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
    return _s3_client


def get_public_url(s3_key: str) -> str:
    if settings.S3_BASE_URL:
        return f"{settings.S3_BASE_URL.rstrip('/')}/{s3_key}"
    if settings.STORAGE_PROVIDER == "minio":
        # Route through nginx proxy (/storage/) so browser doesn't need direct MinIO port access
        return f"http://localhost/storage/{settings.S3_BUCKET_NAME}/{s3_key}"
    return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"


async def upload_emoji_image(
    image_bytes: bytes,
    user_id: str,
    emoji_id: str,
) -> str:
    """Upload PNG image bytes to S3 and return the public URL."""
    s3_key = f"emojis/{user_id}/{emoji_id}.png"
    s3 = _get_s3()

    await asyncio.to_thread(
        s3.put_object,
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
        elif settings.STORAGE_PROVIDER == "minio":
            base = f"http://localhost/storage/{settings.S3_BUCKET_NAME}/"
            s3_key = image_url.replace(base, "")
        else:
            base = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/"
            s3_key = image_url.replace(base, "")

        s3 = _get_s3()
        await asyncio.to_thread(s3.delete_object, Bucket=settings.S3_BUCKET_NAME, Key=s3_key)
    except ClientError:
        pass  # S3 delete failures are non-critical
