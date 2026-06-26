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
    cloudflare_account_id: str | None = Field(default=None, alias="CLOUDFLARE_ACCOUNT_ID")
    cloudflare_api_token: str | None = Field(default=None, alias="CLOUDFLARE_API_TOKEN")
    cloudflare_api_url: str = Field(
        default="https://api.cloudflare.com/client/v4",
        min_length=1,
        alias="CLOUDFLARE_API_URL",
    )
    cloudflare_pages_branch: str = Field(default="main", min_length=1, alias="CLOUDFLARE_PAGES_BRANCH")
    cloudflare_pages_project_prefix: str = Field(
        default="onara-site",
        min_length=1,
        alias="CLOUDFLARE_PAGES_PROJECT_PREFIX",
    )
    cloudflare_wrangler_command: str = Field(
        default="npx --yes wrangler",
        min_length=1,
        alias="CLOUDFLARE_WRANGLER_COMMAND",
    )
    copilot_base_directory: str = Field(default="./.copilot_runtime", min_length=1, alias="COPILOT_BASE_DIRECTORY")
    copilot_github_token: str | None = Field(default=None, alias="COPILOT_GITHUB_TOKEN")
    github_api_url: str = Field(default="https://api.github.com", min_length=1, alias="GITHUB_API_URL")
    github_app_id: str | None = Field(default=None, alias="GITHUB_APP_ID")
    github_app_installation_id: str | None = Field(default=None, alias="GITHUB_APP_INSTALLATION_ID")
    github_app_private_key: str | None = Field(default=None, alias="GITHUB_APP_PRIVATE_KEY")
    github_repo_branch: str = Field(default="main", min_length=1, alias="GITHUB_REPO_BRANCH")
    github_repo_name: str = Field(default="onara-sites", min_length=1, alias="GITHUB_REPO_NAME")
    github_repo_owner: str | None = Field(default=None, alias="GITHUB_REPO_OWNER")
    google_places_api_key: str | None = Field(default=None, alias="GOOGLE_PLACES_API_KEY")
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
    pipeline_job_timeout: int = Field(default=600, ge=30, le=3600, alias="PIPELINE_JOB_TIMEOUT")
    pipeline_v2_enabled: bool = Field(default=True, alias="PIPELINE_V2_ENABLED")
    pipeline_v2_browser_audit_timeout: int = Field(
        default=75,
        ge=20,
        le=180,
        alias="PIPELINE_V2_BROWSER_AUDIT_TIMEOUT",
    )
    pipeline_v2_static_audit_fallback: bool = Field(
        default=True,
        alias="PIPELINE_V2_STATIC_AUDIT_FALLBACK",
    )
    pipeline_v2_candidate_timeout: int = Field(
        default=150,
        ge=30,
        le=300,
        alias="PIPELINE_V2_CANDIDATE_TIMEOUT",
    )
    pipeline_v2_lease_seconds: int = Field(
        default=60,
        ge=30,
        le=300,
        alias="PIPELINE_V2_LEASE_SECONDS",
    )
    pipeline_v2_max_attempts: int = Field(default=3, ge=1, le=5, alias="PIPELINE_V2_MAX_ATTEMPTS")
    pipeline_v2_min_score: float = Field(default=80.0, ge=0, le=100, alias="PIPELINE_V2_MIN_SCORE")
    pipeline_v2_worker_id: str | None = Field(default=None, alias="PIPELINE_V2_WORKER_ID")
    pipeline_v3_enabled: bool = Field(default=False, alias="PIPELINE_V3_ENABLED")
    pipeline_v3_canary_percent: int = Field(
        default=0,
        ge=0,
        le=100,
        alias="PIPELINE_V3_CANARY_PERCENT",
    )
    pipeline_v3_component_timeout: int = Field(
        default=75,
        ge=20,
        le=180,
        alias="PIPELINE_V3_COMPONENT_TIMEOUT",
    )
    pipeline_v3_component_max_tokens: int = Field(
        default=3200,
        ge=1200,
        le=8000,
        alias="PIPELINE_V3_COMPONENT_MAX_TOKENS",
    )
    pipeline_v3_job_timeout: int = Field(
        default=600,
        ge=120,
        le=1800,
        alias="PIPELINE_V3_JOB_TIMEOUT",
    )
    pipeline_v3_lease_seconds: int = Field(
        default=60,
        ge=30,
        le=300,
        alias="PIPELINE_V3_LEASE_SECONDS",
    )
    pipeline_v3_max_component_attempts: int = Field(
        default=2,
        ge=1,
        le=3,
        alias="PIPELINE_V3_MAX_COMPONENT_ATTEMPTS",
    )
    pipeline_v3_max_fallback_components: int = Field(
        default=2,
        ge=0,
        le=12,
        alias="PIPELINE_V3_MAX_FALLBACK_COMPONENTS",
    )
    pipeline_v3_max_attempts: int = Field(default=3, ge=1, le=5, alias="PIPELINE_V3_MAX_ATTEMPTS")
    pipeline_v3_min_score: float = Field(default=84.0, ge=0, le=100, alias="PIPELINE_V3_MIN_SCORE")
    pipeline_v3_worker_id: str | None = Field(default=None, alias="PIPELINE_V3_WORKER_ID")
    ai_nim_concurrency: int = Field(default=8, ge=1, le=8, alias="AI_NIM_CONCURRENCY")
    ai_ollama_concurrency: int = Field(default=1, ge=1, le=4, alias="AI_OLLAMA_CONCURRENCY")
    ai_copilot_concurrency: int = Field(default=1, ge=1, le=4, alias="AI_COPILOT_CONCURRENCY")
    feature_lead_email: bool = Field(default=False, alias="FEATURE_LEAD_EMAIL")
    supabase_url: str | None = Field(default=None, alias="SUPABASE_URL")
    supabase_service_role_key: str | None = Field(default=None, alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_secret_key: str | None = Field(default=None, alias="SUPABASE_SECRET_KEY")

    @field_validator(
        "nvidia_nim_base_url",
        "ollama_base_url",
        "app_url",
        "github_api_url",
        "cloudflare_api_url",
        "supabase_url",
        mode="before",
    )
    @classmethod
    def strip_trailing_slash(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.rstrip("/")

        return value

    @field_validator("github_app_private_key", mode="before")
    @classmethod
    def normalize_github_private_key(cls, value: Any) -> Any:
        if isinstance(value, str):
            stripped = value.strip().strip('"').strip("'")
            return stripped.replace("\\n", "\n")

        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
