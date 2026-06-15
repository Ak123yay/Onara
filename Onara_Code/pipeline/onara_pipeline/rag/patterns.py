from onara_pipeline.rag.types import PatternDocument


DEFAULT_PATTERNS: list[PatternDocument] = [
    PatternDocument(
        id="onara-paper-editorial-theme",
        title="Onara Paper Editorial Theme",
        vertical="local-business",
        pattern_type="design-system",
        tags=["onara", "theme", "paper", "fraunces", "terracotta", "visual-quality"],
        summary="Mandatory Onara visual DNA for generated local business websites.",
        content="""
HTML: local-business pages should feel like Onara-designed editorial paper, not generic SaaS templates.
CSS: define --paper, --paper-2, --paper-3, --ink, --ink-2, --ink-3, --rule, --accent, --accent-ink, --serif, --ui, and --mono in :root.
Typography: use Fraunces-style serif headings, Inter-style body copy, and JetBrains Mono-style uppercase labels.
Visuals: warm paper background, subtle radial/repeating texture, terracotta CTAs, ink panels, thin rule lines, low-radius cards, and practical proof/contact modules.
Avoid: purple defaults, centered-only brochure heroes, excessive rounded pills, glossy gradients, empty whitespace, and interchangeable AI landing-page symmetry.
Use for every generated site before codegen, debugger, QA, and deployment.
""".strip(),
    ),
    PatternDocument(
        id="professional-local-business-composition",
        title="Professional Local Business Composition",
        vertical="local-business",
        pattern_type="layout",
        tags=["visual-quality", "hero", "grid", "proof", "conversion", "onara"],
        summary="Designed above-the-fold layout that avoids generic centered brochure pages.",
        content="""
HTML: header, then a split/asymmetrical hero with one side for headline/CTA and the other for proof, services, booking, image, or contact panel.
CSS: low-radius cards, strong display type, grid-template-columns with minmax/repeat, fluid clamp() type, section contrast, and subtle atmosphere using gradients, color-mix, texture, or shaped panels.
Avoid: text-align:center hero as the main desktop composition, one-badge/one-CTA centered folds, generic rounded pills, oversized empty whitespace, and weak SaaS-template symmetry.
Use for every generated local business site before deployment.
""".strip(),
    ),
    PatternDocument(
        id="hero-emergency-phone-first",
        title="Emergency Phone-First Hero",
        vertical="plumbing",
        pattern_type="hero",
        tags=["emergency", "phone", "cta", "trust"],
        summary="High-contrast contractor hero with urgent service promise and tap-to-call CTA.",
        content="""
HTML: hero section with alert bar, review badge, one strong headline, two CTAs, and service cards.
CSS: navy background, orange alert strip, cream cards, large editorial serif headline.
Use when the business handles urgent homeowner problems and needs phone calls fast.
""".strip(),
    ),
    PatternDocument(
        id="roofing-trust-led-hero",
        title="Trust-Led Roof Repair Hero",
        vertical="roofing",
        pattern_type="hero",
        tags=["license", "reviews", "estimate", "storm"],
        summary="Proof-first roofing layout for expensive, trust-sensitive jobs.",
        content="""
HTML: license proof strip, storm damage copy, estimate CTA, review count, and service-area promise.
CSS: cream background, restrained blue-green accent, thick bordered proof cards.
Use when the generated site must reduce homeowner risk before asking for a call.
""".strip(),
    ),
    PatternDocument(
        id="hvac-maintenance-plan-grid",
        title="Clean HVAC Maintenance Grid",
        vertical="hvac",
        pattern_type="services",
        tags=["maintenance", "booking", "seasonal", "cards"],
        summary="Balanced HVAC services grid with seasonal maintenance plan framing.",
        content="""
HTML: three-column service grid, maintenance plan card, seasonal CTA, and booking action.
CSS: charcoal, sand, copper accents, equal card heights, minimal icons.
Use when HVAC copy should feel planned, clean, and less emergency-driven.
""".strip(),
    ),
    PatternDocument(
        id="local-service-area-proof",
        title="Local Service Area Proof",
        vertical="contractor",
        pattern_type="trust",
        tags=["service-area", "local", "seo", "schema"],
        summary="Service-area block that supports local SEO and homeowner confidence.",
        content="""
HTML: neighborhood list, city headline, short proof paragraph, map placeholder, and local FAQ.
CSS: bordered map panel beside compact location chips.
Use for contractors serving multiple nearby towns from a single base location.
""".strip(),
    ),
    PatternDocument(
        id="review-badge-strip",
        title="Google Review Badge Strip",
        vertical="contractor",
        pattern_type="trust",
        tags=["reviews", "google", "social-proof", "rating"],
        summary="Compact review badge and testimonial strip for above-the-fold credibility.",
        content="""
HTML: rating badge, review count, two short review snippets, and source label.
CSS: thin border, uppercase metadata, warm highlight underline on the best phrase.
Use when Google reviews are strong enough to be a primary conversion argument.
""".strip(),
    ),
    PatternDocument(
        id="estimate-cta-card",
        title="Free Estimate CTA Card",
        vertical="contractor",
        pattern_type="cta",
        tags=["estimate", "lead", "form", "phone"],
        summary="Simple conversion card with phone-first and form fallback actions.",
        content="""
HTML: short CTA headline, phone button, estimate form button, response-time note.
CSS: cream card, orange primary action, subtle shadow, mobile full-width buttons.
Use near the middle and bottom of generated contractor pages.
""".strip(),
    ),
    PatternDocument(
        id="license-insurance-proof-stack",
        title="License and Insurance Proof Stack",
        vertical="contractor",
        pattern_type="trust",
        tags=["license", "insurance", "proof", "badge"],
        summary="Structured trust stack for regulated or high-risk trades.",
        content="""
HTML: license status, insurance mention, warranty note, and service guarantee row.
CSS: small shield icons, calm green status dots, paper-texture background.
Use when homeowners need reassurance before booking.
""".strip(),
    ),
    PatternDocument(
        id="mobile-sticky-call-bar",
        title="Mobile Sticky Call Bar",
        vertical="contractor",
        pattern_type="mobile",
        tags=["mobile", "phone", "sticky", "cta"],
        summary="Bottom mobile call bar for fast local service conversion.",
        content="""
HTML: fixed bottom bar with call button, estimate button, and condensed business name.
CSS: safe-area padding, high contrast, no overlap with page content.
Use on every generated mobile contractor site unless the business has no phone number.
""".strip(),
    ),
    PatternDocument(
        id="accessible-entry-motion",
        title="Accessible Entry Motion",
        vertical="contractor",
        pattern_type="animation",
        tags=["animation", "accessibility", "prefers-reduced-motion", "opacity", "transform"],
        summary="Safe page-entry motion for generated contractor sites.",
        content="""
HTML: no extra wrapper is required; apply reveal classes or scoped selectors to hero copy, service cards, trust rows, and contact cards.
CSS: define short @keyframes using only opacity and translate3d transform, then stagger delays in 70ms steps.
Accessibility: always include @media (prefers-reduced-motion: reduce) that disables animation, transitions, and smooth scrolling.
Use when Agent 6 needs polish without JavaScript, layout shift, infinite motion, heavy filters, or scroll-jacking.
""".strip(),
    ),
    PatternDocument(
        id="contractor-cta-hover-motion",
        title="Contractor CTA Hover Motion",
        vertical="contractor",
        pattern_type="animation",
        tags=["animation", "cta", "hover", "phone", "conversion", "transform"],
        summary="Subtle CTA and card hover motion that keeps phone-first actions clear.",
        content="""
HTML: primary phone CTA, estimate CTA, service cards, and trust cards remain normal links or cards with accessible focus states.
CSS: use @media (hover: hover) before hover effects; animate transform translate3d and box-shadow only.
Behavior: CTAs can lift 2px, service cards can lift 3px, and trust rows can shift 4px horizontally for tactile feedback.
Avoid: color-only state changes, hover-only information, long transitions, animation on mobile tap, and JavaScript-driven loops.
""".strip(),
    ),
    PatternDocument(
        id="mobile-safe-staggered-proof",
        title="Mobile-Safe Staggered Proof",
        vertical="contractor",
        pattern_type="animation",
        tags=["animation", "mobile", "reviews", "trust", "services", "performance"],
        summary="Staggered card/proof animation that stays performant on phones.",
        content="""
HTML: service cards, review proof, license proof, and service-area chips should be independently readable before animation runs.
CSS: stagger nth-child animation-delay values from 70ms to 350ms; keep durations near 600ms and use a single easing curve token.
Performance: animate only opacity and transform, do not animate width, height, top, left, filter, or box-shadow on load.
Reduced motion: collapse delays and durations to 1ms and force scroll-behavior auto inside prefers-reduced-motion.
Use when generated pages need organized reveal sequencing without hurting mobile responsiveness.
""".strip(),
    ),
    PatternDocument(
        id="contractor-faq-local-seo",
        title="Contractor Local SEO FAQ",
        vertical="contractor",
        pattern_type="seo",
        tags=["faq", "seo", "schema", "local"],
        summary="FAQ section designed for schema markup and local homeowner objections.",
        content="""
HTML: five practical questions about service area, response time, estimates, insurance, and availability.
CSS: simple accordion or bordered list, readable spacing, no decorative clutter.
Use when generated pages need more crawlable local content without filler.
""".strip(),
    ),
    PatternDocument(
        id="before-after-project-strip",
        title="Before and After Project Strip",
        vertical="contractor",
        pattern_type="portfolio",
        tags=["photos", "portfolio", "proof", "gallery"],
        summary="Photo-forward strip for businesses with useful project or Google images.",
        content="""
HTML: before/after cards, project type labels, location labels, and short result captions.
CSS: crisp image crops, caption overlays, responsive horizontal scroll on mobile.
Use when Google Business Profile photos are available and relevant.
""".strip(),
    ),
]
