import unittest

from onara_pipeline.agents.contracts import ComponentSpec
from onara_pipeline.config import Settings
from onara_pipeline.job_queue import _select_pipeline_version, request_signature
from onara_pipeline.schemas import GenerateRequest
from onara_pipeline.v3.assembler import assemble_candidate
from onara_pipeline.v3.contracts import ComponentArtifact, DesignDirection
from onara_pipeline.v3.directions import select_directions
from onara_pipeline.v3.quality import audit_component, critical_release_blockers


def _component_spec(component_id: str, component_type: str = "section") -> ComponentSpec:
    return ComponentSpec(
        id=component_id,
        type=component_type,
        order=1,
        html_structure="One semantic component root with accessible content.",
        css_classes=[f"c-{component_id}"],
        responsive_changes="Collapse cleanly to one column.",
    )


def _direction(key: str, layout: str, palette: str = "copper") -> DesignDirection:
    return DesignDirection(
        key=key,
        name=key.replace("-", " ").title(),
        recipe=f"{key}-recipe",
        layout=layout,
        palette=palette,
        hero_composition="A specific asymmetrical hero composition with a direct local call to action.",
        proof_strategy="Use verified aggregate facts and service-area details without invented claims.",
        image_strategy="Use supplied verified images with stable aspect ratios and descriptive alt text.",
        mobile_strategy="Stack content in conversion order without fixed heights or horizontal overflow.",
    )


def _request() -> GenerateRequest:
    return GenerateRequest(
        business_data={"name": "Example Plumbing", "category": "Plumber"},
        style_preferences={"layout": "editorial"},
        user_id="00000000-0000-0000-0000-000000000001",
        user_plan="pro",
    )


class PipelineV3Tests(unittest.TestCase):
    def test_component_audit_accepts_bounded_component(self) -> None:
        audit = audit_component(
            component_id="hero",
            css=".c-hero { color: var(--ink); background: var(--paper); }",
            html=(
                '<section class="c-hero" data-component="hero">'
                "<h1>Local plumbing help</h1><a href=\"tel:+17035550100\">Call now</a>"
                "</section>"
            ),
            spec=_component_spec("hero"),
        )
        self.assertTrue(audit.eligible)
        self.assertEqual(audit.blockers, [])

    def test_component_audit_rejects_global_css_and_raw_colors(self) -> None:
        audit = audit_component(
            component_id="hero",
            css="body { color: #111; } .c-hero { background: rgb(0, 0, 0); }",
            html='<section data-component="hero"><p>Missing required hero structure</p></section>',
            spec=_component_spec("hero"),
        )
        self.assertFalse(audit.eligible)
        self.assertTrue(any("global CSS" in blocker for blocker in audit.blockers))
        self.assertTrue(any("raw color" in blocker for blocker in audit.blockers))

    def test_assembler_replaces_component_and_preserves_document(self) -> None:
        baseline = (
            "<!doctype html><html><head><style>:root{--ink:#111;}</style></head>"
            '<body><main class="site-shell"><section data-component="hero">'
            "<h1>Old</h1></section></main></body></html>"
        )
        artifact = ComponentArtifact(
            candidate_key="a",
            component_id="hero",
            html=(
                '<section class="c-hero" data-component="hero">'
                "<h1>New</h1><a href=\"#contact\">Get an estimate</a></section>"
            ),
            css=".c-hero { color: var(--ink); }",
            model="test",
            provider="test",
            fingerprint="abc",
        )
        html, files = assemble_candidate(
            baseline_html=baseline,
            components=[artifact],
            direction=_direction("local-editorial", "editorial"),
        )
        self.assertIn("<h1>New</h1>", html)
        self.assertNotIn("<h1>Old</h1>", html)
        self.assertIn("Onara Pipeline V3 guardrails", html)
        self.assertEqual(files["components/hero.html"], artifact.html)

    def test_direction_selection_keeps_distinct_layouts(self) -> None:
        first, second = select_directions(
            [
                _direction("one", "trust-led"),
                _direction("duplicate", "trust-led"),
                _direction("two", "service-grid", "navy"),
            ]
        )
        self.assertNotEqual(first.layout, second.layout)

    def test_v3_canary_routing_and_signatures_are_versioned(self) -> None:
        request = _request()
        settings = Settings(
            PIPELINE_V2_ENABLED=True,
            PIPELINE_V3_ENABLED=True,
            PIPELINE_V3_CANARY_PERCENT=100,
        )
        self.assertEqual(_select_pipeline_version(request, settings), "v3")
        self.assertNotEqual(
            request_signature(request, pipeline_version="v2"),
            request_signature(request, pipeline_version="v3"),
        )

    def test_critical_release_policy_demotes_noncritical_guidance(self) -> None:
        blockers = critical_release_blockers(
            [
                "Axe serious: color-contrast - Elements must meet contrast",
                "mobile: 2 primary controls below Onara's 44px target",
                "Lighthouse performance score 72 is below 85",
            ]
        )
        self.assertEqual(len(blockers), 1)
        self.assertIn("Axe serious", blockers[0])


if __name__ == "__main__":
    unittest.main()
