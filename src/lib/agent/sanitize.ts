export interface SanitizedModelText {
  text: string;
  rejected: boolean;
  reason?: string;
}

function numbers(value: string) {
  return (value.match(/\d[\d,.]*/g) ?? [])
    .map((token) => token.replace(/[,.]/g, ""))
    .filter((token) => token.length >= 2 && Number(token) >= 10);
}

function stripUrlsAndCitations(value: string) {
  return value
    .replace(/\[S\d+\]/gi, " ")
    .replace(/https?:\/\/[^\s)]+/gi, " ")
    .replace(/\]\([^)]*\)/g, "]");
}

function hasUngroundedNumber(answer: string, sourceText: string) {
  const allowed = new Set(numbers(sourceText));
  const suspicious = numbers(stripUrlsAndCitations(answer)).filter((token) => !allowed.has(token));
  return suspicious[0];
}

/**
 * Defence in depth: the model is prompted to stay grounded, then its output is
 * stripped of active content and checked for numbers that never appeared in
 * the exact source block. Rejected outputs fall back to the deterministic
 * grounded template instead of being shown to the customer.
 */
export function sanitizeModelText(raw: string, sourceText: string): SanitizedModelText {
  const cleaned = raw
    .replace(/\u0000/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, 1800);

  if (cleaned.length < 8) {
    return { text: "", rejected: true, reason: "Model returned no usable text." };
  }
  const ungrounded = hasUngroundedNumber(cleaned, sourceText);
  if (ungrounded) {
    return {
      text: "",
      rejected: true,
      reason: `Model output contained the unsupported number “${ungrounded}”.`,
    };
  }
  return { text: cleaned, rejected: false };
}
