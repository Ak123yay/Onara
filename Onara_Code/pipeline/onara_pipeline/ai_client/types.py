from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

AIMessageRole = Literal["system", "user", "assistant"]


class AIMessage(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    role: AIMessageRole
    content: str = Field(min_length=1)


class AIRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    max_tokens: int | None = Field(default=None, ge=1)
    messages: list[AIMessage] = Field(min_length=1)
    metadata: dict[str, Any] = Field(default_factory=dict)
    temperature: float = Field(default=0.4, ge=0, le=2)


class AIResponse(BaseModel):
    content: str
    fallback_used: bool = False
    finish_reason: str | None = None
    model: str
    provider: str
    raw: dict[str, Any] = Field(default_factory=dict)
