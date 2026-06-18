// Defines the plan-gated Agent 6 model options shared by the build UI and API route.

export type UserPlan = "free" | "starter" | "pro";

export type Agent6ModelChoice =
  | "onara-default"
  | "copilot-gemini-3.1-pro"
  | "copilot-gpt-5.4-mini"
  | "openai-gpt-5.5-high"
  | "claude-opus-4.8-high";

export type Agent6ModelOption = {
  description: string;
  executable: boolean;
  id: Agent6ModelChoice;
  label: string;
  minimumPlan: UserPlan;
  model: string;
  provider: string;
  unavailableReason?: string;
};

export type Agent6ModelSelection = {
  requestedModel: string | null;
  reason: string | null;
  selectedModel: Agent6ModelChoice;
};

export const AGENT6_DEFAULT_MODEL: Agent6ModelChoice = "onara-default";

const planRank: Record<UserPlan, number> = {
  free: 0,
  starter: 1,
  pro: 2,
};

export const AGENT6_MODEL_OPTIONS: readonly Agent6ModelOption[] = [
  {
    description: "Current production-safe route: GLM 5.1, then Llama 4 Maverick, then local Gemma 4.",
    executable: true,
    id: "onara-default",
    label: "Onara default",
    minimumPlan: "free",
    model: "GLM 5.1 -> Maverick -> Gemma 4",
    provider: "NVIDIA NIM + local fallback",
  },
  {
    description: "Highest-quality Copilot route through the backend SDK, with Onara fallback if Copilot is unavailable.",
    executable: true,
    id: "copilot-gemini-3.1-pro",
    label: "Copilot Gemini 3.1 Pro",
    minimumPlan: "starter",
    model: "gemini-3.1-pro-preview",
    provider: "GitHub Copilot SDK",
  },
  {
    description: "Faster Copilot route through the backend SDK, with Onara fallback if Copilot is unavailable.",
    executable: true,
    id: "copilot-gpt-5.4-mini",
    label: "Copilot GPT 5.4 Mini",
    minimumPlan: "starter",
    model: "gpt-5.4-mini",
    provider: "GitHub Copilot SDK",
  },
  {
    description: "Reserved for Pro users after user key storage and provider clients exist.",
    executable: false,
    id: "openai-gpt-5.5-high",
    label: "OpenAI GPT-5.5 High",
    minimumPlan: "pro",
    model: "gpt-5.5-high",
    provider: "User OpenAI key",
    unavailableReason: "OpenAI user-key storage and client are not wired yet.",
  },
  {
    description: "Reserved for Pro users after user key storage and provider clients exist.",
    executable: false,
    id: "claude-opus-4.8-high",
    label: "Claude Opus 4.8 High",
    minimumPlan: "pro",
    model: "claude-opus-4.8-high",
    provider: "User Anthropic key",
    unavailableReason: "Anthropic user-key storage and client are not wired yet.",
  },
];

export function effectiveUserPlan({
  isTrial,
  plan,
}: {
  isTrial?: boolean | null;
  plan?: string | null;
}): UserPlan {
  if (isTrial) {
    return "pro";
  }

  if (plan === "starter" || plan === "pro") {
    return plan;
  }

  return "free";
}

export function planAllows(userPlan: UserPlan, minimumPlan: UserPlan) {
  return planRank[userPlan] >= planRank[minimumPlan];
}

export function visibleAgent6ModelOptions(userPlan: UserPlan) {
  return AGENT6_MODEL_OPTIONS.filter((option) => planAllows(userPlan, option.minimumPlan));
}

export function agent6OptionReason(option: Agent6ModelOption, allowed: boolean) {
  if (!allowed) {
    return `Requires ${option.minimumPlan}`;
  }

  return option.unavailableReason ?? "Not available yet";
}

export function resolveAgent6ModelForPlan({
  requestedModel,
  userPlan,
}: {
  requestedModel: string | null | undefined;
  userPlan: UserPlan;
}): Agent6ModelSelection {
  const normalizedRequest = requestedModel?.trim() || null;
  const requestedOption = AGENT6_MODEL_OPTIONS.find((option) => option.id === normalizedRequest);

  if (!requestedOption) {
    return {
      requestedModel: normalizedRequest,
      reason: normalizedRequest
        ? `Unknown Agent 6 model option '${normalizedRequest}'; using Onara default.`
        : null,
      selectedModel: AGENT6_DEFAULT_MODEL,
    };
  }

  if (!planAllows(userPlan, requestedOption.minimumPlan)) {
    return {
      requestedModel: normalizedRequest,
      reason: `Agent 6 model option '${normalizedRequest}' requires ${requestedOption.minimumPlan}; using Onara default for ${userPlan}.`,
      selectedModel: AGENT6_DEFAULT_MODEL,
    };
  }

  if (!requestedOption.executable) {
    return {
      requestedModel: normalizedRequest,
      reason: `Agent 6 model option '${normalizedRequest}' is not executable yet: ${
        requestedOption.unavailableReason ?? "provider unavailable"
      }; using Onara default.`,
      selectedModel: AGENT6_DEFAULT_MODEL,
    };
  }

  return {
    requestedModel: normalizedRequest,
    reason: null,
    selectedModel: requestedOption.id,
  };
}
