from functools import lru_cache

from pydantic import EmailStr, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
        hide_input_in_errors=True,
    )

    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "job_matching"
    DATABASE_URL: str | None = None

    JWT_SECRET_KEY: str = Field(min_length=32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    UPLOAD_DIR: str = "uploads/cv"
    MAX_CV_SIZE_MB: int = 5
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    ADMIN_EMAIL: EmailStr | None = None
    ADMIN_PASSWORD: str | None = Field(default=None, min_length=12)

    @model_validator(mode="after")
    def validate_admin_settings(self):
        if (self.ADMIN_EMAIL is None) != (self.ADMIN_PASSWORD is None):
            raise ValueError("Set both ADMIN_EMAIL and ADMIN_PASSWORD, or leave both unset")
        if self.ADMIN_PASSWORD and len(self.ADMIN_PASSWORD.encode("utf-8")) > 72:
            raise ValueError("ADMIN_PASSWORD must be at most 72 bytes")
        return self

    @property
    def database_url(self) -> str | URL:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return URL.create(
            "mysql+pymysql",
            username=self.DB_USER,
            password=self.DB_PASSWORD,
            host=self.DB_HOST,
            port=self.DB_PORT,
            database=self.DB_NAME,
            query={"charset": "utf8mb4"},
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
