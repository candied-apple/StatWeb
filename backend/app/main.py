from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import api_v1_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Web-based Statistical Analysis Platform API inspired by SPSS",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }
