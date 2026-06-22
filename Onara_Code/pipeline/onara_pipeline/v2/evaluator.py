from __future__ import annotations

import asyncio
from difflib import SequenceMatcher
from typing import Any

from pydantic import ValidationError

from onara_pipeline.agents.json_utils import parse_json_model
from onara_pipeline.ai_client import AIClient, AIClientError, AIMessage, AIRequest
from onara_pipeline.ai_client.model_picker import ModelRoute
from onara_pipeline.config import Settings
from onara_pipeline.v2.browser_quality import audit_candidate_html
from onara_pipeline.v2.contracts import CandidateArtifact, GenerationSpec, VisualReview
from onara_pipeline.v2.repair import deterministic_release_hardening

VISUAL_MODEL = "meta/llama-4-maverick-17b-128e-instruct"


async def evaluate_candidates(
    candidates: list[CandidateArtifact],
    *,
    ai_client: AIClient,
    settings: Settings,
    spec: GenerationSpec,
) -> list[CandidateArtifact]:
    await asyncio.gather(
        *[
            _evaluate_candidate(candidate, ai_client=ai_client, settings=settings, spec=spec)
            for candidate in candidates
        ]
    )
    _penalize_near_duplicates(candidates)
    return candidates


async def _evaluate_candidate(
    candidate: CandidateArtifact,
    *,
    ai_client: AIClient,
    settings: Settings,
    spec: GenerationSpec,
) -> None:
    candidate.html = deterministic_release_hardening(candidate.html)
    browser = await audit_candidate_html(
        candidate.html,
        candidate_key=candidate.key,
        settings=settings,
    )
    candidate.browser = browser
    candidate.hard_blockers = list(browser.hard_blockers)
    candidate.warnings = list(dict.fromkeys([*candidate.warnings, *browser.warnings]))
    candidate.deterministic_score = deterministic_score(browser)
    candidate.visual_score = await visual_score(
        candidate,
        ai_client=ai_client,
        spec=spec,
    )
    candidate.final_score = round(candidate.deterministic_score + candidate.visual_score, 2)


def deterministic_score(browser) -> float:
    checks = browser.checks
    if browser.mode == "static":
        structure = 20 if checks.get("html_structure") and checks.get("header") and checks.get("hero") else 0
        cta = 15 if checks.get("primary_cta") else 0
        contact_form = 10 if checks.get("contact_form") else 0
        labels = 10 if checks.get("controls_labeled") else 0
        security = 10 if checks.get("safe_output") else 0
        images = 5 if checks.get("image_sources") else 0
        return round(min(65, structure + cta + contact_form + labels + security + images), 2)
    if not browser.available:
        return 0
    structure = 15 if checks.get("html_structure") and checks.get("header") and checks.get("hero") else 0
    facts_and_cta = 15 if checks.get("primary_cta") else 5
    responsive = 10 * (
        sum(bool(checks.get(key)) for key in ("desktop_reflow", "mobile_reflow", "reflow_reflow")) / 3
    )
    assets_and_forms = (
        10
        if checks.get("contact_form")
        and not any("image" in issue.lower() or "form" in issue.lower() for issue in browser.hard_blockers)
        else 0
    )
    accessibility = max(0, 10 - browser.accessibility_violations * 2)
    security = 10 if checks.get("safe_output") else 0
    score = structure + facts_and_cta + responsive + assets_and_forms + accessibility + security
    return round(min(70, score), 2)


async def visual_score(
    candidate: CandidateArtifact,
    *,
    ai_client: AIClient,
    spec: GenerationSpec,
) -> float:
    desktop = candidate.browser.thumbnail_data_url
    mobile = candidate.browser.mobile_thumbnail_data_url
    if not desktop or not mobile:
        return 0

    route = ModelRoute(
        fallback_model=None,
        fallback_provider=None,
        model=VISUAL_MODEL,
        provider="nim",
    )
    orders = [
        ["hierarchy", "typography", "composition", "trust_and_cta", "brief_fit"],
        ["brief_fit", "trust_and_cta", "composition", "typography", "hierarchy"],
    ]
    reviews = await asyncio.gather(
        *[
            _visual_review(
                ai_client=ai_client,
                brief=spec.brief.model_dump(),
                desktop=desktop,
                mobile=mobile,
                order=order,
                recipe=candidate.recipe,
                route=route,
            )
            for order in orders
        ],
        return_exceptions=True,
    )
    valid = [review for review in reviews if isinstance(review, VisualReview)]
    if not valid or all(review.total == 0 and review.warnings for review in valid):
        candidate.warnings.append("Visual reviewer unavailable; neutral score used")
        return 15
    totals = sorted(review.total for review in valid)
    if len(totals) == 2 and abs(totals[0] - totals[1]) > 10:
        candidate.warnings.append("Visual reviewers disagreed; conservative score used")
        return round(totals[0], 2)
    return round(sum(totals) / len(totals), 2)


async def _visual_review(
    *,
    ai_client: AIClient,
    brief: dict[str, Any],
    desktop: str,
    mobile: str,
    order: list[str],
    recipe: str,
    route: ModelRoute,
) -> VisualReview:
    rubric = ", ".join(order)
    content = [
        {
            "type": "text",
            "text": (
                "Review one local-business website candidate pointwise. Do not compare it to another "
                "candidate and do not infer the model identity. Score the dimensions in this order: "
                f"{rubric}. Recipe: {recipe}. Business brief: {brief}. "
                "Reject generic AI landing-page composition, weak mobile hierarchy, unreadable type, "
                "fake proof, missing contact priority, or poor use of supplied facts. "
                "Return JSON only with hierarchy 0-8, typography 0-6, composition 0-6, "
                "trust_and_cta 0-5, brief_fit 0-5, warnings string array."
            ),
        },
        {"type": "image_url", "image_url": {"url": desktop}},
        {"type": "image_url", "image_url": {"url": mobile}},
    ]
    try:
        response = await ai_client.generate_text(
            route=route,
            request=AIRequest(
                max_tokens=800,
                messages=[
                    AIMessage(
                        role="system",
                        content="You are a strict web design reviewer. Score only visible evidence and return valid JSON.",
                    ),
                    AIMessage(role="user", content=content),
                ],
                metadata={"agent_id": "visual_reviewer", "rubric_order": order},
                temperature=0.05,
            ),
        )
        return parse_json_model(response.content, VisualReview)
    except (AIClientError, ValidationError, ValueError):
        return VisualReview(warnings=["Visual review unavailable"])


def choose_candidate(
    candidates: list[CandidateArtifact],
    *,
    minimum_score: float,
) -> CandidateArtifact:
    eligible = [
        candidate
        for candidate in candidates
        if not candidate.hard_blockers and candidate.final_score >= minimum_score
    ]
    if not eligible:
        best = max(candidates, key=lambda item: item.final_score)
        blockers = "; ".join(best.hard_blockers[:6]) or f"score {best.final_score:g} below {minimum_score:g}"
        raise ValueError(f"No generated candidate passed release gates: {blockers}")
    selected = max(eligible, key=lambda item: item.final_score)
    selected.selected = True
    return selected


def _penalize_near_duplicates(candidates: list[CandidateArtifact]) -> None:
    if len(candidates) < 2:
        return
    ratio = SequenceMatcher(None, candidates[0].html, candidates[1].html, autojunk=False).ratio()
    if ratio < 0.9:
        return
    lower = min(candidates, key=lambda item: item.final_score)
    lower.final_score = max(0, lower.final_score - 15)
    lower.warnings.append("Candidate was too similar to the alternate concept")
