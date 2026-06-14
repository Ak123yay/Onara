from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_url: str = Field(default="http://localhost:3000", alias="APP_URL")
    ollama_base_url: str = Field(default="http://192.168.1.89:11434", alias="OLLAMA_BASE_URL")
    pipeline_api_secret: str | None = Field(default=None, alias="PIPELINE_API_SECRET")
    pipeline_max_concurrency: int = Field(default=1, alias="PIPELINE_MAX_CONCURRENCY")
    pipeline_job_timeout: int = Field(default=300, alias="PIPELINE_JOB_TIMEOUT")

    @field_validator("ollama_base_url", "app_url", mode="before")
    @classmethod
    def strip_trailing_slash(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.rstrip("/")

        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
