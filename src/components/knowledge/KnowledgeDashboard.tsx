"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { MediaCard } from "@/components/chat/MediaCard";
import { SafeMarkdown } from "@/components/chat/SafeMarkdown";
import { isSafeExternalHref } from "@/lib/media/registry";
import type { AgentResponse, KnowledgePayload } from "@/lib/types";

const sampleQuestions = [
  "What is included in the package?",
  "Can you send me a brochure?",
  "Can I see a video of the experience?",
  "Send me the brochure and a video.",
  "What is the VIP refund policy?",
  "Send me the paragliding brochure",
];

function statusLabel(status: AgentResponse["status"]) {
  if (status === "ok") return "Answer generated";
  if (status === "error") return "Model / backend error";
  return "Information unavailable";
}

export function KnowledgeDashboard() {
  const [knowledge, setKnowledge] = useState<KnowledgePayload | null>(null);
  const [knowledgeError, setKnowledgeError] = useState("");
  const [question, setQuestion] = useState("What is included in the package?");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [running, setRunning] = useState(false);
  const [testError, setTestError] = useState("");
  const [result, setResult] = useState<AgentResponse | null>(null);

  const loadKnowledge = useCallback(async () => {
    setKnowledgeError("");
    try {
      const response = await fetch("/api/knowledge", { cache: "no-store" });
      if (!response.ok) throw new Error(`Backend returned HTTP ${response.status}`);
      setKnowledge((await response.json()) as KnowledgePayload);
    } catch (error) {
      setKnowledgeError(error instanceof Error ? error.message : "Could not load knowledge.");
    }
  }, []);

  useEffect(() => {
    void loadKnowledge();
  }, [loadKnowledge]);

  const runTest = useCallback(
    async (override?: string) => {
      const testQuestion = (override ?? question).trim();
      if (!testQuestion) {
        setTestError("Enter a test question first.");
        return;
      }
      setQuestion(testQuestion);
      setRunning(true);
      setTestError("");
      setResult(null);
      try {
        const response = await fetch("/api/knowledge/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: testQuestion, simulateModelFailure: simulateFailure }),
          cache: "no-store",
        });
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : `Backend returned HTTP ${response.status}`;
          throw new Error(message);
        }
        if (!payload || typeof payload !== "object" || !("trace" in payload)) {
          throw new Error("Backend returned an unexpected response.");
        }
        setResult(payload as AgentResponse);
      } catch (error) {
        setTestError(error instanceof Error ? error.message : "The test request failed.");
      } finally {
        setRunning(false);
      }
    },
    [question, simulateFailure],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runTest();
  };

  const selectedMedia = useMemo(() => {
    if (!result || !knowledge) return [];
    return knowledge.media.filter((item) => result.trace.media.selected.includes(item.id));
  }, [result, knowledge]);

  return (
    <div className="knowledge-page">
      <div className="shell knowledge-shell">
        <header className="knowledge-hero">
          <div>
            <span className="eyebrow">Read-only knowledge view</span>
            <h1>What the concierge actually knows.</h1>
            <p>
              This page reads the same server-side snapshot and media allowlist as the chat. It never reads private conversations, API keys or request logs.
            </p>
          </div>
          <div className="knowledge-hero__aside">
            <Link href="/" className="button button--outline button--small">
              ← Back to experience
            </Link>
            {knowledge && (
              <div className={`mode-badge mode-badge--${knowledge.runtime.mode}`} title={knowledge.runtime.note}>
                {knowledge.runtime.label}
              </div>
            )}
          </div>
        </header>

        {knowledgeError && (
          <div className="knowledge-alert" role="alert">
            <strong>Could not load the backend knowledge.</strong>
            <span>{knowledgeError}</span>
            <button type="button" className="button button--small button--quiet" onClick={() => void loadKnowledge()}>
              Retry
            </button>
          </div>
        )}

        {!knowledge && !knowledgeError && (
          <div className="knowledge-loading" role="status" aria-live="polite">
            Loading public sources and media registry…
          </div>
        )}

        {knowledge && (
          <>
            <div className="knowledge-summary">
              <div>
                <strong>{knowledge.documents.length}</strong>
                <span>website pages</span>
              </div>
              <div>
                <strong>{knowledge.documents.reduce((total, doc) => total + doc.sections.length, 0)}</strong>
                <span>passages</span>
              </div>
              <div>
                <strong>{knowledge.media.filter((item) => item.kind === "pdf").length}</strong>
                <span>PDFs</span>
              </div>
              <div>
                <strong>{knowledge.media.filter((item) => item.kind === "video").length}</strong>
                <span>videos</span>
              </div>
            </div>

            <section className="knowledge-section" aria-labelledby="sources-title">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">01 · Website sources</span>
                  <h2 id="sources-title">Captured pages and usable text</h2>
                </div>
                <p>Each passage below is eligible for retrieval. Captured manually on 4 Nov 2026; no crawler.</p>
              </div>
              <div className="source-documents">
                {knowledge.documents.map((document) => (
                  <article key={document.id} className="source-document">
                    <header className="source-document__header">
                      <div>
                        <h3>{document.title}</h3>
                        <p>{document.note}</p>
                      </div>
                      <div className="source-document__meta">
                        <span>Captured {document.capturedAt}</span>
                        {isSafeExternalHref(document.url) ? (
                          <a href={document.url} target="_blank" rel="noopener noreferrer">
                            {document.url} ↗
                          </a>
                        ) : (
                          <span>{document.url}</span>
                        )}
                      </div>
                    </header>
                    <div className="source-passages">
                      {document.sections.map((section) => (
                        <details key={`${document.id}-${section.id}`} className="source-passage">
                          <summary>
                            <span>{section.title}</span>
                            <code>{section.id}</code>
                          </summary>
                          <pre>{section.text}</pre>
                        </details>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="knowledge-section" aria-labelledby="media-title">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">02 · Media library</span>
                  <h2 id="media-title">Available PDFs and videos</h2>
                </div>
                <p>Only these allowlisted demo files can be attached by the chat.</p>
              </div>
              <div className="knowledge-media-grid">
                {knowledge.media.map((item) => (
                  <MediaCard key={item.id} item={item} compact />
                ))}
              </div>
            </section>

            <section className="knowledge-section inspector-section" aria-labelledby="inspector-title">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">03 · Live pipeline inspector</span>
                  <h2 id="inspector-title">Test a question against the real backend</h2>
                </div>
                <p>
                  One isolated question calls <code>/api/knowledge/test</code>. The source block and media selection below come from that exact run, not dashboard sample data.
                </p>
              </div>

              <form className="inspector-form" onSubmit={onSubmit}>
                <label htmlFor="knowledge-question">Test question</label>
                <div className="inspector-form__row">
                  <input
                    id="knowledge-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    maxLength={500}
                    placeholder="Ask about packages, brochures, videos or missing information"
                  />
                  <button className="button button--solid" type="submit" disabled={running}>
                    {running ? "Running…" : "Run test"}
                  </button>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(event) => setSimulateFailure(event.target.checked)}
                  />
                  Simulate a model failure (runs the real backend error path)
                </label>
                <div className="sample-questions">
                  {sampleQuestions.map((sample) => (
                    <button key={sample} type="button" onClick={() => void runTest(sample)} disabled={running}>
                      {sample}
                    </button>
                  ))}
                </div>
              </form>

              <div aria-live="polite" className="inspector-status">
                {running && <span className="inspector-loading">Running validation → retrieval → media selection → model…</span>}
                {testError && <span className="inspector-error" role="alert">Backend error: {testError}</span>}
              </div>

              {result && (
                <div className="inspector-results">
                  <div className="inspector-cards">
                    <div>
                      <span>Status</span>
                      <strong className={`status-pill status-pill--${result.status}`}>{statusLabel(result.status)}</strong>
                    </div>
                    <div>
                      <span>Model called</span>
                      <strong>{result.trace.modelCalled ? "Yes" : "No"}</strong>
                    </div>
                    <div>
                      <span>Answer engine</span>
                      <strong>{result.trace.modelLabel}</strong>
                    </div>
                    <div>
                      <span>Media intent</span>
                      <strong>{result.trace.media.intent}</strong>
                    </div>
                    <div>
                      <span>Elapsed</span>
                      <strong>{result.trace.elapsedMs} ms</strong>
                    </div>
                  </div>

                  <div className="inspector-block">
                    <h3>Backend answer</h3>
                    <SafeMarkdown markdown={result.answer} />
                  </div>

                  {result.trace.error && (
                    <div className="knowledge-alert" role="alert">
                      <strong>Model / backend error</strong>
                      <span>{result.trace.error}</span>
                    </div>
                  )}
                  {result.trace.skipReason && (
                    <div className="inspector-note">
                      <strong>Model skipped:</strong> {result.trace.skipReason}
                    </div>
                  )}
                  {result.trace.guard?.rejectedModelOutput && (
                    <div className="inspector-note inspector-note--warning">
                      <strong>Grounded fallback used:</strong> {result.trace.guard.reason}
                    </div>
                  )}

                  <div className="inspector-two-col">
                    <div className="inspector-block">
                      <h3>Retrieval query</h3>
                      <code className="inspector-code">{result.trace.retrievalQuery || "—"}</code>
                      <h3>Retrieved passages</h3>
                      {result.trace.retrievalHits.length === 0 ? (
                        <p className="muted">No passage matched.</p>
                      ) : (
                        <ol className="retrieval-list">
                          {result.trace.retrievalHits.map((hit) => (
                            <li key={hit.citationId}>
                              <strong>
                                {hit.citationId} · {hit.sectionTitle} <span>({hit.score})</span>
                              </strong>
                              <small>{hit.documentTitle}</small>
                              <p>{hit.text}</p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>

                    <div className="inspector-block">
                      <h3>Media selected by this run</h3>
                      {selectedMedia.length === 0 ? (
                        <p className="muted">
                          No PDF or video selected. {result.trace.media.unavailable ?? "This was a text-only answer or an unavailable-file fallback."}
                        </p>
                      ) : (
                        <ul className="selected-media-list">
                          {selectedMedia.map((item) => (
                            <li key={item.id}>
                              <span className={`media-kind media-kind--${item.kind}`}>{item.kind.toUpperCase()}</span>
                              <div>
                                <strong>{item.title}</strong>
                                <small>{item.url} · {item.originLabel}</small>
                              </div>
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                Open ↗
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      <h3>Exact source text passed to the model</h3>
                      <pre className="inspector-source">
                        {result.trace.sourceText || "No source text was passed to a model for this run."}
                      </pre>
                    </div>
                  </div>

                  <details className="raw-trace">
                    <summary>Raw backend trace (JSON)</summary>
                    <pre>{JSON.stringify(result.trace, null, 2)}</pre>
                  </details>
                </div>
              )}
            </section>

            <section className="knowledge-section knowledge-notes" aria-label="Knowledge view notes">
              <h2>Safety & scope</h2>
              <ul>
                {knowledge.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
                <li>No editing, uploads, authentication or admin tools are provided.</li>
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
