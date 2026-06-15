import json
from typing import Any, TypeVar

from pydantic import BaseModel

ModelT = TypeVar("ModelT", bound=BaseModel)


def compact_json(value: Any) -> str:
    return json.dumps(value, default=str, ensure_ascii=False, separators=(",", ":"))


def parse_json_model(content: str, model_type: type[ModelT]) -> ModelT:
    return model_type.model_validate(json.loads(_extract_json_object(content)))


def _extract_json_object(content: str) -> str:
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        if stripped.lower().startswith("json"):
            stripped = stripped[4:].strip()

    start = stripped.find("{")
    end = stripped.rfind("}")
    if start < 0 or end < start:
        raise ValueError("AI response did not contain a JSON object")

    return stripped[start : end + 1]
