import asyncio

from onara_pipeline.ai_client.errors import (
    AIClientError,
    AIConfigurationError,
    AIProviderError,
    AIRateLimitError,
    AIServiceUnavailableError,
)
from onara_pipeline.ai_client.model_picker import ModelProvider, ModelRoute
from onara_pipeline.ai_client.nim import NIMClient
from onara_pipeline.ai_client.ollama import OllamaClient
from onara_pipeline.ai_client.types import AIRequest, AIResponse
from onara_pipeline.config import Settings

RETRYABLE_ERRORS = (AIRateLimitError, AIServiceUnavailableError)
FALLBACK_ERRORS = (AIConfigurationError, AIRateLimitError, AIServiceUnavailableError)


class AIClient:
    def __init__(
        self,
        *,
        max_retries: int,
        nim: NIMClient,
        ollama: OllamaClient,
        retry_base_delay: float,
    ) -> None:
        self.max_retries = max_retries
        self.nim = nim
        self.ollama = ollama
        self.retry_base_delay = retry_base_delay

    async def generate_text(self, *, request: AIRequest, route: ModelRoute) -> AIResponse:
        fallback_reasons: list[str] = []
        candidates = route.candidates()

        for index, candidate in enumerate(candidates):
            try:
                response = await self._generate_with_retries(
                    model=candidate.model,
                    provider=candidate.provider,
                    request=request,
                )
                if index > 0:
                    response.fallback_used = True
                    response.raw["fallback_reasons"] = fallback_reasons
                return response
            except FALLBACK_ERRORS as exc:
                fallback_reasons.append(f"{candidate.provider}:{candidate.model}: {exc}")
                if index >= len(candidates) - 1:
                    raise

        raise AIProviderError("No model candidates were available")

    async def _generate_with_retries(
        self,
        *,
        model: str,
        provider: ModelProvider,
        request: AIRequest,
    ) -> AIResponse:
        last_error: AIClientError | None = None

        for attempt in range(self.max_retries + 1):
            try:
                return await self._provider(provider).generate(model=model, request=request)
            except AIConfigurationError:
                raise
            except RETRYABLE_ERRORS as exc:
                last_error = exc
                if attempt >= self.max_retries:
                    raise
                await asyncio.sleep(self.retry_base_delay * (2**attempt))
            except AIProviderError:
                raise

        if last_error:
            raise last_error
        raise AIProviderError(f"{provider} failed without an explicit provider error")

    def _provider(self, provider: ModelProvider) -> NIMClient | OllamaClient:
        if provider == "nim":
            return self.nim
        if provider == "ollama":
            return self.ollama
        raise AIProviderError(f"Unsupported model provider: {provider}")


def build_ai_client(settings: Settings) -> AIClient:
    return AIClient(
        max_retries=settings.ai_max_retries,
        nim=NIMClient(
            api_key=settings.nvidia_nim_api_key,
            base_url=settings.nvidia_nim_base_url,
            timeout=settings.ai_request_timeout,
        ),
        ollama=OllamaClient(
            base_url=settings.ollama_base_url,
            timeout=settings.ai_request_timeout,
        ),
        retry_base_delay=settings.ai_retry_base_delay,
    )
