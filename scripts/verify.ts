import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent } from "../src/lib/agent/pipeline";
import { sanitizeModelText } from "../src/lib/agent/sanitize";
import { selectMedia } from "../src/lib/media/selector";
import { isSafeExternalHref, isSafeMediaUrl, MEDIA_ITEMS } from "../src/lib/media/registry";
import { createForcedErrorRunner, createMockRunner } from "../src/lib/model/mock";
import { describeRuntime } from "../src/lib/model/runtime";
import type { ModelRunner } from "../src/lib/model/types";
import { chatRequestSchema, knowledgeTestSchema } from "../src/lib/validation/schemas";
import type { ChatMessage } from "../src/lib/types";

// Keep verification free, deterministic and offline.
process.env.MOCK_MODE = "1";
process.env.FORCE_MODEL_FAILURE = "0";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const mockRunner = createMockRunner();
const failingRunner = createForcedErrorRunner("Verification: forced model outage.");
const ungroundedRunner: ModelRunner = {
  mode: "live",
  label: "Verification — ungrounded number generator",
  modelName: "fake-live-model",
  async generate() {
    return "You fall at 120 mph and the jump costs 99,999 THB.";
  },
};

const user = (content: string): ChatMessage => ({ role: "user", content });
const assistant = (content: string): ChatMessage => ({ role: "assistant", content });
const deps = { runner: mockRunner };

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

async function check(name: string, run: () => void | Promise<void>) {
  try {
    await run();
    console.log(`✓ ${name}`);
    return { name, ok: true, detail: "" } satisfies CheckResult;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${name}\n  ${detail}`);
    return { name, ok: false, detail } satisfies CheckResult;
  }
}

async function main() {
  const results: CheckResult[] = [];
  const add = (result: CheckResult) => results.push(result);

  add(
    await check("Runtime is labelled mock mode without an external key", () => {
      assert.equal(describeRuntime().mode, "mock");
      assert.match(describeRuntime().label, /Mock mode/i);
    }),
  );

  add(
    await check("Generated demo assets exist and have valid signatures", () => {
      const pdf = fs.readFileSync(path.join(root, "public/media/sea-view-brochure-demo.pdf"));
      const video = fs.readFileSync(path.join(root, "public/media/sea-view-film-demo.mp4"));
      const image = fs.readFileSync(path.join(root, "public/media/sea-view-demo.jpg"));
      assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
      assert.equal(video.subarray(4, 8).toString(), "ftyp");
      assert.equal(image[0], 0xff);
      assert.equal(image[1], 0xd8);
      assert.equal(MEDIA_ITEMS.filter((item) => item.kind === "pdf").length, 1);
      assert.equal(MEDIA_ITEMS.filter((item) => item.kind === "video").length, 1);
      assert.ok(MEDIA_ITEMS.every((item) => item.isDemo && item.originLabel === "Demo material"));
    }),
  );

  add(
    await check("Media URLs and markdown links are allowlisted", () => {
      assert.ok(isSafeMediaUrl("/media/sea-view-brochure-demo.pdf"));
      assert.ok(isSafeMediaUrl("/media/sea-view-film-demo.mp4"));
      assert.equal(isSafeMediaUrl("/media/../../etc/passwd"), false);
      assert.equal(isSafeMediaUrl("https://evil.example/file.pdf"), false);
      assert.equal(isSafeExternalHref("javascript:alert(1)"), false);
      assert.equal(isSafeExternalHref("https://evil.example"), false);
      assert.ok(isSafeExternalHref("https://www.greedyadventures.com/experiences/sea-view-skydiving"));
      assert.ok(isSafeExternalHref("https://wa.me/919535768554"));
      assert.ok(isSafeExternalHref("/knowledge"));
    }),
  );

  add(
    await check("Request schemas reject malformed and oversized input", () => {
      assert.equal(chatRequestSchema.safeParse({ messages: [] }).success, false);
      assert.equal(
        chatRequestSchema.safeParse({ messages: [{ role: "assistant", content: "not a question" }] }).success,
        false,
      );
      assert.equal(
        chatRequestSchema.safeParse({ messages: [{ role: "user", content: "x".repeat(4001) }] }).success,
        false,
      );
      assert.ok(chatRequestSchema.safeParse({ messages: [{ role: "user", content: "Hello" }] }).success);
      assert.equal(knowledgeTestSchema.safeParse({ question: "" }).success, false);
      assert.ok(knowledgeTestSchema.safeParse({ question: "What is included?" }).success);
    }),
  );

  add(
    await check("Intent rules select the exact format for the four brief prompts", () => {
      assert.equal(selectMedia([user("What is included in the package?")]).intent, "none");
      assert.deepEqual(selectMedia([user("Can you send me a brochure?")]).requested, ["pdf"]);
      assert.deepEqual(selectMedia([user("Can I see a video of the experience?")]).requested, ["video"]);
      const bundle = selectMedia([user("Send me the brochure and a video.")]);
      assert.equal(bundle.intent, "bundle");
      assert.deepEqual(bundle.requested, ["pdf", "video"]);
      assert.deepEqual(
        bundle.selected.map((item) => item.kind),
        ["pdf", "video"],
      );
    }),
  );

  add(
    await check("Follow-up expands to both formats using conversation memory", () => {
      const decision = selectMedia([
        user("Can you send me a brochure?"),
        assistant("Here is the brochure."),
        user("And a video too, please?"),
      ]);
      assert.equal(decision.intent, "bundle");
      assert.deepEqual(decision.requested, ["pdf", "video"]);
      assert.match(decision.reason, /Conversation history/);
    }),
  );

  add(
    await check("Unavailable media requests never receive a substitute file", () => {
      for (const question of [
        "Send me the paragliding brochure",
        "Can I see an ECO-specific video?",
        "Do you have a VIP video file?",
      ]) {
        const decision = selectMedia([user(question)]);
        assert.equal(decision.selected.length, 0, question);
        assert.ok(decision.unavailable, question);
      }
    }),
  );

  add(
    await check("Text answer uses the real source block and no media", async () => {
      const result = await runAgent({ messages: [user("What is included in the package?")] }, deps);
      assert.equal(result.status, "ok");
      assert.equal(result.media.length, 0);
      assert.ok(result.sources.length > 0);
      assert.match(result.answer, /Safety briefing and tandem instructor support/);
      assert.match(result.answer, /Certificate of completion/);
      assert.match(result.trace.sourceText, /Tandem skydive experience in Pattaya, Thailand/);
      assert.match(result.trace.sourceText, /Source URL: https:\/\/www.greedyadventures.com\/experiences\/sea-view-skydiving/);
      assert.equal(result.trace.modelCalled, true);
      assert.equal(result.trace.media.intent, "none");
    }),
  );

  add(
    await check("Conversation memory resolves a VIP price follow-up", async () => {
      const first = await runAgent({ messages: [user("Tell me about VIP")] }, deps);
      const second = await runAgent(
        {
          messages: [user("Tell me about VIP"), assistant(first.answer), user("What does it cost?")],
        },
        deps,
      );
      assert.equal(second.status, "ok");
      assert.match(second.answer, /VIP/);
      assert.match(second.answer, /14,000/);
      assert.match(second.trace.retrievalQuery, /VIP/i);
    }),
  );

  add(
    await check("PDF, video and combined requests return the exact backend media", async () => {
      const pdf = await runAgent({ messages: [user("Can you send me a brochure?")] }, deps);
      const video = await runAgent({ messages: [user("Can I see a video of the experience?")] }, deps);
      const both = await runAgent({ messages: [user("Send me the brochure and a video.")] }, deps);
      assert.deepEqual(pdf.media.map((item) => item.kind), ["pdf"]);
      assert.deepEqual(video.media.map((item) => item.kind), ["video"]);
      assert.deepEqual(both.media.map((item) => item.kind), ["pdf", "video"]);
      assert.equal(pdf.trace.media.intent, "pdf");
      assert.equal(video.trace.media.intent, "video");
      assert.equal(both.trace.media.intent, "bundle");
      assert.ok(both.trace.sourceText.length > 200);
    }),
  );

  add(
    await check("Missing information skips the model instead of inventing an answer", async () => {
      const result = await runAgent({ messages: [user("What is the VIP refund policy?")] }, deps);
      assert.equal(result.status, "unavailable");
      assert.equal(result.sources.length, 0);
      assert.equal(result.media.length, 0);
      assert.equal(result.trace.modelCalled, false);
      assert.equal(result.trace.sourceText, "");
      assert.match(result.answer, /can't find that detail/i);
      assert.match(result.trace.skipReason ?? "", /outside the captured facts/i);
    }),
  );

  add(
    await check("Missing requested file says so and selects no substitute", async () => {
      const result = await runAgent({ messages: [user("Send me the paragliding brochure")] }, deps);
      assert.equal(result.status, "unavailable");
      assert.equal(result.media.length, 0);
      assert.equal(result.trace.modelCalled, false);
      assert.ok(result.trace.media.unavailable);
      assert.match(result.answer, /don't have a brochure/i);
      assert.match(result.answer, /won't substitute/i);
    }),
  );

  add(
    await check("Model failure produces a clear error and still delivers selected media", async () => {
      const textFailure = await runAgent(
        { messages: [user("What is included in the package?")] },
        { runner: failingRunner },
      );
      assert.equal(textFailure.status, "error");
      assert.equal(textFailure.media.length, 0);
      assert.match(textFailure.answer, /couldn't generate an answer/i);
      assert.match(textFailure.answer, /won't guess/i);
      assert.ok(textFailure.trace.error);

      const mediaFailure = await runAgent(
        { messages: [user("Can you send me a brochure?")] },
        { runner: failingRunner },
      );
      assert.equal(mediaFailure.status, "error");
      assert.deepEqual(mediaFailure.media.map((item) => item.kind), ["pdf"]);
      assert.match(mediaFailure.answer, /still attached below/i);
      assert.equal(mediaFailure.trace.media.selected.length, 1);
    }),
  );

  add(
    await check("Ungrounded model numbers trigger deterministic grounded fallback", async () => {
      const raw = "You fall at 120 mph and the jump costs 99,999 THB.";
      const sourceText = "Exit altitude: 13,000 ft. 60 seconds of freefall. ECO ฿9,500 per person.";
      const checked = sanitizeModelText(raw, sourceText);
      assert.equal(checked.rejected, true);
      assert.match(checked.reason ?? "", /120/);

      const result = await runAgent(
        { messages: [user("What is included in the package?")] },
        { runner: ungroundedRunner },
      );
      assert.equal(result.status, "ok");
      assert.equal(result.trace.guard?.rejectedModelOutput, true);
      assert.doesNotMatch(result.answer, /120|99,999/);
      assert.match(result.answer, /Certificate of completion/);
    }),
  );

  add(
    await check("Knowledge inspector failure simulation is a real backend error path", async () => {
      const result = await runAgent({
        messages: [user("What is included in the package?")],
        simulateModelFailure: true,
      });
      assert.equal(result.status, "error");
      assert.equal(result.trace.modelMode, "forced-error");
      assert.match(result.trace.error ?? "", /Simulated model failure/i);
      assert.equal(result.runtime.mode, "forced-error");
    }),
  );

  if (process.env.API_BASE_URL) {
    add(
      await check("Running server endpoints respond to knowledge and chat smoke checks", async () => {
        const base = process.env.API_BASE_URL!.replace(/\/$/, "");
        const knowledgeResponse = await fetch(`${base}/api/knowledge`, { cache: "no-store" });
        assert.equal(knowledgeResponse.status, 200);
        const knowledge = (await knowledgeResponse.json()) as { documents?: unknown[]; media?: unknown[]; runtime?: unknown };
        assert.ok(Array.isArray(knowledge.documents) && knowledge.documents.length > 0);
        assert.ok(Array.isArray(knowledge.media) && knowledge.media.length > 0);
        assert.ok(knowledge.runtime);

        const chatResponse = await fetch(`${base}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: "Can you send me a brochure?" }] }),
        });
        assert.equal(chatResponse.status, 200);
        const chat = (await chatResponse.json()) as { media?: Array<{ kind: string }>; trace?: { sourceText?: string } };
        assert.equal(chat.media?.[0]?.kind, "pdf");
        assert.ok((chat.trace?.sourceText ?? "").length > 100);

        const testResponse = await fetch(`${base}/api/knowledge/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: "Send me the brochure and a video.", simulateModelFailure: false }),
        });
        assert.equal(testResponse.status, 200);
        const trace = (await testResponse.json()) as { trace?: { media?: { selected?: string[] }; sourceText?: string } };
        assert.equal(trace.trace?.media?.selected?.length, 2);
        assert.ok((trace.trace?.sourceText ?? "").length > 100);
      }),
    );
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (!process.env.API_BASE_URL) {
    console.log("Set API_BASE_URL=http://localhost:3000 to add live HTTP endpoint smoke checks.");
  }
  if (failed.length > 0) process.exitCode = 1;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
