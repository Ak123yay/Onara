from __future__ import annotations

import hashlib
import unittest
from datetime import datetime, timedelta, timezone

from onara_pipeline.v2.contracts import (
    BrowserReport,
    BusinessBrief,
    CandidateArtifact,
    ComponentPatch,
    PatchSet,
)
from onara_pipeline.v2.evaluator import choose_candidate, deterministic_score
from onara_pipeline.job_queue import _durable_event_payload, _lease_retry_delay, request_signature
from onara_pipeline.schemas import GenerateRequest
from onara_pipeline.v2.prompt_compiler import choose_recipes
from onara_pipeline.v2.repair import apply_patch_set


def digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def candidate(*, key: str, score: float, blockers: list[str] | None = None) -> CandidateArtifact:
    return CandidateArtifact(
        final_score=score,
        hard_blockers=blockers or [],
        html="<!doctype html><html><head><style></style></head><body>"
        + ("x" * 520)
        + "</body></html>",
        key=key,
        model="test-model",
        provider="test-provider",
        recipe="service-led",
    )


class PipelineV2Tests(unittest.TestCase):
    def test_request_signature_is_fixed_length_for_large_photo_payloads(self) -> None:
        signature = request_signature(
            GenerateRequest(
                business_data={"manual_photo": {"preview_url": "data:image/jpeg;base64," + ("a" * 20_000)}},
                user_id="00000000-0000-0000-0000-000000000001",
            )
        )

        self.assertEqual(len(signature), 64)

    def test_durable_event_payload_drops_thumbnail_data(self) -> None:
        payload = _durable_event_payload(
            {
                "candidate": {
                    "candidateKey": "a",
                    "thumbnailDataUrl": "data:image/jpeg;base64,large",
                }
            }
        )

        self.assertEqual(payload["candidate"], {"candidateKey": "a"})

    def test_lease_retry_delay_is_bounded(self) -> None:
        far_future = datetime.now(timezone.utc) + timedelta(minutes=5)
        expired = datetime.now(timezone.utc) - timedelta(seconds=1)

        self.assertEqual(_lease_retry_delay(far_future.isoformat()), 5.0)
        self.assertEqual(_lease_retry_delay(expired.isoformat()), 0.25)

    def test_recipe_selection_uses_verified_assets_and_distinct_routes(self) -> None:
        primary, secondary = choose_recipes(
            brief=BusinessBrief(name="A Plumbing Co.", phone="703-555-0100"),
            asset_count=3,
            style_preferences={},
        )

        self.assertEqual(primary, "photo-led")
        self.assertNotEqual(primary, secondary)

    def test_recipe_selection_honors_supported_user_layout(self) -> None:
        primary, secondary = choose_recipes(
            brief=BusinessBrief(name="A Plumbing Co."),
            asset_count=0,
            style_preferences={"layout": "trust-led"},
        )

        self.assertEqual(primary, "editorial-trust")
        self.assertEqual(secondary, "service-led")

    def test_targeted_patch_accepts_matching_component_hash(self) -> None:
        component = '<section data-component="hero"><h1>Old headline</h1></section>'
        html = f"<!doctype html><html><head><style>body{{margin:0}}</style></head><body>{component}</body></html>"
        replacement = '<section data-component="hero"><h1>Better headline</h1></section>'
        patch = PatchSet(
            css_append=".hero { min-height: 70vh; }",
            expected_document_hash=digest(html),
            replacements={
                "hero": ComponentPatch(
                    expected_source_hash=digest(component),
                    html=replacement,
                )
            },
        )

        fixed = apply_patch_set(html, patch)

        self.assertIn("Better headline", fixed)
        self.assertIn("Onara targeted repair", fixed)

    def test_targeted_patch_rejects_stale_document(self) -> None:
        html = "<!doctype html><html><head><style></style></head><body></body></html>"
        patch = PatchSet(expected_document_hash=digest("different"))

        with self.assertRaisesRegex(ValueError, "document hash"):
            apply_patch_set(html, patch)

    def test_deterministic_score_caps_at_seventy(self) -> None:
        report = BrowserReport(
            accessibility_violations=0,
            available=True,
            checks={
                "desktop_reflow": True,
                "contact_form": True,
                "header": True,
                "hero": True,
                "html_structure": True,
                "mobile_reflow": True,
                "primary_cta": True,
                "reflow_reflow": True,
                "safe_output": True,
            },
        )

        self.assertEqual(deterministic_score(report), 70)

    def test_candidate_gate_rejects_blocked_high_score(self) -> None:
        blocked = candidate(key="a", score=98, blockers=["Hero section is missing"])
        valid = candidate(key="b", score=84)

        selected = choose_candidate([blocked, valid], minimum_score=80)

        self.assertEqual(selected.key, "b")
        self.assertTrue(selected.selected)


if __name__ == "__main__":
    unittest.main()
