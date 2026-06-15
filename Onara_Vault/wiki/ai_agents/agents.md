# AI Agents — Onara Pipeline

_All 10 agents: model, job, input, output, retry logic. Source: raw/03_agent_prompts.md._

---

## Pipeline Summary

10 agents run sequentially (with Agents 2 and 3 in parallel) on a shared **Blackboard** dict. A **Supervisor** validates each output and routes retries. Max 2 retries per agent; third failure marks the job `failed`.

---

## Agent 1 — Business Analyst

| | |
|---|---|
| **Model** | `z-ai/glm-5.1` (NVIDIA NIM) |
| **Fallback** | `gemma4:e4b` (Ollama local) |
| **Input** | Google Business Profile data |
| **Output** | Structured JSON site requirements |

Analyzes GBP data and produces a site specification. Identifies industry type, CTA, required sections, trust signals, urgency triggers, and target SEO keyword. Does not write content or code.

Output fields: `industryType`, `primaryCta`, `ctaType`, `mustHaveSections`, `optionalSections`, `trustSignals`, `urgencyTriggers`, `targetKeyword`, `competitorWeaknesses`, `toneKeywords`

---

## Agent 2 — Content Writer

| | |
|---|---|
| **Model** | `qwen3.5:9b` (Ollama local) |
| **Runs parallel with** | Agent 3 |
| **Input** | Business data + Agent 1 output |
| **Output** | All site text content (JSON) |

Writes conversion-focused copy. Prohibited words: "solutions", "we are committed to", "world-class", "industry-leading". City/service area always in hero headline.

Output sections: `hero`, `about`, `services[]`, `social_proof`, `contact`, `footer_tagline`

---

## Agent 3 — Style Agent

| | |
|---|---|
| **Model** | `qwen3.5:9b` (Ollama local) |
| **Runs parallel with** | Agent 2 |
| **Input** | Business data + Agent 1 `industryType` |
| **Output** | Complete design system tokens (JSON) |

Defines visual identity with industry-specific palette defaults:
- plumber/HVAC → trust blue (#1a4f8a) + accent orange (#f97316)
- electrician → bold yellow (#facc15) + dark navy (#0f172a)
- landscaper → forest green (#166534) + warm tan (#d4a96a)
- contractor/builder → slate grey (#475569) + warm orange (#ea580c)

Output sections: `colors`, `typography`, `spacing`, `style_notes`

---

## Agent 4 — Planner

| | |
|---|---|
| **Model** | `z-ai/glm-5.1` (NVIDIA NIM) |
| **Fallback** | `gemma4:e4b` (Ollama local) |
| **Input** | Agents 1, 2, and 3 outputs |
| **Output** | HTML/CSS component blueprint (JSON) |

Translates content and design system into an unambiguous component blueprint. Specifies exact element hierarchy, CSS variables, responsive behavior, interactive behaviors, and copy mapping. Does not write code.

Output fields: `components[]`, `css_variables`, `component_order[]`, `special_notes`

---

## Agent 5 — Prompt Engineer

| | |
|---|---|
| **Model** | `z-ai/glm-5.1` (NVIDIA NIM) |
| **Fallback** | `gemma4:e4b` (Ollama local) |
| **Input** | Agent 4 blueprint |
| **Output** | Optimized code generation prompt (plain string) |

Converts the blueprint into the most effective single prompt for Agent 6. Output is a plain string passed directly to the code generator.

---

## Agent 6 — Code Generator

| | |
|---|---|
| **Model (Free/Trial)** | `z-ai/glm-5.1` (NVIDIA NIM) |
| **Model (Starter)** | GitHub Copilot SDK selectable model, with NIM fallback |
| **Model (Pro)** | Claude or OpenAI model (user-provided key), with NIM fallback |
| **Fallback 1** | `meta/llama-4-maverick-17b-128e-instruct` (NVIDIA NIM) |
| **Fallback 2** | `gemma4:e4b` (Ollama local) |
| **Input** | Agent 5 prompt |
| **Output** | Complete `index.html` |

Generates a single self-contained HTML file. All CSS in `<style>` tag, all JS before `</body>`. Mobile-first, breakpoint at 768px. CSS custom properties for all colors/fonts. No external frameworks. HTML5 valid. Lighthouse accessibility ≥ 90.

**Output format**: entire file wrapped in `{FILE_MARKER_START}` / `{FILE_MARKER_END}` for parser extraction.

```python
pattern = r'\{FILE_MARKER_START\}(.*?)\{FILE_MARKER_END\}'
html = re.search(pattern, output, re.DOTALL).group(1).strip()
```

---

## Agent 7 — Debugger

| | |
|---|---|
| **Model** | `z-ai/glm-5.1` (NVIDIA NIM) |
| **Fallback** | `gemma4:e4b` (Ollama local) |
| **Input** | HTML from Agent 6 + validation error list |
| **Output** | Fixed HTML (wrapped in markers) or string `"PASS"` |

Fixes: unclosed tags, missing alt text, color contrast failures, broken CSS, JS errors, missing meta tags, CTAs not linked to phone, mobile overflow. Never returns partial HTML — always returns complete file or `PASS`.

---

## Agent 8 — SEO Agent

| | |
|---|---|
| **Model** | `qwen3.5:9b` (Ollama local) |
| **Input** | Debugged HTML + business data + target keyword |
| **Output** | HTML with SEO elements injected |

Injects: `<title>` replacement, meta description (150–160 chars), Open Graph tags, JSON-LD `LocalBusiness` structured data, geo meta tags. Ensures H1 contains target keyword.

---

## Agent 9 — QA Agent

| | |
|---|---|
| **Model** | `z-ai/glm-5.1` (NVIDIA NIM) |
| **Fallback** | `gemma4:e4b` (Ollama local) |
| **Input** | HTML after SEO injection |
| **Output** | JSON verdict: `PASS` or `FAIL` + blocking issues |

Quality gate with 10 checks (see `testing/test-strategy.md`). On FAIL → pipeline retries from Agent 6 (max 2 retries). Does NOT write code — only flags issues. Failed retries do not deduct user revisions.

```json
{ "result": "PASS", "score": 95, "blocking_issues": [], "warnings": [] }
```

---

## Agent 10 — Mobile Agent

| | |
|---|---|
| **Model** | `qwen3.5:9b` (Ollama local) |
| **Input** | QA-passed HTML |
| **Output** | Mobile-optimized HTML (always full file — never returns PASS) |

Ensures: 44px touch targets, 16px body font, prominent hero phone CTA, hamburger nav on mobile, no horizontal scrolling, `object-fit: cover` on hero images, reduced mobile padding, 16px form inputs (prevents iOS auto-zoom).

---

## Supervisor

| | |
|---|---|
| **Model** | `gemma4:e4b` (Ollama local) |
| **Role** | Pipeline monitor — not a numbered agent |

Validates each agent's output, accepts/retries/fails, writes to blackboard, escalates to fallback models after 2 failed retries.

---

## Blackboard Schema

```python
blackboard = {
    "job_id": str,
    "user_id": str,
    "project_id": str,
    "business_data": dict,
    "analyst_output": dict | None,
    "content_output": dict | None,
    "style_output": dict | None,
    "planner_output": dict | None,
    "prompt_output": str | None,
    "raw_code": str | None,        # None after Debugger consumes
    "debugged_code": str | None,   # None after SEO agent consumes
    "seo_code": str | None,        # None after QA consumes
    "qa_result": dict | None,
    "final_html": str,             # goes to deployment
    "current_agent": str,
    "retry_count": int,
    "started_at": float,
    "completed_at": float | None,
}
```
