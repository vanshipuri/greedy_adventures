"use client";

import { useChatDock } from "@/components/providers/chat-context";
import { faqs } from "@/lib/landing/packages";

export function Faq() {
  const { openChat } = useChatDock();

  return (
    <section id="faq" className="section faq-section" aria-labelledby="faq-title">
      <div className="shell faq-grid">
        <div className="faq-intro">
          <span className="eyebrow">Good to know</span>
          <h2 id="faq-title">Questions, answered from the page.</h2>
          <p>
            These answers come from the captured Pattaya Dropzone and contact FAQs. For anything not published, the concierge will say so rather than guess.
          </p>
          <button
            type="button"
            className="button button--outline"
            onClick={() => openChat("What should I wear?", { send: true })}
          >
            Ask your own question
          </button>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details key={faq.question} className="faq-item" open={index === 0}>
              <summary>
                <span>{faq.question}</span>
                <span aria-hidden="true">+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
