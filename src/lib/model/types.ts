import type {
  ChatMessage,
  MediaDecision,
  ModelMode,
  RetrievedSection,
} from "@/lib/types";

export interface ModelRequest {
  systemPrompt: string;
  messages: ChatMessage[];
  retrievalQuery: string;
  hits: RetrievedSection[];
  mediaDecision: MediaDecision;
  signal?: AbortSignal;
}

export interface ModelRunner {
  mode: ModelMode;
  label: string;
  modelName: string;
  generate(request: ModelRequest): Promise<string>;
}

export class ModelServiceError extends Error {
  constructor(message: string, readonly safeDetail = message) {
    super(message);
    this.name = "ModelServiceError";
  }
}
