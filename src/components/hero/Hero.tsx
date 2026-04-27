"use client";

import HeroSequence from "./HeroSequence";
import HeroContent from "./HeroContent";

export default function Hero() {
  return (
    <section id="hero" className="relative" style={{ height: "300vh" }}>
      {/* Scroll-driven image sequence — sticky canvas */}
      <HeroSequence />

      {/* Overlay: headline, subtext, CTA — sticks to viewport while in hero */}
      <div className="sticky top-0 h-screen z-20 pointer-events-none">
        <HeroContent />
      </div>
    </section>
  );
}
