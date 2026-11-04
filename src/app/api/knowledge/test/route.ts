import { runAgent } from "@/lib/agent/pipeline";
import { knowledgeTestSchema, zodErrorMessage } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body. Please send a test question." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = knowledgeTestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: `Invalid test request: ${zodErrorMessage(parsed.error)}` },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // A single, isolated question: private chat conversations never enter this view.
  const result = await runAgent({
    messages: [{ role: "user", content: parsed.data.question }],
    simulateModelFailure: parsed.data.simulateModelFailure,
    signal: request.signal,
  });

  return Response.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
