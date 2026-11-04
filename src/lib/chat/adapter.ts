"use client";

import type { ChatModelAdapter, ThreadMessage } from "@assistant-ui/react";
import { isAgentResponse, type ConciergePayload } from "@/lib/chat/payload";
import type { AgentResponse, ChatMessage, RuntimeInfo } from "@/lib/types";

function toApiMessages(messages: readonly ThreadMessage[]): ChatMessage[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content
        .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
        .map((part) => part.text)
        .join("\n")
        .trim()
        .slice(0, 4000),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-24) as ChatMessage[];
}

const fallbackRuntime: RuntimeInfo = {
  mode: "mock",
  label: "Backend status unavailable",
  modelName: "unavailable",
  externalModelConfigured: false,
  note: "The chat endpoint could not be reached.",
};

function errorPayload(message: string): ConciergePayload {
  return {
    answer: `I couldn't reach the concierge backend. ${message} Please try again in a moment; no answer has been invented.`,
    status: "error",
    sources: [],
    media: [],
    runtime: fallbackRuntime,
    transportError: true,
    error: message,
    trace: {
      retrievalQuery: "",
      retrievalHits: [],
      sourceText: "",
      modelCalled: false,
      modelMode: "mock",
      modelLabel: "unavailable",
      media: { intent: "none", requested: [], selected: [] },
      skipReason: "Chat endpoint was unreachable.",
      error: message,
      elapsedMs: 0,
    },
  };
}

function toResult(payload: ConciergePayload) {
  const answer = payload.answer || "The backend returned no answer. Please try again.";
  return {
    content: [
      { type: "text" as const, text: answer },
      { type: "data" as const, name: "concierge", data: payload },
    ],
    metadata: {
      custom: { concierge: payload },
    },
  };
}

/** assistant-ui local runtime adapter → validated Next.js chat endpoint. */
export const conciergeAdapter: ChatModelAdapter = {
  async run({ messages, abortSignal }) {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toApiMessages(messages) }),
        signal: abortSignal,
        cache: "no-store",
      });

      const body: unknown = await response.json().catch(() => null);
      if (isAgentResponse(body)) {
        return toResult(body satisfies AgentResponse);
      }

      const detail =
        body && typeof body === "object" && "error" in body && typeof body.error === "string"
          ? body.error
          : `The server returned HTTP ${response.status}.`;
      return toResult(errorPayload(response.ok ? "The response format was invalid." : detail));
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "The request was cancelled."
          : "Check your connection and the demo server status.";
      return toResult(errorPayload(message));
    }
  },
};
