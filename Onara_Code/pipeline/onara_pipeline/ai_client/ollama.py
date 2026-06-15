import httpx

from onara_pipeline.ai_client.errors import AIProviderError, AIServiceUnavailableError
from onara_pipeline.ai_client.types import AIRequest, AIResponse


class OllamaClient:
    provider = "ollama"

    def __init__(self, *, base_url: str, timeout: float) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def generate(self, *, model: str, request: AIRequest) -> AIResponse:
        payload = {
            "messages": [message.model_dump() for message in request.messages],
            "model": model,
            "stream": False,
            "think": False,
        }
        options = {"temperature": request.temperature}
        if request.max_tokens:
            options["num_predict"] = request.max_tokens
        payload["options"] = options

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.base_url}/api/chat", json=payload)
        except httpx.HTTPError as exc:
            raise AIServiceUnavailableError(f"Ollama request failed: {exc}") from exc

        if response.status_code >= 500:
            raise AIServiceUnavailableError(
                "Ollama service unavailable",
                status_code=response.status_code,
            )
        if response.status_code >= 400:
            raise AIProviderError(
                f"Ollama request rejected with status {response.status_code}",
                status_code=response.status_code,
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise AIProviderError("Ollama response was not valid JSON") from exc

        message = data.get("message")
        if not isinstance(message, dict):
            raise AIProviderError("Ollama response did not include a message object")

        content = message.get("content")
        if not isinstance(content, str) or not content.strip():
            raise AIProviderError("Ollama response did not include message content")

        return AIResponse(
            content=content,
            finish_reason=data.get("done_reason"),
            model=str(data.get("model") or model),
            provider=self.provider,
            raw=data,
        )

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=min(self.timeout, 2.0)) as client:
                response = await client.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except httpx.HTTPError:
            return False
