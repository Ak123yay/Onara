from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PatternDocument(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    vertical: str = Field(min_length=1)
    pattern_type: str = Field(min_length=1)
    tags: list[str] = Field(default_factory=list)
    summary: str = Field(min_length=1)
    content: str = Field(min_length=1)
    content_hash: str | None = None
    learned_at: str | None = None
    quality_gate: str | None = None
    source: str | None = None
    source_job_hash: str | None = None
    source_key_hash: str | None = None
    source_project_hash: str | None = None

    def searchable_text(self) -> str:
        tags = " ".join(self.tags)
        return f"{self.title}\n{self.vertical}\n{self.pattern_type}\n{tags}\n{self.summary}\n{self.content}"

    def metadata(self) -> dict[str, Any]:
        metadata: dict[str, Any] = {
            "title": self.title,
            "vertical": self.vertical,
            "pattern_type": self.pattern_type,
            "tags": ",".join(self.tags),
            "summary": self.summary,
        }
        for key in (
            "content_hash",
            "learned_at",
            "quality_gate",
            "source",
            "source_job_hash",
            "source_key_hash",
            "source_project_hash",
        ):
            value = getattr(self, key)
            if value:
                metadata[key] = value
        return metadata


class PatternSearchResult(BaseModel):
    id: str
    title: str
    vertical: str
    pattern_type: str
    tags: list[str]
    summary: str
    content: str
    score: float
    vector_score: float
    bm25_score: float
