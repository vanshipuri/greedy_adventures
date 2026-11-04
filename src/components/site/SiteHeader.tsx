"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatDock } from "@/components/providers/chat-context";

export function SiteHeader() {
  const pathname = usePathname();
  const { openChat } = useChatDock();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand" aria-label="Greedy Adventures home">
          <span className="brand__mark" aria-hidden="true">GA</span>
          <span className="brand__words">
            <strong>GREEDY</strong>
            <small>ADVENTURES</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/#experience">Experience</Link>
          <Link href="/#packages">Packages</Link>
          <Link href="/#plan">The plan</Link>
          <Link href="/knowledge" aria-current={pathname === "/knowledge" ? "page" : undefined}>
            Knowledge view
          </Link>
        </nav>

        <button
          type="button"
          className="button button--outline header-cta"
          onClick={() => openChat("What is included in the package?")}
        >
          Ask concierge
        </button>
      </div>
    </header>
  );
}
