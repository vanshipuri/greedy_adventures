"use client";

import type { DataMessagePartComponent } from "@assistant-ui/react";
import { MediaCard } from "@/components/chat/MediaCard";
import type { ConciergePayload } from "@/lib/chat/payload";
import { isSafeExternalHref } from "@/lib/media/registry";
import type { MediaItem, SourceRef } from "@/lib/types";

export const ConciergeExtras: DataMessagePartComponent<ConciergePayload> = ({ data }) => {
  if (!data) return null;
  const sources: SourceRef[] = data.sources ?? [];
  const media: MediaItem[] = data.media ?? [];
  const runtime = data.runtime;
  const trace = data.trace;
  const isError = data.status === "error";
  const isUnavailable = data.status === "unavailable";

  return (
    <div className="concierge-extras">
      <div className="reply-meta" aria-label="Response status">
        {runtime?.mode === "mock" && <span className="reply-chip reply-chip--mock">Mock mode</span>}
        {runtime?.mode === "live" && <span className="reply-chip">Live model</span>}
        {runtime?.mode === "forced-error" && <span className="reply-chip reply-chip--error">Failure simulation</span>}
        {trace?.guard?.rejectedModelOutput && (
          <span className="reply-chip reply-chip--fallback" title={trace.guard.reason}>
            Grounded fallback used
          </span>
        )}
        {sources.length > 0 && (
          <span className="reply-chip reply-chip--quiet">{sources.length} source section{sources.length === 1 ? "" : "s"}</span>
        )}
      </div>

      {isError && (
        <div className="chat-alert chat-alert--error" role="alert">
          <strong>Answer service unavailable.</strong>
          <span>{trace?.error ?? data.error ?? "No answer was generated. Please try again."}</span>
        </div>
      )}

      {isUnavailable && (
        <div className="chat-alert" role="status">
          <strong>Not in the supplied information.</strong>
          <span>{data.unavailable ?? "No matching source text or file was available."}</span>
        </div>
      )}

      {media.length > 0 && (
        <div className="chat-media-list" aria-label="Shared files">
          {media.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="source-chips" aria-label="Sources used for this answer">
          <span className="source-chips__label">Sources</span>
          <div className="source-chips__list">
            {sources.map((source) => {
              const safe = isSafeExternalHref(source.url);
              const label = `${source.citationId} · ${source.documentTitle} — ${source.sectionTitle}`;
              return safe ? (
                <a
                  key={`${source.documentId}-${source.citationId}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Captured ${source.capturedAt} · retrieval score ${source.score}`}
                >
                  {label}
                  <span aria-hidden="true"> ↗</span>
                </a>
              ) : (
                <span key={`${source.documentId}-${source.citationId}`}>{label}</span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
