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
    services: list[ServiceCopy] = Field(min_length=1)
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
