import argparse
import asyncio
import json
import statistics
import time
from dataclasses import dataclass
from typing import Any

import httpx

from onara_pipeline.config import Settings


DEFAULT_CANDIDATES = [
    "meta/llama-4-maverick-17b-128e-instruct",
    "z-ai/glm-5.1",
    "mistralai/mistral-nemotron",
    "nvidia/nemotron-3-nano-30b-a3b",
    "nvidia/nemotron-3-super-120b-a12b",
    "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    "nvidia/nvidia-nemotron-nano-9b-v2",
    "qwen/qwen3.5-122b-a10b",
    "moonshotai/kimi-k2.6",
    "deepseek-ai/deepseek-v4-flash",
    "deepseek-ai/deepseek-v4-pro",
]

PING_PROMPT = "Reply with exactly: ok"

BENCHMARK_TASKS = [
    {
        "id": "analyst_json",
        "max_tokens": 450,
        "required_terms": ["industry", "services", "conversion", "trust"],
        "messages": [
            {
                "role": "system",
                "content": "Return compact valid JSON only. Do not use markdown.",
            },
            {
                "role": "user",
                "content": (
                    "Analyze this contractor business for a generated website. "
                    "Business: Nova Pro Plumbing, Sterling VA. Rating: 4.8 from 127 reviews. "
                    "Services: emergency repair, water heaters, drain cleaning, leak detection. "
                    "Phone: (703) 555-0182. Return JSON with keys industry, services, "
                    "conversion_priority, trust_signals, homepage_sections."
                ),
            },
        ],
    },
    {
        "id": "code_block",
        "max_tokens": 750,
        "required_terms": ["section", "style", "tel:", "Emergency", "Free estimate"],
        "messages": [
            {
                "role": "system",
                "content": "Return one self-contained HTML section with CSS in a style tag. No markdown.",
            },
            {
                "role": "user",
                "content": (
                    "Create a premium contractor hero section for Nova Pro Plumbing. "
                    "Use a phone-first CTA, emergency strip, Google review badge, service cards, "
                    "and mobile-friendly CSS."
                ),
            },
        ],
    },
    {
        "id": "debug_fix",
        "max_tokens": 650,
        "required_terms": ["section", "style", "aria-label", "tel:", "@media"],
        "messages": [
            {
                "role": "system",
                "content": (
                    "Fix the provided HTML/CSS. Return only the corrected self-contained section. "
                    "No markdown, no explanation."
                ),
            },
            {
                "role": "user",
                "content": (
                    "<section class='hero'><h1>Fast plumbing</h1><a class='call'>Call now</a>"
                    "<div class='cards'><div>Water heaters</div><div>Drain cleaning</div></section>"
                    "<style>.hero{padding:20px}.cards{display:flex}.call{background:#f60}</style>\n"
                    "Fix invalid markup, make the phone CTA accessible with tel:+17035550182, add mobile CSS, "
                    "and preserve a premium contractor look."
                ),
            },
        ],
    },
]

CODE_BENCHMARK_TASKS = [
    {
        "id": "component_contract",
        "max_tokens": 900,
        "required_terms": [
            "{FILE_MARKER_START}",
            "{FILE_MARKER_END}",
            "<!DOCTYPE html>",
            "<style>",
            ":root",
            "tel:+17035550182",
            "@media",
        ],
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are Agent 6, a strict frontend code generator. Return only one complete "
                    "self-contained HTML document wrapped in {FILE_MARKER_START} and {FILE_MARKER_END}. "
                    "No markdown, no explanation."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Generate a contractor homepage for Nova Pro Plumbing in Sterling, VA. "
                    "Requirements: emergency banner, tap-to-call hero CTA, 4.8 rating badge, "
                    "three service cards, CSS variables in :root, mobile-first responsive CSS, "
                    "no external JS libraries, and phone links must use tel:+17035550182."
                ),
            },
        ],
    },
    {
        "id": "html_repair_accessibility",
        "max_tokens": 850,
        "required_terms": [
            "<section",
            "<style>",
            "aria-label",
            "alt=",
            "tel:+17035550182",
            "@media",
            "min-height: 44px",
        ],
        "messages": [
            {
                "role": "system",
                "content": (
                    "Fix the HTML/CSS. Return only the corrected self-contained section with CSS. "
                    "No markdown, no explanation."
                ),
            },
            {
                "role": "user",
                "content": (
                    "<section class='hero'><img src='/truck.jpg'><h1>Fast plumbing</h1>"
                    "<a class='call' href='#'>Call now</a><div class='cards'><button>Water heaters</button>"
                    "<button>Drain cleaning</button></section><style>.hero{padding:18px}.cards{display:flex}"
                    ".call{background:#f60;color:white}</style>\n"
                    "Fix invalid markup, add accessible image alt text, make the phone CTA accessible, "
                    "remove href='#', add responsive mobile CSS, and make all touch targets at least 44px tall."
                ),
            },
        ],
    },
    {
        "id": "vanilla_js_interaction",
        "max_tokens": 950,
        "required_terms": [
            "<script>",
            "addEventListener",
            "dataset",
            "aria-pressed",
            "querySelectorAll",
            "hidden",
            "@media",
        ],
        "messages": [
            {
                "role": "system",
                "content": (
                    "Return only one self-contained HTML section with style and script tags. "
                    "Use vanilla JavaScript only. No markdown."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Build a small service filter component for a contractor site. It needs three filter "
                    "buttons: All, Emergency, Maintenance. Six service cards should filter by data-category. "
                    "Use aria-pressed correctly, hide filtered cards, and include responsive CSS."
                ),
            },
        ],
    },
    {
        "id": "json_blueprint",
        "max_tokens": 750,
        "required_terms": [
            "components",
            "css_variables",
            "component_order",
            "responsive_changes",
            "content_mapping",
        ],
        "messages": [
            {
                "role": "system",
                "content": "Return strict valid JSON only. No markdown, no comments, no explanation.",
            },
            {
                "role": "user",
                "content": (
                    "Create a frontend component blueprint for a contractor hero, trust strip, service grid, "
                    "and contact CTA. Return JSON with keys components, css_variables, component_order, "
                    "and special_notes. Each component must include id, type, order, html_structure, "
                    "css_classes, content_mapping, responsive_changes, and interactive."
                ),
            },
        ],
    },
    {
        "id": "css_responsive_quality",
        "max_tokens": 650,
        "required_terms": [
            ":root",
            "clamp(",
            "grid-template-columns",
            "@media",
            "min-height: 44px",
            "max-width: 100%",
            "prefers-reduced-motion",
        ],
        "messages": [
            {
                "role": "system",
                "content": "Return only CSS. No markdown, no explanation.",
            },
            {
                "role": "user",
                "content": (
                    "Write production-quality mobile-first CSS for a generated contractor website with "
                    "hero, proof cards, service grid, and CTA buttons. Include CSS variables, responsive "
                    "grid behavior, accessible tap targets, fluid type, overflow protection, and reduced-motion handling."
                ),
            },
        ],
    },
]


@dataclass(frozen=True)
class ModelResult:
    error: str | None
    latency_seconds: float | None
    model: str
    output_chars: int
    score: float
    task_id: str


async def call_model(
    *,
    client: httpx.AsyncClient,
    settings: Settings,
    model: str,
    messages: list[dict[str, str]],
    max_tokens: int,
    temperature: float,
) -> tuple[str, float]:
    started_at = time.perf_counter()
    response = await client.post(
        f"{settings.nvidia_nim_base_url}/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "max_tokens": max_tokens,
            "messages": messages,
            "model": model,
            "temperature": temperature,
        },
    )
    elapsed = time.perf_counter() - started_at
    response.raise_for_status()
    data = response.json()
    content = extract_message_content(data)
    if not isinstance(content, str) or not content.strip():
        raise ValueError("empty model output")
    return content, elapsed


def extract_message_content(data: dict[str, Any]) -> str:
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ValueError("missing choices")

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise ValueError("malformed first choice")

    message = first_choice.get("message")
    if not isinstance(message, dict):
        raise ValueError("missing message")

    content = message.get("content")
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text") or item.get("content")
                if isinstance(text, str):
                    parts.append(text)
        return "\n".join(parts)

    reasoning = message.get("reasoning_content") or message.get("thinking")
    if isinstance(reasoning, str):
        return reasoning

    raise ValueError(f"missing text content in message keys: {sorted(message.keys())}")


async def ping_model(model: str, *, settings: Settings, timeout: float) -> ModelResult:
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            content, elapsed = await call_model(
                client=client,
                settings=settings,
                model=model,
                messages=[{"role": "user", "content": PING_PROMPT}],
                max_tokens=8,
                temperature=0,
            )
            score = 1.0 if content.strip().lower().startswith("ok") else 0.5
            return ModelResult(None, elapsed, model, len(content), score, "ping")
        except Exception as exc:
            return ModelResult(f"{type(exc).__name__}: {exc}", None, model, 0, 0.0, "ping")


async def benchmark_model(
    model: str,
    *,
    settings: Settings,
    task: dict[str, Any],
    timeout: float,
) -> ModelResult:
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            content, elapsed = await call_model(
                client=client,
                settings=settings,
                model=model,
                messages=task["messages"],
                max_tokens=task["max_tokens"],
                temperature=0.2,
            )
            score = score_content(content, task)
            return ModelResult(None, elapsed, model, len(content), score, task["id"])
        except Exception as exc:
            return ModelResult(f"{type(exc).__name__}: {exc}", None, model, 0, 0.0, task["id"])


def score_content(content: str, task: dict[str, Any]) -> float:
    lowered = content.lower()
    required_terms = task["required_terms"]
    term_score = sum(1 for term in required_terms if term.lower() in lowered) / len(required_terms)

    if task["id"] == "analyst_json":
        try:
            parsed = json.loads(strip_code_fence(content))
            json_score = 1.0 if isinstance(parsed, dict) else 0.0
        except json.JSONDecodeError:
            json_score = 0.0
        return round(0.65 * json_score + 0.35 * term_score, 4)

    if task["id"] in {"code_block", "debug_fix"}:
        html_score = 1.0 if "<section" in lowered and "<style" in lowered else 0.0
        return round(0.55 * html_score + 0.45 * term_score, 4)

    if task["id"] == "component_contract":
        marker_score = 1.0 if "{file_marker_start}" in lowered and "{file_marker_end}" in lowered else 0.0
        document_score = 1.0 if "<!doctype html" in lowered and "</html>" in lowered else 0.0
        markdown_penalty = 0.2 if "```" in content else 0.0
        return round(max(0, 0.35 * marker_score + 0.25 * document_score + 0.40 * term_score - markdown_penalty), 4)

    if task["id"] == "html_repair_accessibility":
        no_broken_href_score = 1.0 if "href='#'" not in lowered and 'href="#"' not in lowered else 0.0
        html_score = 1.0 if "<section" in lowered and "</section>" in lowered and "<style" in lowered else 0.0
        return round(0.25 * no_broken_href_score + 0.30 * html_score + 0.45 * term_score, 4)

    if task["id"] == "vanilla_js_interaction":
        no_framework_score = 0.0 if any(term in lowered for term in ["react", "vue", "jquery", "alpine"]) else 1.0
        script_score = 1.0 if "<script" in lowered and "</script>" in lowered else 0.0
        return round(0.20 * no_framework_score + 0.30 * script_score + 0.50 * term_score, 4)

    if task["id"] == "json_blueprint":
        try:
            parsed = json.loads(strip_code_fence(content))
            required_keys = {"components", "css_variables", "component_order", "special_notes"}
            json_score = 1.0 if isinstance(parsed, dict) and required_keys.issubset(parsed.keys()) else 0.35
            component_score = 0.0
            if isinstance(parsed, dict) and isinstance(parsed.get("components"), list) and parsed["components"]:
                component_keys = {
                    "id",
                    "type",
                    "order",
                    "html_structure",
                    "css_classes",
                    "content_mapping",
                    "responsive_changes",
                    "interactive",
                }
                component_score = 1.0 if all(
                    isinstance(component, dict) and component_keys.issubset(component.keys())
                    for component in parsed["components"]
                ) else 0.4
        except json.JSONDecodeError:
            json_score = 0.0
            component_score = 0.0
        return round(0.55 * json_score + 0.30 * component_score + 0.15 * term_score, 4)

    if task["id"] == "css_responsive_quality":
        css_only_score = 0.0 if any(term in lowered for term in ["<html", "<section", "```"]) else 1.0
        selector_score = 1.0 if any(selector in lowered for selector in [".hero", ".service", ".cta", ".proof"]) else 0.0
        return round(0.20 * css_only_score + 0.20 * selector_score + 0.60 * term_score, 4)

    return round(term_score, 4)


def strip_code_fence(content: str) -> str:
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        return "\n".join(lines[1:-1]).strip()
    return text


def summarize(results: list[ModelResult]) -> list[dict[str, Any]]:
    by_model: dict[str, list[ModelResult]] = {}
    for result in results:
        by_model.setdefault(result.model, []).append(result)

    summary = []
    for model, model_results in by_model.items():
        successful = [result for result in model_results if result.error is None and result.latency_seconds is not None]
        latencies = [result.latency_seconds for result in successful if result.latency_seconds is not None]
        scores = [result.score for result in model_results]
        avg_latency = statistics.mean(latencies) if latencies else None
        avg_score = statistics.mean(scores) if scores else 0
        reliability_score = len(successful) / len(model_results) if model_results else 0
        speed_score = score_speed(avg_latency)
        value_score = (0.55 * avg_score) + (0.30 * reliability_score) + (0.15 * speed_score)
        summary.append(
            {
                "avg_latency_seconds": round(avg_latency, 3) if avg_latency is not None else None,
                "avg_score": round(avg_score, 4),
                "category": categorize_model(avg_score=avg_score, avg_latency=avg_latency, reliability_score=reliability_score),
                "max_latency_seconds": round(max(latencies), 3) if latencies else None,
                "model": model,
                "reliability_score": round(reliability_score, 4),
                "speed_score": round(speed_score, 4),
                "successes": len(successful),
                "tasks": len(model_results),
                "value_score": round(value_score, 4),
            }
        )

    return sorted(
        summary,
        key=lambda item: (
            -item["value_score"],
            -item["avg_score"],
            item["avg_latency_seconds"] if item["avg_latency_seconds"] is not None else 999,
        ),
    )


def score_speed(avg_latency: float | None) -> float:
    if avg_latency is None:
        return 0.0
    if avg_latency <= 12:
        return 1.0
    if avg_latency >= 30:
        return 0.0
    return (30 - avg_latency) / 18


def categorize_model(*, avg_score: float, avg_latency: float | None, reliability_score: float) -> str:
    if reliability_score < 1:
        return "unstable"
    if avg_score >= 0.9 and avg_latency is not None and avg_latency <= 12:
        return "best-value"
    if avg_score >= 0.9:
        return "quality-but-slower"
    if avg_score >= 0.75 and avg_latency is not None and avg_latency <= 12:
        return "usable-specialist"
    if avg_latency is not None and avg_latency <= 4:
        return "fast-but-weak"
    return "not-recommended"


async def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark NVIDIA NIM models for Onara.")
    parser.add_argument("--models", nargs="*", default=DEFAULT_CANDIDATES)
    parser.add_argument("--ping-timeout", type=float, default=25)
    parser.add_argument("--task-timeout", type=float, default=60)
    parser.add_argument("--skip-ping", action="store_true")
    parser.add_argument("--suite", choices=("default", "code"), default="default")
    args = parser.parse_args()

    settings = Settings()
    if not settings.nvidia_nim_api_key:
        raise SystemExit("NVIDIA_NIM_API_KEY is not configured")

    models = list(dict.fromkeys(args.models))
    if args.skip_ping:
        passing_models = models
        ping_results: list[ModelResult] = []
    else:
        ping_results = []
        for model in models:
            result = await ping_model(model, settings=settings, timeout=args.ping_timeout)
            ping_results.append(result)
            print(json.dumps(result.__dict__, sort_keys=True))
            await asyncio.sleep(1)
        passing_models = [result.model for result in ping_results if result.error is None]

    tasks = CODE_BENCHMARK_TASKS if args.suite == "code" else BENCHMARK_TASKS
    benchmark_results = []
    for model in passing_models:
        for task in tasks:
            result = await benchmark_model(model, settings=settings, task=task, timeout=args.task_timeout)
            benchmark_results.append(result)
            print(json.dumps(result.__dict__, sort_keys=True))
            await asyncio.sleep(1)

    print("SUMMARY")
    print(json.dumps(summarize([*ping_results, *benchmark_results]), indent=2, sort_keys=True))


if __name__ == "__main__":
    asyncio.run(main())
