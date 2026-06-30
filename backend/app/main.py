import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api import admin, auth, emojis

logger = logging.getLogger(__name__)

app = FastAPI(
    title="3TOP Emoji Studio API",
    description="AI-powered emoji generation service for 3TOP employees",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."},
    )

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(emojis.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)

if settings.MOCK_MODE:
    from app.api import mock
    app.include_router(mock.router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return JSONResponse({
        "status": "healthy",
        "service": settings.APP_NAME,
        "mock_mode": settings.MOCK_MODE,
    })
