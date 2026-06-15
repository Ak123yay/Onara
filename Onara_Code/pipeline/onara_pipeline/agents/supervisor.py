from onara_pipeline.agents.contracts import AnalystOutput, ContentOutput, StyleOutput

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
