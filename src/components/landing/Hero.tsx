"use client";

import { useChatDock } from "@/components/providers/chat-context";

const stats = [
  { value: "13,000 ft", label: "Exit altitude" },
  { value: "60 s", label: "Freefall" },
  { value: "5–7 min", label: "Under canopy" },
  { value: "≈3 h", label: "At the dropzone" },
];

export function Hero() {
  const { openChat } = useChatDock();

  return (
    <section id="experience" className="hero" aria-labelledby="hero-title">
      <div className="hero__grain" aria-hidden="true" />
      <div className="shell hero__grid">
        <div className="hero__copy">
          <div className="hero__eyebrow">
            <span className="hero__eyebrow-line" aria-hidden="true" />
            Pattaya Dropzone · Thailand
          </div>
          <h1 id="hero-title">
            The sea, from
            <em> 13,000 feet.</em>
          </h1>
          <p className="hero__lede">
            A tandem skydive over the Gulf of Thailand: one instructor, one coastline and around sixty seconds of freefall. Choose how much of the moment you want to keep.
          </p>
          <div className="hero__actions">
            <button
              type="button"
              className="button button--solid"
              onClick={() => openChat("What is included in the package?", { send: true })}
            >
              Ask about the package
              <span aria-hidden="true">→</span>
            </button>
            <a className="button button--ghost" href="#packages">
              Explore packages
            </a>
          </div>
          <div className="hero__note">
            <span className="status-dot" aria-hidden="true" />
            Public website facts captured 4 Nov 2026 · prototype experience, no real booking
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__image-frame">
            <img
              src="/media/sea-view-demo.jpg"
              alt="Aerial view of a tandem skydive above a turquoise coastline and the Gulf of Thailand"
              className="hero__image"
            />
            <div className="hero__image-overlay" aria-hidden="true" />
            <div className="hero__image-caption">
              <span>Sea View · Pattaya</span>
              <small>AI-generated demo visual for this prototype</small>
            </div>
          </div>
          <div className="hero__floating-card" aria-label="Experience highlight">
            <span>Same jump in every package</span>
            <strong>Only the media changes.</strong>
          </div>
        </div>
      </div>

      <div className="shell hero__stats" aria-label="Published jump facts">
        {stats.map((stat) => (
          <div className="hero-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
