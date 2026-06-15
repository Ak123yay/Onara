import html as html_lib
import re
from typing import Any

from onara_pipeline.agents.context import BusinessContext, default_services, infer_industry
from onara_pipeline.agents.contracts import (
    AnalystOutput,
    CodegenOutput,
    ContentOutput,
    PlannerOutput,
    PromptOutput,
    StyleOutput,
)
from onara_pipeline.agents.json_utils import compact_json


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
    services = context.services or default_services(analyst.industryType)
    service_area = context.service_area
    cta = analyst.primaryCta
    rating_line = (
        f"Built around a {context.rating:g}-star Google rating and {context.review_count} local reviews."
        if context.rating and context.review_count
        else "Built around clear proof, local service details, and fast contact."
    )

    return ContentOutput.model_validate(
        {
            "hero": {
                "headline": f"{_industry_label(analyst.industryType)} help in {service_area}.",
                "subheadline": (
                    f"{context.name} gives homeowners a clear way to get help, compare services, "
                    "and call without digging through a long page."
                ),
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
                    "description": f"Practical {service.lower()} support with clear next steps and a simple way to call.",
                }
                for service in services[:6]
            ],
            "social_proof": {
                "headline": "Proof homeowners can check quickly.",
                "subtext": rating_line,
            },
            "contact": {
                "headline": "Tell us what is going on.",
                "subtext": "No pressure. Call or request an estimate and get a clear next step.",
            },
            "footer_tagline": f"{context.name} - local help without the runaround.",
        }
    )


def fallback_style(
    context: BusinessContext,
    analyst: AnalystOutput,
    style_preferences: dict[str, Any],
) -> StyleOutput:
    palette = _palette(style_preferences, analyst.industryType)
    tone = str(style_preferences.get("tone") or "professional")
    layout = str(style_preferences.get("layout") or "phone-first")

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
                f"Use a {layout.replace('-', ' ')} layout with strong contrast and practical trust proof."
            ),
        }
    )


def fallback_planner(
    analyst: AnalystOutput,
    content: ContentOutput,
    style: StyleOutput,
) -> PlannerOutput:
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
        {
            "id": "contact",
            "type": "section",
            "order": 5,
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
            "order": 6,
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

    return PlannerOutput.model_validate(
        {
            "components": components,
            "css_variables": {
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
                f"Target keyword: {analyst.targetKeyword}. {style.style_notes}"
            ),
        }
    )


def fallback_prompt(
    *,
    analyst: AnalystOutput,
    content: ContentOutput,
    planner: PlannerOutput,
    style: StyleOutput,
    business_name: str,
    phone: str,
) -> PromptOutput:
    prompt = f"""You are generating the production-ready contractor website for {business_name}.

Return exactly one self-contained index.html file wrapped with {{FILE_MARKER_START}} before <!doctype html> and {{FILE_MARKER_END}} after </html>. Return no markdown, no explanation, and no extra text outside the markers.

Hard requirements:
- Use semantic HTML5: header, main, section, footer, nav where appropriate.
- Put all CSS inside a single <style> tag in <head>.
- Put any JavaScript inline before </body>; use no frameworks.
- Mobile-first responsive CSS with one breakpoint at 768px.
- Use CSS custom properties for every color, font, spacing token, and radius.
- Include accessible focus states, visible labels, and alt text for any placeholder images.
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

Component blueprint:
{compact_json(planner.model_dump())}

Build the components in this exact order: {", ".join(planner.component_order)}.
The final HTML must look polished, local, contractor-specific, and conversion-focused. Avoid generic SaaS landing-page patterns."""

    return PromptOutput(prompt=prompt)


def fallback_codegen(
    *,
    analyst: AnalystOutput,
    content: ContentOutput,
    context: BusinessContext,
    planner: PlannerOutput,
    style: StyleOutput,
    model: str = "fallback-template",
    provider: str = "deterministic",
) -> CodegenOutput:
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
        "components/hero.html": f"""<section class="hero" data-component="hero" id="top">
  <div class="hero-copy">
    <span class="eyebrow">{_escape(rating_line)}</span>
    <h1>{_escape(content.hero.headline)}</h1>
    <p>{_escape(content.hero.subheadline)}</p>
    <div class="hero-actions">
      <a class="primary-cta" href="{cta_href}">{_escape(content.hero.cta_button)}</a>
      <span>Serving {_escape(service_area)}</span>
    </div>
  </div>
  <aside class="hero-card" aria-label="Fast contact">
    <span>Phone-first contractor site</span>
    <strong>{_escape(context.phone or "Call for estimate")}</strong>
    <p>{_escape(analyst.targetKeyword)}</p>
  </aside>
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
  </div>
</section>""",
        "components/site_footer.html": f"""<footer class="site-footer" data-component="site_footer">
  <strong>{_escape(content.footer_tagline)}</strong>
  <span>{_escape(context.address or service_area)}</span>
</footer>""",
    }

    ordered_components = _ordered_component_html(planner, component_files)
    html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{_escape(context.name)} | {_escape(analyst.targetKeyword)}</title>
    <meta name="description" content="{_escape(content.hero.subheadline)}" />
    <style>
      :root {{
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
        background: var(--color-background);
        color: var(--color-text);
        font-family: var(--font-body);
        font-size: {style.typography.base_size};
        line-height: 1.6;
      }}
      a {{ color: inherit; text-decoration: none; }}
      .site-shell {{
        min-height: 100vh;
        background:
          radial-gradient(circle at 18% 10%, color-mix(in srgb, var(--color-secondary) 16%, transparent), transparent 32rem),
          linear-gradient(180deg, var(--color-background), color-mix(in srgb, var(--color-surface) 72%, var(--color-background)));
      }}
      .site-header {{
        align-items: center;
        animation: onara-fade-in 460ms var(--motion-ease) both;
        border-bottom: 1px solid var(--color-border);
        display: flex;
        gap: 22px;
        justify-content: space-between;
        margin: 0 auto;
        max-width: var(--container);
        padding: 24px 20px;
      }}
      .brand {{
        font-family: var(--font-heading);
        font-size: clamp(1.35rem, 2vw, 1.85rem);
        font-weight: {style.typography.heading_weight};
        letter-spacing: -0.045em;
      }}
      nav {{ display: flex; gap: 20px; }}
      nav a, .eyebrow {{
        color: var(--color-muted);
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }}
      .header-cta, .primary-cta {{
        align-items: center;
        background: var(--color-secondary);
        color: #fff;
        display: inline-flex;
        font-weight: 850;
        justify-content: center;
        min-height: 48px;
        padding: 0 22px;
        transition: background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
      }}
      .hero {{
        display: grid;
        gap: clamp(28px, 5vw, 72px);
        grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
        margin: 0 auto;
        max-width: var(--container);
        padding: clamp(58px, 8vw, 112px) 20px;
      }}
      .hero-copy > * {{
        animation: onara-rise var(--motion-duration) var(--motion-ease) both;
      }}
      .hero-copy > :nth-child(2) {{ animation-delay: 70ms; }}
      .hero-copy > :nth-child(3) {{ animation-delay: 140ms; }}
      .hero-copy > :nth-child(4) {{ animation-delay: 210ms; }}
      h1, h2, h3 {{
        font-family: var(--font-heading);
        font-weight: {style.typography.heading_weight};
        letter-spacing: -0.06em;
        line-height: 0.95;
        margin: 0;
      }}
      h1 {{ font-size: clamp(3.5rem, 8vw, 7.8rem); max-width: 11ch; }}
      h2 {{ font-size: clamp(2.4rem, 5vw, 5rem); max-width: 12ch; }}
      h3 {{ font-size: 1.65rem; }}
      .hero-copy p, .section-head p, .trust p, .contact p {{
        color: var(--color-muted);
        font-size: clamp(1.05rem, 1.5vw, 1.25rem);
        max-width: 58ch;
      }}
      .hero-actions {{ align-items: center; display: flex; flex-wrap: wrap; gap: 16px; margin-top: 30px; }}
      .hero-actions span {{ color: var(--color-muted); font-size: 0.95rem; }}
      .hero-card {{
        animation: onara-rise var(--motion-duration) var(--motion-ease) 220ms both;
        align-self: end;
        background: var(--color-primary);
        border: 1px solid color-mix(in srgb, var(--color-surface) 18%, transparent);
        color: #fff;
        padding: clamp(28px, 4vw, 42px);
        transition: box-shadow 180ms ease, transform 180ms ease;
      }}
      .hero-card span {{ color: color-mix(in srgb, #fff 62%, transparent); font-size: 0.82rem; letter-spacing: 0.16em; text-transform: uppercase; }}
      .hero-card strong {{ display: block; font-family: var(--font-heading); font-size: 2.2rem; line-height: 1; margin: 28px 0 16px; }}
      .hero-card p {{ color: color-mix(in srgb, #fff 70%, transparent); margin: 0; }}
      .section {{ margin: 0 auto; max-width: var(--container); padding: 72px 20px; }}
      .section-head {{ display: grid; gap: 18px; margin-bottom: 28px; }}
      .service-grid {{
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }}
      .service-card {{
        animation: onara-rise var(--motion-duration) var(--motion-ease) both;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
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
        color: var(--color-secondary);
        display: block;
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.2em;
        margin-bottom: 36px;
      }}
      .service-card p {{ color: var(--color-muted); margin-bottom: 0; }}
      .trust {{
        align-items: start;
        display: grid;
        gap: 36px;
        grid-template-columns: minmax(0, 0.9fr) minmax(280px, 1.1fr);
      }}
      .trust-list {{
        background: color-mix(in srgb, var(--color-primary) 94%, #000);
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
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        display: grid;
        gap: 16px;
        padding: clamp(30px, 5vw, 58px);
      }}
      .site-footer {{
        border-top: 1px solid var(--color-border);
        color: var(--color-muted);
        display: flex;
        gap: 16px;
        justify-content: space-between;
        margin: 40px auto 0;
        max-width: var(--container);
        padding: 28px 20px;
      }}
      .site-footer strong {{ color: var(--color-text); }}
      :focus-visible {{ outline: 3px solid var(--color-secondary); outline-offset: 3px; }}
      @media (hover: hover) {{
        .header-cta:hover,
        .primary-cta:hover {{
          box-shadow: 0 16px 34px color-mix(in srgb, var(--color-secondary) 28%, transparent);
          transform: translate3d(0, -2px, 0);
        }}
        .hero-card:hover,
        .service-card:hover {{
          box-shadow: 0 18px 44px color-mix(in srgb, var(--color-text) 12%, transparent);
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
        .site-header {{ align-items: stretch; flex-direction: column; }}
        nav {{ justify-content: space-between; }}
        .header-cta, .primary-cta {{ width: 100%; }}
        .hero, .trust {{ grid-template-columns: 1fr; }}
        .service-grid {{ grid-template-columns: 1fr; }}
        .site-footer {{ flex-direction: column; }}
      }}
    </style>
  </head>
  <body>
    <div class="site-shell">
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
    cta = style_preferences.get("cta")
    if cta == "call-now" and context.phone:
        return "Call Now"
    if cta == "emergency" and context.phone:
        return "Call for Emergency Help"
    if cta == "book-online":
        return "Book Online"
    return "Get a Free Estimate"


def _industry_label(industry: str) -> str:
    labels = {
        "hvac": "HVAC",
        "plumber": "Plumbing",
        "roofer": "Roof repair",
        "electrician": "Electrical",
    }
    return labels.get(industry, industry.replace("-", " ").title())


def _palette(style_preferences: dict[str, Any], industry: str) -> dict[str, str]:
    if style_preferences.get("palette") == "custom":
        custom = style_preferences.get("customPalette")
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

    preset = style_preferences.get("palette")
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
    }
    values = palettes.get(str(preset)) or industry_palettes.get(industry) or palettes["clean"]
    keys = ("primary", "secondary", "background", "surface", "text_primary", "text_secondary", "border")
    return dict(zip(keys, values, strict=True))


def _typography(tone: str) -> dict[str, str]:
    if tone == "premium":
        return {
            "heading_font": "Cormorant Garamond",
            "body_font": "Manrope",
            "heading_weight": "700",
            "base_size": "16px",
            "scale": "1.28",
        }
    if tone == "direct":
        return {
            "heading_font": "Archivo",
            "body_font": "Source Sans 3",
            "heading_weight": "800",
            "base_size": "16px",
            "scale": "1.22",
        }

    return {
        "heading_font": "Fraunces",
        "body_font": "Work Sans",
        "heading_weight": "700",
        "base_size": "16px",
        "scale": "1.25",
    }


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
