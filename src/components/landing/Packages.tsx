"use client";

import { useChatDock } from "@/components/providers/chat-context";
import { packages, type PackageDisplay } from "@/lib/landing/packages";

function PackageImage({ item }: { item: PackageDisplay }) {
  return (
    <img
      src={item.image}
      alt={`${item.name} package preview from the Greedy Adventures website`}
      loading="lazy"
      onError={(event) => {
        const image = event.currentTarget;
        if (!image.dataset.fallback) {
          image.dataset.fallback = "true";
          image.src = "/media/sea-view-demo.jpg";
        }
      }}
    />
  );
}

export function Packages() {
  const { openChat } = useChatDock();

  return (
    <section id="packages" className="section packages-section" aria-labelledby="packages-title">
      <div className="shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Choose your package</span>
            <h2 id="packages-title">One jump. Three ways to remember it.</h2>
          </div>
          <p>
            Every package shares the same aircraft, altitude and instructors. The published difference is media coverage — not the skydive itself.
          </p>
        </div>

        <div className="package-grid">
          {packages.map((item) => (
            <article key={item.name} className={`package-card ${item.featured ? "package-card--featured" : ""}`}>
              <div className="package-card__image">
                <PackageImage item={item} />
                {item.featured && <span className="package-card__ribbon">Most chosen</span>}
              </div>
              <div className="package-card__body">
                <div className="package-card__topline">
                  <span>{item.kicker}</span>
                  <strong>{item.name}</strong>
                </div>
                <h3>{item.description}</h3>
                <div className="package-card__price">
                  <strong>{item.price}</strong>
                  <span>{item.priceNote}</span>
                </div>
                <p className="package-card__media-note">{item.mediaNote}</p>
                <ul className="feature-list">
                  {item.features.map((feature) => (
                    <li key={feature}>
                      <span aria-hidden="true">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="package-card__actions">
                  <button
                    type="button"
                    className="button button--small button--solid"
                    onClick={() =>
                      openChat(`What is included in the ${item.name} package?`, { send: true })
                    }
                  >
                    Ask AI about {item.name}
                  </button>
                  <a
                    className="button button--small button--quiet"
                    href="https://www.greedyadventures.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Enquire with crew ↗
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="packages-footnote">
          Prices and wording from the public Sea View Skydiving page, captured 4 Nov 2026. “Most chosen” is a visual label for this redesign, not a booking claim.
        </p>
      </div>
    </section>
  );
}
