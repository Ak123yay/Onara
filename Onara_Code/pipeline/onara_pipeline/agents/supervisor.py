from onara_pipeline.agents.contracts import (
    AnalystOutput,
    CodegenOutput,
    ContentOutput,
    PlannerOutput,
    PromptOutput,
    StyleOutput,
)

BANNED_COPY_PHRASES = (
    "solutions",
    "we are committed to",
    "world-class",
    "industry-leading",
)


class SupervisorValidationError(ValueError):
    pass


def validate_analyst_output(output: AnalystOutput) -> None:
    if not output.mustHaveSections:
        raise SupervisorValidationError("Analyst output must include at least one required section")
    if not output.toneKeywords:
        raise SupervisorValidationError("Analyst output must include tone keywords")


def validate_content_output(output: ContentOutput) -> None:
    text = " ".join(
        [
            output.hero.headline,
            output.hero.subheadline,
            output.about.headline,
            output.about.body,
            output.social_proof.headline,
            output.social_proof.subtext,
            output.contact.headline,
            output.contact.subtext,
            output.footer_tagline,
            *[service.name for service in output.services],
            *[service.description for service in output.services],
        ]
    ).lower()

    blocked = [phrase for phrase in BANNED_COPY_PHRASES if phrase in text]
    if blocked:
        raise SupervisorValidationError(f"Content output includes banned phrase: {blocked[0]}")
    if not output.services:
        raise SupervisorValidationError("Content output must include at least one service")


def validate_style_output(output: StyleOutput) -> None:
    if output.typography.heading_font == output.typography.body_font:
        raise SupervisorValidationError("Style output should use distinct heading and body fonts")
    if output.colors.primary == output.colors.background:
        raise SupervisorValidationError("Style output primary color cannot equal background color")


def validate_planner_output(output: PlannerOutput) -> None:
    ids = [component.id for component in output.components]
    if len(ids) != len(set(ids)):
        raise SupervisorValidationError("Planner output component IDs must be unique")
    if output.component_order != ids:
        raise SupervisorValidationError("Planner output component_order must match component order")
    if "hero" not in ids:
        raise SupervisorValidationError("Planner output must include a hero component")
    if "contact" not in ids:
        raise SupervisorValidationError("Planner output must include a contact component")


def validate_prompt_output(output: PromptOutput) -> None:
    prompt = output.prompt
    required = ("{FILE_MARKER_START}", "{FILE_MARKER_END}", "index.html", "<style", "</body>")
    missing = [item for item in required if item not in prompt]
    if missing:
        raise SupervisorValidationError(f"Prompt output missing required instruction: {missing[0]}")


def validate_codegen_output(output: CodegenOutput) -> None:
    html = output.html.strip()
    lower = html.lower()

    required = ("<html", "<head", "<style", "<body", "</body>", "</html>")
    missing = [item for item in required if item not in lower]
    if missing:
        raise SupervisorValidationError(f"Codegen output missing required markup: {missing[0]}")
    if "{file_marker_start}" in lower or "{file_marker_end}" in lower:
        raise SupervisorValidationError("Codegen HTML still contains file markers")
    if "```" in html:
        raise SupervisorValidationError("Codegen HTML contains markdown fences")
    if len(html) < 1200:
        raise SupervisorValidationError("Codegen HTML is too short for a complete contractor site")
    if not output.component_files.get("index.html"):
        raise SupervisorValidationError("Codegen output must include index.html in component_files")
