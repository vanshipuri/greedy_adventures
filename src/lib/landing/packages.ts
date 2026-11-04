export interface PackageDisplay {
  name: string;
  kicker: string;
  price: string;
  priceNote: string;
  description: string;
  mediaNote: string;
  image: string;
  features: string[];
  featured?: boolean;
}

export const packages: PackageDisplay[] = [
  {
    name: "ECO",
    kicker: "For the first try",
    price: "฿9,500",
    priceNote: "per person",
    description: "The jump, nothing else.",
    mediaNote: "Standard jump without media coverage",
    image: "https://www.greedyadventures.com/greedy/package-previews/eco-landscape.jpg",
    features: [
      "Tandem skydive experience in Pattaya, Thailand",
      "Safety briefing and tandem instructor support",
      "Aircraft ascent and ocean-view jump experience",
      "Certificate of completion",
    ],
  },
  {
    name: "DELUXE",
    kicker: "For collecting memories",
    price: "฿12,500",
    priceNote: "per person",
    description: "Video and photos included.",
    mediaNote: "Handy cam video, per the website FAQ",
    image: "https://www.greedyadventures.com/greedy/package-previews/deluxe-landscape-poster.png",
    features: [
      "All four core inclusions",
      "Handy cam video",
      "Photos",
      "Same jump, altitude and instructors",
    ],
    featured: true,
  },
  {
    name: "VIP",
    kicker: "Once in a lifetime",
    price: "฿14,000",
    priceNote: "per person",
    description: "Personal cameraman and edited film.",
    mediaNote: "Full media coverage",
    image: "https://www.greedyadventures.com/greedy/package-previews/vip-landscape-poster.png",
    features: [
      "All four core inclusions",
      "Personal cameraman",
      "Edited film",
      "Same jump, altitude and instructors",
    ],
  },
];

export const journeySteps = [
  {
    number: "01",
    title: "Arrival and check-in",
    text: "Sign in at the dropzone and bring your photo ID.",
  },
  {
    number: "02",
    title: "Briefing and gear fitting",
    text: "Meet your instructor for the safety briefing and harness fitting.",
  },
  {
    number: "03",
    title: "Boarding and the climb",
    text: "Board the aircraft and climb to jump altitude.",
  },
  {
    number: "04",
    title: "Exit and freefall",
    text: "Exit with your instructor for freefall over the Gulf of Thailand.",
  },
  {
    number: "05",
    title: "Canopy flight and landing",
    text: "Fly under the parachute with your instructor and land back at the dropzone.",
  },
];

export const faqs = [
  {
    question: "Do I need any experience?",
    answer:
      "None at all. A USPA-certified instructor handles the exit, freefall and landing, with a full ground briefing first.",
  },
  {
    question: "Is the jump different in the more expensive packages?",
    answer:
      "No. The Pattaya Dropzone FAQ says the aircraft, altitude, instructors and sixty seconds are the same. The difference is only whether it is filmed.",
  },
  {
    question: "Can I add video later?",
    answer:
      "Yes — you can add video and photos at the dropzone on the day, if a camera slot is free.",
  },
  {
    question: "What should I wear?",
    answer: "Trainers and comfortable clothes. No sandals, no loose jewellery.",
  },
  {
    question: "What happens if the weather is bad?",
    answer:
      "Jumps run on wind and cloud conditions. If a load is held, you wait for the next window the same day or move to another date at no cost.",
  },
];
