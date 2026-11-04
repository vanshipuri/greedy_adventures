import type { MediaItem } from "@/lib/types";

/**
 * Allowlisted media. The chatbot can only return IDs from this registry; it is
 * never allowed to invent a file URL. Both files are generated demo material.
 */
export const MEDIA_ITEMS: MediaItem[] = [
  {
    id: "sea-view-brochure-demo",
    kind: "pdf",
    title: "Sea View Skydiving brochure",
    description:
      "Two-page sample brochure built from the captured public page facts. Covers ECO, Deluxe and VIP. Every page is stamped DEMO MATERIAL.",
    url: "/media/sea-view-brochure-demo.pdf",
    poster: "/media/sea-view-demo.jpg",
    originLabel: "Demo material",
    isDemo: true,
    formatLabel: "PDF · 2 pages",
    tags: ["brochure", "pdf", "pamphlet", "leaflet", "flyer", "sea view", "sea-view", "pattaya", "skydiving", "experience", "package", "eco", "deluxe", "vip"],
  },
  {
    id: "sea-view-film-demo",
    kind: "video",
    title: "Sea View experience film",
    description:
      "Six-second silent mood reel generated from the demo sea-view image. The film carries a visible DEMO MATERIAL label; it is not customer footage.",
    url: "/media/sea-view-film-demo.mp4",
    poster: "/media/sea-view-demo.jpg",
    originLabel: "Demo material",
    isDemo: true,
    formatLabel: "MP4 · 6 seconds",
    tags: ["video", "film", "footage", "clip", "watch", "see", "sea view", "sea-view", "pattaya", "skydiving", "experience"],
  },
];

export function findMediaById(id: string) {
  return MEDIA_ITEMS.find((item) => item.id === id);
}

/** Only same-origin /media paths from the registry can be rendered as files. */
export function isSafeMediaUrl(url: string) {
  if (!url.startsWith("/media/")) return false;
  if (url.includes("..") || url.includes("\\") || url.includes("?")) return false;
  return /^\/media\/[a-zA-Z0-9._-]+$/.test(url);
}

/** Links shown in model-authored markdown are restricted to trusted hosts. */
export function isSafeExternalHref(href: string) {
  try {
    const url = new URL(href, "https://www.greedyadventures.com");
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (href.startsWith("/") && !href.startsWith("//")) {
      const path = href.split(/[?#]/)[0];
      if (path.includes("..")) return false;
      return (
        path === "/" ||
        path.startsWith("/knowledge") ||
        path.startsWith("/media/") ||
        path.startsWith("/#")
      );
    }
    return (
      url.hostname === "www.greedyadventures.com" ||
      url.hostname === "greedyadventures.com" ||
      url.hostname === "wa.me" ||
      url.hostname === "www.assistant-ui.com"
    );
  } catch {
    return false;
  }
}
