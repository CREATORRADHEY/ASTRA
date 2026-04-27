"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { AstronomyCard as CardData } from "./astronomy-data";

interface Props {
  card: CardData;
  index: number;
}

/**
 * Outer div receives a ref so the parent can set CSS vars:
 *   --card-scale   (default 1)
 *   --card-border  (default rgba(139,127,184,0.1))
 *   --card-shadow  (default 0 12px 40px rgba(0,0,0,0.55))
 *
 * All proximity effects are driven by those vars — zero React re-renders per frame.
 */
const AstronomyCard = forwardRef<HTMLDivElement, Props>(({ card, index }, ref) => {
  // Static brightness — based on card era, not viewport position
  const brightness = 0.45 + card.brightness * 0.5;

  // Year badge tone: amber for ancient, Star Blue for modern
  const warmth = 1 - card.brightness;
  const yr = Math.round(212 + (1 - warmth) * (155 - 212));
  const yg = Math.round(146 + (1 - warmth) * (184 - 146));
  const yb = Math.round(42  + (1 - warmth) * (212 - 42));
  const yearColor = `rgba(${yr},${yg},${yb},${Math.max(0.55, brightness)})`;

  const floatDuration = 5.5 + (index % 3) * 0.9;

  return (
    // Outer wrapper — receives forwardRef and CSS vars from parent
    <div
      ref={ref}
      style={{ width: "340px", flexShrink: 0, userSelect: "none" }}
    >
      {/* Framer Motion handles only the float — no proximity state */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Scale + border + glow driven by CSS vars — updated imperatively by parent */}
        <div
          className="rounded-xl overflow-hidden backdrop-blur-sm"
          style={{
            transform:       "scale(var(--card-scale, 1))",
            transformOrigin: "center bottom",
            border:          "1px solid var(--card-border, rgba(139,127,184,0.1))",
            boxShadow:       "var(--card-shadow, 0 12px 40px rgba(0,0,0,0.55))",
            transition:      "transform 0.25s ease, box-shadow 0.25s ease",
          }}
        >
          {/* ── Image ── */}
          <div className="relative overflow-hidden" style={{ height: "300px" }}>
            <Image
              src={card.imageUrl}
              alt={card.title}
              fill
              sizes="340px"
              className="object-cover"
              style={{ filter: `grayscale(0.25) brightness(${(0.5 + brightness * 0.55).toFixed(2)}) saturate(0.8)` }}
            />

            {/* Deep Indigo screen tint */}
            <div
              className="absolute inset-0"
              style={{ background: "rgba(26,34,64,0.2)", mixBlendMode: "screen" }}
            />

            {/* Bottom gradient into card body */}
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: "140px",
                background: "linear-gradient(to top, rgba(8,14,28,1) 0%, rgba(8,14,28,0.55) 55%, transparent 100%)",
              }}
            />

            {/* Year badge — top left */}
            <span
              className="absolute top-5 left-5 font-display text-xs tracking-[0.35em] uppercase"
              style={{ color: yearColor }}
            >
              {card.year}
            </span>

            {/* Era brightness bar — top right */}
            <div className="absolute top-5 right-5 flex gap-1" style={{ opacity: 0.65 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    height: "12px",
                    background: i / 4 <= card.brightness
                      ? `rgba(${yr},${yg},${yb},0.8)`
                      : "rgba(139,127,184,0.18)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Text section ── */}
          <div
            className="px-6 pt-5 pb-6"
            style={{
              background: "linear-gradient(180deg, rgba(8,14,28,1) 0%, rgba(26,34,64,0.85) 100%)",
            }}
          >
            {/* Title */}
            <h3
              className="font-display font-normal leading-snug"
              style={{
                fontSize: "1.05rem",
                letterSpacing: "0.03em",
                color: `rgba(232,223,192,${brightness.toFixed(2)})`,
              }}
            >
              {card.title}
            </h3>

            {/* Subtitle */}
            {card.subtitle && (
              <p
                className="font-mono text-xs tracking-wide mt-1"
                style={{ color: `rgba(155,184,212,${Math.max(0.45, brightness * 0.85).toFixed(2)})` }}
              >
                {card.subtitle}
              </p>
            )}

            {/* Lavender rule */}
            <div
              className="my-4 h-px"
              style={{ background: "linear-gradient(to right, rgba(139,127,184,0.22), transparent)" }}
            />

            {/* Era fact */}
            <p
              className="font-sans text-xs font-light leading-relaxed"
              style={{ color: `rgba(168,170,191,${Math.max(0.45, brightness * 0.8).toFixed(2)})` }}
            >
              {card.fact}
            </p>

            {/* Poetic line */}
            <p
              className="font-sans text-sm font-light italic leading-relaxed mt-3"
              style={{ color: `rgba(232,223,192,${Math.max(0.42, brightness * 0.75).toFixed(2)})` }}
            >
              &ldquo;{card.line}&rdquo;
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

AstronomyCard.displayName = "AstronomyCard";
export default AstronomyCard;
