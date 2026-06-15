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
ModelProvider = Literal["nim", "ollama"]
UserPlan = Literal["free", "starter", "pro"]

BENCHMARKED_PRIMARY_MODEL = "z-ai/glm-5.1"
BENCHMARKED_QUALITY_FALLBACK_MODEL = "meta/llama-4-maverick-17b-128e-instruct"


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


def get_agent_model_route(
    agent_id: AgentId,
    *,
    is_trial: bool = False,
    ollama_fallback_model: str,
    ollama_primary_model: str,
    user_plan: UserPlan = "free",
) -> ModelRoute:
    if agent_id == "agent_06_codegen":
        return _agent_6_route(
            is_trial=is_trial,
            ollama_fallback_model=ollama_fallback_model,
            user_plan=user_plan,
        )

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
    return ModelRoute(
        fallback_model=fallback_model,
        fallback_provider="ollama",
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
    # Free and trial users use NIM directly. Paid-provider routing is added when
    # user API-key storage exists; until then paid tiers use the same safe route.
    if is_trial or user_plan in {"free", "starter", "pro"}:
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

    return cloud_route(BENCHMARKED_PRIMARY_MODEL, ollama_fallback_model)
