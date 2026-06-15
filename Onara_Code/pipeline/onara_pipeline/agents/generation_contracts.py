from onara_pipeline.agents.context import BusinessContext, default_services, infer_industry
from onara_pipeline.agents.json_utils import compact_json
from onara_pipeline.agents.style_directives import normalized_style_preferences


ONARA_GENERATION_QUALITY_CONTRACT = """
Onara generation quality contract:
- Canonical Onara tokens are protected. Define --paper, --paper-2, --paper-3, --ink, --ink-2, --ink-3, --rule, --accent, --accent-ink, --leaf, --serif, --ui, and --mono once from the Onara theme. Do not redeclare them later for a selected palette.
- Selected palettes must be expressed through secondary tokens such as --choice-primary, --choice-accent, --choice-background, --choice-surface, --choice-text, --choice-muted, and --choice-border, or through local component styling. They must not flatten the warm paper/ink aesthetic.
- The page must render real business facts that are available in the input: name, address, phone, service area, hours, rating/review count, listed services, website, and resolved photos.
- Display headings must use the Onara landing-page weight: Fraunces 400, italic accents at 300, and tight readable tracking. Do not use bold/black hero headings.
- Never ship generic filler cards. Repeated review/proof text, placeholder trust claims, or three identical cards are launch blockers.
- Do not fabricate credentials. If license or insurance details are selected but not supplied, omit the visible license/credential section entirely. Do not show "pending", "verification-needed", or "credential status" cards on public drafts.
- If hours are supplied, show them in a named hours-card or local detail panel above the fold or in a clearly labeled local details section.
- If a service area section is selected, it must include the actual service area and either the address, city/state, or a map/search reference. A single generic paragraph is not enough.
- If resolved photo assets are supplied, at least one exact photo src must appear in the hero, gallery, or proof section. If no photos are supplied, use designed CSS visual panels instead of broken image tags.
- Services must feel complete. If Google only returns one service/category, supplement with industry-appropriate services and render at least four distinct service entries.
- The final composition must look like a finished local-business brand piece: split hero, side panel stack, proof strip, service menu/grid, local/hours cards, and practical CTA repetition.
""".strip()


def business_fact_contract(context: BusinessContext, style_preferences: dict | None = None) -> str:
    preferences = normalized_style_preferences(style_preferences)
    known_services = context.services or default_services(infer_industry(context))
    facts = {
        "name": context.name,
        "category": context.category,
        "address": context.address or "not supplied",
        "phone": context.phone or "not supplied",
        "service_area": context.service_area,
        "hours": context.hours,
        "rating": context.rating,
        "review_count": context.review_count,
        "services": known_services,
        "website": context.website or "not supplied",
        "photo_count": len(context.photos),
        "selected_sections": preferences["sections"],
        "owner_notes": context.notes or "none",
    }
    return f"""Business facts that must drive the generated page:
{compact_json(facts)}

Rendering requirements for these facts:
- Render supplied hours exactly enough that a customer can understand availability.
- Render supplied address or city/state in local proof and service-area sections.
- Render supplied phone as a tap-to-call link when available.
- Use rating and review count only when present; do not invent review quotes.
- Use owner notes as the only source for license numbers, insurance claims, guarantees, or special offers.
- If selected sections require data that is missing, omit the visible section unless the missing-state copy is useful to customers. For license, insurance, bonded, or certification proof, missing-state copy is not useful; omit it.
""".strip()
