import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__top">
        <div>
          <span className="eyebrow">Greedy Adventures</span>
          <h2>Ready when you are.</h2>
          <p>
            This is a design and AI-concierge prototype. It does not take bookings, payments or personal data.
          </p>
        </div>
        <div className="site-footer__links">
          <a href="https://www.greedyadventures.com/experiences/sea-view-skydiving" target="_blank" rel="noopener noreferrer">
            Original experience ↗
          </a>
          <a href="https://www.greedyadventures.com/contact" target="_blank" rel="noopener noreferrer">
            Contact the crew ↗
          </a>
          <Link href="/knowledge">Knowledge view</Link>
        </div>
      </div>
      <div className="shell site-footer__bottom">
        <p>
          Website facts and package previews © Greedy Adventures, captured from public pages on 4 Nov 2026 for this assignment. Hero visual, brochure and film are AI/generated demo material.
        </p>
        <p>
          Open-source credits: Next.js · TypeScript · assistant-ui · react-markdown · remark-gfm · Zod · pdf-lib. See README for details.
        </p>
      </div>
    </footer>
  );
}
