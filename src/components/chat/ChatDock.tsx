"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatThread } from "@/components/chat/ChatThread";
import { useChatDock } from "@/components/providers/chat-context";
import type { KnowledgePayload, RuntimeInfo } from "@/lib/types";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function modeLabel(runtime?: RuntimeInfo) {
  if (!runtime) return "Checking mode";
  if (runtime.mode === "mock") return "Mock mode";
  if (runtime.mode === "forced-error") return "Failure simulation";
  return "Live model";
}

export function ChatDock() {
  const { open, openChat, closeChat, resetConversation } = useChatDock();
  const [runtime, setRuntime] = useState<RuntimeInfo | undefined>();
  const [resetNotice, setResetNotice] = useState("");
  const [resetting, setResetting] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/knowledge", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("status"))))
      .then((payload: KnowledgePayload) => {
        if (!cancelled) setRuntime(payload.runtime);
      })
      .catch(() => {
        if (!cancelled) setRuntime(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const target =
        panelRef.current?.querySelector<HTMLElement>("[data-chat-composer]") ??
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 20);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeChat();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const elements = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.getClientRects().length > 0 && !element.hasAttribute("aria-hidden"),
      );
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      (previousFocus ?? launcherRef.current)?.focus();
    };
  }, [open, closeChat]);

  const handleReset = useCallback(async () => {
    setResetting(true);
    setResetNotice("");
    try {
      await resetConversation();
      setResetNotice("New chat started. Conversation memory cleared.");
    } catch {
      setResetNotice("Could not reset the chat. Please try again.");
    } finally {
      setResetting(false);
      window.setTimeout(() => setResetNotice(""), 4000);
    }
  }, [resetConversation]);

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className="chat-launcher"
        onClick={() => openChat()}
        aria-label="Open Sea View AI concierge chat"
        aria-expanded={open}
        aria-controls="concierge-panel"
        tabIndex={open ? -1 : 0}
      >
        <span className="chat-launcher__icon" aria-hidden="true">
          ✦
        </span>
        <span className="chat-launcher__text">
          <strong>Ask the concierge</strong>
          <small>Packages, sources &amp; demo files</small>
        </span>
      </button>

      <div className="chat-layer" hidden={!open} data-open={open}>
        <div className="chat-backdrop" onClick={closeChat} aria-hidden="true" />
        <section
          id="concierge-panel"
          ref={panelRef}
          className="chat-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="concierge-title"
          aria-describedby="concierge-description"
        >
          <header className="chat-header">
            <div className="chat-header__identity">
              <span className="chat-header__mark" aria-hidden="true">GA</span>
              <div>
                <h2 id="concierge-title">Sea View concierge</h2>
                <p id="concierge-description">
                  Grounded in captured public pages ·{" "}
                  <span className={`mode-badge mode-badge--${runtime?.mode ?? "unknown"}`} title={runtime?.note}>
                    {modeLabel(runtime)}
                  </span>
                </p>
              </div>
            </div>
            <div className="chat-header__actions">
              <button
                type="button"
                className="icon-button"
                onClick={handleReset}
                disabled={resetting}
                aria-label="Start a new chat and clear this conversation"
                title="New chat"
              >
                <span aria-hidden="true">↻</span>
              </button>
              <Link href="/knowledge" className="icon-button icon-button--text" onClick={closeChat}>
                Knowledge
              </Link>
              <button type="button" className="icon-button" onClick={closeChat} aria-label="Close chat" title="Close chat">
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </header>
          <div className="sr-only" role="status" aria-live="polite">
            {resetNotice}
          </div>
          <ChatThread />
          <footer className="chat-footer">
            <span>Prototype only · no booking or payment</span>
            <Link href="/knowledge" onClick={closeChat}>
              View backend sources ↗
            </Link>
          </footer>
        </section>
      </div>
    </>
  );
}
