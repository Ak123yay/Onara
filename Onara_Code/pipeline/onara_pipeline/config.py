from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_url: str = Field(default="http://localhost:3000", min_length=1, alias="APP_URL")
    ai_max_retries: int = Field(default=2, ge=0, le=5, alias="AI_MAX_RETRIES")
    ai_request_timeout: float = Field(default=60.0, gt=0, le=300, alias="AI_REQUEST_TIMEOUT")
    ai_retry_base_delay: float = Field(default=0.5, ge=0, le=10, alias="AI_RETRY_BASE_DELAY")
    chroma_collection_name: str = Field(default="onara_patterns", min_length=1, alias="CHROMA_COLLECTION_NAME")
    chroma_persist_path: str = Field(default="./chroma_db", min_length=1, alias="CHROMA_PERSIST_PATH")
    nvidia_nim_api_key: str | None = Field(default=None, alias="NVIDIA_NIM_API_KEY")
    nvidia_nim_base_url: str = Field(
        default="https://integrate.api.nvidia.com/v1",
        alias="NVIDIA_NIM_BASE_URL",
    )
    ollama_base_url: str = Field(default="http://192.168.1.89:11434", min_length=1, alias="OLLAMA_BASE_URL")
    ollama_fallback_model: str = Field(default="gemma4:e4b", min_length=1, alias="OLLAMA_FALLBACK_MODEL")
    ollama_primary_model: str = Field(default="qwen3.5:9b", min_length=1, alias="OLLAMA_PRIMARY_MODEL")
    pipeline_api_secret: str | None = Field(default=None, alias="PIPELINE_API_SECRET")
    pipeline_max_concurrency: int = Field(default=1, ge=1, le=10, alias="PIPELINE_MAX_CONCURRENCY")
    pipeline_job_timeout: int = Field(default=300, ge=30, le=3600, alias="PIPELINE_JOB_TIMEOUT")

    @field_validator("nvidia_nim_base_url", "ollama_base_url", "app_url", mode="before")
    @classmethod
    def strip_trailing_slash(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.rstrip("/")

        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
