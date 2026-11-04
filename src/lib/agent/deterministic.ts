import type { ChatMessage, MediaDecision, RetrievedSection } from "@/lib/types";

export const WHATSAPP_URL =
  "https://wa.me/919535768554?text=Hi%20Greedy%20Adventures%20%E2%80%94%20I%20have%20a%20question.";

const CAPABILITY_RE =
  /^\s*(hi|hello|hey|who are you|what can you do|what do you do|how can you help|help me|help)\b/i;

const UNSUPPORTED_FACT_RE =
  /\b(refund|refunds|cancellation|cancel policy|parking|helicopter|paris|antarctica|insurance|pregnancy|medical|freefall speed|falling speed|how fast|mph|kph|diet|meal|hotel|locker)\b/i;

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function includes(query: string, words: string[]) {
  return words.some((word) => query.includes(word));
}

export function isCapabilityQuestion(message: string) {
  return CAPABILITY_RE.test(message.trim());
}

export function isUnsupportedFactRequest(contextualQuestion: string) {
  const combined = normalize(contextualQuestion);
  if (UNSUPPORTED_FACT_RE.test(combined)) return true;
  // The page gives duration and altitude, but not velocity. Be explicit.
  return /\bhow fast\b|\bspeed\b|\bmph\b|\bkph\b/.test(combined);
}

export function buildCapabilityAnswer() {
  return [
    "I can help with the captured **Sea View Skydiving** pages: package inclusions and prices, the jump plan, practical FAQs and source links.",
    "I remember this conversation for follow-ups, and I can share the **demo brochure PDF**, the **demo experience video**, or both when asked.",
    "I cannot confirm a booking, take payment, or invent details that are not in the supplied pages.",
  ].join("\n\n");
}

export function buildUnavailableAnswer(mediaDecision?: MediaDecision) {
  if (mediaDecision?.unavailable) {
    return `${mediaDecision.unavailable}\n\nIf you need a specific file, please [message the crew on WhatsApp](${WHATSAPP_URL}).`;
  }
  return `I can't find that detail in the supplied Greedy Adventures pages, so I won't guess. Please [message the crew on WhatsApp](${WHATSAPP_URL}) to confirm it. I can still help with the published packages, jump plan, inclusions and demo files.`;
}

function bullet(lines: string[]) {
  return lines.map((line) => `- ${line}`).join("\n");
}

function firstSentences(hits: RetrievedSection[], query: string) {
  const terms = new Set(
    normalize(query)
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length > 3 && !["what", "about", "with", "that", "this", "your", "please"].includes(term)),
  );
  const candidates = hits.flatMap((hit) =>
    hit.text
      .split(/(?<=[.!?])\s+|\s+—\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 24 && sentence.length < 260)
      .map((sentence) => {
        const lower = sentence.toLowerCase();
        let score = 0;
        for (const term of terms) if (lower.includes(term)) score += 1;
        return { sentence, score };
      }),
  );
  const seen = new Set<string>();
  return candidates
    .sort((a, b) => b.score - a.score)
    .filter(({ sentence }) => {
      const key = sentence.slice(0, 70).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4)
    .map(({ sentence }) => sentence.replace(/[.]+$/, ""));
}

export function buildGroundedReply(options: {
  messages: ChatMessage[];
  retrievalQuery: string;
  hits: RetrievedSection[];
  mediaDecision: MediaDecision;
}): string {
  const { messages, retrievalQuery, hits, mediaDecision } = options;
  const latest = messages.at(-1)?.content ?? "";
  const previousUser =
    [...messages.slice(0, -1)].reverse().find((message) => message.role === "user")?.content ?? "";
  // Topic detection uses the customer's words only. Retrieval text can contain
  // prior assistant wording and must not turn a price follow-up into an
  // “inclusions” answer.
  const query = normalize(`${latest} ${previousUser}`);
  const contextQuery = normalize(`${latest} ${previousUser} ${retrievalQuery}`);
  const hasVip = /\bvip\b/.test(contextQuery);
  const hasDeluxe = /\bdeluxe\b/.test(contextQuery);
  const hasEco = /\beco\b/.test(contextQuery);
  const asksPrice = includes(query, ["price", "cost", "how much", "pricing", "฿"]);
  const asksInclusions =
    includes(query, ["what is included", "what's included", "inclusions", "what's in the package"]) ||
    includes(normalize(latest), ["included", "includes"]);

  if (mediaDecision.selected.length === 2) {
    return `Here are both **demo files** you asked for. The brochure summarises the captured package facts; the short film is a visual sample, not customer footage. Use the open or download buttons below.\n\nAll three packages share the same aircraft, altitude and instructors — the difference is media coverage. The source pages are linked below.`;
  }
  if (mediaDecision.selected.some((item) => item.kind === "pdf")) {
    return `Here is the **Sea View Skydiving demo brochure**. It is a two-page sample built from the captured public page: ECO ฿9,500, Deluxe ฿12,500 and VIP ฿14,000 per person, plus the four shared inclusions. Use **Open PDF** or **Download PDF** below. The website sources are linked below.`;
  }
  if (mediaDecision.selected.some((item) => item.kind === "video")) {
    return `Here is the **Sea View experience demo film** — a six-second silent visual sample with a visible DEMO MATERIAL label. Use the player or **Watch / download video** below. It is not customer footage; the published page facts are linked below.`;
  }

  if (asksPrice && !asksInclusions) {
    if (hasVip) {
      return "VIP is **฿14,000 per person**. It is described as “Personal cameraman and edited film” and is the full media coverage option. All four core inclusions are shared with ECO and Deluxe.";
    }
    if (hasDeluxe) {
      return "Deluxe is **฿12,500 per person**. It is described as “Video and photos included”; the page says to choose Deluxe if you want handy cam video.";
    }
    if (hasEco) {
      return "ECO is **฿9,500 per person**. It is described as “The jump, nothing else” — the standard sea-view jump without the media coverage of Deluxe or VIP.";
    }
    return `Published prices are **ECO ฿9,500**, **Deluxe ฿12,500** and **VIP ฿14,000**, each per person. The jump itself is the same; the difference is whether it is filmed and how much media coverage is included.`;
  }

  if (asksInclusions) {
    const priceLine = asksPrice
      ? "\n\nPublished prices are ECO ฿9,500, Deluxe ฿12,500 and VIP ฿14,000, each per person."
      : "";
    return `Every Sea View Skydiving package includes:\n\n${bullet([
      "Tandem skydive experience in Pattaya, Thailand",
      "Safety briefing and tandem instructor support",
      "Aircraft ascent and ocean-view jump experience",
      "Certificate of completion",
    ])}\n\nThe packages use the same aircraft, altitude and instructors. ECO is the jump without media, Deluxe includes handy cam video, and VIP is for full media coverage with a personal cameraman and edited film.${priceLine}`;
  }

  if (includes(query, ["how high", "altitude", "height", "13,000"])) {
    return "The listed exit altitude is **13,000 ft**, over the Gulf of Thailand. The page lists around sixty seconds of freefall followed by five to seven minutes under canopy along the coast.";
  }
  if (includes(query, ["freefall", "sixty seconds", "60 seconds"])) {
    return "The page lists **60 seconds of freefall** after exit, followed by five to seven minutes under canopy along the coast.";
  }
  if (includes(query, ["canopy", "five to seven", "5-7"])) {
    return "After around sixty seconds of freefall, the page says you fly under canopy for **five to seven minutes** along the coast before landing back at the dropzone.";
  }
  if (includes(query, ["how long", "duration", "hours", "3h", "whole thing"])) {
    return "The experience page lists **about 3 hours at the dropzone**. The contact page asks guests to budget **three to four hours** for check-in, briefing, gear fitting, the flight, the jump and collecting media afterwards.";
  }
  if (includes(query, ["weight", "100 kg", "age", "18"])) {
    return "The contact page says guests must be **18 or older with valid ID**. The tandem weight limit is **100 kg**, with weight proportional to height for harness fit. If you are close to the limit, message the crew before booking so they can confirm.";
  }
  if (includes(query, ["weather", "wind", "cloud"])) {
    return "Jumps run on **wind and cloud conditions, not the clock**. If a load is held, you wait for the next window the same day or move to another date at no cost. The crew never jumps in unsafe conditions.";
  }
  if (includes(query, ["pay in advance", "payment", "deposit"])) {
    return "No advance payment is required. The contact page says to send a preferred date on WhatsApp; the team holds the slot and you pay at the dropzone on the day of the jump.";
  }
  if (includes(query, ["gopro", "own camera", "carry cameras"])) {
    return "No. The Pattaya Dropzone FAQ says dropzones do not allow unlicensed jumpers to carry cameras, for safety reasons.";
  }
  if (includes(query, ["what should i wear", "wear", "trainers", "sandals"])) {
    return "Wear **trainers and comfortable clothes**. The FAQ says no sandals and no loose jewellery.";
  }
  if (includes(query, ["which package", "choose", "handy cam", "full media"])) {
    return "Choose **ECO** for the standard jump, **Deluxe** if you want handy cam video, and **VIP** if you want full media coverage. The aircraft, altitude and instructors are the same in every package.";
  }
  if (includes(query, ["add video later", "camera slot"])) {
    return "Yes — you can add video and photos at the dropzone on the day, **if a camera slot is free**.";
  }
  if (includes(query, ["bangkok", "pickup"])) {
    return "Yes. Bangkok pickup is available as a **fixed-price add-on**. The supplied page does not list the add-on price.";
  }
  if (includes(query, ["where", "location", "address", "operated by"])) {
    return "The tandem skydive is listed for **Pattaya, Thailand**, at Pattaya Sea View. The published address is 95 M.4, Chakphong, Klaeng District, Rayong 21190, Thailand, and it is operated by Dropzone Thailand.";
  }
  if (includes(query, ["different", "same aircraft", "same instructors"])) {
    return "No. The Pattaya Dropzone FAQ says the jump is the same: **same aircraft, same altitude, same instructors, same sixty seconds**. The difference is only whether it is filmed.";
  }
  if (includes(query, ["contact", "whatsapp", "phone", "crew"])) {
    return `WhatsApp is fastest and the crew usually replies within the hour. You can [message the crew on WhatsApp](${WHATSAPP_URL}) or call +91 95357 68554.`;
  }
  if (includes(query, ["experience needed", "no experience", "first time", "nervous"])) {
    return "No experience is needed. A USPA-certified instructor handles the exit, freefall and landing; the contact page says the ground briefing takes around 20 minutes.";
  }

  const sentences = firstSentences(hits, `${latest} ${retrievalQuery}`);
  if (sentences.length === 0) return buildUnavailableAnswer(mediaDecision);
  return `According to the captured public pages:\n\n${bullet(sentences)}\n\nThe linked source sections below contain the exact wording used for this answer.`;
}
