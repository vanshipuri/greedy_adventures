"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isSafeExternalHref } from "@/lib/media/registry";

interface SafeMarkdownProps {
  markdown: string;
  className?: string;
}

/**
 * Model text is rendered without raw HTML. Images/iframes are dropped and links
 * are restricted to the public website, WhatsApp, assistant-ui and same-origin
 * demo/knowledge paths.
 */
export function SafeMarkdown({ markdown, className = "" }: SafeMarkdownProps) {
  const cleaned = markdown.replace(/\[S\d+\]/gi, "").trim();
  return (
    <div className={`safe-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            const url = typeof href === "string" ? href : "";
            if (!isSafeExternalHref(url)) return <span>{children}</span>;
            const external = /^https?:\/\//.test(url);
            return (
              <a
                {...props}
                href={url}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
              >
                {children}
              </a>
            );
          },
          img() {
            return null;
          },
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
