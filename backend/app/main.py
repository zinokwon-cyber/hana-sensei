from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api import auth, emojis

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

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(emojis.router, prefix=settings.API_PREFIX)

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
