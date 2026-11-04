import type { KnowledgeDocument } from "@/lib/types";

export const CAPTURE_DATE = "2026-11-04";
export const CAPTURE_NOTE =
  "Manual, read-only capture of visible public website text. No crawler and no private data.";

/**
 * A deliberately small, auditable snapshot. The visible text below was copied
 * from four public Greedy Adventures pages on 4 November 2026. It is the only
 * factual knowledge the model is allowed to use.
 */
export const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "sea-view-experience",
    title: "Sea View Skydiving — Tandem Jump over Pattaya",
    url: "https://www.greedyadventures.com/experiences/sea-view-skydiving",
    capturedAt: CAPTURE_DATE,
    note: "Primary experience page: packages, inclusions, jump details and plan.",
    sections: [
      {
        id: "overview",
        title: "Experience overview",
        text: "Sea View Skydiving — Tandem Jump over Pattaya. A tandem skydive over the Gulf of Thailand. Pattaya Dropzone, Thailand. About 3 hours at the dropzone. At the dropzone: 3h. Exit altitude: 13,000 ft. 60 seconds of freefall.",
        keywords: ["sea view", "pattaya", "skydiving", "overview", "duration", "3h", "altitude", "13,000", "freefall", "60 seconds", "gulf of thailand"],
      },
      {
        id: "packages",
        title: "Choose your package",
        text: "ECO — The jump, nothing else — ฿9,500 per person. DELUXE — Video and photos included — ฿12,500 per person. VIP — Personal cameraman and edited film — ฿14,000 per person. Same aircraft, altitude and instructors in every package. Choose ECO for the standard jump, Deluxe if you want handy cam video, and VIP if you want full media coverage.",
        keywords: ["eco", "deluxe", "vip", "package", "packages", "price", "cost", "how much", "฿9,500", "฿12,500", "฿14,000", "9500", "12500", "14000", "video", "photos", "handy cam", "cameraman", "edited film"],
      },
      {
        id: "what-is-included",
        title: "What's included",
        text: "What's included in every package: Tandem skydive experience in Pattaya, Thailand. Safety briefing and tandem instructor support. Aircraft ascent and ocean-view jump experience. Certificate of completion.",
        keywords: ["what is included", "included", "package", "inclusions", "briefing", "instructor", "aircraft ascent", "certificate", "ocean view", "tandem"],
      },
      {
        id: "highlights",
        title: "Highlights",
        text: "Exit at 13,000 ft with the Gulf of Thailand on the horizon. Around sixty seconds of freefall, then five to seven minutes under canopy along the coast. No experience needed: your USPA-certified instructor flies the jump. Same aircraft, altitude and instructors in every package.",
        keywords: ["highlights", "13,000 ft", "altitude", "height", "how high", "sixty seconds", "60 seconds", "freefall", "canopy", "five to seven minutes", "5-7 minutes", "no experience", "USPA", "instructor"],
      },
      {
        id: "the-plan",
        title: "The plan",
        text: "Step 1 — Arrival and check-in: Sign in at the dropzone and bring your photo ID. Step 2 — Safety briefing and gear fitting: Meet your instructor for the safety briefing and harness fitting. Step 3 — Boarding and the climb: Board the aircraft and climb to jump altitude. Step 4 — Exit and freefall: Exit with your instructor for freefall over the Gulf of Thailand. Step 5 — Canopy flight and landing: Fly under the parachute with your instructor and land back at the dropzone.",
        keywords: ["plan", "steps", "itinerary", "arrival", "check-in", "photo id", "briefing", "harness", "boarding", "aircraft", "exit", "freefall", "canopy", "landing"],
      },
      {
        id: "the-details",
        title: "The details",
        text: "A tandem skydiving experience over Pattaya with ocean views. Guests receive a safety briefing, fly to jump altitude, complete the tandem jump with a certified instructor, and choose from ECO, Deluxe, or VIP package options depending on the media coverage they want. Pattaya Sea View, Pattaya, Thailand. 95 M.4, Chakphong, Klaeng District, Rayong 21190, Thailand. Operated by Dropzone Thailand.",
        keywords: ["where", "location", "address", "pattaya sea view", "rayong", "dropzone thailand", "operated by", "certified instructor", "media coverage"],
      },
      {
        id: "good-to-know",
        title: "Good to know",
        text: "Where does the activity take place? The tandem skydive is listed for Pattaya, Thailand. Which package should I choose? Choose ECO for the standard jump, Deluxe if you want handy cam video, and VIP if you want full media coverage. Is Bangkok pickup available? Yes. Bangkok pickup is available as a fixed-price add-on.",
        keywords: ["where", "pattaya", "which package", "choose", "eco", "deluxe", "vip", "handy cam", "full media coverage", "bangkok", "pickup", "add-on", "fixed-price"],
      },
    ],
  },
  {
    id: "pattaya-dropzone",
    title: "Adventures in Pattaya Dropzone",
    url: "https://www.greedyadventures.com/escapes/thailand/pattaya",
    capturedAt: CAPTURE_DATE,
    note: "Destination page with dropzone facts and customer FAQs.",
    sections: [
      {
        id: "dropzone-overview",
        title: "Why go to Pattaya Dropzone",
        text: "Pattaya, Thailand. The busiest dropzone in the region and where most of our jumpers start. Loads run every day of the year, the exit is straight out over the Gulf of Thailand, and the landing area is a two-minute walk from the packing shed.",
        keywords: ["pattaya", "dropzone", "busiest", "loads", "every day", "gulf of thailand", "landing area", "packing shed"],
      },
      {
        id: "sea-view-description",
        title: "Sea View Skydiving — Tandem Jump over Pattaya",
        text: "The straightforward first jump. Same aircraft, same instructors and the same sea view — you exit at 13,000 feet, freefall for around sixty seconds and fly the coastline under canopy. No cameras, no extras: the cheapest way to find out what freefall actually feels like.",
        keywords: ["first jump", "13,000 feet", "altitude", "sixty seconds", "freefall", "coastline", "canopy", "cheapest", "no cameras", "no extras", "same aircraft", "same instructors"],
      },
      {
        id: "dropzone-faq",
        title: "Pattaya Dropzone FAQs",
        text: "When is the best time to visit Pattaya Dropzone? Year round. Is the jump itself any different from the more expensive packages? No. Same aircraft, same altitude, same instructors, same sixty seconds. The difference is only whether it is filmed. Can I add video later? Yes — you can add video and photos at the dropzone on the day, if a camera slot is free. Can I use my own GoPro? No. Dropzones do not allow unlicensed jumpers to carry cameras, for safety reasons. What should I wear? Trainers and comfortable clothes. No sandals, no loose jewellery.",
        keywords: ["best time", "year round", "different", "more expensive", "filmed", "add video later", "camera slot", "gopro", "own camera", "safety", "what should i wear", "trainers", "comfortable clothes", "sandals", "jewellery"],
      },
    ],
  },
  {
    id: "contact",
    title: "Talk to the crew",
    url: "https://www.greedyadventures.com/contact",
    capturedAt: CAPTURE_DATE,
    note: "Public contact details and practical pre-jump questions.",
    sections: [
      {
        id: "contact-channels",
        title: "How to reach us",
        text: "WhatsApp is fastest. We usually reply within the hour. Or message us on WhatsApp: https://wa.me/919535768554. Phone: +91 95357 68554. Where we are: Pattaya Dropzone, Thailand.",
        keywords: ["contact", "whatsapp", "phone", "reach us", "pattaya dropzone", "message", "crew", "help"],
      },
      {
        id: "contact-faq",
        title: "Before you message",
        text: "Do I need any experience to do a tandem jump? None at all. On a tandem you are harnessed to a USPA-certified instructor who handles the exit, the freefall and the landing. You get a full briefing on the ground first — around 20 minutes — and that is all the preparation you need. What are the age and weight limits? You must be 18 or older with valid ID. The weight limit is 100 kg for tandem jumps, and we ask that your weight is proportional to your height for harness fit. If you are close to the limit, message us before booking and we will confirm. Do I have to pay in advance? No. Send us your preferred date on WhatsApp and we will hold your slot. You pay at the dropzone on the day of the jump. What happens if the weather is bad? Jumps run on wind and cloud conditions, not the clock. If a load is held, you wait for the next window the same day, or we move you to another date at no cost. We never jump in unsafe conditions. How long does the whole thing take? Budget three to four hours at the dropzone. That covers check-in, the safety briefing, gear fitting, the flight to altitude, the jump itself, and collecting your video and photos afterwards.",
        keywords: ["experience", "no experience", "USPA", "briefing", "20 minutes", "age", "18", "weight", "100 kg", "valid id", "proportional", "height", "pay in advance", "preferred date", "whatsapp", "weather", "wind", "cloud", "unsafe conditions", "three to four hours", "3-4 hours", "duration"],
      },
    ],
  },
  {
    id: "home",
    title: "Greedy Adventures — Tandem skydiving in Thailand and India",
    url: "https://www.greedyadventures.com/",
    capturedAt: CAPTURE_DATE,
    note: "Home page context for the brand and the two published destinations.",
    sections: [
      {
        id: "home-overview",
        title: "Find your kind of adventure",
        text: "Tandem skydives in Thailand and India. Jump over the Gulf of Thailand at Pattaya, or at Mount Abu in Rajasthan, India. Choose your tandem, send a booking request and we will confirm the slot with you.",
        keywords: ["tandem", "thailand", "india", "pattaya", "mount abu", "gulf of thailand", "booking request", "confirm slot"],
      },
      {
        id: "home-story",
        title: "One jump changed everything",
        text: "Greedy Adventures began with a tandem jump and a simple idea: make it easier for more people to experience that feeling for themselves. Today we help first-timers jump in Thailand and India. Paragliding, scuba diving and snowboarding are coming soon.",
        keywords: ["about", "story", "first-timers", "thailand", "india", "paragliding", "scuba diving", "snowboarding", "coming soon"],
      },
    ],
  },
];

export function getAllSections() {
  return KNOWLEDGE_DOCUMENTS.flatMap((document) =>
    document.sections.map((section) => ({ document, section })),
  );
}
