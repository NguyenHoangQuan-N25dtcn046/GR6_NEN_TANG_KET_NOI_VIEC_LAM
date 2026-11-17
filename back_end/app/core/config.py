from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./job_platform.db"
    CORS_ORIGINS: str = "http://localhost:5173"
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env",
                                      env_file_encoding="utf-8",
                                       extra="ignore")

settings = Settings()

