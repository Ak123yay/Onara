from dataclasses import dataclass
from typing import Literal

AgentId = Literal[
    "agent_01_analyst",
    "agent_02_content",
    "agent_03_style",
    "agent_04_planner",
    "agent_05_prompt_engineer",
    "agent_06_codegen",
    "agent_07_debugger",
    "agent_08_seo",
    "agent_09_qa",
    "agent_10_mobile",
    "supervisor",
]
ModelProvider = Literal["nim", "ollama", "copilot"]
UserPlan = Literal["free", "starter", "pro"]
Agent6ModelOptionId = Literal[
    "onara-default",
    "copilot-gemini-3.1-pro",
    "copilot-gpt-5.4-mini",
    "openai-gpt-5.4",
    "claude-sonnet-4",
]

BENCHMARKED_PRIMARY_MODEL = "z-ai/glm-5.1"
BENCHMARKED_QUALITY_FALLBACK_MODEL = "meta/llama-4-maverick-17b-128e-instruct"
AGENT_6_DEFAULT_OPTION_ID: Agent6ModelOptionId = "onara-default"

PLAN_ORDER: dict[UserPlan, int] = {"free": 0, "starter": 1, "pro": 2}


@dataclass(frozen=True)
class ModelCandidate:
    model: str
    provider: ModelProvider


@dataclass(frozen=True)
class ModelRoute:
    fallback_model: str | None
    fallback_provider: ModelProvider | None
    model: str
    provider: ModelProvider
    fallback_chain: tuple[ModelCandidate, ...] = ()

    def candidates(self) -> tuple[ModelCandidate, ...]:
        fallback = self.fallback_chain
        if not fallback and self.fallback_model and self.fallback_provider:
            fallback = (ModelCandidate(model=self.fallback_model, provider=self.fallback_provider),)

        return (ModelCandidate(model=self.model, provider=self.provider), *fallback)


@dataclass(frozen=True)
class Agent6ModelOption:
    enabled: bool
    id: Agent6ModelOptionId
    label: str
    minimum_plan: UserPlan
    model: str
    provider_label: str
    reason: str | None = None


@dataclass(frozen=True)
class Agent6ModelSelection:
    options: tuple[Agent6ModelOption, ...]
    requested_option_id: str | None
    route: ModelRoute
    selected_option_id: Agent6ModelOptionId
    selection_reason: str | None = None


def get_agent_model_route(
    agent_id: AgentId,
    *,
    agent_6_model: str | None = None,
    is_trial: bool = False,
    ollama_fallback_model: str,
    ollama_primary_model: str,
    user_plan: UserPlan = "free",
) -> ModelRoute:
    if agent_id == "agent_06_codegen":
        return get_agent_6_model_selection(
            requested_option_id=agent_6_model,
            is_trial=is_trial,
            ollama_fallback_model=ollama_fallback_model,
            user_plan=user_plan,
        ).route

    routes: dict[AgentId, ModelRoute] = {
        "agent_01_analyst": cloud_route(BENCHMARKED_PRIMARY_MODEL, ollama_fallback_model),
        "agent_02_content": local_route(ollama_primary_model, ollama_fallback_model),
        "agent_03_style": local_route(ollama_primary_model, ollama_fallback_model),
        "agent_04_planner": cloud_route(BENCHMARKED_PRIMARY_MODEL, ollama_fallback_model),
        "agent_05_prompt_engineer": cloud_route(BENCHMARKED_PRIMARY_MODEL, ollama_fallback_model),
        "agent_07_debugger": cloud_route(BENCHMARKED_PRIMARY_MODEL, ollama_fallback_model),
        "agent_08_seo": local_route(ollama_primary_model, ollama_fallback_model),
        "agent_09_qa": cloud_route(BENCHMARKED_PRIMARY_MODEL, ollama_fallback_model),
        "agent_10_mobile": local_route(ollama_primary_model, ollama_fallback_model),
        "supervisor": local_route(ollama_fallback_model, ollama_primary_model),
    }

    return routes[agent_id]


def cloud_route(model: str, fallback_model: str) -> ModelRoute:
    fallback_chain = []
    if BENCHMARKED_QUALITY_FALLBACK_MODEL != model:
        fallback_chain.append(ModelCandidate(model=BENCHMARKED_QUALITY_FALLBACK_MODEL, provider="nim"))
    fallback_chain.append(ModelCandidate(model=fallback_model, provider="ollama"))

    return ModelRoute(
        fallback_model=fallback_model,
        fallback_provider="ollama",
        fallback_chain=tuple(fallback_chain),
        model=model,
        provider="nim",
    )


def local_route(model: str, fallback_model: str) -> ModelRoute:
    fallback = fallback_model if fallback_model != model else None
    return ModelRoute(
        fallback_model=fallback,
        fallback_provider="ollama" if fallback else None,
        model=model,
        provider="ollama",
    )


def _agent_6_route(
    *,
    is_trial: bool,
    ollama_fallback_model: str,
    user_plan: UserPlan,
) -> ModelRoute:
    return get_agent_6_model_selection(
        is_trial=is_trial,
        ollama_fallback_model=ollama_fallback_model,
        requested_option_id=None,
        user_plan=user_plan,
    ).route


def get_agent_6_model_selection(
    *,
    is_trial: bool,
    ollama_fallback_model: str,
    requested_option_id: str | None,
    user_plan: UserPlan,
) -> Agent6ModelSelection:
    # A trial is a Pro trial in Onara. The app passes `user_plan="pro"` for
    # active trials, so `is_trial` is context only and must not downgrade access.
    effective_plan = user_plan
    options = get_agent_6_model_options(is_trial=is_trial, user_plan=user_plan)
    requested_option = next((option for option in options if option.id == requested_option_id), None)

    if requested_option is None:
        return Agent6ModelSelection(
            options=options,
            requested_option_id=requested_option_id,
            route=_agent_6_nim_route(ollama_fallback_model),
            selected_option_id=AGENT_6_DEFAULT_OPTION_ID,
            selection_reason=(
                f"Unknown Agent 6 model option '{requested_option_id}'; using Onara default."
                if requested_option_id
                else None
            ),
        )

    if not _plan_allows(effective_plan, requested_option.minimum_plan):
        return Agent6ModelSelection(
            options=options,
            requested_option_id=requested_option_id,
            route=_agent_6_nim_route(ollama_fallback_model),
            selected_option_id=AGENT_6_DEFAULT_OPTION_ID,
            selection_reason=(
                f"Agent 6 model option '{requested_option_id}' requires {requested_option.minimum_plan}; "
                f"using Onara default for {effective_plan}."
            ),
        )

    if not requested_option.enabled:
        return Agent6ModelSelection(
            options=options,
            requested_option_id=requested_option_id,
            route=_agent_6_nim_route(ollama_fallback_model),
            selected_option_id=AGENT_6_DEFAULT_OPTION_ID,
            selection_reason=(
                f"Agent 6 model option '{requested_option_id}' is not executable yet: "
                f"{requested_option.reason or 'provider unavailable'}; using Onara default."
            ),
        )

    if requested_option.id.startswith("copilot-"):
        return Agent6ModelSelection(
            options=options,
            requested_option_id=requested_option_id,
            route=_agent_6_copilot_route(
                copilot_model=requested_option.model,
                ollama_fallback_model=ollama_fallback_model,
            ),
            selected_option_id=requested_option.id,
        )

    return Agent6ModelSelection(
        options=options,
        requested_option_id=requested_option_id,
        route=_agent_6_nim_route(ollama_fallback_model),
        selected_option_id=requested_option.id,
    )


def get_agent_6_model_options(*, is_trial: bool, user_plan: UserPlan) -> tuple[Agent6ModelOption, ...]:
    # A trial is a Pro trial in Onara. Keep plan gating based on the effective
    # plan supplied by the app, not the boolean trial marker.
    effective_plan = user_plan
    definitions: tuple[tuple[Agent6ModelOptionId, str, UserPlan, str, str, bool, str | None], ...] = (
        (
            "onara-default",
            "Onara default",
            "free",
            "NVIDIA NIM",
            BENCHMARKED_PRIMARY_MODEL,
            True,
            None,
        ),
        (
            "copilot-gemini-3.1-pro",
            "GitHub Copilot Gemini 3.1 Pro",
            "starter",
            "GitHub Copilot SDK",
            "gemini-3.1-pro-preview",
            True,
            None,
        ),
        (
            "copilot-gpt-5.4-mini",
            "GitHub Copilot GPT 5.4 Mini",
            "starter",
            "GitHub Copilot SDK",
            "gpt-5.4-mini",
            True,
            None,
        ),
        (
            "openai-gpt-5.4",
            "OpenAI GPT-5.4",
            "pro",
            "User OpenAI key",
            "gpt-5.4",
            False,
            "User API-key storage and OpenAI client are not implemented yet.",
        ),
        (
            "claude-sonnet-4",
            "Claude Sonnet 4",
            "pro",
            "User Anthropic key",
            "claude-sonnet-4",
            False,
            "User API-key storage and Anthropic client are not implemented yet.",
        ),
    )

    options = []
    for option_id, label, minimum_plan, provider_label, model, executable, unavailable_reason in definitions:
        plan_allowed = _plan_allows(effective_plan, minimum_plan)
        reason = unavailable_reason
        if not plan_allowed:
            reason = f"Requires {minimum_plan} plan."
        options.append(
            Agent6ModelOption(
                enabled=plan_allowed and executable,
                id=option_id,
                label=label,
                minimum_plan=minimum_plan,
                model=model,
                provider_label=provider_label,
                reason=reason,
            )
        )

    return tuple(options)


def _agent_6_nim_route(ollama_fallback_model: str) -> ModelRoute:
    return ModelRoute(
        fallback_model=ollama_fallback_model,
        fallback_provider="ollama",
        fallback_chain=(
            ModelCandidate(model=BENCHMARKED_QUALITY_FALLBACK_MODEL, provider="nim"),
            ModelCandidate(model=ollama_fallback_model, provider="ollama"),
        ),
        model=BENCHMARKED_PRIMARY_MODEL,
        provider="nim",
    )


def _agent_6_copilot_route(*, copilot_model: str, ollama_fallback_model: str) -> ModelRoute:
    return ModelRoute(
        fallback_model=ollama_fallback_model,
        fallback_provider="ollama",
        fallback_chain=(
            ModelCandidate(model=BENCHMARKED_PRIMARY_MODEL, provider="nim"),
            ModelCandidate(model=BENCHMARKED_QUALITY_FALLBACK_MODEL, provider="nim"),
            ModelCandidate(model=ollama_fallback_model, provider="ollama"),
        ),
        model=copilot_model,
        provider="copilot",
    )


def _plan_allows(user_plan: UserPlan, minimum_plan: UserPlan) -> bool:
    return PLAN_ORDER[user_plan] >= PLAN_ORDER[minimum_plan]
