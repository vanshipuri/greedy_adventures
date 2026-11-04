import { getAllSections } from "@/lib/knowledge/snapshot";
import type { ChatMessage, MediaIntent, RetrievedSection } from "@/lib/types";

const STOP_WORDS = new Set([
  "a", "about", "am", "an", "and", "are", "as", "at", "be", "can", "could",
  "do", "does", "for", "from", "get", "give", "have", "hello", "help", "hi",
  "how", "i", "in", "is", "it", "its", "me", "my", "of", "on", "or", "our",
  "please", "send", "show", "some", "that", "the", "their", "them", "there",
  "these", "this", "to", "us", "was", "we", "what", "when", "where", "which",
  "who", "why", "with", "would", "you", "your",
]);

const LOW_VALUE_WORDS = new Set(["experience", "package", "packages", "pattaya", "skydiving", "jump"]);

const SYNONYMS: Record<string, string[]> = {
  cost: ["price", "pricing", "฿"],
  costs: ["price", "pricing", "฿"],
  price: ["cost", "pricing", "฿"],
  prices: ["cost", "pricing", "฿"],
  much: ["price", "cost"],
  included: ["inclusions", "what's included", "includes"],
  includes: ["inclusions", "included"],
  inclusions: ["included", "what's included"],
  high: ["altitude", "height", "13,000"],
  height: ["altitude", "13,000"],
  long: ["duration", "freefall", "three to four hours"],
  duration: ["long", "hours", "3h"],
  film: ["video", "footage", "clip"],
  movie: ["video", "footage", "clip"],
  clip: ["video", "film", "footage"],
  watch: ["video", "film", "see"],
  wear: ["trainers", "clothes", "sandals"],
  clothes: ["trainers", "wear"],
  age: ["18", "valid id"],
  weight: ["100 kg", "limit", "proportional"],
  weather: ["wind", "cloud", "unsafe conditions"],
  pickup: ["bangkok", "add-on"],
  gopro: ["camera", "cameras", "unlicensed"],
};

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[฿£$]/g, "")
    .replace(/(\d),(\d)/g, "$1$2")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 1);
}

function meaningfulTokens(value: string): string[] {
  const unique = new Set<string>();
  for (const token of tokenize(value)) {
    if (STOP_WORDS.has(token)) continue;
    unique.add(token);
    for (const synonym of SYNONYMS[token] ?? []) {
      for (const expanded of tokenize(synonym)) unique.add(expanded);
    }
  }
  return [...unique];
}

function termWeight(term: string) {
  return LOW_VALUE_WORDS.has(term) ? 0.35 : 1;
}

function count(haystack: string[], needle: string) {
  let total = 0;
  for (const token of haystack) {
    if (token === needle) total += 1;
    else if (needle.length > 4 && token.startsWith(needle)) total += 0.5;
  }
  return total;
}

export function retrieve(query: string, limit = 4): RetrievedSection[] {
  const terms = meaningfulTokens(query);
  if (terms.length === 0) return [];

  const scored = getAllSections().map(({ document, section }) => {
    const titleTokens = tokenize(section.title);
    const keywordTokens = tokenize(section.keywords.join(" "));
    const textTokens = tokenize(section.text);
    const allText = `${section.title} ${section.keywords.join(" ")} ${section.text}`.toLowerCase();

    let score = 0;
    let matchedTerms = 0;
    for (const term of terms) {
      const weight = termWeight(term);
      const titleHits = count(titleTokens, term);
      const keywordHits = count(keywordTokens, term);
      const textHits = count(textTokens, term);
      const hits = titleHits * 3 + keywordHits * 3.5 + textHits * 1.1;
      if (hits > 0) matchedTerms += 1;
      score += hits * weight;
    }
    if (matchedTerms > 1) score += matchedTerms * 0.75;
    if (allText.includes(query.toLowerCase().trim()) && query.trim().length > 12) score += 2;

    return {
      ...section,
      documentId: document.id,
      documentTitle: document.title,
      documentUrl: document.url,
      capturedAt: document.capturedAt,
      score: Number(score.toFixed(2)),
      citationId: "",
    };
  });

  return scored
    .filter((section) => section.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((section, index) => ({ ...section, citationId: `S${index + 1}` }));
}

const FOLLOW_UP_RE = /\b(it|its|that|they|one|them|this|these|those|and|also|too|as well|what about)\b/i;

/** Folds in the previous turn for short follow-ups, e.g. “and its price?”. */
export function buildRetrievalQuery(
  messages: ChatMessage[],
  mediaIntent: MediaIntent,
): string {
  const latest = messages.at(-1)?.content.trim() ?? "";
  const history = messages.slice(0, -1);
  const previousUser = [...history].reverse().find((message) => message.role === "user")?.content ?? "";
  const previousAssistant = [...history].reverse().find((message) => message.role === "assistant")?.content ?? "";
  const wordCount = latest.split(/\s+/).filter(Boolean).length;
  const isFollowUp = wordCount <= 7 || FOLLOW_UP_RE.test(latest);

  let query = latest;
  if (isFollowUp) {
    query = [previousUser, previousAssistant.slice(0, 220), latest].filter(Boolean).join(" ");
  }
  if (mediaIntent !== "none" && wordCount <= 12) {
    query = `${query} Sea View Skydiving packages overview`;
  }
  return query.replace(/\s+/g, " ").trim().slice(0, 500);
}

/** The exact block inserted into the model's system prompt. */
export function buildSourceText(hits: RetrievedSection[]): string {
  if (hits.length === 0) return "";
  return hits
    .map(
      (hit) =>
        `[${hit.citationId}] ${hit.documentTitle} — ${hit.title}\n` +
        `Source URL: ${hit.documentUrl}\n` +
        `Captured: ${hit.capturedAt}\n` +
        `${hit.text}`,
    )
    .join("\n\n---\n\n");
}
