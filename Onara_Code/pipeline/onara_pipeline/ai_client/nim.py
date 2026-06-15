import httpx

from onara_pipeline.ai_client.errors import (
    AIConfigurationError,
    AIProviderError,
    AIRateLimitError,
    AIServiceUnavailableError,
)
from onara_pipeline.ai_client.types import AIRequest, AIResponse


class NIMClient:
    provider = "nim"

    def __init__(self, *, api_key: str | None, base_url: str, timeout: float) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def generate(self, *, model: str, request: AIRequest) -> AIResponse:
        if not self.api_key:
            raise AIConfigurationError("NVIDIA_NIM_API_KEY is not configured")

        payload = {
            "max_tokens": request.max_tokens or 4096,
            "messages": [message.model_dump() for message in request.messages],
            "model": model,
            "temperature": request.temperature,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise AIServiceUnavailableError(f"NIM request failed: {exc}") from exc

        if response.status_code == 429:
            raise AIRateLimitError("NIM rate limit reached", status_code=response.status_code)
        if response.status_code in {500, 502, 503, 504}:
            raise AIServiceUnavailableError(
                "NIM service unavailable",
                status_code=response.status_code,
            )
        if response.status_code >= 400:
            raise AIProviderError(
                f"NIM request rejected with status {response.status_code}",
                status_code=response.status_code,
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise AIProviderError("NIM response was not valid JSON") from exc

        choices = data.get("choices")
        if not isinstance(choices, list) or not choices:
            raise AIProviderError("NIM response did not include choices")

        first_choice = choices[0]
        if not isinstance(first_choice, dict):
            raise AIProviderError("NIM response choice was malformed")

        message = first_choice.get("message")
        if not isinstance(message, dict):
            raise AIProviderError("NIM response did not include a message object")

        content = message.get("content")
        if not isinstance(content, str) or not content.strip():
            raise AIProviderError("NIM response did not include message content")

        return AIResponse(
            content=content,
            finish_reason=first_choice.get("finish_reason"),
            model=str(data.get("model") or model),
            provider=self.provider,
            raw=data,
        )
