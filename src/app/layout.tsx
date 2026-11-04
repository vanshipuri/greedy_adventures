import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ChatProvider } from "@/components/providers/ChatProvider";
import { SiteHeader } from "@/components/site/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sea View Skydiving | Greedy Adventures Concierge",
  description:
    "A premium Sea View Skydiving prototype with a grounded assistant-ui concierge, demo brochure and film delivery, and a read-only knowledge view.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChatProvider>
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <SiteHeader />
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
