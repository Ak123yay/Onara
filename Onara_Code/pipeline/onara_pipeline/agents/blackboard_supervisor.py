from dataclasses import dataclass, field
from typing import Any, Literal

SupervisorAction = Literal["continue", "rerun_agent", "route_debugger", "fail"]
SupervisorStage = Literal["after_phase_18", "after_phase_19", "after_phase_20"]


class BlackboardSupervisorError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class BlackboardDecision:
    action: SupervisorAction
    stage: SupervisorStage
    reason: str
    target_agent: str | None = None
    issues: tuple[str, ...] = ()
    blocking: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "action": self.action,
            "blocking": self.blocking,
            "issues": list(self.issues),
            "metadata": self.metadata,
            "reason": self.reason,
            "stage": self.stage,
            "target_agent": self.target_agent,
        }


REQUIRED_KEYS_BY_STAGE: dict[SupervisorStage, dict[str, str]] = {
    "after_phase_18": {
        "analyst_output": "agent_01_analyst",
        "content_output": "agent_02_content",
        "phase_18": "agent_01_analyst",
        "style_output": "agent_03_style",
    },
    "after_phase_19": {
        "analyst_output": "agent_01_analyst",
        "content_output": "agent_02_content",
        "phase_18": "agent_01_analyst",
        "phase_19": "agent_04_planner",
        "planner_output": "agent_04_planner",
        "prompt_output": "agent_05_prompt_engineer",
        "style_output": "agent_03_style",
    },
    "after_phase_20": {
        "codegen_output": "agent_06_codegen",
        "component_files": "agent_06_codegen",
        "generated_html": "agent_06_codegen",
        "phase_20": "agent_06_codegen",
        "raw_code": "agent_06_codegen",
    },
}


def inspect_blackboard(
    blackboard: dict[str, Any],
    *,
    business_data: dict[str, Any],
    stage: SupervisorStage,
) -> BlackboardDecision:
    missing = _missing_required_keys(blackboard, stage)
    if missing:
        key = missing[0]
        return _record_decision(
            blackboard,
            BlackboardDecision(
                action="rerun_agent",
                blocking=True,
                issues=tuple(f"Missing required blackboard key: {item}" for item in missing),
                reason=f"Required blackboard output is missing: {key}.",
                stage=stage,
                target_agent=REQUIRED_KEYS_BY_STAGE[stage][key],
            ),
        )

    invalid = _invalid_required_payloads(blackboard, stage)
    if invalid:
        key = invalid[0]
        return _record_decision(
            blackboard,
            BlackboardDecision(
                action="rerun_agent",
                blocking=True,
                issues=tuple(f"Invalid blackboard payload: {item}" for item in invalid),
                reason=f"Required blackboard output is malformed: {key}.",
                stage=stage,
                target_agent=REQUIRED_KEYS_BY_STAGE[stage][key],
            ),
        )

    if stage == "after_phase_20":
        html_decision = _inspect_generated_html(blackboard, business_data, stage)
        if html_decision:
            return _record_decision(blackboard, html_decision)

    return _record_decision(
        blackboard,
        BlackboardDecision(
            action="continue",
            metadata={"blackboard_keys": sorted(blackboard.keys())},
            reason=f"Blackboard passed supervisor checks for {stage}.",
            stage=stage,
        ),
    )


def _inspect_generated_html(
    blackboard: dict[str, Any],
    business_data: dict[str, Any],
    stage: SupervisorStage,
) -> BlackboardDecision | None:
    html = blackboard.get("generated_html")
    component_files = blackboard.get("component_files")
    issues: list[str] = []

    if not isinstance(html, str) or not html.strip():
        return BlackboardDecision(
            action="rerun_agent",
            blocking=True,
            issues=("generated_html is empty or not a string",),
            reason="Agent 6 did not produce usable HTML.",
            stage=stage,
            target_agent="agent_06_codegen",
        )

    lower = html.lower()
    required_markup = ("<html", "<head", "<style", "<body", "</body>", "</html>")
    missing_markup = [item for item in required_markup if item not in lower]
    if missing_markup:
        return BlackboardDecision(
            action="rerun_agent",
            blocking=True,
            issues=tuple(f"Generated HTML missing {item}" for item in missing_markup),
            reason=f"Generated HTML is missing required markup: {missing_markup[0]}.",
            stage=stage,
            target_agent="agent_06_codegen",
        )

    if not isinstance(component_files, dict) or "index.html" not in component_files:
        return BlackboardDecision(
            action="rerun_agent",
            blocking=True,
            issues=("component_files.index.html is missing",),
            reason="Agent 6 did not split the generated site into component files.",
            stage=stage,
            target_agent="agent_06_codegen",
        )

    if "@media" not in lower:
        issues.append("Generated HTML has no responsive @media rules")
    if "@keyframes" not in lower:
        issues.append("Generated HTML has no lightweight CSS keyframes")
    if "prefers-reduced-motion" not in lower:
        issues.append("Generated HTML has no prefers-reduced-motion safety")
    if "requestanimationframe" in lower or "setinterval(" in lower or "infinite" in lower:
        issues.append("Generated HTML uses unsafe or continuous animation")
    if ("@keyframes" in lower or "animation" in lower) and ("opacity" not in lower or "transform" not in lower):
        issues.append("Generated HTML animation does not use opacity and transform")
    if "{file_marker_start}" in lower or "{file_marker_end}" in lower:
        issues.append("Generated HTML still contains FILE_MARKER tokens")
    if "```" in html:
        issues.append("Generated HTML still contains markdown fences")
    if business_data.get("phone") and "tel:" not in lower:
        issues.append("Generated HTML has no tap-to-call link despite business phone")

    if issues:
        return BlackboardDecision(
            action="route_debugger",
            blocking=False,
            issues=tuple(issues),
            metadata={"next_agent": "agent_07_debugger"},
            reason="Generated HTML is usable but needs debugger cleanup before deployment.",
            stage=stage,
            target_agent="agent_07_debugger",
        )

    return None


def _missing_required_keys(blackboard: dict[str, Any], stage: SupervisorStage) -> list[str]:
    return [key for key in REQUIRED_KEYS_BY_STAGE[stage] if key not in blackboard]


def _invalid_required_payloads(blackboard: dict[str, Any], stage: SupervisorStage) -> list[str]:
    invalid = []

    for key in REQUIRED_KEYS_BY_STAGE[stage]:
        value = blackboard.get(key)
        if key == "generated_html" or key == "raw_code":
            if not isinstance(value, str) or not value.strip():
                invalid.append(key)
        elif key == "component_files":
            if not isinstance(value, dict) or not value:
                invalid.append(key)
        elif not isinstance(value, dict) or not value:
            invalid.append(key)

    return invalid


def _record_decision(blackboard: dict[str, Any], decision: BlackboardDecision) -> BlackboardDecision:
    decision_dict = decision.to_dict()
    decisions = blackboard.setdefault("blackboard_supervisor_decisions", [])
    if isinstance(decisions, list):
        decisions.append(decision_dict)
    else:
        blackboard["blackboard_supervisor_decisions"] = [decision_dict]

    blackboard["latest_blackboard_decision"] = decision_dict
    if decision.action == "route_debugger":
        blackboard["next_agent"] = decision.target_agent

    return decision
