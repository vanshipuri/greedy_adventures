import { runAgent } from "@/lib/agent/pipeline";
import { chatRequestSchema, zodErrorMessage } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body. Please send a chat request." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: `Invalid chat request: ${zodErrorMessage(parsed.error)}` },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await runAgent({
      messages: parsed.data.messages,
      signal: request.signal,
    });
    return Response.json(result, {
      status: result.status === "error" ? 502 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "The concierge backend is temporarily unavailable. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
