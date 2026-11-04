import { CAPTURE_NOTE } from "@/lib/knowledge/snapshot";
import { KNOWLEDGE_DOCUMENTS } from "@/lib/knowledge/snapshot";
import { MEDIA_ITEMS } from "@/lib/media/registry";
import { describeRuntime } from "@/lib/model/runtime";
import type { KnowledgePayload } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const payload: KnowledgePayload = {
    documents: KNOWLEDGE_DOCUMENTS,
    media: MEDIA_ITEMS,
    runtime: describeRuntime(),
    notes: [
      CAPTURE_NOTE,
      "This read-only view never reads chat transcripts, request logs, environment values or API keys.",
      "The test panel calls the same server pipeline as the chat and returns the exact source block and media decision from that run.",
    ],
  };

  return Response.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
