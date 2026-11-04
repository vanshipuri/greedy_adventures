import { buildGroundedReply } from "@/lib/agent/deterministic";
import type { ModelRequest, ModelRunner } from "@/lib/model/types";

/** Deterministic answer engine used when no model key is configured. */
export function createMockRunner(): ModelRunner {
  return {
    mode: "mock",
    label: "Mock mode — deterministic, no external model",
    modelName: "local-grounded-template",
    async generate(request: ModelRequest) {
      return buildGroundedReply({
        messages: request.messages,
        retrievalQuery: request.retrievalQuery,
        hits: request.hits,
        mediaDecision: request.mediaDecision,
      });
    },
  };
}

export function createForcedErrorRunner(reason = "Simulated model failure"): ModelRunner {
  return {
    mode: "forced-error",
    label: "Forced model error — verification only",
    modelName: "forced-error",
    async generate() {
      throw new Error(reason);
    },
  };
}
