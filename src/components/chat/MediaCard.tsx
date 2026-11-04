"use client";

import { isSafeMediaUrl } from "@/lib/media/registry";
import type { MediaItem } from "@/lib/types";

interface MediaCardProps {
  item: MediaItem;
  compact?: boolean;
}

export function MediaCard({ item, compact = false }: MediaCardProps) {
  const safeUrl = isSafeMediaUrl(item.url);
  const safePoster = item.poster ? isSafeMediaUrl(item.poster) : false;

  return (
    <article className={`media-card ${compact ? "media-card--compact" : ""}`} aria-label={item.title}>
      <div className="media-card__topline">
        <span className={`media-kind media-kind--${item.kind}`}>{item.kind.toUpperCase()}</span>
        <span className="demo-badge">{item.originLabel}</span>
      </div>

      {item.kind === "video" && safeUrl ? (
        <div className="media-card__video">
          <video controls playsInline preload="metadata" poster={safePoster ? item.poster : undefined} aria-label={item.title}>
            <source src={item.url} type="video/mp4" />
            Your browser cannot play this video. Use the watch link below.
          </video>
        </div>
      ) : (
        <div
          className="media-card__preview"
          style={safePoster ? { backgroundImage: `url(${item.poster})` } : undefined}
          aria-hidden="true"
        >
          <span>{item.formatLabel}</span>
        </div>
      )}

      <h4>{item.title}</h4>
      <p>{item.description}</p>
      <p className="media-card__format">{item.formatLabel}</p>

      {!safeUrl ? (
        <p className="media-card__error" role="status">
          This media link was blocked because it is not in the demo allowlist.
        </p>
      ) : (
        <div className="media-actions">
          <a className="button button--small button--solid" href={item.url} target="_blank" rel="noopener noreferrer">
            {item.kind === "pdf" ? "Open PDF" : "Watch / open video"}
          </a>
          <a className="button button--small button--quiet" href={item.url} download>
            {item.kind === "pdf" ? "Download PDF" : "Download video"}
          </a>
        </div>
      )}
    </article>
  );
}
