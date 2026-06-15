from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AgentContract(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)


class AnalystOutput(AgentContract):
    industryType: str = Field(min_length=1)
    primaryCta: str = Field(min_length=1)
    ctaType: Literal["phone_call", "contact_form", "booking"]
    mustHaveSections: list[str] = Field(min_length=1)
    optionalSections: list[str] = Field(default_factory=list)
    trustSignals: list[str] = Field(default_factory=list)
    urgencyTriggers: list[str] = Field(default_factory=list)
    targetKeyword: str = Field(min_length=1)
    competitorWeaknesses: list[str] = Field(default_factory=list)
    toneKeywords: list[str] = Field(min_length=1)


class HeroCopy(AgentContract):
    headline: str = Field(min_length=1)
    subheadline: str = Field(min_length=1)
    cta_button: str = Field(min_length=1)


class TextBlock(AgentContract):
    headline: str = Field(min_length=1)
    body: str = Field(default="")
    subtext: str = Field(default="")


class ServiceCopy(AgentContract):
    name: str = Field(min_length=1)
    description: str = Field(min_length=1)


class ContentOutput(AgentContract):
    hero: HeroCopy
    about: TextBlock
    services: list[ServiceCopy] = Field(min_length=3)
    social_proof: TextBlock
    contact: TextBlock
    footer_tagline: str = Field(min_length=1)


class ColorTokens(AgentContract):
    primary: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    secondary: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    background: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    surface: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    text_primary: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    text_secondary: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    border: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")


class TypographyTokens(AgentContract):
    heading_font: str = Field(min_length=1)
    body_font: str = Field(min_length=1)
    heading_weight: Literal["600", "700", "800"]
    base_size: str = Field(default="16px")
    scale: str = Field(default="1.25")


class SpacingTokens(AgentContract):
    section_padding: str = Field(default="80px 0")
    container_max: str = Field(default="1100px")
    border_radius: str = Field(default="8px")


class StyleOutput(AgentContract):
    colors: ColorTokens
    typography: TypographyTokens
    spacing: SpacingTokens
    style_notes: str = Field(min_length=1)


class ComponentSpec(AgentContract):
    id: str = Field(min_length=1, pattern=r"^[a-z][a-z0-9_]*$")
    type: Literal["section", "header", "footer", "nav"]
    order: int = Field(ge=1)
    html_structure: str = Field(min_length=20)
    css_classes: list[str] = Field(min_length=1)
    content_mapping: dict[str, str] = Field(default_factory=dict)
    responsive_changes: str = Field(min_length=1)
    interactive: str | None = None


class PlannerOutput(AgentContract):
    components: list[ComponentSpec] = Field(min_length=1)
    css_variables: dict[str, str] = Field(min_length=1)
    component_order: list[str] = Field(min_length=1)
    special_notes: str = Field(min_length=1)


class PromptOutput(AgentContract):
    prompt: str = Field(min_length=500)


class CodegenOutput(AgentContract):
    raw_output: str = Field(min_length=1)
    html: str = Field(min_length=500)
    component_files: dict[str, str] = Field(default_factory=dict)
    model: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    fallback_used: bool = False
    used_fallback_template: bool = False


class DebuggerOutput(AgentContract):
    status: Literal["pass", "fixed"]
    issues: list[str] = Field(default_factory=list)
    fixes: list[str] = Field(default_factory=list)
    raw_output: str = Field(min_length=1)
    html: str = Field(min_length=500)
    component_files: dict[str, str] = Field(default_factory=dict)
    model: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    fallback_used: bool = False
    used_deterministic_fallback: bool = False


class SEOOutput(AgentContract):
    title: str = Field(min_length=8, max_length=80)
    meta_description: str = Field(min_length=40, max_length=180)
    canonical_placeholder: str = Field(default="Set final canonical URL during deployment.")
    json_ld: dict = Field(default_factory=dict)
    raw_output: str = Field(min_length=1)
    html: str = Field(min_length=500)
    component_files: dict[str, str] = Field(default_factory=dict)
    model: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    fallback_used: bool = False
    used_deterministic_fallback: bool = False


class QAOutput(AgentContract):
    status: Literal["pass", "fail"]
    blocking_issues: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    checks: dict[str, bool] = Field(default_factory=dict)
    raw_output: str = Field(min_length=1)
    model: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    fallback_used: bool = False
    used_deterministic_fallback: bool = False


class MobileOutput(AgentContract):
    status: Literal["pass", "fixed"]
    issues: list[str] = Field(default_factory=list)
    fixes: list[str] = Field(default_factory=list)
    checks: dict[str, bool] = Field(default_factory=dict)
    raw_output: str = Field(min_length=1)
    html: str = Field(min_length=500)
    component_files: dict[str, str] = Field(default_factory=dict)
    model: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    fallback_used: bool = False
    used_deterministic_fallback: bool = False
