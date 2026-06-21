from __future__ import annotations

import asyncio
import base64
import json
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
        return BrowserReport(
            available=False,
            hard_blockers=["Browser audit script is missing"],
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
            return BrowserReport(
                available=False,
                hard_blockers=["Node.js is not installed for browser validation"],
            )
        except TimeoutError:
            if "process" in locals():
                process.kill()
                await process.communicate()
            return BrowserReport(
                available=False,
                hard_blockers=["Browser audit timed out"],
            )

        if process.returncode != 0 or not report_path.exists():
            detail = (stderr or stdout).decode("utf-8", errors="replace")[:600]
            return BrowserReport(
                available=False,
                hard_blockers=[f"Browser audit failed: {detail or 'unknown error'}"],
            )

        payload = json.loads(report_path.read_text(encoding="utf-8"))
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
            available=bool(payload.get("available")),
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


def _apply_lighthouse_thresholds(
    *,
    lighthouse: dict[str, Any],
    hard_blockers: list[str],
    warnings: list[str],
) -> None:
    if not lighthouse:
        warnings.append("Lighthouse report was unavailable")
        return

    thresholds = {
        "accessibility": 95,
        "best_practices": 95,
        "performance": 90,
        "seo": 95,
    }
    for key, minimum in thresholds.items():
        score = float(lighthouse.get(key) or 0)
        if score < minimum:
            hard_blockers.append(f"Lighthouse {key.replace('_', ' ')} score {score:g} is below {minimum}")

    if float(lighthouse.get("lcp_ms") or 0) > 2500:
        hard_blockers.append("Lab LCP is above 2.5 seconds")
    if float(lighthouse.get("cls") or 0) > 0.1:
        hard_blockers.append("CLS is above 0.1")
    if float(lighthouse.get("tbt_ms") or 0) > 200:
        hard_blockers.append("Total Blocking Time is above 200ms")


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
