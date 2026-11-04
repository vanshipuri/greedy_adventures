import {
  buildCapabilityAnswer,
  buildGroundedReply,
  buildUnavailableAnswer,
  isCapabilityQuestion,
  isUnsupportedFactRequest,
} from "@/lib/agent/deterministic";
import { buildSystemPrompt } from "@/lib/agent/prompt";
import { sanitizeModelText } from "@/lib/agent/sanitize";
import { buildRetrievalQuery, buildSourceText, retrieve } from "@/lib/knowledge/retrieval";
import { selectMedia } from "@/lib/media/selector";
import { createForcedErrorRunner } from "@/lib/model/mock";
import { ModelServiceError, type ModelRunner } from "@/lib/model/types";
import { createRuntimeRunner, describeRuntime } from "@/lib/model/runtime";
import type {
  AgentResponse,
  AgentTrace,
  ChatMessage,
  MediaDecision,
  RetrievedSection,
  RuntimeInfo,
  SourceRef,
} from "@/lib/types";

export interface AgentRequest {
  messages: ChatMessage[];
  signal?: AbortSignal;
  /** Used only by the knowledge inspector to exercise a real failure path. */
  simulateModelFailure?: boolean;
}

export interface AgentDependencies {
  runner?: ModelRunner;
  runtime?: RuntimeInfo;
}

function sourceRefs(hits: RetrievedSection[]): SourceRef[] {
  return hits.map((hit) => ({
    citationId: hit.citationId,
    documentId: hit.documentId,
    documentTitle: hit.documentTitle,
    sectionTitle: hit.title,
    url: hit.documentUrl,
    capturedAt: hit.capturedAt,
    score: hit.score,
  }));
}

function baseTrace(options: {
  retrievalQuery: string;
  hits: RetrievedSection[];
  sourceText: string;
  mediaDecision: MediaDecision;
  runtime: RuntimeInfo;
  runner: ModelRunner;
  startedAt: number;
  modelCalled: boolean;
  skipReason?: string;
}): AgentTrace {
  return {
    retrievalQuery: options.retrievalQuery,
    retrievalHits: options.hits.map((hit) => ({
      citationId: hit.citationId,
      documentTitle: hit.documentTitle,
      sectionTitle: hit.title,
      score: hit.score,
      text: hit.text,
    })),
    sourceText: options.sourceText,
    modelCalled: options.modelCalled,
    modelMode: options.runner.mode,
    modelLabel: options.runner.label,
    media: {
      intent: options.mediaDecision.intent,
      requested: options.mediaDecision.requested,
      selected: options.mediaDecision.selected.map((item) => item.id),
      unavailable: options.mediaDecision.unavailable,
    },
    elapsedMs: Date.now() - options.startedAt,
  };
}

function response(options: {
  answer: string;
  status: AgentResponse["status"];
  sources: SourceRef[];
  media: MediaDecision["selected"];
  unavailable?: string;
  runtime: RuntimeInfo;
  trace: AgentTrace;
}): AgentResponse {
  return {
    answer: options.answer,
    status: options.status,
    sources: options.sources,
    media: options.media,
    unavailable: options.unavailable,
    runtime: options.runtime,
    trace: options.trace,
  };
}

function safeErrorDetail(error: unknown) {
  if (error instanceof ModelServiceError) return error.safeDetail;
  if (error instanceof Error) {
    if (error.message.includes("FORCE_MODEL_FAILURE")) {
      return "FORCE_MODEL_FAILURE is enabled. The model call failed before an answer was produced.";
    }
    if (/Simulated model failure/i.test(error.message)) {
      return "Simulated model failure: the model call failed before an answer was produced.";
    }
  }
  return "The answer service is unavailable. No answer was generated; please try again.";
}

/**
 * The single real pipeline used by /api/chat and /api/knowledge/test.
 * Order: validate → media decision → contextual retrieval → grounded model →
 * deterministic output guard → safe response.
 */
export async function runAgent(
  request: AgentRequest,
  deps: AgentDependencies = {},
): Promise<AgentResponse> {
  const startedAt = Date.now();
  const envRuntime = deps.runtime ?? describeRuntime();
  const runner =
    deps.runner ??
    (request.simulateModelFailure
      ? createForcedErrorRunner("Simulated model failure from the knowledge inspector.")
      : createRuntimeRunner());
  const runtime: RuntimeInfo =
    runner.mode === envRuntime.mode
      ? envRuntime
      : { ...envRuntime, mode: runner.mode, label: runner.label };

  const messages = request.messages
    .filter((message) => message.content.trim().length > 0)
    .slice(-24)
    .map((message) => ({ role: message.role, content: message.content.trim().slice(0, 4000) }));
  const latestUser = [...messages].reverse().find((message) => message.role === "user");

  if (!latestUser) {
    const emptyDecision: MediaDecision = {
      intent: "none",
      requested: [],
      selected: [],
      reason: "No user question was supplied.",
      subject: "general",
    };
    return response({
      answer: "Please type a question so I can check the supplied pages.",
      status: "error",
      sources: [],
      media: [],
      runtime,
      trace: {
        ...baseTrace({
          retrievalQuery: "",
          hits: [],
          sourceText: "",
          mediaDecision: emptyDecision,
          runtime,
          runner,
          startedAt,
          modelCalled: false,
        }),
        skipReason: "Missing user message.",
        error: "No user message was supplied.",
        elapsedMs: Date.now() - startedAt,
      },
    });
  }

  const mediaDecision = selectMedia(messages);
  let retrievalQuery = buildRetrievalQuery(messages, mediaDecision.intent);
  let hits = retrieve(retrievalQuery);

  // Media-only questions still get a real, auditable source block.
  if (mediaDecision.selected.length > 0 && hits.length === 0) {
    retrievalQuery = `${retrievalQuery} Sea View Skydiving packages overview (fallback)`;
    hits = retrieve("Sea View Skydiving packages overview pricing inclusions", 3);
  }

  const makeSkipped = (answer: string, skipReason: string, unavailable?: string): AgentResponse =>
    response({
      answer,
      status: "unavailable",
      sources: [],
      media: mediaDecision.selected,
      unavailable,
      runtime,
      trace: {
        ...baseTrace({
          retrievalQuery,
          hits,
          sourceText: "",
          mediaDecision,
          runtime,
          runner,
          startedAt,
          modelCalled: false,
        }),
        skipReason,
        elapsedMs: Date.now() - startedAt,
      },
    });

  if (mediaDecision.unavailable) {
    return makeSkipped(
      buildUnavailableAnswer(mediaDecision),
      "Requested media was not in the allowlist; no substitute was selected.",
      mediaDecision.unavailable,
    );
  }

  if (isCapabilityQuestion(latestUser.content) && mediaDecision.intent === "none") {
    return response({
      answer: buildCapabilityAnswer(),
      status: "ok",
      sources: [],
      media: [],
      runtime,
      trace: {
        ...baseTrace({
          retrievalQuery,
          hits,
          sourceText: "",
          mediaDecision,
          runtime,
          runner,
          startedAt,
          modelCalled: false,
        }),
        skipReason: "Capability question answered without website facts.",
        elapsedMs: Date.now() - startedAt,
      },
    });
  }

  const previousUser =
    [...messages.slice(0, -1)].reverse().find((message) => message.role === "user")?.content ?? "";
  const contextualQuestion = `${latestUser.content} ${previousUser}`;
  if (isUnsupportedFactRequest(contextualQuestion) && mediaDecision.selected.length === 0) {
    return makeSkipped(
      buildUnavailableAnswer(),
      "Topic is outside the captured facts; model was skipped to avoid invention.",
      "That detail is not covered by the supplied website pages.",
    );
  }

  if (hits.length === 0 || hits[0].score < 1) {
    return makeSkipped(
      buildUnavailableAnswer(),
      "No sufficiently relevant source section was found; model was skipped.",
      "No matching source text was available for that question.",
    );
  }

  const sourceText = buildSourceText(hits);
  const systemPrompt = buildSystemPrompt({ sourceText, mediaDecision, runtime });
  const trace = {
    ...baseTrace({
      retrievalQuery,
      hits,
      sourceText,
      mediaDecision,
      runtime,
      runner,
      startedAt,
      modelCalled: true,
    }),
    systemPrompt,
  };

  try {
    const raw = await runner.generate({
      systemPrompt,
      messages,
      retrievalQuery,
      hits,
      mediaDecision,
      signal: request.signal,
    });
    const checked = sanitizeModelText(raw, sourceText);
    const answer = checked.rejected
      ? buildGroundedReply({ messages, retrievalQuery, hits, mediaDecision })
      : checked.text;

    return response({
      answer,
      status: "ok",
      sources: sourceRefs(hits),
      media: mediaDecision.selected,
      runtime,
      trace: {
        ...trace,
        guard: { rejectedModelOutput: checked.rejected, reason: checked.reason },
        elapsedMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    const detail = safeErrorDetail(error);
    return response({
      answer: `I couldn't generate an answer right now. ${detail} I won't guess or invent a reply.${
        mediaDecision.selected.length > 0
          ? " The requested demo file is still attached below because media selection runs independently."
          : " Please try again in a moment."
      }`,
      status: "error",
      sources: [],
      media: mediaDecision.selected,
      runtime,
      trace: {
        ...trace,
        error: detail,
        elapsedMs: Date.now() - startedAt,
      },
    });
  }
}
