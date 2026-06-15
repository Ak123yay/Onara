import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from onara_pipeline.agents.contracts import PlannerOutput

FILE_MARKER_RE = re.compile(
    r"\{FILE_MARKER_START\}\s*(?P<html>.*?)\s*\{FILE_MARKER_END\}",
    flags=re.IGNORECASE | re.DOTALL,
)
HTML_DOCUMENT_RE = re.compile(
    r"(?P<html><!doctype\s+html\b.*?</html>|<html\b.*?</html>)",
    flags=re.IGNORECASE | re.DOTALL,
)


class DeploymentParserError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class DeploymentArtifact:
    files: dict[str, str]
    index_html: str
    manifest: dict[str, Any]

    @property
    def file_count(self) -> int:
        return len(self.files)

    def to_dict(self) -> dict[str, Any]:
        return {
            "file_count": self.file_count,
            "files": self.files,
            "index_html": self.index_html,
            "manifest": self.manifest,
        }


def build_deployment_artifact(
    raw_html: str,
    *,
    business_data: dict[str, Any],
    job_id: str,
    planner: PlannerOutput,
    project_id: str,
    user_id: str,
) -> DeploymentArtifact:
    index_html = extract_final_html(raw_html)
    files = split_atomic_files(index_html, planner)
    manifest = _build_manifest(
        business_data=business_data,
        files=files,
        job_id=job_id,
        planner=planner,
        project_id=project_id,
        user_id=user_id,
    )
    files["deployment-manifest.json"] = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True)

    return DeploymentArtifact(files=files, index_html=index_html, manifest=manifest)


def extract_final_html(raw_output: str) -> str:
    content = _strip_markdown_fences(str(raw_output or "").strip())
    marker_match = FILE_MARKER_RE.search(content)

    if marker_match:
        html = _strip_markdown_fences(marker_match.group("html").strip())
    else:
        document_match = HTML_DOCUMENT_RE.search(content)
        if not document_match:
            raise DeploymentParserError("Deployment parser could not find a complete HTML document")
        html = _strip_markdown_fences(document_match.group("html").strip())

    _validate_html_document(html)
    return html


def split_atomic_files(html: str, planner: PlannerOutput) -> dict[str, str]:
    _validate_html_document(html)
    files = {"index.html": html}

    for component in planner.components:
        component_html = _extract_component_html(html, component.id)
        if component_html:
            files[f"components/{component.id}.html"] = component_html
            files[f"components/{component.id}.metadata.json"] = json.dumps(
                {
                    "css_classes": component.css_classes,
                    "id": component.id,
                    "order": component.order,
                    "responsive_changes": component.responsive_changes,
                    "type": component.type,
                },
                ensure_ascii=False,
                indent=2,
                sort_keys=True,
            )
        else:
            files[f"components/{component.id}.spec.txt"] = component.html_structure

    return files


def _build_manifest(
    *,
    business_data: dict[str, Any],
    files: dict[str, str],
    job_id: str,
    planner: PlannerOutput,
    project_id: str,
    user_id: str,
) -> dict[str, Any]:
    return {
        "business_name": str(business_data.get("name") or "Unknown Business"),
        "component_order": planner.component_order,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "file_paths": sorted(files.keys()),
        "job_id": job_id,
        "project_id": project_id,
        "user_id": user_id,
    }


def _extract_component_html(html: str, component_id: str) -> str | None:
    variants = {component_id, component_id.replace("_", "-")}
    tags = ("header", "nav", "main", "section", "footer", "aside")

    for variant in variants:
        escaped = re.escape(variant)
        for tag in tags:
            patterns = (
                rf"(<{tag}\b[^>]*data-component=[\"']{escaped}[\"'][^>]*>.*?</{tag}>)",
                rf"(<{tag}\b[^>]*id=[\"']{escaped}[\"'][^>]*>.*?</{tag}>)",
                rf"(<{tag}\b[^>]*class=[\"'][^\"']*\b{escaped}\b[^\"']*[\"'][^>]*>.*?</{tag}>)",
            )
            for pattern in patterns:
                match = re.search(pattern, html, flags=re.IGNORECASE | re.DOTALL)
                if match:
                    return match.group(1).strip()

    return None


def _validate_html_document(html: str) -> None:
    lower = html.lower()
    required = ("<html", "<head", "<style", "<body", "</body>", "</html>")
    missing = [item for item in required if item not in lower]
    if missing:
        raise DeploymentParserError(f"Deployment HTML is missing required marker: {missing[0]}")
    if "{file_marker_start}" in lower or "{file_marker_end}" in lower:
        raise DeploymentParserError("Deployment HTML still contains FILE_MARKER tokens")
    if "```" in html:
        raise DeploymentParserError("Deployment HTML contains markdown fences")


def _strip_markdown_fences(value: str) -> str:
    stripped = value.strip()
    if not stripped.startswith("```"):
        return stripped

    stripped = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", stripped)
    stripped = re.sub(r"\s*```$", "", stripped)
    return stripped.strip()
