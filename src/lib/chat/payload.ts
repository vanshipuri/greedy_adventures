import type { AgentResponse } from "@/lib/types";

/** A data part on every assistant-ui message carries the backend response. */
export type ConciergePayload = Partial<AgentResponse> & {
  error?: string;
  transportError?: boolean;
};

export function isAgentResponse(value: unknown): value is AgentResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "answer" in value &&
      "status" in value &&
      "trace" in value,
  );
}
