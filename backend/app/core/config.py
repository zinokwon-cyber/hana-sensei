from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "3TOP Emoji Studio"
    APP_ENV: str = "development"
    DEBUG: bool = False
    API_PREFIX: str = "/api"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # Mock mode — set MOCK_MODE=true to run without real API keys
    MOCK_MODE: bool = False

    # Auth mode: "password" (email+pw) | "azure" (Microsoft SSO)
    AUTH_MODE: str = "password"

    # Image provider: "pollinations" (free) | "openai" (DALL-E 3)
    IMAGE_PROVIDER: str = "pollinations"

    # Storage provider: "minio" (local Docker) | "s3" (AWS)
    STORAGE_PROVIDER: str = "minio"

    # Comma-separated list of emails that receive admin privileges on login
    ADMIN_EMAILS: list[str] = []

    # Allowed email domains for self-registration (empty = allow all)
    ALLOWED_EMAIL_DOMAINS: list[str] = []

    # Database
    DATABASE_URL: str

    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Microsoft Entra ID (Azure AD) — required when AUTH_MODE=azure
    AZURE_CLIENT_ID: Optional[str] = None
    AZURE_CLIENT_SECRET: Optional[str] = None
    AZURE_TENANT_ID: Optional[str] = None
    AZURE_REDIRECT_URI: str = "http://localhost:3000/auth/callback"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # OpenAI — required when IMAGE_PROVIDER=openai
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_IMAGE_MODEL: str = "dall-e-3"
    OPENAI_IMAGE_SIZE: str = "1024x1024"
    OPENAI_IMAGE_QUALITY: str = "standard"

    # MinIO — used when STORAGE_PROVIDER=minio
    MINIO_ENDPOINT: str = "http://minio:9000"
    MINIO_ROOT_USER: str = "minioadmin"
    MINIO_ROOT_PASSWORD: str = "minioadmin123"
    S3_BUCKET_NAME: str = "emoji-studio"
    # Public URL for browser access (MinIO: http://localhost:9000/emoji-studio)
    S3_BASE_URL: Optional[str] = None

    # AWS S3 — required when STORAGE_PROVIDER=s3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "ap-northeast-2"

    @model_validator(mode="after")
    def validate_production_keys(self) -> "Settings":
        if self.MOCK_MODE:
            return self
        missing = []
        if self.AUTH_MODE == "azure":
            missing += [
                name for name, val in [
                    ("AZURE_CLIENT_ID", self.AZURE_CLIENT_ID),
                    ("AZURE_CLIENT_SECRET", self.AZURE_CLIENT_SECRET),
                    ("AZURE_TENANT_ID", self.AZURE_TENANT_ID),
                ] if not val
            ]
        if self.IMAGE_PROVIDER == "openai" and not self.OPENAI_API_KEY:
            missing.append("OPENAI_API_KEY")
        if self.STORAGE_PROVIDER == "s3":
            missing += [
                name for name, val in [
                    ("AWS_ACCESS_KEY_ID", self.AWS_ACCESS_KEY_ID),
                    ("AWS_SECRET_ACCESS_KEY", self.AWS_SECRET_ACCESS_KEY),
                ] if not val
            ]
        if missing:
            raise ValueError(
                f"필수 환경변수가 누락됐습니다: {', '.join(missing)}\n"
                ".env 파일을 확인하세요."
            )
        return self

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
