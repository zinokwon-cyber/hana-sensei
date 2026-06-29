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

    # Comma-separated list of emails that receive admin privileges on login
    ADMIN_EMAILS: list[str] = []

    # Database
    DATABASE_URL: str

    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Microsoft Entra ID (Azure AD) — required when MOCK_MODE=false
    AZURE_CLIENT_ID: Optional[str] = None
    AZURE_CLIENT_SECRET: Optional[str] = None
    AZURE_TENANT_ID: Optional[str] = None
    AZURE_REDIRECT_URI: str = "http://localhost:3000/auth/callback"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # OpenAI — required when MOCK_MODE=false
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_IMAGE_MODEL: str = "dall-e-3"
    OPENAI_IMAGE_SIZE: str = "1024x1024"
    OPENAI_IMAGE_QUALITY: str = "standard"

    # AWS S3 — required when MOCK_MODE=false
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "ap-northeast-2"
    S3_BUCKET_NAME: Optional[str] = None
    S3_BASE_URL: Optional[str] = None

    @model_validator(mode="after")
    def validate_production_keys(self) -> "Settings":
        if self.MOCK_MODE:
            return self
        missing = [
            name for name, val in [
                ("AZURE_CLIENT_ID",     self.AZURE_CLIENT_ID),
                ("AZURE_CLIENT_SECRET", self.AZURE_CLIENT_SECRET),
                ("AZURE_TENANT_ID",     self.AZURE_TENANT_ID),
                ("OPENAI_API_KEY",      self.OPENAI_API_KEY),
                ("AWS_ACCESS_KEY_ID",   self.AWS_ACCESS_KEY_ID),
                ("AWS_SECRET_ACCESS_KEY", self.AWS_SECRET_ACCESS_KEY),
                ("S3_BUCKET_NAME",      self.S3_BUCKET_NAME),
            ] if not val
        ]
        if missing:
            raise ValueError(
                f"프로덕션 모드에서 필수 환경변수가 누락됐습니다: {', '.join(missing)}\n"
                "MOCK_MODE=true 로 설정하거나 누락된 값을 .env 에 추가하세요."
            )
        return self

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
