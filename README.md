# Greedy Adventures — Sea View Skydiving concierge prototype

A single-page Next.js + TypeScript redesign of the public **Sea View Skydiving — Pattaya** experience, with an `assistant-ui` chat connected to a validated backend, deterministic media routing, a read-only knowledge view and labelled demo assets.

## Links

- **Arena live preview:** https://3000-ivn7x2mgygb5wnv3attwt.e2b.app
- **Knowledge view:** https://3000-ivn7x2mgygb5wnv3attwt.e2b.app/knowledge
- **Source branch:** https://github.com/vanshipuri/greedy_adventures/tree/arena/e176883e-greedy-adventures
- **Review PR:** https://github.com/vanshipuri/greedy_adventures/pull/1
- **Repository:** https://github.com/vanshipuri/greedy_adventures
- **Vercel:** no Vercel account is connected to this sandbox, so no Vercel URL was created. Import the public repository in Vercel with the default Next.js settings; add `AI_API_KEY` only if a live model is wanted. The Arena preview above is the working demo.

> No model access was purchased and no API key is included. Without a key the app runs in **clearly labelled mock mode**, while the full validation → retrieval → media selection → answer guard pipeline still runs. If a reviewer needs real model access, please provide it before any spend.

## Setup

Requires Node.js 20.9+ (tested on Node 22).

```bash
npm install
npm run dev
# open http://localhost:3000 and http://localhost:3000/knowledge
```

Optional server-side environment variables (see `.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_API_KEY` / `OPENAI_API_KEY` | unset | Enables a live OpenAI-compatible Chat Completions backend. Never sent to the browser. |
| `AI_BASE_URL` | `https://api.openai.com/v1` | HTTPS OpenAI-compatible base URL; local HTTP is allowed for testing only. |
| `AI_MODEL` | `gpt-4o-mini` | Model name shown in the safe runtime label. |
| `MOCK_MODE` | `0` | `1` forces the deterministic mock engine even with a key. |
| `FORCE_MODEL_FAILURE` | `0` | `1` makes every model call fail, for a visible error-path check. |

Other commands:

```bash
npm run typecheck      # strict TypeScript
npm run build          # production build
npm run verify         # offline repeatable checks
API_BASE_URL=http://localhost:3000 npm run verify  # adds HTTP endpoint smoke checks
npm run generate:media # regenerates PDF; MP4 also requires ffmpeg or FFMPEG_PATH
```

## Sources and media

Manual, read-only capture of visible public text on **4 Nov 2026**; no crawler and no private data. The exact passages are in `src/lib/knowledge/snapshot.ts` and are shown in `/knowledge`.

| Public source | Used for |
| --- | --- |
| [Sea View Skydiving — Tandem Jump over Pattaya](https://www.greedyadventures.com/experiences/sea-view-skydiving) | Packages, prices, inclusions, highlights, plan, location, good-to-know |
| [Adventures in Pattaya Dropzone](https://www.greedyadventures.com/escapes/thailand/pattaya) | Dropzone facts and published FAQs |
| [Talk to the crew](https://www.greedyadventures.com/contact) | Contact, age/weight limits, payment, weather, duration |
| [Greedy Adventures home](https://www.greedyadventures.com/) | Brand and destination context |

Generated demo files (every page/frame is labelled **DEMO MATERIAL**):

| File | Origin | Label |
| --- | --- | --- |
| `public/media/sea-view-brochure-demo.pdf` | `scripts/generate-media.mjs` + `pdf-lib`, built from captured facts | Demo material |
| `public/media/sea-view-film-demo.mp4` | Six-second zoom film from the synthetic hero image via ffmpeg | Demo material |
| `public/media/sea-view-demo.jpg` | AI-generated editorial visual used for the hero, poster and film | Demo material |

Website photographs/package previews remain hotlinked from Greedy Adventures and are credited in the page footer. They fall back to the local demo visual if unavailable.

## Agent flow

1. **UI / `assistant-ui`:** `useLocalRuntime` keeps the thread in the browser tab. The custom adapter sends the last 24 text messages to `POST /api/chat` and turns the response into a text part plus a typed `concierge` data part.
2. **Validation:** Zod limits roles, message count and content length, and requires the last turn to be a user question. The knowledge test endpoint uses its own schema.
3. **Media handling:** `selectMedia()` deterministically detects `pdf`, `video`, both, or none. It only returns IDs from the allowlisted registry. Unsupported experiences and package-specific videos get an honest unavailable message — never a substitute file. Short follow-ups can expand “and a video too?” into a bundle using conversation history.
4. **Knowledge:** `buildRetrievalQuery()` folds in the previous turn for short follow-ups. A transparent keyword/BM25-like scorer selects up to four passages; `buildSourceText()` produces the **exact** block passed to the answer engine.
5. **Chat/model logic:** With a key, an OpenAI-compatible Chat Completions call receives the strict grounding prompt, source block and conversation history. Without a key, `createMockRunner()` uses deterministic grounded templates. Both go through `sanitizeModelText()`: raw HTML/images are removed and any number of 10 or more that is absent from the source block causes a deterministic grounded fallback.
6. **Safe rendering:** `react-markdown` renders no raw HTML; links are allowlisted, images are dropped and source chips come from trusted backend metadata. `MediaCard` only renders `/media/...` registry URLs.
7. **Fallback/errors:** Missing facts skip the model and say the supplied pages do not cover them. Missing files say so. Model/network failures return a visible error card and still attach any independently selected media. The chat endpoint returns HTTP 502 for model errors.

Conversation memory lives in the current browser tab through `assistant-ui`; it is not persisted to a database and is not visible in the knowledge view.

## How to open the knowledge view

Use **Knowledge view** in the header, the chat header/footer, the page footer, or open `/knowledge` directly.

The page calls `GET /api/knowledge` for the loaded documents, capture dates, passage text, media registry and safe runtime label. **Test a question** calls `POST /api/knowledge/test`, which runs the same `runAgent()` pipeline as chat with one isolated question. The inspector shows the real retrieval query, scored passages, exact source text passed to the model (or a model-skipped reason), selected PDF/video IDs, answer, guard result and raw JSON trace. It never reads chat transcripts, request logs, environment values or API keys.

## Code structure

```text
src/app/                         Next.js App Router, API routes, global CSS
src/components/chat/             assistant-ui thread, dock, safe markdown, media cards
src/components/knowledge/        read-only dashboard and live inspector
src/components/landing/          hero, packages, plan, FAQ, footer
src/components/providers/        chat runtime + page-level open/close context
src/lib/agent/                   pipeline, prompt, grounded templates, output guard
src/lib/chat/                    assistant-ui adapter and data-part payload
src/lib/knowledge/               captured snapshot and retrieval
src/lib/media/                   allowlisted registry, deterministic selector, URL safety
src/lib/model/                   mock, live and runtime-configuration engines
src/lib/validation/              Zod request schemas
scripts/                         demo-media generation and repeatable verification
public/media/                    generated demo JPG, PDF and MP4
```

## Verification

`npm run verify` runs 15 offline checks; add `API_BASE_URL=http://localhost:3000` for a 16th live HTTP check. It asserts asset signatures, schemas, URL allowlists, exact media intent, follow-up expansion, no-substitute fallback, real source text, VIP price memory, missing information, model failure, ungrounded-number fallback and the inspector failure path.

Manual checks in the chat:

| # | Ask / action | Expected result |
| --- | --- | --- |
| 1 | `What is included in the package?` | Text only: four shared inclusions; source chips; no media card. |
| 2 | `Tell me about VIP` then `What does it cost?` | Follow-up resolves to VIP and **฿14,000 per person**; source chips remain. |
| 3 | `Can you send me a brochure?` | One PDF card with **Open PDF** and **Download PDF**, labelled Demo material. |
| 4 | `Can I see a video of the experience?` | One inline MP4 player plus watch/download link, labelled Demo material. |
| 5 | `Send me the brochure and a video.` | Both cards in the same response; inspector intent `bundle`. |
| 6 | `Can you send me a brochure?` then `And a video too?` | Conversation history expands the follow-up to both files. |
| 7 | `What is the VIP refund policy?` | States the supplied pages do not cover it; no invented policy, no source chips, model skipped. |
| 8 | `Send me the paragliding brochure` or `Can I see an ECO-specific video?` | States the file is unavailable; no substitute file; inspector shows no selected media. |
| 9 | In `/knowledge`, run `Send me the brochure and a video.` | Exact backend source block and two selected media IDs; not dashboard sample data. |
| 10 | In `/knowledge`, tick **Simulate a model failure** and run any question | Real backend error trace, clear error card, no invented answer; files still attach if requested. |
| 11 | Start with `FORCE_MODEL_FAILURE=1 npm run dev` | Every chat model call shows the error state; deterministic media routing still works. |
| 12 | Set `MOCK_MODE=0`, `AI_API_KEY=test`, `AI_BASE_URL=http://127.0.0.1:9/v1` | Live-model network failure shows a red error card and HTTP 502; no spending and no silent mock fallback. |
| 13 | Keyboard check | Tab reaches skip link, nav, package CTAs, chat launcher; chat traps focus, focuses the composer, closes on Escape and returns focus. |

Additional reproducible checks:

```bash
npm run typecheck
npm run build
npm run verify
API_BASE_URL=http://localhost:3000 npm run verify
curl -s http://localhost:3000/api/knowledge | jq '.runtime, (.documents|length), (.media|length)'
curl -s -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Send me the brochure and a video."}]}' \
  | jq '.trace.media, (.media|map(.kind)), (.trace.sourceText|length)'
```

## Limitations

- Prototype only: no real bookings, payments, login, database, rate limiting or whole-site crawler.
- Knowledge is a one-time manual snapshot of four public pages; keyword retrieval is English-oriented and would need embeddings/hybrid search for a larger site.
- Chat memory is in the browser tab only; reloading or **New chat** clears it.
- Mock mode is deterministic rather than a hosted LLM. A live OpenAI-compatible endpoint can be enabled with a server-side key; no key or private conversation is exposed in `/knowledge`.
- Hero visual, brochure and film are synthetic demo material, not customer footage or a real commercial brochure.
- The Arena preview URL is environment-bound. A Vercel deployment can be created from the public branch with the default Next.js settings.

## AI assistance and credits

Built in Arena Agent Mode with AI coding assistance. The generated code was reviewed, type-checked, production-built and exercised by `npm run verify` plus live HTTP smoke checks. Synthetic media was produced with Arena image generation, `pdf-lib` and ffmpeg; all demo material is labelled.

Open-source credits: [assistant-ui](https://www.assistant-ui.com/) (chat primitives and local runtime), Next.js, React, TypeScript, react-markdown, remark-gfm, Zod, pdf-lib and ffmpeg. Public page text and package previews © Greedy Adventures, used only for this assignment.
