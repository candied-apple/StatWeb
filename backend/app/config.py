from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "StatWeb"
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "statweb-secret-key-change-in-production-env"

    # Database
    DATABASE_URL: str = "postgresql+psycopg://statweb:statweb_pass@localhost:5432/statweb"

    # Storage
    STORAGE_DIR: Path = Path(__file__).resolve().parent.parent / "data_storage"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
