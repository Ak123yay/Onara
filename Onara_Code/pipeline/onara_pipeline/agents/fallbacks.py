import html as html_lib
import re
from typing import Any

from onara_pipeline.agents.context import (
    BusinessContext,
    default_services,
    infer_industry,
    service_candidates_for_context,
)
from onara_pipeline.agents.contracts import (
    AnalystOutput,
    CodegenOutput,
    ContentOutput,
    PlannerOutput,
    PromptOutput,
    StyleOutput,
)
from onara_pipeline.agents.generation_contracts import (
    ONARA_GENERATION_QUALITY_CONTRACT,
    business_fact_contract,
)
from onara_pipeline.agents.json_utils import compact_json
from onara_pipeline.agents.onara_theme import ONARA_FONT_IMPORT, ONARA_THEME_CONTRACT, ONARA_THEME_CSS
from onara_pipeline.agents.style_directives import (
    PALETTE_LABELS,
    SECTION_LABELS,
    normalized_style_preferences,
    style_directive_text,
)


def fallback_analyst(context: BusinessContext, style_preferences: dict[str, Any]) -> AnalystOutput:
    industry = infer_industry(context)
    selected_sections = _selected_sections(style_preferences)
    cta = _cta_text(style_preferences, context)
    rating_signal = (
        f"{context.rating:g} stars from {context.review_count} Google reviews"
        if context.rating and context.review_count
        else "Google Business Profile verified"
    )
    notes = context.notes.lower()

    urgency = []
    if any(term in notes for term in ("emergency", "24/7", "same day", "same-day")):
        urgency.append("Emergency or same-day service mentioned by owner")
    if industry in {"plumber", "hvac", "electrician", "roofer"}:
        urgency.append("Homeowners often need urgent help for this trade")

    return AnalystOutput(
        industryType=industry,
        primaryCta=cta,
        ctaType="phone_call" if context.phone else "contact_form",
        mustHaveSections=_unique(["hero", "services", "contact", *selected_sections]),
        optionalSections=["gallery", "service_area", "faq"],
        trustSignals=_unique([rating_signal, "local service area", "clear phone number"]),
        urgencyTriggers=urgency,
        targetKeyword=_target_keyword(industry, context),
        competitorWeaknesses=[
            "Phone number is not visible enough on mobile",
            "Service area is unclear",
            "Reviews and trust proof are buried too low",
        ],
        toneKeywords=_tone_keywords(style_preferences, industry),
    )


def fallback_content(context: BusinessContext, analyst: AnalystOutput) -> ContentOutput:
    services = _service_list(context, analyst.industryType)
    service_area = context.service_area
    cta = analyst.primaryCta
    tone = _tone_from_keywords(analyst.toneKeywords)
    rating_line = (
        f"Built around a {context.rating:g}-star Google rating and {context.review_count} local reviews."
        if context.rating and context.review_count
        else "Built around clear proof, local service details, and fast contact."
    )
    subheadline = {
        "direct": (
            f"{context.name} makes it easy to get the right help in {service_area}. "
            "Call, compare the services, and get the next step fast."
        ),
        "friendly": (
            f"{context.name} gives neighbors around {service_area} a simple place to understand services, "
            "ask for help, and feel comfortable before calling."
        ),
        "premium": (
            f"{context.name} presents clear service details, proof, and a refined way for homeowners in "
            f"{service_area} to start a serious project."
        ),
        "professional": (
            f"{context.name} gives homeowners a clear way to get help, compare services, "
            "and call without digging through a long page."
        ),
    }.get(tone, "")
    contact_subtext = {
        "direct": "Call now or request the next available estimate.",
        "friendly": "Tell us what you need and we will point you to the right next step.",
        "premium": "Share the project details and get a clear, professional next step.",
        "professional": "No pressure. Call or request an estimate and get a clear next step.",
    }.get(tone, "No pressure. Call or request an estimate and get a clear next step.")

    return ContentOutput.model_validate(
        {
            "hero": {
                "headline": f"{_industry_label(analyst.industryType)} help in {service_area}.",
                "subheadline": subheadline,
                "cta_button": cta,
            },
            "about": {
                "headline": f"Local work from {context.name}.",
                "body": (
                    f"We help customers around {service_area} understand what is needed, what happens next, "
                    "and how to get a straightforward estimate."
                ),
            },
            "services": [
                {
                    "name": service,
                    "description": _service_description(service, context, analyst),
                }
                for service in services[:6]
            ],
            "social_proof": {
                "headline": "Proof homeowners can check quickly.",
                "subtext": rating_line,
            },
            "contact": {
                "headline": "Tell us what is going on.",
                "subtext": contact_subtext,
            },
            "footer_tagline": f"{context.name} - local help without the runaround.",
        }
    )


def fallback_style(
    context: BusinessContext,
    analyst: AnalystOutput,
    style_preferences: dict[str, Any],
) -> StyleOutput:
    preferences = normalized_style_preferences(style_preferences)
    palette = _palette(style_preferences, analyst.industryType)
    tone = preferences["tone"]
    layout = preferences["layout"]

    return StyleOutput.model_validate(
        {
            "colors": palette,
            "typography": _typography(tone),
            "spacing": {
                "section_padding": "84px 0",
                "container_max": "1120px",
                "border_radius": "10px" if layout == "trust-led" else "6px",
            },
            "style_notes": (
                f"{context.name} should feel {tone}, local, and easy to call. "
                f"Use a {layout.replace('-', ' ')} layout with Onara paper texture, Fraunces display type, "
                f"{PALETTE_LABELS[preferences['palette']].lower()} color direction, "
                "low-radius proof panels, and practical trust proof."
            ),
        }
    )


def fallback_planner(
    analyst: AnalystOutput,
    content: ContentOutput,
    style: StyleOutput,
    style_preferences: dict[str, Any] | None = None,
) -> PlannerOutput:
    preferences = normalized_style_preferences(style_preferences)
    components = [
        {
            "id": "site_header",
            "type": "header",
            "order": 1,
            "html_structure": (
                "Create a header with a logo text block, compact service-area label, and a primary phone/contact CTA."
            ),
            "css_classes": ["site-header", "site-logo", "header-cta"],
            "content_mapping": {
                "logo": content.footer_tagline,
                "cta": content.hero.cta_button,
            },
            "responsive_changes": "Stack logo and CTA on narrow screens; keep the CTA full width on mobile.",
            "interactive": "CTA links to tel: when a phone number is available, otherwise #contact.",
        },
        {
            "id": "hero",
            "type": "section",
            "order": 2,
            "html_structure": (
                "Create a high-contrast hero section with eyebrow trust proof, H1 headline, subheadline, CTA button, "
                "and a short service card list."
            ),
            "css_classes": ["hero", "hero-copy", "hero-proof", "hero-services", "primary-cta"],
            "content_mapping": {
                "headline": content.hero.headline,
                "subheadline": content.hero.subheadline,
                "cta": content.hero.cta_button,
            },
            "responsive_changes": "Use a single column on mobile and keep the CTA above the service cards.",
            "interactive": None,
        },
        {
            "id": "services",
            "type": "section",
            "order": 3,
            "html_structure": "Create a services section with one card for each service name and description.",
            "css_classes": ["services", "service-grid", "service-card"],
            "content_mapping": {
                service.name: service.description for service in content.services
            },
            "responsive_changes": "Use a responsive grid: one column on mobile, two or three columns on larger screens.",
            "interactive": None,
        },
        {
            "id": "trust",
            "type": "section",
            "order": 4,
            "html_structure": "Create a trust section with review proof, analyst trust signals, and local service proof.",
            "css_classes": ["trust", "trust-card", "review-proof"],
            "content_mapping": {
                "headline": content.social_proof.headline,
                "subtext": content.social_proof.subtext,
                "trustSignals": ", ".join(analyst.trustSignals),
            },
            "responsive_changes": "Keep proof cards readable with generous spacing on mobile.",
            "interactive": None,
        },
    ]
    components.extend(_optional_component_specs(preferences, analyst, content, start_order=len(components) + 1))
    components.extend(
        [
            {
                "id": "contact",
                "type": "section",
                "order": len(components) + 1,
                "html_structure": "Create a contact section with a short headline, low-friction subtext, and final CTA.",
                "css_classes": ["contact", "contact-card", "contact-cta"],
                "content_mapping": {
                    "headline": content.contact.headline,
                    "subtext": content.contact.subtext,
                    "cta": content.hero.cta_button,
                },
                "responsive_changes": "Make the final CTA full-width on mobile with at least 44px tap height.",
                "interactive": "CTA links to tel: when a phone number is available, otherwise #contact.",
            },
            {
                "id": "site_footer",
                "type": "footer",
                "order": len(components) + 2,
                "html_structure": "Create a simple footer with tagline, service area, and contact details.",
                "css_classes": ["site-footer", "footer-tagline"],
                "content_mapping": {
                    "tagline": content.footer_tagline,
                    "targetKeyword": analyst.targetKeyword,
                },
                "responsive_changes": "Stack footer details vertically on mobile.",
                "interactive": None,
            },
        ]
    )

    return PlannerOutput.model_validate(
        {
            "components": components,
            "css_variables": {
                "--paper": "#fbfaf6",
                "--paper-2": "#f3f0e8",
                "--paper-3": "#ebe6dc",
                "--ink": "#1a1a1a",
                "--ink-2": "#3b3b3b",
                "--ink-3": "#6a6a6a",
                "--rule": "#d8d6cf",
                "--accent": "#c76f35",
                "--accent-ink": "#8a461f",
                "--serif": "Fraunces",
                "--ui": "Inter",
                "--mono": "JetBrains Mono",
                "--choice-primary": style.colors.primary,
                "--choice-accent": style.colors.secondary,
                "--choice-background": style.colors.background,
                "--choice-surface": style.colors.surface,
                "--choice-text": style.colors.text_primary,
                "--choice-muted": style.colors.text_secondary,
                "--choice-border": style.colors.border,
                "--color-primary": style.colors.primary,
                "--color-secondary": style.colors.secondary,
                "--color-background": style.colors.background,
                "--color-surface": style.colors.surface,
                "--color-text": style.colors.text_primary,
                "--color-muted": style.colors.text_secondary,
                "--color-border": style.colors.border,
                "--font-heading": style.typography.heading_font,
                "--font-body": style.typography.body_font,
                "--radius": style.spacing.border_radius,
                "--container": style.spacing.container_max,
            },
            "component_order": [component["id"] for component in components],
            "special_notes": (
                f"Build a phone-first {analyst.industryType} website. Primary CTA: {analyst.primaryCta}. "
                f"Target keyword: {analyst.targetKeyword}. {style.style_notes} "
                f"{style_directive_text(preferences)}"
            ),
        }
    )


def fallback_prompt(
    *,
    analyst: AnalystOutput,
    business_name: str,
    content: ContentOutput,
    context: BusinessContext,
    phone: str,
    planner: PlannerOutput,
    style: StyleOutput,
    photo_assets: list[dict[str, str]] | None = None,
    style_preferences: dict[str, Any] | None = None,
) -> PromptOutput:
    photo_assets = photo_assets or []
    prompt = f"""You are generating the production-ready local business website for {business_name}.

Return exactly one self-contained index.html file wrapped with {{FILE_MARKER_START}} before <!doctype html> and {{FILE_MARKER_END}} after </html>. Return no markdown, no explanation, and no extra text outside the markers.

Hard requirements:
- Use semantic HTML5: header, main, section, footer, nav where appropriate.
- Put all CSS inside a single <style> tag in <head>.
- Put any JavaScript inline before </body>; use no frameworks.
- Mobile-first responsive CSS with one breakpoint at 768px.
- Use CSS custom properties for every color, font, spacing token, and radius.
- Include accessible focus states, visible labels, and alt text for any placeholder images.
- If photo assets are available, include at least one real image using an exact provided src.
- Never use raw Google Places photo names, /api/places/photo, localhost, or authenticated app URLs in deployed HTML.
- Follow the Onara design contract exactly.
- Build a complete first fold with a hero-side panel stack, proof-strip, service-menu/local-card/detail-card surfaces, and at least three distinct card types.
- Do not generate only a large headline, paragraph, CTA, and one photo; layer proof, services, and local action panels into the page.
- Include lightweight CSS-only animation using opacity and transform for entry reveals, CTA/card hover states, and proof/card stagger.
- Include at least one @keyframes rule.
- Include @media (prefers-reduced-motion: reduce) that disables animations, transitions, and smooth scrolling.
- Do not use JavaScript animation, infinite animation loops, layout-shifting animation, or heavy visual filters.
- Use at least one phone-first CTA. The phone value is: {phone or "not provided"}.
- Primary CTA text: {analyst.primaryCta}.
- Target local SEO keyword: {analyst.targetKeyword}.
- Do not use filler marketing language.

Business and content:
{compact_json(content.model_dump())}

Design system:
{compact_json(style.model_dump())}

{ONARA_THEME_CONTRACT}
{style_directive_text(style_preferences)}
{business_fact_contract(context, style_preferences)}
{ONARA_GENERATION_QUALITY_CONTRACT}

Resolved photo assets:
{compact_json(photo_assets)}

Component blueprint:
{compact_json(planner.model_dump())}

Build the components in this exact order: {", ".join(planner.component_order)}.
The final HTML must look polished, local, business-specific, and conversion-focused. Avoid generic SaaS landing-page patterns."""

    return PromptOutput(prompt=prompt)


def fallback_codegen(
    *,
    analyst: AnalystOutput,
    content: ContentOutput,
    context: BusinessContext,
    planner: PlannerOutput,
    style: StyleOutput,
    style_preferences: dict[str, Any] | None = None,
    model: str = "fallback-template",
    provider: str = "deterministic",
) -> CodegenOutput:
    preferences = normalized_style_preferences(style_preferences)
    cta_href = _cta_href(context.phone)
    rating_line = (
        f"{context.rating:g} from {context.review_count} Google reviews"
        if context.rating and context.review_count
        else "Google Business Profile verified"
    )
    service_area = context.service_area
    services = content.services[:6]
    service_cards = "\n".join(
        f"""          <article class="service-card">
            <span>{_escape(str(index).zfill(2))}</span>
            <h3>{_escape(service.name)}</h3>
            <p>{_escape(service.description)}</p>
          </article>"""
        for index, service in enumerate(services, start=1)
    )
    trust_items = "\n".join(
        f"""          <li>{_escape(signal)}</li>""" for signal in analyst.trustSignals[:5]
    )
    if not trust_items:
        trust_items = "          <li>Local service area and clear contact details</li>"
    hero_side = _hero_side_component(context, analyst, cta_href, rating_line, service_area, preferences)
    proof_items = _proof_items(context, rating_line, service_area)
    optional_component_files = _optional_component_files(
        analyst=analyst,
        content=content,
        context=context,
        cta_href=cta_href,
        preferences=preferences,
        rating_line=rating_line,
        service_area=service_area,
    )

    component_files = {
        "components/site_header.html": f"""<header class="site-header" data-component="site_header">
  <a class="brand" href="#top">{_escape(context.name)}</a>
  <nav aria-label="Primary">
    <a href="#services">Services</a>
    <a href="#trust">Proof</a>
    <a href="#contact">Contact</a>
  </nav>
  <a class="header-cta" href="{cta_href}">{_escape(analyst.primaryCta)}</a>
</header>""",
        "components/hero.html": f"""<section class="hero hero-{_escape(preferences["layout"])}" data-component="hero" id="top">
  <div class="hero-copy">
    <span class="eyebrow">{_escape(rating_line)}</span>
    <h1>{_escape(content.hero.headline)}</h1>
    <p>{_escape(content.hero.subheadline)}</p>
  <div class="hero-actions">
      <a class="primary-cta" href="{cta_href}">{_escape(content.hero.cta_button)}</a>
      <span>Serving {_escape(service_area)}</span>
    </div>
    <div class="proof-strip" aria-label="Fast proof">
{proof_items}
    </div>
  </div>
{hero_side}
</section>""",
        "components/services.html": f"""<section class="services section" data-component="services" id="services">
  <div class="section-head">
    <span class="eyebrow">Services</span>
    <h2>{_escape(content.about.headline)}</h2>
    <p>{_escape(content.about.body or content.about.subtext)}</p>
  </div>
  <div class="service-grid">
{service_cards}
  </div>
</section>""",
        "components/trust.html": f"""<section class="trust section" data-component="trust" id="trust">
  <div>
    <span class="eyebrow">Trust proof</span>
    <h2>{_escape(content.social_proof.headline)}</h2>
    <p>{_escape(content.social_proof.subtext)}</p>
  </div>
  <ul class="trust-list">
{trust_items}
  </ul>
</section>""",
        "components/contact.html": f"""<section class="contact section" data-component="contact" id="contact">
  <div class="contact-card">
    <span class="eyebrow">Next step</span>
    <h2>{_escape(content.contact.headline)}</h2>
    <p>{_escape(content.contact.subtext)}</p>
    <a class="primary-cta" href="{cta_href}">{_escape(analyst.primaryCta)}</a>
    <form class="contact-form">
      <label>
        <span>Name</span>
        <input autocomplete="name" name="name" placeholder="Your name" type="text">
      </label>
      <label>
        <span>Email</span>
        <input autocomplete="email" name="email" placeholder="you@example.com" type="email">
      </label>
      <label>
        <span>Phone</span>
        <input autocomplete="tel" name="phone" placeholder="Your phone number" type="tel">
      </label>
      <label>
        <span>How can we help?</span>
        <textarea name="message" placeholder="Tell us about the service you need" rows="4"></textarea>
      </label>
      <button class="primary-cta" type="submit">Request an estimate</button>
    </form>
  </div>
</section>""",
        "components/site_footer.html": f"""<footer class="site-footer" data-component="site_footer">
  <strong>{_escape(content.footer_tagline)}</strong>
  <span>{_escape(context.address or service_area)}</span>
</footer>""",
    }
    component_files.update(optional_component_files)

    ordered_components = _ordered_component_html(planner, component_files)
    html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{_escape(context.name)} | {_escape(analyst.targetKeyword)}</title>
    <meta name="description" content="{_escape(content.hero.subheadline)}" />
    <style>
      {ONARA_FONT_IMPORT}

      :root {{
{_indent(ONARA_THEME_CSS, 8)}
        --choice-primary: {style.colors.primary};
        --choice-accent: {style.colors.secondary};
        --choice-background: {style.colors.background};
        --choice-surface: {style.colors.surface};
        --choice-text: {style.colors.text_primary};
        --choice-muted: {style.colors.text_secondary};
        --choice-border: {style.colors.border};
        --color-primary: {style.colors.primary};
        --color-secondary: {style.colors.secondary};
        --color-background: {style.colors.background};
        --color-surface: {style.colors.surface};
        --color-text: {style.colors.text_primary};
        --color-muted: {style.colors.text_secondary};
        --color-border: {style.colors.border};
        --font-heading: "{_css_escape(style.typography.heading_font)}", Georgia, serif;
        --font-body: "{_css_escape(style.typography.body_font)}", Arial, sans-serif;
        --radius: {style.spacing.border_radius};
        --container: {style.spacing.container_max};
        --motion-duration: 620ms;
        --motion-ease: cubic-bezier(0.2, 0.65, 0.2, 1);
      }}

      @keyframes onara-rise {{
        from {{ opacity: 0; transform: translate3d(0, 18px, 0); }}
        to {{ opacity: 1; transform: translate3d(0, 0, 0); }}
      }}

      @keyframes onara-fade-in {{
        from {{ opacity: 0; }}
        to {{ opacity: 1; }}
      }}

      * {{ box-sizing: border-box; }}
      html {{ scroll-behavior: smooth; }}
      body {{
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: var(--ui);
        font-size: {style.typography.base_size};
        line-height: 1.6;
      }}
      a {{ color: inherit; text-decoration: none; }}
      .site-shell {{
        min-height: 100%;
        background:
          radial-gradient(circle at 18% 10%, color-mix(in srgb, var(--choice-accent) 16%, transparent), transparent 32rem),
          radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--leaf) 10%, transparent), transparent 30rem),
          radial-gradient(circle at 25% 30%, rgba(0,0,0,0.012) 0, transparent 38rem),
          linear-gradient(180deg, var(--paper), var(--paper-2));
      }}
      .site-shell.layout-trust-led .hero {{
        grid-template-columns: minmax(0, 0.88fr) minmax(340px, 1.12fr);
      }}
      .site-shell.layout-service-grid .hero {{
        grid-template-columns: minmax(0, 0.82fr) minmax(360px, 1.18fr);
      }}
      .site-shell.layout-service-grid .service-menu {{
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }}
      .site-shell.layout-split-hero .hero {{
        grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
      }}
      .site-shell.layout-split-hero .hero-photo img {{
        aspect-ratio: 5 / 4;
      }}
      .site-header {{
        align-items: center;
        animation: onara-fade-in 460ms var(--motion-ease) both;
        border-bottom: 1px solid var(--rule);
        display: grid;
        gap: 22px;
        grid-template-columns: minmax(180px, 1fr) auto auto;
        margin: 0 auto;
        max-width: var(--container);
        padding: 24px 20px;
      }}
      .brand {{
        font-family: var(--serif);
        font-size: clamp(1.25rem, 1.8vw, 1.65rem);
        font-weight: 500;
        letter-spacing: -0.025em;
        line-height: 1.12;
        max-width: 34ch;
      }}
      nav {{ display: flex; gap: 20px; }}
      nav a, .eyebrow {{
        color: var(--ink-3);
        font-family: var(--mono);
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }}
      .header-cta, .primary-cta {{
        align-items: center;
        background: var(--choice-accent);
        color: #fff;
        display: inline-flex;
        font-weight: 850;
        justify-content: center;
        min-height: 48px;
        padding: 0 22px;
        transition: background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
      }}
      .hero {{
        align-items: start;
        display: grid;
        gap: clamp(28px, 4vw, 58px);
        grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
        margin: 0 auto;
        max-width: var(--container);
        padding: clamp(42px, 6vw, 82px) 20px clamp(36px, 5vw, 70px);
      }}
      .hero-copy > * {{
        animation: onara-rise var(--motion-duration) var(--motion-ease) both;
      }}
      .hero-copy > :nth-child(2) {{ animation-delay: 70ms; }}
      .hero-copy > :nth-child(3) {{ animation-delay: 140ms; }}
      .hero-copy > :nth-child(4) {{ animation-delay: 210ms; }}
      h1, h2, h3 {{
        font-family: var(--serif);
        font-optical-sizing: auto;
        font-synthesis: none;
        font-variation-settings: "wght" 400, "opsz" 72;
        font-weight: 400;
        letter-spacing: -0.04em;
        line-height: 0.95;
        margin: 0;
      }}
      h1 *, h2 *, h3 * {{
        font-weight: inherit;
      }}
      h1 em, h2 em, h3 em, .serif-italic {{
        font-style: italic;
        font-variation-settings: "wght" 300, "opsz" 72;
        font-weight: 300;
      }}
      h1 {{ font-size: clamp(3.5rem, 8vw, 7.8rem); max-width: 11ch; }}
      h2 {{ font-size: clamp(2.4rem, 5vw, 5rem); max-width: 12ch; }}
      h3 {{ font-size: 1.65rem; }}
      .hero-copy p, .section-head p, .trust p, .contact p {{
        color: var(--ink-3);
        font-size: clamp(1.05rem, 1.5vw, 1.25rem);
        max-width: 58ch;
      }}
      .hero-actions {{ align-items: center; display: flex; flex-wrap: wrap; gap: 16px; margin-top: 30px; }}
      .hero-actions span {{ color: var(--ink-3); font-size: 0.95rem; }}
      .proof-strip {{
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-top: 34px;
      }}
      .metric-card {{
        animation: onara-rise var(--motion-duration) var(--motion-ease) both;
        background: color-mix(in srgb, var(--paper) 82%, #fff);
        border: 1px solid var(--rule);
        min-height: 96px;
        padding: 16px;
      }}
      .metric-card:nth-child(2) {{ animation-delay: 80ms; }}
      .metric-card:nth-child(3) {{ animation-delay: 160ms; }}
      .metric-card span,
      .detail-card span {{
        color: var(--ink-3);
        display: block;
        font-family: var(--mono);
        font-size: 0.68rem;
        letter-spacing: 0.18em;
        margin-bottom: 12px;
        text-transform: uppercase;
      }}
      .metric-card strong {{
        color: var(--ink);
        display: block;
        font-size: 0.9rem;
        line-height: 1.25;
      }}
      .hero-side {{
        align-self: start;
        display: grid;
        gap: 12px;
      }}
      .panel-stack > * {{
        animation: onara-rise var(--motion-duration) var(--motion-ease) both;
      }}
      .panel-stack > :nth-child(2) {{ animation-delay: 90ms; }}
      .panel-stack > :nth-child(3) {{ animation-delay: 180ms; }}
      .panel-stack > :nth-child(4) {{ animation-delay: 270ms; }}
      .hero-card {{
        animation: onara-rise var(--motion-duration) var(--motion-ease) 220ms both;
        background: var(--ink);
        border: 1px solid color-mix(in srgb, var(--paper) 18%, transparent);
        color: #fff;
        padding: clamp(28px, 4vw, 42px);
        transition: box-shadow 180ms ease, transform 180ms ease;
      }}
      .hero-card span {{ color: color-mix(in srgb, #fff 62%, transparent); font-size: 0.82rem; letter-spacing: 0.16em; text-transform: uppercase; }}
      .hero-card strong {{ display: block; font-family: var(--serif); font-size: 2.2rem; line-height: 1; margin: 28px 0 16px; }}
      .hero-card p {{ color: color-mix(in srgb, #fff 70%, transparent); margin: 0; }}
      .hero-photo {{
        animation: onara-rise var(--motion-duration) var(--motion-ease) 220ms both;
        background: var(--ink);
        border: 1px solid color-mix(in srgb, var(--paper) 18%, transparent);
        color: #fff;
        margin: 0;
        overflow: hidden;
        padding: 14px;
        transition: box-shadow 180ms ease, transform 180ms ease;
      }}
      .hero-photo img {{
        aspect-ratio: 16 / 10;
        display: block;
        height: auto;
        max-height: 330px;
        object-fit: cover;
        width: 100%;
      }}
      .hero-photo figcaption {{
        color: color-mix(in srgb, #fff 72%, transparent);
        font-size: 0.9rem;
        padding: 14px 4px 0;
      }}
      .detail-card {{
        background: color-mix(in srgb, var(--paper) 88%, #fff);
        border: 1px solid var(--rule);
        padding: 20px;
      }}
      .detail-card strong {{
        display: block;
        font-family: var(--serif);
        font-size: 1.45rem;
        letter-spacing: -0.045em;
        line-height: 1;
      }}
      .detail-card p {{
        color: var(--ink-3);
        margin: 12px 0 0;
      }}
      .hours-card {{
        align-items: start;
        display: grid;
        gap: 12px;
        grid-template-columns: 1fr auto;
      }}
      .hours-card span {{ grid-column: 1 / -1; }}
      .hours-card .hours-list {{ grid-column: 1 / -1; }}
      .hours-card a {{
        border-bottom: 1px solid var(--choice-accent);
        color: var(--choice-primary);
        font-weight: 800;
      }}
      .hours-card small {{
        color: var(--ink-3);
        font-size: 0.9rem;
      }}
      .hours-list {{
        color: var(--ink-3);
        display: grid;
        font-size: 0.78rem;
        gap: 4px 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        line-height: 1.35;
        list-style: none;
        margin: 4px 0 0;
        padding: 0;
      }}
      .service-menu {{
        background: var(--paper-2);
        border: 1px solid var(--rule);
        display: grid;
        gap: 0;
        list-style: none;
        margin: 0;
        padding: 0;
      }}
      .service-menu li {{
        border-bottom: 1px solid var(--rule);
        font-weight: 750;
        padding: 15px 18px;
      }}
      .service-menu li:last-child {{ border-bottom: 0; }}
      .section {{ margin: 0 auto; max-width: var(--container); padding: 72px 20px; }}
      .section-head {{ display: grid; gap: 18px; margin-bottom: 28px; }}
      .service-grid {{
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }}
      .service-card {{
        animation: onara-rise var(--motion-duration) var(--motion-ease) both;
        background: var(--paper);
        border: 1px solid var(--rule);
        min-height: 220px;
        padding: 28px;
        transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
      }}
      .service-card:nth-child(2) {{ animation-delay: 70ms; }}
      .service-card:nth-child(3) {{ animation-delay: 140ms; }}
      .service-card:nth-child(4) {{ animation-delay: 210ms; }}
      .service-card:nth-child(5) {{ animation-delay: 280ms; }}
      .service-card:nth-child(6) {{ animation-delay: 350ms; }}
      .service-card span {{
        color: var(--choice-accent);
        font-family: var(--mono);
        display: block;
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.2em;
        margin-bottom: 36px;
      }}
      .service-card p {{ color: var(--ink-3); margin-bottom: 0; }}
      .trust {{
        align-items: start;
        display: grid;
        gap: 36px;
        grid-template-columns: minmax(0, 0.9fr) minmax(280px, 1.1fr);
      }}
      .trust-list {{
        background: color-mix(in srgb, var(--ink) 94%, #000);
        color: #fff;
        display: grid;
        gap: 12px;
        list-style: none;
        margin: 0;
        padding: 28px;
      }}
      .trust-list li {{
        animation: onara-rise var(--motion-duration) var(--motion-ease) both;
        border: 1px solid color-mix(in srgb, #fff 18%, transparent);
        padding: 16px;
        transition: background 180ms ease, transform 180ms ease;
      }}
      .trust-list li:nth-child(2) {{ animation-delay: 70ms; }}
      .trust-list li:nth-child(3) {{ animation-delay: 140ms; }}
      .trust-list li:nth-child(4) {{ animation-delay: 210ms; }}
      .trust-list li:nth-child(5) {{ animation-delay: 280ms; }}
      .contact-card {{
        animation: onara-rise var(--motion-duration) var(--motion-ease) both;
        background: var(--paper);
        border: 1px solid var(--rule);
        display: grid;
        gap: 16px;
        padding: clamp(30px, 5vw, 58px);
      }}
      .contact-form {{
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 6px;
      }}
      .contact-form label {{
        display: grid;
        gap: 6px;
        color: var(--ink-2);
        font-size: 0.76rem;
        font-weight: 650;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }}
      .contact-form label:last-of-type,
      .contact-form button {{
        grid-column: 1 / -1;
      }}
      .contact-form input,
      .contact-form textarea {{
        width: 100%;
        min-height: 44px;
        border: 1px solid var(--rule);
        border-radius: 2px;
        background: #fff;
        color: var(--ink);
        font: 500 0.96rem/1.4 var(--ui);
        padding: 12px 13px;
      }}
      .contact-form textarea {{
        min-height: 112px;
        resize: vertical;
      }}
      .contact-form input:focus-visible,
      .contact-form textarea:focus-visible {{
        outline: 3px solid color-mix(in srgb, var(--choice-accent) 30%, transparent);
        outline-offset: 1px;
      }}
      .site-footer {{
        border-top: 1px solid var(--rule);
        color: var(--ink-3);
        display: flex;
        gap: 16px;
        justify-content: space-between;
        margin: 40px auto 0;
        max-width: var(--container);
        padding: 28px 20px;
      }}
      .site-footer strong {{ color: var(--ink); }}
      .optional-section {{
        margin: 0 auto;
        max-width: var(--container);
        padding: 48px 20px;
      }}
      .review-facts {{
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        list-style: none;
        margin: 18px 0 0;
        padding: 0;
      }}
      .review-facts li {{
        background: var(--paper);
        border: 1px solid var(--rule);
        display: grid;
        gap: 8px;
        padding: 18px;
      }}
      .review-facts span {{
        color: var(--ink-3);
        font-family: var(--mono);
        font-size: 0.68rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }}
      .review-facts strong {{
        color: var(--ink);
        font-size: 0.98rem;
        line-height: 1.25;
      }}
      .review-grid,
      .gallery-grid,
      .faq-grid,
      .proof-grid {{
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }}
      .review-card,
      .proof-card,
      .faq-card,
      .finance-card {{
        background: var(--paper);
        border: 1px solid var(--rule);
        padding: 24px;
      }}
      .review-card strong,
      .proof-card strong,
      .finance-card strong {{
        color: var(--choice-primary);
      }}
      .gallery-grid figure {{
        background: var(--ink);
        color: #fff;
        margin: 0;
        padding: 10px;
      }}
      .gallery-grid img {{
        aspect-ratio: 4 / 3;
        display: block;
        object-fit: cover;
        width: 100%;
      }}
      .gallery-grid figcaption {{
        color: color-mix(in srgb, #fff 70%, transparent);
        font-size: 0.86rem;
        padding: 10px 2px 0;
      }}
      .gallery-placeholder div {{
        aspect-ratio: 4 / 3;
        background:
          radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--choice-accent) 24%, transparent), transparent 40%),
          linear-gradient(135deg, color-mix(in srgb, var(--ink) 94%, #000), color-mix(in srgb, var(--choice-accent) 34%, var(--ink)));
      }}
      :focus-visible {{ outline: 3px solid var(--choice-accent); outline-offset: 3px; }}
      @media (hover: hover) {{
        .header-cta:hover,
        .primary-cta:hover {{
          box-shadow: 0 16px 34px color-mix(in srgb, var(--choice-accent) 28%, transparent);
          transform: translate3d(0, -2px, 0);
        }}
        .hero-card:hover,
        .hero-photo:hover,
        .service-card:hover {{
          box-shadow: 0 18px 44px color-mix(in srgb, var(--ink) 12%, transparent);
          transform: translate3d(0, -3px, 0);
        }}
        .trust-list li:hover {{
          background: color-mix(in srgb, #fff 8%, transparent);
          transform: translate3d(4px, 0, 0);
        }}
      }}
      @media (prefers-reduced-motion: reduce) {{
        *,
        *::before,
        *::after {{
          animation-delay: 0ms !important;
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
          transition-duration: 1ms !important;
        }}
      }}
      @media (max-width: 768px) {{
        .site-header {{ align-items: stretch; grid-template-columns: 1fr; }}
        nav {{ justify-content: space-between; }}
        .header-cta, .primary-cta {{ width: 100%; }}
        .hero, .trust {{ grid-template-columns: 1fr; }}
        .contact-form {{ grid-template-columns: 1fr; }}
        .contact-form label,
        .contact-form label:last-of-type,
        .contact-form button {{ grid-column: 1; }}
        .hours-card,
        .proof-strip {{ grid-template-columns: 1fr; }}
        .hours-list,
        .review-facts,
        .review-grid,
        .gallery-grid,
        .faq-grid,
        .proof-grid {{ grid-template-columns: 1fr; }}
        .service-grid {{ grid-template-columns: 1fr; }}
        .site-footer {{ flex-direction: column; }}
      }}
    </style>
  </head>
  <body>
    <div class="site-shell layout-{_escape(preferences["layout"])} palette-{_escape(preferences["palette"])} tone-{_escape(preferences["tone"])} cta-{_escape(preferences["cta"])}">
{ordered_components}
    </div>
  </body>
</html>"""
    raw_output = f"{{FILE_MARKER_START}}\n{html}\n{{FILE_MARKER_END}}"
    return CodegenOutput(
        component_files={"index.html": html, **component_files},
        fallback_used=True,
        html=html,
        model=model,
        provider=provider,
        raw_output=raw_output,
        used_fallback_template=True,
    )


def _cta_text(style_preferences: dict[str, Any], context: BusinessContext) -> str:
    cta = normalized_style_preferences(style_preferences)["cta"]
    if cta == "call-now" and context.phone:
        return "Call Now"
    if cta == "emergency" and context.phone:
        return "Get Emergency Help"
    if cta == "book-online":
        return "Book Online"
    return "Get a Free Estimate"


def _industry_label(industry: str) -> str:
    labels = {
        "hvac": "HVAC",
        "plumber": "Plumbing",
        "roofer": "Roof repair",
        "electrician": "Electrical",
        "grocery": "Fresh grocery",
        "campground": "Campground",
    }
    return labels.get(industry, industry.replace("-", " ").title())


def _palette(style_preferences: dict[str, Any], industry: str) -> dict[str, str]:
    preferences = normalized_style_preferences(style_preferences)
    if preferences["palette"] == "custom":
        custom = preferences["customPalette"]
        if isinstance(custom, dict):
            return {
                "primary": _hex(custom.get("primary"), "#10263a"),
                "secondary": _hex(custom.get("accent"), "#ea5b0c"),
                "background": _hex(custom.get("background"), "#f8f2e8"),
                "surface": "#ffffff",
                "text_primary": _hex(custom.get("text"), "#191919"),
                "text_secondary": "#62615d",
                "border": "#ddd5ca",
            }

    preset = preferences["palette"]
    palettes = {
        "emergency": ("#10263a", "#ea5b0c", "#fff8ef", "#ffffff", "#191919", "#62615d", "#ddd5ca"),
        "trust": ("#1a4f8a", "#047481", "#f5efe4", "#ffffff", "#10263a", "#617080", "#d8d0c4"),
        "clean": ("#191919", "#c76f35", "#f8f2e8", "#ffffff", "#191919", "#6c6a66", "#d8d0c4"),
    }
    industry_palettes = {
        "plumber": ("#1a4f8a", "#f97316", "#f8fbff", "#ffffff", "#10263a", "#5b6b7b", "#d8e3ed"),
        "hvac": ("#1a4f8a", "#f97316", "#f8fbff", "#ffffff", "#10263a", "#5b6b7b", "#d8e3ed"),
        "electrician": ("#0f172a", "#facc15", "#fffbea", "#ffffff", "#111827", "#5b5b4d", "#e4dec8"),
        "landscaper": ("#166534", "#d4a96a", "#fbf7ef", "#ffffff", "#17351f", "#64705f", "#d8cdbb"),
        "cleaner": ("#0ea5e9", "#94a3b8", "#f6fbff", "#ffffff", "#183044", "#637583", "#d8e7ef"),
        "grocery": ("#1a1a1a", "#5d946a", "#fbfaf6", "#ffffff", "#1a1a1a", "#6a6a6a", "#d8d6cf"),
        "campground": ("#17351f", "#c76f35", "#fbfaf6", "#ffffff", "#1a1a1a", "#6a6a6a", "#d8d6cf"),
    }
    values = palettes.get(str(preset)) or industry_palettes.get(industry) or palettes["clean"]
    keys = ("primary", "secondary", "background", "surface", "text_primary", "text_secondary", "border")
    return dict(zip(keys, values, strict=True))


def _typography(tone: str) -> dict[str, str]:
    return {
        "heading_font": "Fraunces",
        "body_font": "Inter",
        "heading_weight": "800" if tone == "direct" else "700",
        "base_size": "16px",
        "scale": "1.28" if tone == "premium" else "1.25",
    }


def _tone_from_keywords(tone_keywords: list[str]) -> str:
    allowed = {"direct", "professional", "friendly", "premium"}
    for keyword in tone_keywords:
        normalized = keyword.strip().lower()
        if normalized in allowed:
            return normalized
    return "professional"


def _ordered_component_html(planner: PlannerOutput, component_files: dict[str, str]) -> str:
    by_id = {path.removeprefix("components/").removesuffix(".html"): value for path, value in component_files.items()}
    aliases = {
        "header": "site_header",
        "footer": "site_footer",
        "site_nav": "site_header",
    }
    ordered = []

    for component_id in planner.component_order:
        normalized = aliases.get(component_id, component_id)
        component = by_id.get(normalized)
        if component and component not in ordered:
            ordered.append(component)

    for default_id in ("site_header", "hero", "services", "trust", "contact", "site_footer"):
        component = by_id[default_id]
        if component not in ordered:
            ordered.append(component)

    return "\n".join(_indent(component, 6) for component in ordered)


def _optional_component_specs(
    preferences: dict[str, Any],
    analyst: AnalystOutput,
    content: ContentOutput,
    *,
    start_order: int,
) -> list[dict[str, Any]]:
    specs: list[dict[str, Any]] = []
    section_specs = {
        "reviews": {
            "id": "reviews",
            "html_structure": "Create a Google reviews section with rating proof and review-style cards.",
            "css_classes": ["optional-section", "reviews", "review-grid", "review-card"],
            "content_mapping": {"headline": content.social_proof.headline, "subtext": content.social_proof.subtext},
        },
        "license": {
            "id": "license_proof",
            "html_structure": "Create a license and insurance proof section only when owner-supplied credentials exist; otherwise keep this component hidden.",
            "css_classes": ["optional-section", "license-proof", "proof-grid", "proof-card"],
            "content_mapping": {"trustSignals": ", ".join(analyst.trustSignals)},
        },
        "service-area": {
            "id": "service_area",
            "html_structure": "Create a service area section naming the local coverage area and nearby work.",
            "css_classes": ["optional-section", "service-area", "proof-card"],
            "content_mapping": {"targetKeyword": analyst.targetKeyword},
        },
        "gallery": {
            "id": "gallery",
            "html_structure": "Create a photo gallery section using resolved photo assets when available.",
            "css_classes": ["optional-section", "gallery", "gallery-grid"],
            "content_mapping": {"headline": "Photos from the business"},
        },
        "faq": {
            "id": "faq",
            "html_structure": "Create a concise FAQ section that answers common homeowner objections.",
            "css_classes": ["optional-section", "faq", "faq-grid", "faq-card"],
            "content_mapping": {"targetKeyword": analyst.targetKeyword},
        },
        "financing": {
            "id": "financing",
            "html_structure": "Create a financing/payment options section without inventing lender claims.",
            "css_classes": ["optional-section", "financing", "finance-card"],
            "content_mapping": {"cta": content.hero.cta_button},
        },
    }

    for section in preferences.get("sections", []):
        spec = section_specs.get(str(section))
        if not spec:
            continue
        specs.append(
            {
                "id": spec["id"],
                "type": "section",
                "order": start_order + len(specs),
                "html_structure": spec["html_structure"],
                "css_classes": spec["css_classes"],
                "content_mapping": spec["content_mapping"],
                "responsive_changes": "Stack cards into one column on mobile with readable spacing.",
                "interactive": None,
            }
        )

    return specs


def _optional_component_files(
    *,
    analyst: AnalystOutput,
    content: ContentOutput,
    context: BusinessContext,
    cta_href: str,
    preferences: dict[str, Any],
    rating_line: str,
    service_area: str,
) -> dict[str, str]:
    files: dict[str, str] = {}
    sections = set(preferences.get("sections", []))

    if "reviews" in sections:
        review_facts = _review_fact_list(context, service_area)
        files["components/reviews.html"] = f"""<section class="optional-section reviews" data-component="reviews" id="reviews">
  <div class="section-head">
    <span class="eyebrow">{_escape(SECTION_LABELS["reviews"])}</span>
    <h2>Google profile proof customers can verify.</h2>
    <p>{_escape(rating_line)}</p>
  </div>
  <div class="review-summary-card">
    <div class="review-stars" aria-label="{_escape(rating_line)}">
      <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
    </div>
    <strong>{_escape(rating_line)}</strong>
    <p>Public Google Business Profile rating for {_escape(context.name)}.</p>
  </div>
  <ul class="review-facts" aria-label="Google review facts">
{review_facts}
  </ul>
</section>"""

    if "license" in sections:
        trust_items = _license_cards(context, analyst, rating_line)
        if trust_items:
            files["components/license_proof.html"] = f"""<section class="optional-section license-proof" data-component="license_proof" id="license-proof">
  <div class="section-head">
    <span class="eyebrow">{_escape(SECTION_LABELS["license"])}</span>
    <h2>Proof before the phone call.</h2>
  </div>
  <div class="proof-grid">
{trust_items}
  </div>
</section>"""

    if "service-area" in sections:
        service_area_cards = _service_area_cards(context, analyst, service_area)
        files["components/service_area.html"] = f"""<section class="optional-section service-area" data-component="service_area" id="service-area">
  <div class="section-head">
    <span class="eyebrow">{_escape(SECTION_LABELS["service-area"])}</span>
    <h2>Built for {_escape(service_area)} searches.</h2>
    <p>{_escape(context.name)} keeps the coverage area, address, hours, and next step visible for local customers.</p>
  </div>
  <div class="proof-grid local-detail-grid">
{service_area_cards}
  </div>
</section>"""

    if "gallery" in sections:
        figures = _gallery_figures(context, analyst)
        files["components/gallery.html"] = f"""<section class="optional-section gallery" data-component="gallery" id="gallery">
  <div class="section-head">
    <span class="eyebrow">{_escape(SECTION_LABELS["gallery"])}</span>
    <h2>Photos customers can recognize.</h2>
  </div>
  <div class="gallery-grid">
{figures}
  </div>
</section>"""

    if "faq" in sections:
        files["components/faq.html"] = f"""<section class="optional-section faq" data-component="faq" id="faq">
  <div class="section-head">
    <span class="eyebrow">{_escape(SECTION_LABELS["faq"])}</span>
    <h2>Quick answers before you call.</h2>
  </div>
  <div class="faq-grid">
    <article class="faq-card"><strong>How fast can I get help?</strong><p>Use the primary CTA and include your location so the team can give the clearest next step.</p></article>
    <article class="faq-card"><strong>What areas do you serve?</strong><p>The site is written around {_escape(service_area)} and nearby local searches.</p></article>
    <article class="faq-card"><strong>Can I ask for an estimate first?</strong><p>Yes. Use the CTA to start with a clear, low-friction estimate request.</p></article>
  </div>
</section>"""

    if "financing" in sections:
        files["components/financing.html"] = f"""<section class="optional-section financing" data-component="financing" id="financing">
  <div class="finance-card">
    <span class="eyebrow">{_escape(SECTION_LABELS["financing"])}</span>
    <h2>Ask about payment options.</h2>
    <p>For larger work, use the first call to ask what estimate, deposit, or payment options are available. No lender claims are made until the business confirms them.</p>
    <a class="primary-cta" href="{cta_href}">{_escape(content.hero.cta_button)}</a>
  </div>
</section>"""

    return files


def _gallery_figures(context: BusinessContext, analyst: AnalystOutput) -> str:
    if context.photos:
        return "\n".join(
            f"""    <figure>
      <img src="{_escape(photo.src)}" alt="{_escape(photo.alt)}" loading="lazy" decoding="async" />
      <figcaption>{_escape(photo.attribution_display or analyst.targetKeyword)}</figcaption>
    </figure>"""
            for photo in context.photos[:3]
        )

    placeholders = (
        ("Project detail", analyst.targetKeyword),
        ("Service area", context.service_area),
        ("Before the call", context.name),
    )
    return "\n".join(
        f"""    <figure class="gallery-placeholder">
      <div aria-hidden="true"></div>
      <figcaption>{_escape(title)} - {_escape(subtitle)}</figcaption>
    </figure>"""
        for title, subtitle in placeholders
    )


def _review_fact_list(context: BusinessContext, service_area: str) -> str:
    facts = [
        ("Rating", f"{context.rating:g} / 5 on Google" if context.rating else "Google profile listed"),
        ("Reviews", f"{context.review_count:,} public reviews" if context.review_count else "Public review count unavailable"),
        ("Local profile", context.address or service_area),
    ]
    return "\n".join(
        f"""    <li><span>{_escape(label)}</span><strong>{_escape(value)}</strong></li>"""
        for label, value in facts
    )


def _license_cards(context: BusinessContext, analyst: AnalystOutput, rating_line: str) -> str:
    credentials = _credential_claims(context.notes)
    if credentials:
        cards = [
            ("Owner-provided credential", credentials[0]),
            ("Business identity", context.address or context.category),
            ("Review proof", rating_line),
        ]
    else:
        return ""

    return "\n".join(
        f"""    <article class="proof-card"><strong>{_escape(title)}</strong><p>{_escape(body)}</p></article>"""
        for title, body in cards[:3]
    )


def _service_area_cards(context: BusinessContext, analyst: AnalystOutput, service_area: str) -> str:
    cards = [
        ("Coverage", f"Focused on {service_area} and nearby customers."),
        ("Address", context.address or f"City/state shown as {service_area}."),
    ]
    html_cards = "\n".join(
        f"""    <article class="proof-card"><strong>{_escape(title)}</strong><p>{_escape(body)}</p></article>"""
        for title, body in cards
    )
    return f"""{html_cards}
    <article class="proof-card hours-proof-card">
      <strong>Availability</strong>
{_hours_list_markup(context)}
    </article>"""


def _credential_claims(notes: str) -> list[str]:
    if not notes:
        return []

    matches = re.findall(
        r"(?i)\b(?:license(?:d)?|lic\.?|insured|insurance|bonded|certified|certification)\b[^.\n;]{0,90}",
        notes,
    )
    return _unique([match.strip(" :-") for match in matches])[:3]


def _hours_summary(context: BusinessContext) -> str:
    hours = [item.strip() for item in context.hours if item.strip()]
    if not hours:
        return "Hours not supplied yet"

    time_parts = []
    for item in hours:
        if ":" not in item:
            continue
        time_parts.append(item.split(":", 1)[1].strip())

    unique_times = _unique(time_parts)
    if len(unique_times) == 1 and len(hours) >= 5:
        return f"Daily {unique_times[0]}"

    return "Weekly hours listed"


def _hours_list_markup(context: BusinessContext) -> str:
    hours = [item.strip() for item in context.hours if item.strip()]
    if not hours:
        return "      <p>Hours not supplied yet</p>"

    items = "\n".join(f"        <li>{_escape(item)}</li>" for item in hours)
    return f"""      <ul class="hours-list">
{items}
      </ul>"""


def _service_list(context: BusinessContext, industry: str, *, limit: int = 6) -> list[str]:
    services = service_candidates_for_context(context, industry, limit=limit)
    if services:
        return services
    return default_services(industry)[:limit]


def _service_description(service: str, context: BusinessContext, analyst: AnalystOutput) -> str:
    next_step = context.phone or analyst.primaryCta
    return (
        f"Clear {service.lower()} details for {context.service_area} customers, with "
        f"{next_step} visible as the next step."
    )


def _proof_items(context: BusinessContext, rating_line: str, service_area: str) -> str:
    items = [
        ("Reviews", rating_line),
        ("Area", f"Serving {service_area}"),
        ("Action", context.phone or "Fast estimate request"),
    ]
    return "\n".join(
        f"""      <div class="metric-card">
        <span>{_escape(label)}</span>
        <strong>{_escape(value)}</strong>
      </div>"""
        for label, value in items
    )


def _hero_side_component(
    context: BusinessContext,
    analyst: AnalystOutput,
    cta_href: str,
    rating_line: str,
    service_area: str,
    preferences: dict[str, Any],
) -> str:
    services = _service_list(context, analyst.industryType, limit=4)
    service_items = "\n".join(
        f"""      <li>{_escape(service)}</li>""" for service in services
    )
    layout = str(preferences.get("layout") or "phone-first")
    media = _hero_media_component(context, analyst)
    hours_summary = _hours_summary(context)
    local_card = f"""    <div class="detail-card local-card">
      <span class="eyebrow">Local proof</span>
      <strong>{_escape(service_area)}</strong>
      <p>{_escape(context.address or rating_line)}</p>
    </div>"""
    action_card = f"""    <div class="detail-card hours-card">
      <span class="eyebrow">Hours and next step</span>
      <strong>{_escape(hours_summary)}</strong>
      <small>{_escape(context.phone or "Use the estimate request to start.")}</small>
      <a href="{cta_href}">{_escape(analyst.primaryCta)}</a>
{_hours_list_markup(context)}
    </div>"""
    service_menu = f"""    <ul class="service-menu" aria-label="Common services">
{service_items}
    </ul>"""

    if layout == "trust-led":
        ordered_panels = f"{local_card}\n{media}\n{action_card}\n{service_menu}"
    elif layout == "service-grid":
        ordered_panels = f"{service_menu}\n{local_card}\n{media}\n{action_card}"
    elif layout == "split-hero":
        ordered_panels = f"{media}\n{service_menu}\n{local_card}\n{action_card}"
    else:
        ordered_panels = f"{action_card}\n{service_menu}\n{media}\n{local_card}"

    return f"""  <aside class="hero-side panel-stack" aria-label="Local proof and next steps">
{ordered_panels}
  </aside>"""


def _hero_media_component(context: BusinessContext, analyst: AnalystOutput) -> str:
    if context.photos:
        photo = context.photos[0]
        attribution = (
            f"""<a href="{_escape(photo.attribution_uri)}" rel="nofollow noopener" target="_blank">{_escape(photo.attribution_display)}</a>"""
            if photo.attribution_display and photo.attribution_uri
            else _escape(photo.attribution_display)
        )
        caption = attribution or _escape(analyst.targetKeyword)
        return f"""    <figure class="hero-photo" aria-label="Business photo">
      <img src="{_escape(photo.src)}" alt="{_escape(photo.alt)}" loading="eager" decoding="async" />
      <figcaption>{caption}</figcaption>
    </figure>"""

    return f"""    <div class="hero-card" aria-label="Fast contact">
      <span>Phone-first local site</span>
      <strong>{_escape(context.phone or "Call for estimate")}</strong>
      <p>{_escape(analyst.targetKeyword)}</p>
    </div>"""


def _cta_href(phone: str) -> str:
    digits = re.sub(r"[^0-9+]", "", phone)
    return f"tel:{digits}" if digits else "#contact"


def _escape(value: str) -> str:
    return html_lib.escape(value, quote=True)


def _css_escape(value: str) -> str:
    return value.replace("\\", "").replace('"', "").strip()


def _indent(value: str, spaces: int) -> str:
    prefix = " " * spaces
    return "\n".join(f"{prefix}{line}" if line else line for line in value.splitlines())


def _selected_sections(style_preferences: dict[str, Any]) -> list[str]:
    sections = style_preferences.get("sections")
    return [item for item in sections if isinstance(item, str)] if isinstance(sections, list) else []


def _target_keyword(industry: str, context: BusinessContext) -> str:
    area = context.service_area
    return f"{industry} in {area}" if area != "your area" else context.category


def _tone_keywords(style_preferences: dict[str, Any], industry: str) -> list[str]:
    tone = str(style_preferences.get("tone") or "professional")
    keywords = [tone, "local", "clear", "trustworthy"]
    if industry in {"plumber", "hvac", "electrician", "roofer"}:
        keywords.append("responsive")
    return _unique(keywords)[:5]


def _hex(value: Any, fallback: str) -> str:
    if isinstance(value, str) and len(value) == 7 and value.startswith("#"):
        return value
    return fallback


def _unique(values: list[str]) -> list[str]:
    seen = set()
    output = []
    for value in values:
        normalized = value.strip()
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            output.append(normalized)
    return output
