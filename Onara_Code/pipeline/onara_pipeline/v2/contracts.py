from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class V2Contract(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)


class FactEntry(V2Contract):
    key: str
    value: Any
    source: Literal["google", "manual", "account", "derived"]
    trusted: bool = True


class BusinessBrief(V2Contract):
    name: str = Field(min_length=1)
    category: str = "Local service business"
    address: str | None = None
    city_or_region: str | None = None
    email: str | None = None
    phone: str | None = None
    service_area: str | None = None
    services: list[str] = Field(default_factory=list)
    hours: list[str] = Field(default_factory=list)
    rating: float | None = None
    review_count: int | None = None
    owner_notes: str | None = None


class AssetEntry(V2Contract):
    src: str
    alt: str
    source: str
    attribution: str | None = None


class GenerationSpec(V2Contract):
    brief: BusinessBrief
    facts: list[FactEntry]
    assets: list[AssetEntry]
    recipe_a: str
    recipe_b: str
    selected_layout: str | None = None
    style_preferences: dict[str, Any] = Field(default_factory=dict)


class BrowserReport(V2Contract):
    available: bool = False
    accessibility_violations: int = 0
    console_errors: list[str] = Field(default_factory=list)
    failed_requests: list[str] = Field(default_factory=list)
    hard_blockers: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    checks: dict[str, bool] = Field(default_factory=dict)
    lighthouse: dict[str, float] = Field(default_factory=dict)
    mobile_thumbnail_data_url: str | None = None
    screenshot_hash: str | None = None
    thumbnail_data_url: str | None = None


class VisualReview(V2Contract):
    hierarchy: float = Field(default=0, ge=0, le=8)
    typography: float = Field(default=0, ge=0, le=6)
    composition: float = Field(default=0, ge=0, le=6)
    trust_and_cta: float = Field(default=0, ge=0, le=5)
    brief_fit: float = Field(default=0, ge=0, le=5)
    warnings: list[str] = Field(default_factory=list)

    @property
    def total(self) -> float:
        return self.hierarchy + self.typography + self.composition + self.trust_and_cta + self.brief_fit


class CandidateArtifact(V2Contract):
    key: Literal["a", "b"]
    recipe: str
    html: str = Field(min_length=500)
    model: str
    provider: str
    fallback_used: bool = False
    used_fallback_template: bool = False
    deterministic_score: float = 0
    visual_score: float = 0
    final_score: float = 0
    hard_blockers: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    browser: BrowserReport = Field(default_factory=BrowserReport)
    fingerprint: str | None = None
    selected: bool = False


class ComponentPatch(V2Contract):
    expected_source_hash: str
    html: str


class PatchSet(V2Contract):
    expected_document_hash: str
    css_append: str = ""
    replacements: dict[str, ComponentPatch] = Field(default_factory=dict)
    summary: str = ""
