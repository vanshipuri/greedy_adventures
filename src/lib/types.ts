export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type MediaKind = "pdf" | "video";
export type MediaIntent = "none" | "pdf" | "video" | "bundle";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  title: string;
  description: string;
  url: string;
  poster?: string;
  originLabel: "Demo material" | "From website";
  isDemo: boolean;
  formatLabel: string;
  tags: string[];
}

export interface SourceSection {
  id: string;
  title: string;
  text: string;
  keywords: string[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  url: string;
  capturedAt: string;
  note: string;
  sections: SourceSection[];
}

export interface RetrievedSection extends SourceSection {
  documentId: string;
  documentTitle: string;
  documentUrl: string;
  capturedAt: string;
  score: number;
  citationId: string;
}

export interface SourceRef {
  citationId: string;
  documentId: string;
  documentTitle: string;
  sectionTitle: string;
  url: string;
  capturedAt: string;
  score: number;
}

export interface MediaDecision {
  intent: MediaIntent;
  requested: MediaKind[];
  selected: MediaItem[];
  unavailable?: string;
  reason: string;
  subject: string;
}

export type AgentStatus = "ok" | "unavailable" | "error";
export type ModelMode = "mock" | "live" | "forced-error";

export interface RuntimeInfo {
  mode: ModelMode;
  label: string;
  modelName: string;
  externalModelConfigured: boolean;
  note: string;
}

export interface AgentTrace {
  retrievalQuery: string;
  retrievalHits: Array<{
    citationId: string;
    documentTitle: string;
    sectionTitle: string;
    score: number;
    text: string;
  }>;
  sourceText: string;
  modelCalled: boolean;
  modelMode: ModelMode;
  modelLabel: string;
  systemPrompt?: string;
  media: {
    intent: MediaIntent;
    requested: MediaKind[];
    selected: string[];
    unavailable?: string;
  };
  guard?: {
    rejectedModelOutput: boolean;
    reason?: string;
  };
  skipReason?: string;
  error?: string;
  elapsedMs: number;
}

export interface AgentResponse {
  answer: string;
  status: AgentStatus;
  sources: SourceRef[];
  media: MediaItem[];
  unavailable?: string;
  runtime: RuntimeInfo;
  trace: AgentTrace;
}

export interface KnowledgePayload {
  documents: KnowledgeDocument[];
  media: MediaItem[];
  runtime: RuntimeInfo;
  notes: string[];
}
