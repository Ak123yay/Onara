import json
import re
import html as html_lib
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
    lead_capture_endpoint: str | None = None,
    planner: PlannerOutput,
    project_id: str,
    user_id: str,
) -> DeploymentArtifact:
    index_html = extract_final_html(raw_html)
    index_html = apply_lead_capture(
        index_html,
        business_data=business_data,
        endpoint=lead_capture_endpoint,
        project_id=project_id,
    )
    files = split_atomic_files(index_html, planner)
    manifest = _build_manifest(
        business_data=business_data,
        files=files,
        job_id=job_id,
        lead_capture_enabled=bool(lead_capture_endpoint),
        planner=planner,
        project_id=project_id,
        user_id=user_id,
    )
    files["deployment-manifest.json"] = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True)

    return DeploymentArtifact(files=files, index_html=index_html, manifest=manifest)


def lead_capture_endpoint(*, enabled: bool, supabase_url: str | None) -> str | None:
    if not enabled or not supabase_url:
        return None
    return f"{supabase_url.rstrip('/')}/functions/v1/lead-email"


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
    lead_capture_enabled: bool,
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
        "lead_capture_enabled": lead_capture_enabled,
        "project_id": project_id,
        "user_id": user_id,
    }


def apply_lead_capture(
    html: str,
    *,
    business_data: dict[str, Any],
    endpoint: str | None,
    project_id: str,
) -> str:
    if not endpoint:
        return html

    updated = _ensure_lead_form(html, business_data=business_data)
    updated = _inject_lead_capture_style(updated)
    return _inject_lead_capture_script(updated, endpoint=endpoint, project_id=project_id)


def _ensure_lead_form(html: str, *, business_data: dict[str, Any]) -> str:
    if re.search(r"<form\b", html, flags=re.IGNORECASE):
        return html

    business_name = html_lib.escape(str(business_data.get("name") or "the business"))
    form = f"""
      <form class="onara-lead-form" data-onara-lead-form>
        <div class="onara-lead-form-heading">
          <span>Quick request</span>
          <strong>Send {business_name} your details</strong>
        </div>
        <label>
          <span>Name</span>
          <input autocomplete="name" name="name" placeholder="Your name" type="text">
        </label>
        <label>
          <span>Phone</span>
          <input autocomplete="tel" name="phone" placeholder="Best phone number" type="tel">
        </label>
        <label>
          <span>Email</span>
          <input autocomplete="email" name="email" placeholder="you@example.com" type="email">
        </label>
        <label>
          <span>Message</span>
          <textarea name="message" placeholder="What do you need help with?" rows="4"></textarea>
        </label>
        <input aria-hidden="true" autocomplete="off" class="onara-lead-hp" name="onara_website" tabindex="-1" type="text">
        <button type="submit">Request a callback</button>
        <p class="onara-lead-status" role="status"></p>
      </form>
    """.rstrip()

    contact_pattern = re.compile(
        r"(?P<section><section\b[^>]*(?:id=[\"']contact[\"']|data-component=[\"']contact[\"'])[^>]*>.*?)(?P<close></section>)",
        flags=re.IGNORECASE | re.DOTALL,
    )
    match = contact_pattern.search(html)
    if match:
        return (
            html[: match.start()]
            + match.group("section")
            + "\n"
            + form
            + "\n"
            + match.group("close")
            + html[match.end() :]
        )

    section = f"""
    <section class="contact onara-lead-section" data-component="contact" id="contact">
      <div class="onara-lead-section-copy">
        <span>Contact</span>
        <h2>Start with a quick message.</h2>
        <p>Share the basics and the team will follow up directly.</p>
      </div>
{form}
    </section>
    """.rstrip()
    return re.sub(r"</body>", f"{section}\n</body>", html, count=1, flags=re.IGNORECASE)


def _inject_lead_capture_style(html: str) -> str:
    if "onara-lead-capture-style" in html:
        return html

    style = """
<style id="onara-lead-capture-style">
  .onara-lead-form {
    display: grid;
    gap: 0.75rem;
    margin-top: 1.25rem;
    border: 1px solid rgba(30, 30, 30, 0.14);
    border-radius: 4px;
    background: rgba(255, 252, 246, 0.92);
    padding: 1rem;
  }
  .onara-lead-form-heading {
    display: grid;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
  }
  .onara-lead-form-heading span,
  .onara-lead-form label span {
    color: #6a6a6a;
    font: 500 0.68rem/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .onara-lead-form-heading strong {
    color: #1a1a1a;
    font-size: 1rem;
  }
  .onara-lead-form label {
    display: grid;
    gap: 0.35rem;
  }
  .onara-lead-form input,
  .onara-lead-form textarea {
    width: 100%;
    border: 1px solid rgba(30, 30, 30, 0.16);
    border-radius: 2px;
    background: #fffdf7;
    color: #1a1a1a;
    font: inherit;
    padding: 0.72rem 0.8rem;
  }
  .onara-lead-form textarea {
    resize: vertical;
  }
  .onara-lead-form button {
    border: 1px solid #cf6f32;
    border-radius: 2px;
    background: #cf6f32;
    color: #fff;
    cursor: pointer;
    font: inherit;
    font-weight: 700;
    line-height: 1.2;
    padding: 0.8rem 1rem;
  }
  .onara-lead-form button[disabled] {
    cursor: wait;
    opacity: 0.68;
  }
  .onara-lead-status {
    min-height: 1rem;
    margin: 0;
    color: #6a6a6a;
    font-size: 0.85rem;
  }
  .onara-lead-hp {
    position: absolute !important;
    left: -9999px !important;
  }
  .onara-lead-section {
    display: grid;
    gap: 1rem;
    padding: clamp(2.5rem, 6vw, 5rem);
  }
</style>
""".strip()
    return re.sub(r"</head>", f"{style}\n</head>", html, count=1, flags=re.IGNORECASE)


def _inject_lead_capture_script(html: str, *, endpoint: str, project_id: str) -> str:
    if "onara-lead-capture-script" in html:
        return html

    script = f"""
<script id="onara-lead-capture-script">
(() => {{
  const endpoint = {json.dumps(endpoint)};
  const projectId = {json.dumps(project_id)};
  const pick = (data, names) => {{
    for (const name of names) {{
      const value = String(data.get(name) || "").trim();
      if (value) return value;
    }}
    return "";
  }};
  const forms = Array.from(document.querySelectorAll("form[data-onara-lead-form], #contact form, form.contact-form"));
  const targets = forms.length ? forms : Array.from(document.querySelectorAll("form"));
  for (const form of targets) {{
    if (form.dataset.onaraLeadBound === "true") continue;
    form.dataset.onaraLeadBound = "true";
    form.addEventListener("submit", async (event) => {{
      event.preventDefault();
      const status = form.querySelector(".onara-lead-status");
      const button = form.querySelector("button[type='submit'], button:not([type])");
      const data = new FormData(form);
      const payload = {{
        project_id: projectId,
        name: pick(data, ["name", "full_name", "first_name"]),
        email: pick(data, ["email", "email_address"]),
        phone: pick(data, ["phone", "tel", "telephone"]),
        message: pick(data, ["message", "details", "notes", "service"]),
        source_url: window.location.href,
        website: pick(data, ["onara_website"])
      }};
      if (status) status.textContent = "Sending...";
      if (button) button.disabled = true;
      try {{
        const response = await fetch(endpoint, {{
          method: "POST",
          headers: {{ "content-type": "application/json" }},
          body: JSON.stringify(payload)
        }});
        if (!response.ok) throw new Error("Lead request failed");
        form.reset();
        if (status) status.textContent = "Sent. The team will follow up shortly.";
      }} catch {{
        if (status) status.textContent = "Could not send. Please call instead.";
      }} finally {{
        if (button) button.disabled = false;
      }}
    }});
  }}
}})();
</script>
""".strip()
    return re.sub(r"</body>", f"{script}\n</body>", html, count=1, flags=re.IGNORECASE)


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
