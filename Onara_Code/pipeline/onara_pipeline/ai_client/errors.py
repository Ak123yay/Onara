class AIClientError(Exception):
    """Base exception for model-provider failures."""


class AIConfigurationError(AIClientError):
    """Raised when a provider is selected but not configured."""


class AIProviderError(AIClientError):
    def __init__(self, message: str, *, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class AIRateLimitError(AIProviderError):
    """Raised when a model provider returns a 429."""


class AIServiceUnavailableError(AIProviderError):
    """Raised when a provider is unavailable or overloaded."""
