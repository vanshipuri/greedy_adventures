import { MEDIA_ITEMS } from "@/lib/media/registry";
import type { ChatMessage, MediaDecision, MediaItem, MediaKind } from "@/lib/types";

const PDF_RE = /\b(brochure|pdf|pamphlet|leaflet|flyer)\b/i;
const VIDEO_RE = /\b(video|videos|film|films|footage|clip|clips|movie|watch|see it|see the jump)\b/i;
const BOTH_RE = /\b(both|them|these|those)\b/i;
const FOLLOW_UP_RE = /\b(and|also|too|as well|additionally)\b/i;
const PACKAGE_RE = /\b(eco|deluxe|vip)\b/i;

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function requestedKinds(text: string): MediaKind[] {
  const kinds: MediaKind[] = [];
  if (PDF_RE.test(text)) kinds.push("pdf");
  if (VIDEO_RE.test(text)) kinds.push("video");
  return kinds;
}

function detectSubject(text: string) {
  const value = normalize(text);
  if (/\b(paragliding|scuba|snowboarding|mount abu|antarctica|paris|helicopter)\b/.test(value)) {
    return "unsupported";
  }
  const packageMatch = value.match(PACKAGE_RE);
  if (packageMatch) return packageMatch[1].toLowerCase();
  if (/\b(sea view|sea-view|pattaya|skydiving|experience|jump|dropzone|tandem)\b/.test(value)) {
    return "sea-view";
  }
  return "general";
}

function subjectLabel(subject: string) {
  if (subject === "unsupported") return "that experience";
  if (subject === "general" || subject === "sea-view") return "Sea View Skydiving";
  return `${subject.toUpperCase()} package`;
}

function unavailableMessage(subject: string, requested: MediaKind[]) {
  const noun = requested.length === 2 ? "files" : requested[0] === "pdf" ? "brochure" : "video";
  if (subject === "unsupported") {
    return `I don't have a ${noun} for that experience. The library only contains general Sea View Skydiving demo material, so I won't substitute a different file.`;
  }
  return `I don't have a ${subject.toUpperCase()}-specific ${noun}. The library only has one general Sea View Skydiving demo film and one general brochure, so I won't substitute a package-specific file.`;
}

function formatRequested(requested: MediaKind[]) {
  if (requested.length === 2) return "the brochure and the video";
  return requested[0] === "pdf" ? "the brochure" : "the video";
}

/**
 * Deterministic media router. Rules make file selection repeatable and keep the
 * model out of the allowlist decision. The model only writes words around the
 * files that this function returns.
 */
export function selectMedia(messages: ChatMessage[]): MediaDecision {
  const latestUser = [...messages].reverse().find((message) => message.role === "user");
  const current = normalize(latestUser?.content ?? "");
  const previousUserMessages = messages
    .slice(0, -1)
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => normalize(message.content));
  const previousText = previousUserMessages.at(-1) ?? "";
  const previousKinds = requestedKinds(previousText);
  const isFollowUp = FOLLOW_UP_RE.test(current) || BOTH_RE.test(current);

  let requested = requestedKinds(current);
  let followUpNote = "";
  if (isFollowUp && requested.length === 1 && previousKinds.length > 0) {
    const combined = Array.from(new Set([...previousKinds, ...requested])) as MediaKind[];
    if (combined.length === 2) {
      requested = combined;
      followUpNote = "Conversation history expanded this follow-up to a PDF + video bundle. ";
    }
  }
  if (BOTH_RE.test(current) && previousKinds.length === 2) {
    requested = previousKinds;
    followUpNote = "Conversation history resolved “both” to the previously requested formats. ";
  }

  const subject = detectSubject(`${current} ${isFollowUp ? previousText : ""}`);
  const intent: MediaDecision["intent"] =
    requested.length === 2 ? "bundle" : requested[0] === "pdf" ? "pdf" : requested[0] === "video" ? "video" : "none";

  if (requested.length === 0) {
    return { intent: "none", requested, selected: [], reason: "No file requested.", subject };
  }

  // Only the general brochure covers named packages. No package-specific video
  // exists, and unsupported experiences never get a substitute file.
  const selected: MediaItem[] = MEDIA_ITEMS.filter((item) => {
    if (!requested.includes(item.kind)) return false;
    if (subject === "general" || subject === "sea-view") return true;
    if (subject === "unsupported") return false;
    if (item.kind === "pdf" && item.tags.includes(subject)) return true;
    return false;
  });

  if (selected.length === 0) {
    return {
      intent,
      requested,
      selected: [],
      unavailable: unavailableMessage(subject, requested),
      reason: `${followUpNoSubstitute(subject)} No ${formatRequested(requested)} in the allowlist matches ${subjectLabel(subject)}.`,
      subject,
    };
  }

  const packageBrochureNote =
    /^(eco|deluxe|vip)$/.test(subject) && selected.some((item) => item.kind === "pdf")
      ? " One general brochure covers all three packages."
      : "";

  return {
    intent,
    requested,
    selected,
    reason:
      followUpNote +
      `Selected ${formatRequested(requested)} from the allowlisted demo library for ${subjectLabel(subject)}.` +
      packageBrochureNote,
    subject,
  };
}

function followUpNoSubstitute(subject: string) {
  return subject === "unsupported"
    ? "Unsupported experience detected."
    : "Package-specific media detected.";
}
