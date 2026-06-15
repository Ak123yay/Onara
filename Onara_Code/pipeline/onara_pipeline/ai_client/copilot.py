import asyncio
import inspect
from typing import Any

from onara_pipeline.ai_client.errors import (
    AIConfigurationError,
    AIProviderError,
    AIRateLimitError,
    AIServiceUnavailableError,
)
from onara_pipeline.ai_client.types import AIRequest, AIResponse


def _deny_tool_permission(_request: Any, _invocation: dict[str, Any]) -> Any:
    try:
        from copilot.rpc import PermissionDecisionReject

        return PermissionDecisionReject(feedback="Tool calls are disabled for Onara Agent 6.")
    except Exception:
        return {"decision": "reject", "feedback": "Tool calls are disabled for Onara Agent 6."}


class CopilotSDKClient:
    provider = "copilot"

    def __init__(self, *, base_directory: str, github_token: str | None, timeout: float) -> None:
        self.base_directory = base_directory
        self.github_token = github_token
        self.timeout = timeout

    async def generate(self, *, model: str, request: AIRequest) -> AIResponse:
        if not self.github_token:
            raise AIConfigurationError("COPILOT_GITHUB_TOKEN is not configured")

        try:
            from copilot import CopilotClient
        except ImportError as exc:
            raise AIConfigurationError(
                "github-copilot-sdk is not installed. Run: python -m pip install -r requirements.txt"
            ) from exc

        prompt = self._messages_to_prompt(request)
        client = self._create_client(CopilotClient)
        session = None

        try:
            await client.start()
            session = await self._create_session(client=client, model=model)
            response = await asyncio.wait_for(session.send_and_wait(prompt), timeout=self.timeout)
        except TimeoutError as exc:
            raise AIServiceUnavailableError(f"Copilot SDK request timed out after {self.timeout:g}s") from exc
        except AIProviderError:
            raise
        except Exception as exc:
            self._raise_provider_error(exc)
        finally:
            if session is not None:
                await self._close_session(session)
            await self._stop_client(client)

        content = self._extract_content(response)
        return AIResponse(
            content=content,
            finish_reason=None,
            model=model,
            provider=self.provider,
            raw={
                "response_type": type(response).__name__,
                "data_type": type(getattr(response, "data", None)).__name__,
            },
        )

    def _create_client(self, copilot_client_class: Any) -> Any:
        options = {
            "base_directory": self.base_directory,
            "github_token": self.github_token,
            "mode": "empty",
            "session_idle_timeout_seconds": max(60, int(self.timeout) + 30),
            "use_logged_in_user": False,
        }

        try:
            return copilot_client_class(**options)
        except TypeError:
            return copilot_client_class(options)

    async def _create_session(self, *, client: Any, model: str) -> Any:
        try:
            return await client.create_session(
                available_tools=[],
                github_token=self.github_token,
                model=model,
                on_permission_request=_deny_tool_permission,
            )
        except TypeError:
            return await client.create_session(
                model=model,
                on_permission_request=_deny_tool_permission,
            )

    async def _close_session(self, session: Any) -> None:
        close = getattr(session, "disconnect", None) or getattr(session, "close", None)
        if close is None:
            return

        result = close()
        if inspect.isawaitable(result):
            await result

    async def _stop_client(self, client: Any) -> None:
        stop = getattr(client, "stop", None)
        if stop is None:
            return

        result = stop()
        if inspect.isawaitable(result):
            await result

    def _extract_content(self, response: Any) -> str:
        if response is None:
            raise AIProviderError("Copilot SDK response was empty")

        data = getattr(response, "data", None)
        content = getattr(data, "content", None)
        if content is None and isinstance(data, dict):
            content = data.get("content")

        if not isinstance(content, str) or not content.strip():
            raise AIProviderError("Copilot SDK response did not include message content")

        return content

    def _messages_to_prompt(self, request: AIRequest) -> str:
        parts = []
        for message in request.messages:
            role = message.role.upper()
            parts.append(f"{role}:\n{message.content.strip()}")

        return "\n\n".join(parts)

    def _raise_provider_error(self, exc: Exception) -> None:
        message = str(exc)
        normalized = message.lower()

        if "rate limit" in normalized or "quota" in normalized or "429" in normalized:
            raise AIRateLimitError(f"Copilot SDK rate limit or quota reached: {message}") from exc
        if "unauthorized" in normalized or "forbidden" in normalized or "authentication" in normalized:
            raise AIConfigurationError(f"Copilot SDK authentication failed: {message}") from exc

        raise AIServiceUnavailableError(f"Copilot SDK request failed: {message}") from exc
