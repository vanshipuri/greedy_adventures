import { createForcedErrorRunner, createMockRunner } from "@/lib/model/mock";
import { createLiveRunner } from "@/lib/model/live";
import type { ModelRunner } from "@/lib/model/types";
import type { RuntimeInfo } from "@/lib/types";

function flag(name: string) {
  return process.env[name] === "1" || process.env[name]?.toLowerCase() === "true";
}

function envConfig() {
  const apiKey = process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  const baseUrl = process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1";
  const modelName = process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  const forcedFailure = flag("FORCE_MODEL_FAILURE");
  const forcedMock = flag("MOCK_MODE");
  const mode = forcedFailure ? "forced-error" : forcedMock || !apiKey ? "mock" : "live";
  return { apiKey, baseUrl, modelName, forcedFailure, forcedMock, mode } as const;
}

export function describeRuntime(): RuntimeInfo {
  const config = envConfig();
  if (config.mode === "forced-error") {
    return {
      mode: "forced-error",
      label: "Model failure simulation",
      modelName: config.modelName,
      externalModelConfigured: Boolean(config.apiKey),
      note: "FORCE_MODEL_FAILURE is enabled. Every model call returns a visible error; media routing still runs.",
    };
  }
  if (config.mode === "mock") {
    return {
      mode: "mock",
      label: "Mock mode — no external model",
      modelName: "local-grounded-template",
      externalModelConfigured: Boolean(config.apiKey),
      note: config.forcedMock
        ? "MOCK_MODE is enabled. Answers come from a deterministic, grounded template engine."
        : "No model key is configured. Answers come from a deterministic, grounded template engine; no money is spent.",
    };
  }
  return {
    mode: "live",
    label: `Live model — ${config.modelName}`,
    modelName: config.modelName,
    externalModelConfigured: true,
    note: "An OpenAI-compatible Chat Completions endpoint is configured. API keys are never sent to the browser.",
  };
}

export function createRuntimeRunner(): ModelRunner {
  const config = envConfig();
  if (config.mode === "forced-error") {
    return createForcedErrorRunner("FORCE_MODEL_FAILURE=1: simulated model outage.");
  }
  if (config.mode === "mock") return createMockRunner();
  return createLiveRunner({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    modelName: config.modelName,
  });
}
