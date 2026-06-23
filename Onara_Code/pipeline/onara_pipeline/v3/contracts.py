from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from onara_pipeline.v2.contracts import CandidateArtifact


class V3Contract(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)


PaletteId = Literal["copper", "navy", "forest", "charcoal", "clay"]
LayoutId = Literal["phone-first", "trust-led", "service-grid", "split-hero", "editorial"]


class DesignDirection(V3Contract):
    key: str = Field(pattern=r"^[a-z][a-z0-9_-]*$")
    name: str = Field(min_length=3, max_length=80)
    recipe: str = Field(min_length=3, max_length=80)
    layout: LayoutId
    palette: PaletteId
    hero_composition: str = Field(min_length=20, max_length=500)
    proof_strategy: str = Field(min_length=20, max_length=500)
    image_strategy: str = Field(min_length=20, max_length=500)
    mobile_strategy: str = Field(min_length=20, max_length=500)


class DirectionSet(V3Contract):
    directions: list[DesignDirection] = Field(min_length=3, max_length=3)


class ComponentArtifact(V3Contract):
    candidate_key: Literal["a", "b"]
    component_id: str = Field(pattern=r"^[a-z][a-z0-9_]*$")
    html: str = Field(min_length=20)
    css: str = ""
    model: str
    provider: str
    attempts: int = Field(default=1, ge=1)
    fallback_used: bool = False
    warnings: list[str] = Field(default_factory=list)
    fingerprint: str


class ComponentAudit(V3Contract):
    eligible: bool = True
    blockers: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class V3CandidateArtifact(CandidateArtifact):
    component_files: dict[str, str] = Field(default_factory=dict)
    component_artifacts: list[ComponentArtifact] = Field(default_factory=list)
    direction: DesignDirection
    fallback_component_count: int = 0
    evidence: dict[str, Any] = Field(default_factory=dict)

