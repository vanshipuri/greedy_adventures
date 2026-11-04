import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Journey } from "@/components/landing/Journey";
import { Packages } from "@/components/landing/Packages";

export default function HomePage() {
  return (
    <main id="main-content">
      <Hero />
      <Packages />
      <Journey />
      <Faq />
      <Footer />
    </main>
  );
}
