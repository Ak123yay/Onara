"""Tests for V3 pipeline hardening changes.

Covers:
- quality.py theme/brand gate (protected variables, font checks, pill-radius, raw color)
- assembler.py strict ValueError on missing data-component
- directions.py scoring and fallback logic
- component_codegen.py prompt injection + extract markers
- config.py V3 settings defaults
- critical_release_blockers policy
"""
import unittest

from onara_pipeline.agents.contracts import ComponentSpec
from onara_pipeline.config import Settings
from onara_pipeline.v3.assembler import assemble_candidate, fallback_component
from onara_pipeline.v3.contracts import ComponentArtifact, ComponentAudit, DesignDirection
from onara_pipeline.v3.directions import select_directions, _score_direction
from onara_pipeline.v3.quality import (
    audit_component,
    component_fingerprint,
    critical_release_blockers,
    _contains_raw_color,
)


def _spec(component_id: str = "hero", component_type: str = "section") -> ComponentSpec:
    return ComponentSpec(
        id=component_id,
        type=component_type,
        order=1,
        html_structure="One semantic component root with accessible content.",
        css_classes=[f"c-{component_id}"],
        responsive_changes="Collapse cleanly to one column.",
    )


def _direction(
    key: str = "test-dir",
    layout: str = "editorial",
    palette: str = "copper",
    hero_composition: str = "An asymmetrical editorial hero composition with services stacked below.",
    proof_strategy: str = "Use verified aggregate facts and service-area details without invented claims.",
    image_strategy: str = "Use supplied verified images with stable aspect ratios and descriptive alt text.",
    mobile_strategy: str = "Stack content in conversion order without fixed heights or horizontal overflow.",
) -> DesignDirection:
    return DesignDirection(
        key=key,
        name=key.replace("-", " ").title(),
        recipe=f"{key}-recipe",
        layout=layout,
        palette=palette,
        hero_composition=hero_composition,
        proof_strategy=proof_strategy,
        image_strategy=image_strategy,
        mobile_strategy=mobile_strategy,
    )


def _artifact(
    component_id: str = "hero",
    html: str = '<section class="c-hero" data-component="hero"><h1>Title</h1><a href="#contact">Go</a></section>',
    css: str = ".c-hero { color: var(--ink); }",
    candidate_key: str = "a",
) -> ComponentArtifact:
    return ComponentArtifact(
        candidate_key=candidate_key,
        component_id=component_id,
        html=html,
        css=css,
        model="test",
        provider="test",
        fingerprint=component_fingerprint(html, css),
    )


# ─── QUALITY GATE TESTS ─────────────────────────────────────────────────────────


class TestAuditComponentThemeGate(unittest.TestCase):
    """Tests for the brand/theme validation gate in quality.py."""

    def test_accepts_valid_component(self) -> None:
        audit = audit_component(
            component_id="hero",
            css=".c-hero { color: var(--ink); background: var(--paper); }",
            html=(
                '<section class="c-hero" data-component="hero">'
                "<h1>Example Plumbing</h1>"
                '<a href="tel:+17035550100">Call now</a>'
                "</section>"
            ),
            spec=_spec(),
        )
        self.assertTrue(audit.eligible)
        self.assertEqual(audit.blockers, [])

    def test_rejects_redeclared_protected_variables(self) -> None:
        css = ".c-hero { --paper: #fff; --ink: #000; color: var(--ink); }"
        audit = audit_component(
            component_id="hero",
            css=css,
            html='<section class="c-hero" data-component="hero"><h1>T</h1><a href="#">Go</a></section>',
            spec=_spec(),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(
            any("redeclares protected" in b for b in audit.blockers),
            f"Expected 'redeclares protected' blocker, got: {audit.blockers}",
        )

    def test_rejects_hardcoded_font_family(self) -> None:
        css = '.c-hero { font-family: "Helvetica", sans-serif; }'
        audit = audit_component(
            component_id="hero",
            css=css,
            html='<section class="c-hero" data-component="hero"><h1>T</h1><a href="#">Go</a></section>',
            spec=_spec(),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(
            any("font-family" in b for b in audit.blockers),
            f"Expected font-family blocker, got: {audit.blockers}",
        )

    def test_accepts_font_family_with_var(self) -> None:
        css = ".c-hero { font-family: var(--font-display); }"
        audit = audit_component(
            component_id="hero",
            css=css,
            html='<section class="c-hero" data-component="hero"><h1>T</h1><a href="#">Go</a></section>',
            spec=_spec(),
        )
        # Should not have any font-family blockers
        font_blockers = [b for b in audit.blockers if "font-family" in b]
        self.assertEqual(font_blockers, [])

    def test_rejects_pill_radius_on_non_badge(self) -> None:
        css = ".c-hero .btn { border-radius: 9999px; }"
        audit = audit_component(
            component_id="hero",
            css=css,
            html='<section class="c-hero" data-component="hero"><h1>T</h1><a href="#">Go</a></section>',
            spec=_spec(),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(
            any("pill-shaped" in b for b in audit.blockers),
            f"Expected pill-shaped blocker, got: {audit.blockers}",
        )

    def test_allows_pill_radius_on_badge(self) -> None:
        css = ".c-hero .badge { border-radius: 9999px; }"
        audit = audit_component(
            component_id="hero",
            css=css,
            html='<section class="c-hero" data-component="hero"><h1>T</h1><a href="#">Go</a></section>',
            spec=_spec(),
        )
        # pill check should not fire for badge elements
        pill_blockers = [b for b in audit.blockers if "pill-shaped" in b]
        self.assertEqual(pill_blockers, [])

    def test_rejects_raw_hex_color(self) -> None:
        css = ".c-hero { color: #ff5500; }"
        audit = audit_component(
            component_id="hero",
            css=css,
            html='<section class="c-hero" data-component="hero"><h1>T</h1><a href="#">Go</a></section>',
            spec=_spec(),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("raw color" in b for b in audit.blockers))

    def test_rejects_raw_rgb_color(self) -> None:
        css = ".c-hero { background-color: rgb(255, 85, 0); }"
        audit = audit_component(
            component_id="hero",
            css=css,
            html='<section class="c-hero" data-component="hero"><h1>T</h1><a href="#">Go</a></section>',
            spec=_spec(),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("raw color" in b for b in audit.blockers))

    def test_accepts_var_colors(self) -> None:
        css = ".c-hero { color: var(--ink); background: var(--paper); border-color: var(--rule); }"
        self.assertFalse(_contains_raw_color(css))

    def test_accepts_transparent_inherit(self) -> None:
        css = ".c-hero { color: inherit; background: transparent; }"
        self.assertFalse(_contains_raw_color(css))

    def test_rejects_hsl_color(self) -> None:
        css = ".c-hero { color: hsl(20, 100%, 50%); }"
        self.assertTrue(_contains_raw_color(css))

    def test_rejects_oklch_color(self) -> None:
        css = ".c-hero { color: oklch(0.5 0.1 200); }"
        self.assertTrue(_contains_raw_color(css))

    def test_rejects_global_css(self) -> None:
        css = "body { margin: 0; } .c-hero { color: var(--ink); }"
        audit = audit_component(
            component_id="hero",
            css=css,
            html='<section class="c-hero" data-component="hero"><h1>T</h1><a href="#">Go</a></section>',
            spec=_spec(),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("global CSS" in b for b in audit.blockers))

    def test_rejects_inline_styles(self) -> None:
        audit = audit_component(
            component_id="hero",
            css=".c-hero { color: var(--ink); }",
            html='<section class="c-hero" data-component="hero" style="color:red"><h1>T</h1><a href="#">Go</a></section>',
            spec=_spec(),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("inline styles" in b for b in audit.blockers))

    def test_rejects_unscoped_css(self) -> None:
        css = ".other-class { color: var(--ink); }"
        audit = audit_component(
            component_id="hero",
            css=css,
            html='<section class="c-hero" data-component="hero"><h1>T</h1><a href="#">Go</a></section>',
            spec=_spec(),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("not scoped" in b for b in audit.blockers))

    def test_rejects_missing_data_component(self) -> None:
        audit = audit_component(
            component_id="hero",
            css=".c-hero { color: var(--ink); }",
            html='<section class="c-hero"><h1>T</h1><a href="#">Go</a></section>',
            spec=_spec(),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("data-component" in b for b in audit.blockers))

    def test_rejects_multiple_data_component_roots(self) -> None:
        html = (
            '<section data-component="hero"><h1>A</h1></section>'
            '<section data-component="services"><p>B</p></section>'
        )
        audit = audit_component(
            component_id="hero",
            css=".c-hero { color: var(--ink); }",
            html=html,
            spec=_spec(),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("exactly one" in b for b in audit.blockers))

    def test_rejects_unsafe_html(self) -> None:
        html = '<section class="c-hero" data-component="hero"><script>alert(1)</script></section>'
        audit = audit_component(
            component_id="hero",
            css=".c-hero { color: var(--ink); }",
            html=html,
            spec=_spec(),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("unsafe" in b for b in audit.blockers))


# ─── SEMANTIC COMPONENT TESTS ───────────────────────────────────────────────────


class TestComponentSemanticRules(unittest.TestCase):
    """Tests for hero, contact, services, footer semantic rules."""

    def _valid_html(self, component_id: str, inner: str) -> str:
        tag = "footer" if component_id == "site_footer" else "section"
        return f'<{tag} class="c-{component_id}" data-component="{component_id}">{inner}</{tag}>'

    def test_hero_requires_h1(self) -> None:
        html = self._valid_html("hero", '<p>No heading</p><a href="#">Go</a>')
        audit = audit_component(component_id="hero", css=".c-hero{}", html=html, spec=_spec("hero"))
        self.assertFalse(audit.eligible)
        self.assertTrue(any("h1" in b for b in audit.blockers))

    def test_hero_requires_action(self) -> None:
        html = self._valid_html("hero", "<h1>Title</h1><p>No action</p>")
        audit = audit_component(component_id="hero", css=".c-hero{}", html=html, spec=_spec("hero"))
        self.assertFalse(audit.eligible)
        self.assertTrue(any("action" in b for b in audit.blockers))

    def test_services_requires_three_cards(self) -> None:
        html = self._valid_html("services", "<article>One</article><article>Two</article>")
        audit = audit_component(
            component_id="services",
            css=".c-services{}",
            html=html,
            spec=_spec("services"),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("three service" in b for b in audit.blockers))

    def test_contact_requires_form_and_labels(self) -> None:
        html = self._valid_html("contact", "<p>Call us</p>")
        audit = audit_component(
            component_id="contact",
            css=".c-contact{}",
            html=html,
            spec=_spec("contact"),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("form" in b for b in audit.blockers))

    def test_footer_requires_footer_element(self) -> None:
        html = '<section class="c-site_footer" data-component="site_footer"><p>Copyright</p></section>'
        audit = audit_component(
            component_id="site_footer",
            css=".c-site_footer{}",
            html=html,
            spec=_spec("site_footer", "footer"),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("footer root" in b for b in audit.blockers))


# ─── ASSEMBLER TESTS ────────────────────────────────────────────────────────────


class TestAssemblerStrict(unittest.TestCase):
    """Tests for the strict assembler ValueError on missing data-component."""

    def _baseline(self, *component_ids: str) -> str:
        placeholders = "".join(
            f'<section data-component="{cid}"><p>Placeholder</p></section>'
            for cid in component_ids
        )
        return (
            "<!doctype html><html><head>"
            '<style>:root{--ink:#111;}</style></head>'
            f'<body><main class="site-shell">{placeholders}</main></body></html>'
        )

    def test_assembly_replaces_matching_component(self) -> None:
        baseline = self._baseline("hero")
        artifact = _artifact()
        html, files = assemble_candidate(
            baseline_html=baseline,
            components=[artifact],
            direction=_direction(),
        )
        self.assertIn("Title", html)
        self.assertNotIn("Placeholder", html)
        self.assertIn("components/hero.html", files)

    def test_assembly_raises_on_missing_placeholder(self) -> None:
        baseline = self._baseline("hero")
        artifact = _artifact(
            component_id="services",
            html='<section class="c-services" data-component="services"><article>A</article><article>B</article><article>C</article></section>',
            css=".c-services { color: var(--ink); }",
        )
        with self.assertRaises(ValueError) as ctx:
            assemble_candidate(
                baseline_html=baseline,
                components=[artifact],
                direction=_direction(),
            )
        self.assertIn("services", str(ctx.exception))

    def test_assembly_includes_guardrails_css(self) -> None:
        baseline = self._baseline("hero")
        artifact = _artifact()
        html, _ = assemble_candidate(
            baseline_html=baseline,
            components=[artifact],
            direction=_direction(),
        )
        self.assertIn("Onara Pipeline V3 guardrails", html)

    def test_assembly_injects_direction_variable(self) -> None:
        baseline = self._baseline("hero")
        artifact = _artifact()
        html, _ = assemble_candidate(
            baseline_html=baseline,
            components=[artifact],
            direction=_direction(key="local-editorial"),
        )
        self.assertIn("--v3-direction", html)
        self.assertIn("local-editorial", html)


# ─── DIRECTION SCORING TESTS ────────────────────────────────────────────────────


class TestDirectionScoring(unittest.TestCase):
    """Tests for the heuristic direction scoring and selection logic."""

    def test_editorial_direction_scores_higher_than_center(self) -> None:
        editorial = _direction(
            key="edit-dir",
            layout="editorial",
            hero_composition="Asymmetrical editorial composition with stacked content below fold.",
        )
        centered = _direction(
            key="centered-dir",
            layout="trust-led",
            hero_composition="Centered generic hero with large title and centered call to action.",
        )
        self.assertGreater(_score_direction(editorial), _score_direction(centered))

    def test_brochure_direction_scores_very_low(self) -> None:
        brochure = _direction(
            key="brochure-dir",
            layout="trust-led",
            hero_composition="Standard brochure hero with large centered heading.",
            proof_strategy="Simple standard brochure proof strategy for generic business sites.",
        )
        self.assertLess(_score_direction(brochure), 50.0)

    def test_select_directions_returns_distinct_layouts(self) -> None:
        directions = [
            _direction(key="a", layout="trust-led", hero_composition="First unique editorial composition A"),
            _direction(key="b", layout="trust-led", hero_composition="Second unique editorial composition B"),
            _direction(key="c", layout="service-grid", palette="navy", hero_composition="Third unique service composition C"),
        ]
        first, second = select_directions(directions)
        self.assertNotEqual(first.layout, second.layout)

    def test_select_directions_falls_back_on_all_weak(self) -> None:
        """When all provided directions score below threshold, fallbacks should fill in."""
        directions = [
            _direction(
                key="weak-a",
                layout="trust-led",
                hero_composition="Generic centered brochure simple hero that looks standard.",
                proof_strategy="Short proof.",
                image_strategy="Short images.",
            ),
            _direction(
                key="weak-b",
                layout="service-grid",
                hero_composition="Generic centered brochure standard simple hero.",
                proof_strategy="Short proof.",
                image_strategy="Short images.",
            ),
        ]
        # Should not raise; falls back to built-in directions
        first, second = select_directions(directions)
        self.assertNotEqual(first.layout, second.layout)

    def test_score_rewards_asymmetric_split(self) -> None:
        asymmetric_split = _direction(
            key="asym",
            layout="split-hero",
            hero_composition="Asymmetrical split hero with oversized headline and bounded image.",
        )
        score = _score_direction(asymmetric_split)
        self.assertGreater(score, 100.0)  # base 100 + split(10) + asymmetric(10)

    def test_score_penalizes_short_strategies(self) -> None:
        """Directions with very short proof_strategy and image_strategy should score lower."""
        short = _direction(
            key="short-strat",
            layout="editorial",
            proof_strategy="Short.",
            image_strategy="Short.",
        )
        long = _direction(
            key="long-strat",
            layout="editorial",
            hero_composition="Different asymmetrical editorial hero than the short strategy one.",
            proof_strategy="Use verified rating, review count, and service-area details.",
            image_strategy="Use supplied verified images with descriptive alt text.",
        )
        self.assertGreater(_score_direction(long), _score_direction(short))


# ─── CRITICAL RELEASE BLOCKERS TESTS ────────────────────────────────────────────


class TestCriticalReleaseBlockers(unittest.TestCase):
    """Tests for critical_release_blockers filtering."""

    def test_axe_serious_is_critical(self) -> None:
        blockers = critical_release_blockers([
            "Axe serious: color-contrast - Elements must meet contrast",
        ])
        self.assertEqual(len(blockers), 1)

    def test_lighthouse_performance_is_not_critical(self) -> None:
        blockers = critical_release_blockers([
            "Lighthouse performance score 72 is below 85",
        ])
        self.assertEqual(len(blockers), 0)

    def test_broken_image_is_critical(self) -> None:
        blockers = critical_release_blockers([
            "broken image found in hero section",
        ])
        self.assertEqual(len(blockers), 1)

    def test_horizontal_overflow_is_critical(self) -> None:
        blockers = critical_release_blockers([
            "horizontal overflow detected on mobile viewport",
        ])
        self.assertEqual(len(blockers), 1)

    def test_missing_hero_is_critical(self) -> None:
        blockers = critical_release_blockers([
            "no hero section found in HTML",
        ])
        self.assertEqual(len(blockers), 1)

    def test_unsafe_executable_is_critical(self) -> None:
        blockers = critical_release_blockers([
            "unsafe executable content found",
        ])
        self.assertEqual(len(blockers), 1)

    def test_mixed_blockers_filters_correctly(self) -> None:
        blockers = critical_release_blockers([
            "Axe serious: color-contrast violation",
            "mobile: 2 primary controls below Onara's 44px target",
            "Lighthouse performance score 72 is below 85",
            "broken image in gallery section",
        ])
        self.assertEqual(len(blockers), 2)
        self.assertTrue(any("Axe" in b for b in blockers))
        self.assertTrue(any("broken image" in b for b in blockers))


# ─── CONFIG SETTINGS TESTS ──────────────────────────────────────────────────────


class TestV3ConfigDefaults(unittest.TestCase):
    """Validate V3 config defaults were updated."""

    def test_v3_job_timeout_is_600(self) -> None:
        settings = Settings()
        self.assertEqual(settings.pipeline_v3_job_timeout, 600)

    def test_v3_nim_concurrency_is_8(self) -> None:
        settings = Settings()
        self.assertEqual(settings.ai_nim_concurrency, 8)

    def test_v3_min_score_is_84(self) -> None:
        settings = Settings()
        self.assertEqual(settings.pipeline_v3_min_score, 84.0)

    def test_v3_component_timeout_is_75(self) -> None:
        settings = Settings()
        self.assertEqual(settings.pipeline_v3_component_timeout, 75)

    def test_v3_max_component_attempts_is_2(self) -> None:
        settings = Settings()
        self.assertEqual(settings.pipeline_v3_max_component_attempts, 2)


# ─── FINGERPRINT TESTS ──────────────────────────────────────────────────────────


class TestComponentFingerprint(unittest.TestCase):
    """Tests for deterministic fingerprint generation."""

    def test_fingerprint_is_deterministic(self) -> None:
        html = '<section data-component="hero"><h1>Title</h1></section>'
        css = ".c-hero { color: var(--ink); }"
        self.assertEqual(component_fingerprint(html, css), component_fingerprint(html, css))

    def test_fingerprint_changes_on_content_change(self) -> None:
        css = ".c-hero { color: var(--ink); }"
        fp1 = component_fingerprint("<section>A</section>", css)
        fp2 = component_fingerprint("<section>B</section>", css)
        self.assertNotEqual(fp1, fp2)

    def test_fingerprint_is_hex_sha256(self) -> None:
        fp = component_fingerprint("<section>A</section>", "")
        self.assertEqual(len(fp), 64)  # SHA-256 hex digest length


# ─── FALLBACK COMPONENT TESTS ───────────────────────────────────────────────────


class TestFallbackComponent(unittest.TestCase):
    """Tests for fallback_component baseline extraction."""

    def test_returns_matching_component(self) -> None:
        files = {"components/hero.html": "<section>Hero</section>"}
        result = fallback_component("hero", files)
        self.assertEqual(result, "<section>Hero</section>")

    def test_returns_none_for_missing_component(self) -> None:
        files = {"components/hero.html": "<section>Hero</section>"}
        result = fallback_component("contact", files)
        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
