ONARA_FONT_IMPORT = (
    "@import url('https://fonts.googleapis.com/css2?"
    "family=Caveat:wght@400;600;700&"
    "family=Inter:wght@300;400;500;600;700;800&"
    "family=JetBrains+Mono:wght@300;400;500;600&"
    "family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&"
    "display=swap');"
)

ONARA_THEME_CSS = """
--paper: #fbfaf6;
--paper-2: #f3f0e8;
--paper-3: #ebe6dc;
--ink: #1a1a1a;
--ink-2: #3b3b3b;
--ink-3: #6a6a6a;
--ink-4: #a8a8a3;
--rule: #d8d6cf;
--rule-2: #ebeae4;
--accent: #c76f35;
--accent-2: #a95724;
--accent-soft: #f4dfcc;
--accent-softer: #f8eadb;
--accent-ink: #8a461f;
--leaf: #5d946a;
--serif: "Fraunces", Georgia, serif;
--ui: "Inter", Arial, sans-serif;
--mono: "JetBrains Mono", "Courier New", monospace;
""".strip()

ONARA_THEME_CONTRACT = f"""
Onara design contract:
- Use the Onara paper aesthetic: warm paper background, subtle radial/repeating texture, visible rule lines, and restrained shadows.
- Use Onara typography: Fraunces-style serif display headings, Inter-style UI body copy, and JetBrains Mono-style uppercase labels/eyebrows.
- Use Onara colors: warm paper/ink neutrals plus the selected palette as secondary action/detail colors.
- Terracotta remains the canonical Onara --accent; selected palettes may influence CTA/detail styling through --choice-* tokens.
- Canonical variables are protected. Do not redeclare --paper, --paper-2, --paper-3, --ink, --ink-2, --ink-3, --rule, --accent, --accent-ink, or --leaf after the Onara definitions. Put user palette values in --choice-primary, --choice-accent, --choice-background, --choice-surface, --choice-text, --choice-muted, and --choice-border instead.
- Use low-radius surfaces: mostly 2px-8px cards/buttons; only small chips/badges may be pill-shaped.
- Use crisp editorial composition: split or asymmetrical hero, browser/card/proof panels, section contrast, and practical local proof.
- Build a complete first fold, not a single hero poster: include a split hero plus a side panel stack, proof strip, service menu, local detail card, or contact/booking card above the fold.
- Use named composition surfaces when possible: hero-side, panel-stack, proof-strip, proof-grid, service-menu, local-card, hours-card, detail-card, review-card, and contact-card.
- Every generated site should feel like a finished local-business brand piece with layered utility panels, not just a huge headline, one CTA, and one photo.
- Avoid generic SaaS gloss: no purple defaults, no centered-only brochure hero, no oversized rounded pills, no empty template spacing.
- Define these CSS variables in :root and use them across the page:
{ONARA_THEME_CSS}
""".strip()

ONARA_REQUIRED_VARIABLES = (
    "--paper",
    "--paper-2",
    "--ink",
    "--ink-2",
    "--ink-3",
    "--rule",
    "--accent",
    "--accent-ink",
    "--serif",
    "--ui",
    "--mono",
)
