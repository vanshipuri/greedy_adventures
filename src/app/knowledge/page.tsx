import type { Metadata } from "next";
import { KnowledgeDashboard } from "@/components/knowledge/KnowledgeDashboard";

export const metadata: Metadata = {
  title: "Knowledge view | Greedy Adventures Concierge",
  description:
    "Read-only backend view of the public website passages, demo media and live retrieval/model activity.",
};

export default function KnowledgePage() {
  return (
    <main id="main-content">
      <KnowledgeDashboard />
    </main>
  );
}
