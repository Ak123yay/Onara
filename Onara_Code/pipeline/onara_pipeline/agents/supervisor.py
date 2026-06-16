from onara_pipeline.agents.contracts import (
    AnalystOutput,
    CodegenOutput,
    ContentOutput,
    DebuggerOutput,
    MobileOutput,
    PlannerOutput,
    PromptOutput,
    QAOutput,
    SEOOutput,
    StyleOutput,
)
from onara_pipeline.agents.visual_quality import professional_visual_issues

BANNED_COPY_PHRASES = (
    "solutions",
    "we are committed to",
    "world-class",
    "industry-leading",
)


class SupervisorValidationError(ValueError):
    pass


REPAIRABLE_CODEGEN_VISUAL_ISSUE_PREFIXES = (
    "Hero side stack is too tall",
    "Header brand, navigation, and CTA need a stable center-aligned grid",
    "Hours card uses awkward summary copy",
)


def repairable_codegen_visual_issues(issues: list[str]) -> list[str]:
    return [
        issue
        for issue in issues
        if issue.startswith(REPAIRABLE_CODEGEN_VISUAL_ISSUE_PREFIXES)
    ]


def blocking_codegen_visual_issues(
    issues: list[str],
    *,
    allow_repairable_visual_issues: bool = False,
) -> list[str]:
    if not allow_repairable_visual_issues:
        return issues

    repairable = set(repairable_codegen_visual_issues(issues))
    return [issue for issue in issues if issue not in repairable]


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
    if len(output.services) < 3:
        raise SupervisorValidationError("Content output must include at least three distinct services")
    service_names = {" ".join(service.name.lower().split()) for service in output.services}
    if len(service_names) < 3:
        raise SupervisorValidationError("Content output must include three distinct service names")


def validate_style_output(output: StyleOutput) -> None:
    if output.typography.heading_font == output.typography.body_font:
        raise SupervisorValidationError("Style output should use distinct heading and body fonts")
    if output.colors.primary == output.colors.background:
        raise SupervisorValidationError("Style output primary color cannot equal background color")
    if output.typography.heading_font.strip().lower() != "fraunces":
        raise SupervisorValidationError("Style output must use Onara heading font: Fraunces")
    if output.typography.body_font.strip().lower() != "inter":
        raise SupervisorValidationError("Style output must use Onara body font: Inter")


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
    lower = prompt.lower()
    theme_required = ("onara", "fraunces", "inter", "terracotta", "--paper", "--accent")
    missing_theme = [item for item in theme_required if item not in lower]
    if missing_theme:
        raise SupervisorValidationError(f"Prompt output missing Onara theme instruction: {missing_theme[0]}")


def validate_codegen_output(
    output: CodegenOutput,
    *,
    allow_repairable_visual_issues: bool = False,
) -> None:
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
    if "@keyframes" not in lower:
        raise SupervisorValidationError("Codegen output must include lightweight CSS keyframes")
    if "prefers-reduced-motion" not in lower:
        raise SupervisorValidationError("Codegen output must include prefers-reduced-motion safety")
    if "requestanimationframe" in lower or "setinterval(" in lower:
        raise SupervisorValidationError("Codegen output must not use JavaScript-driven animation loops")
    if "infinite" in lower:
        raise SupervisorValidationError("Codegen output must not use infinite animations")
    if "opacity" not in lower or "transform" not in lower:
        raise SupervisorValidationError("Codegen animation must use opacity and transform")

    visual_issues = professional_visual_issues(html)
    blocking_visual_issues = blocking_codegen_visual_issues(
        visual_issues,
        allow_repairable_visual_issues=allow_repairable_visual_issues,
    )
    if blocking_visual_issues:
        raise SupervisorValidationError(f"Codegen output failed visual quality gate: {blocking_visual_issues[0]}")


def validate_debugger_output(output: DebuggerOutput) -> None:
    validate_codegen_output(
        CodegenOutput(
            component_files=output.component_files,
            fallback_used=output.fallback_used,
            html=output.html,
            model=output.model,
            provider=output.provider,
            raw_output=output.raw_output,
            used_fallback_template=output.used_deterministic_fallback,
        )
    )

    if output.status == "fixed" and not output.fixes:
        raise SupervisorValidationError("Debugger output marked fixed but included no fixes")
    if output.status == "pass" and output.fixes:
        raise SupervisorValidationError("Debugger output marked pass but included fixes")


def validate_seo_output(output: SEOOutput) -> None:
    validate_codegen_output(
        CodegenOutput(
            component_files=output.component_files,
            fallback_used=output.fallback_used,
            html=output.html,
            model=output.model,
            provider=output.provider,
            raw_output=output.raw_output,
            used_fallback_template=output.used_deterministic_fallback,
        )
    )

    lower = output.html.lower()
    required = (
        "<title>",
        'name="description"',
        'property="og:title"',
        'property="og:description"',
        'property="og:type"',
        'name="twitter:card"',
        'application/ld+json',
        "onara canonical placeholder",
    )
    missing = [item for item in required if item not in lower]
    if missing:
        raise SupervisorValidationError(f"SEO output missing required metadata: {missing[0]}")
    if len(output.title) > 80:
        raise SupervisorValidationError("SEO title is too long")
    if len(output.meta_description) > 180:
        raise SupervisorValidationError("SEO meta description is too long")
    if output.json_ld.get("@context") != "https://schema.org":
        raise SupervisorValidationError("SEO JSON-LD must use schema.org context")
    if "localbusiness" not in str(output.json_ld.get("@type", "")).lower():
        raise SupervisorValidationError("SEO JSON-LD must describe a LocalBusiness")


def validate_qa_output(output: QAOutput) -> None:
    required_checks = (
        "html_structure",
        "component_files",
        "component_markers",
        "professional_visual_system",
        "composition_depth",
        "onara_theme",
        "onara_typography",
        "onara_spacing",
        "motion_safety",
        "seo_metadata",
        "localbusiness_schema",
        "tap_to_call",
        "photo_usage",
        "service_richness",
        "hours_rendered",
        "local_details",
        "review_integrity",
        "section_dedupe",
        "service_menu_integrity",
        "license_honesty",
        "mobile_basics",
        "no_artifacts",
    )
    missing_checks = [check for check in required_checks if check not in output.checks]
    if missing_checks:
        raise SupervisorValidationError(f"QA output missing required check: {missing_checks[0]}")

    failed_checks = [check for check in required_checks if output.checks.get(check) is False]
    if output.status == "pass" and failed_checks:
        raise SupervisorValidationError(f"QA output passed despite failed check: {failed_checks[0]}")
    if output.status == "fail" and not output.blocking_issues:
        raise SupervisorValidationError("QA output failed but included no blocking issues")
    if output.status == "pass" and output.blocking_issues:
        raise SupervisorValidationError("QA output passed but included blocking issues")


def validate_mobile_output(output: MobileOutput) -> None:
    validate_codegen_output(
        CodegenOutput(
            component_files=output.component_files,
            fallback_used=output.fallback_used,
            html=output.html,
            model=output.model,
            provider=output.provider,
            raw_output=output.raw_output,
            used_fallback_template=output.used_deterministic_fallback,
        )
    )

    required_checks = (
        "viewport",
        "responsive_media_query",
        "overflow_guard",
        "flexible_media",
        "tap_targets",
        "fluid_type",
        "reduced_motion",
        "safe_motion",
        "seo_preserved",
    )
    missing_checks = [check for check in required_checks if check not in output.checks]
    if missing_checks:
        raise SupervisorValidationError(f"Mobile output missing required check: {missing_checks[0]}")

    failed_checks = [check for check in required_checks if output.checks.get(check) is False]
    if failed_checks:
        raise SupervisorValidationError(f"Mobile output failed required check: {failed_checks[0]}")
    if output.status == "fixed" and not output.fixes:
        raise SupervisorValidationError("Mobile output marked fixed but included no fixes")
    if output.status == "pass" and output.fixes:
        raise SupervisorValidationError("Mobile output marked pass but included fixes")
