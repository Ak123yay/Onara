from __future__ import annotations

import asyncio
import base64
import json
import re
import tempfile
from pathlib import Path
from typing import Any

from onara_pipeline.config import Settings
from onara_pipeline.v2.contracts import BrowserReport


async def audit_candidate_html(
    html: str,
    *,
    candidate_key: str,
    settings: Settings,
) -> BrowserReport:
    pipeline_root = Path(__file__).resolve().parents[2]
    script_path = pipeline_root / "browser_audit.mjs"
    if not script_path.exists():
        return _unavailable_browser_report(
            html,
            reason="Browser audit script is missing",
            settings=settings,
        )

    with tempfile.TemporaryDirectory(prefix=f"onara-{candidate_key}-") as directory:
        root = Path(directory)
        html_path = root / "index.html"
        report_path = root / "report.json"
        output_dir = root / "artifacts"
        html_path.write_text(html, encoding="utf-8")

        try:
            process = await asyncio.create_subprocess_exec(
                "node",
                str(script_path),
                str(html_path),
                str(output_dir),
                str(report_path),
                cwd=str(pipeline_root),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=settings.pipeline_v2_browser_audit_timeout,
            )
        except FileNotFoundError:
            return _unavailable_browser_report(
                html,
                reason="Node.js is not installed for browser validation",
                settings=settings,
            )
        except TimeoutError:
            if "process" in locals():
                process.kill()
                await process.communicate()
            return _unavailable_browser_report(
                html,
                reason="Browser audit timed out",
                settings=settings,
            )

        if process.returncode != 0 or not report_path.exists():
            detail = (stderr or stdout).decode("utf-8", errors="replace")[:600]
            return _unavailable_browser_report(
                html,
                reason=f"Browser audit failed: {detail or 'unknown error'}",
                settings=settings,
            )

        try:
            payload = json.loads(report_path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            return _unavailable_browser_report(
                html,
                reason=f"Browser audit report could not be read: {exc}",
                settings=settings,
            )
        screenshots = payload.pop("screenshots", {})
        thumbnail_data_url = _data_url(screenshots.get("desktop"))
        mobile_thumbnail_data_url = _data_url(screenshots.get("mobile"))
        lighthouse = payload.get("lighthouse") if isinstance(payload.get("lighthouse"), dict) else {}
        hard_blockers = [str(item) for item in payload.get("hard_blockers", [])]
        warnings = [str(item) for item in payload.get("warnings", [])]

        _apply_lighthouse_thresholds(
            lighthouse=lighthouse,
            hard_blockers=hard_blockers,
            warnings=warnings,
        )
        return BrowserReport(
            accessibility_violations=int(payload.get("accessibility_violations") or 0),
            accessibility_issues=[
                item for item in payload.get("accessibility_issues", []) if isinstance(item, dict)
            ],
            available=bool(payload.get("available")),
            mode="full",
            checks=payload.get("checks") if isinstance(payload.get("checks"), dict) else {},
            console_errors=[str(item) for item in payload.get("console_errors", [])],
            failed_requests=[str(item) for item in payload.get("failed_requests", [])],
            hard_blockers=_unique(hard_blockers),
            lighthouse={str(key): float(value) for key, value in lighthouse.items() if isinstance(value, int | float)},
            mobile_thumbnail_data_url=mobile_thumbnail_data_url,
            screenshot_hash=str(payload.get("screenshot_hash") or "") or None,
            thumbnail_data_url=thumbnail_data_url,
            warnings=_unique(warnings),
        )


def _unavailable_browser_report(
    html: str,
    *,
    reason: str,
    settings: Settings,
) -> BrowserReport:
    if not settings.pipeline_v2_static_audit_fallback:
        return BrowserReport(
            available=False,
            degraded_reason=reason,
            hard_blockers=[reason],
            mode="static",
        )

    checks, hard_blockers = _static_audit(html)
    return BrowserReport(
        available=False,
        checks=checks,
        degraded_reason=reason,
        hard_blockers=hard_blockers,
        mode="static",
        warnings=[
            "Full browser, accessibility, responsive, and Lighthouse checks were unavailable.",
            "A strict static safety gate and deterministic final QA were used instead.",
        ],
    )


def _static_audit(html: str) -> tuple[dict[str, bool], list[str]]:
    lower = html.lower()
    required = ("<!doctype html", "<html", "<head", "</head>", "<body", "</body>", "</html>")
    html_structure = all(marker in lower for marker in required)
    has_header = bool(
        re.search(r"<header\b", lower)
        or re.search(r"data-component\s*=\s*['\"](?:site_header|header)['\"]", lower)
    )
    has_hero = bool(
        re.search(r"data-component\s*=\s*['\"]hero['\"]", lower)
        or re.search(r"<section\b[^>]*(?:id|class)\s*=\s*['\"][^'\"]*\bhero\b", lower)
    )
    cta_contents = re.findall(
        r"<(?:a|button)\b[^>]*>(.*?)</(?:a|button)>",
        lower,
        flags=re.DOTALL,
    )
    has_primary_cta = any(
        re.search(
            r"\b(?:call|contact|estimate|quote|book|schedule|emergency|get started|start now)\b",
            re.sub(r"<[^>]+>", " ", content),
        )
        for content in cta_contents
    )

    form_matches = re.findall(r"<form\b[^>]*>(.*?)</form>", lower, flags=re.DOTALL)
    has_contact_form = False
    controls_labeled = False
    if form_matches:
        contact_form = next(
            (
                form
                for form in form_matches
                if len(re.findall(r"<(?:input|select|textarea)\b", form)) >= 2
                and re.search(r"contact|estimate|quote|message|service|phone|email", form)
            ),
            None,
        )
        has_contact_form = contact_form is not None
        if contact_form:
            controls = [
                control
                for control in re.findall(
                    r"<(?:input|select|textarea)\b[^>]*>",
                    contact_form,
                    flags=re.DOTALL,
                )
                if not re.search(r"type\s*=\s*['\"]hidden['\"]", control)
            ]
            aria_labeled = sum(
                1
                for control in controls
                if re.search(r"aria-(?:label|labelledby)\s*=", control)
            )
            label_count = len(re.findall(r"<label\b", contact_form))
            controls_labeled = bool(controls) and label_count + aria_labeled >= len(controls)

    unsafe_script = bool(
        re.search(
            r"<script\b(?![^>]*type\s*=\s*['\"]application/ld\+json['\"])",
            lower,
        )
    )
    unsafe_handlers = bool(re.search(r"\son[a-z]+\s*=", lower))
    unsafe_embeds = bool(re.search(r"<(?:iframe|object|embed)\b", lower))
    unsafe_urls = "javascript:" in lower
    unsafe_refresh = bool(re.search(r"<meta\b[^>]*http-equiv\s*=\s*['\"]refresh['\"]", lower))
    unsafe_form_action = any(
        not _safe_form_action(action)
        for action in re.findall(r"<form\b[^>]*action\s*=\s*['\"]([^'\"]+)['\"]", lower)
    )
    safe_output = not any(
        (unsafe_script, unsafe_handlers, unsafe_embeds, unsafe_urls, unsafe_refresh, unsafe_form_action)
    )

    image_sources = re.findall(r"<img\b[^>]*src\s*=\s*['\"]([^'\"]*)['\"]", lower)
    safe_images = all(
        source
        and "localhost" not in source
        and not source.startswith("places/")
        and "/api/places/photo" not in source
        for source in image_sources
    )

    checks = {
        "contact_form": has_contact_form,
        "controls_labeled": controls_labeled,
        "header": has_header,
        "hero": has_hero,
        "html_structure": html_structure,
        "image_sources": safe_images,
        "primary_cta": has_primary_cta,
        "safe_output": safe_output,
    }
    blockers = []
    if not html_structure:
        blockers.append("Static audit found incomplete HTML document structure")
    if not has_header:
        blockers.append("Static audit found no site header")
    if not has_hero:
        blockers.append("Static audit found no hero section")
    if not has_primary_cta:
        blockers.append("Static audit found no primary conversion CTA")
    if not has_contact_form:
        blockers.append("Static audit found no usable contact form")
    if has_contact_form and not controls_labeled:
        blockers.append("Static audit found unlabeled contact form controls")
    if not safe_output:
        blockers.append("Static audit found unsafe executable or navigation behavior")
    if not safe_images:
        blockers.append("Static audit found empty or non-deployable image sources")
    return checks, blockers


def _safe_form_action(action: str) -> bool:
    value = action.strip().lower()
    if not value or value.startswith(("#", "/")):
        return True
    return bool(
        re.match(r"https://[a-z0-9-]+\.supabase\.co/functions/v1/lead-email(?:[/?#]|$)", value)
        or re.match(r"https://(?:www\.)?onara\.tech(?:[/?#]|$)", value)
    )


def _apply_lighthouse_thresholds(
    *,
    lighthouse: dict[str, Any],
    hard_blockers: list[str],
    warnings: list[str],
) -> None:
    if not lighthouse:
        warnings.append("Lighthouse report was unavailable")
        return

    # Axe serious/critical findings remain hard blockers. Lighthouse's category
    # score is aggregate guidance and can include minor audits already surfaced
    # by Axe, so do not independently fail an otherwise accessible candidate.
    if float(lighthouse.get("accessibility") or 0) < 90:
        warnings.append(f"Lighthouse accessibility score {lighthouse.get('accessibility'):g} is below 90")
    if float(lighthouse.get("best_practices") or 0) < 90:
        hard_blockers.append(f"Lighthouse best practices score {lighthouse.get('best_practices'):g} is below 90")

    # Warnings: performance and SEO guidance (don't block release)
    if float(lighthouse.get("performance") or 0) < 85:
        warnings.append(f"Lighthouse performance score {lighthouse.get('performance'):g} is below 85")
    if float(lighthouse.get("seo") or 0) < 95:
        warnings.append(f"Lighthouse SEO score {lighthouse.get('seo'):g} is below 95")
    if float(lighthouse.get("lcp_ms") or 0) > 2500:
        warnings.append("Lab LCP is above 2.5 seconds")
    if float(lighthouse.get("cls") or 0) > 0.1:
        warnings.append("CLS is above 0.1")
    if float(lighthouse.get("tbt_ms") or 0) > 200:
        warnings.append("Total Blocking Time is above 200ms")


def _data_url(path_value: Any) -> str | None:
    if not isinstance(path_value, str):
        return None
    path = Path(path_value)
    if not path.exists():
        return None
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/jpeg;base64,{encoded}"


def _unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value))
