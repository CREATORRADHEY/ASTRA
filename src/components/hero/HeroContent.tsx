"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" as const } },
};

export default function HeroContent() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const heroHeight = 3 * window.innerHeight;
      setScrollProgress(Math.min(1, window.scrollY / (heroHeight - window.innerHeight)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const inviteOpacity = scrollProgress < 0.08 ? 1 - scrollProgress / 0.08 : 0;

  // Veil fades in between 8 % and 25 % scroll so it's invisible over the first frames
  const veilOpacity = scrollProgress < 0.08
    ? 0
    : Math.min(1, (scrollProgress - 0.08) / 0.17);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10">

      {/* Dark Void Navy veil — scroll-driven entry, separate from text */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(8,14,28,0.68) 0%, transparent 100%)",
          opacity: veilOpacity,
          transition: "opacity 0.25s ease",
          pointerEvents: "none",
        }}
      />

      {/* Text cluster — its own stagger animation, independent of veil */}
      <div style={{ padding: "3rem 4rem", position: "relative", transform: "translateY(-8vh)" }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          {/* Eyebrow — Cinzel brand mark */}
          <motion.p
            variants={itemVariants}
            className="font-display tracking-[0.6em] uppercase mb-10"
            style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.15rem)", color: "rgba(212,146,42,0.6)" }}
          >
            A &middot; S &middot; T &middot; R &middot; A
          </motion.p>

          {/* Main headline */}
          <motion.h1
            variants={itemVariants}
            className="glow-breathe leading-[1.02] tracking-tight select-none"
          >
            {/* Line 1 */}
            <span
              className="block font-display font-normal"
              style={{
                fontSize: "clamp(3rem, 7.5vw, 7rem)",
                color: "var(--color-moon-white)",
                letterSpacing: "0.03em",
              }}
            >
              Shaped by
            </span>

            {/* Line 2 — "thought." glows amber */}
            <span
              className="block font-display font-normal thought-glow"
              style={{
                fontSize: "clamp(3.5rem, 9vw, 8.5rem)",
                letterSpacing: "0.01em",
              }}
            >
              thought.
            </span>
          </motion.h1>

          {/* Separator with flanking ornaments */}
          <motion.div
            variants={itemVariants}
            className="my-8 flex items-center gap-4"
          >
            <span style={{ color: "rgba(212,146,42,0.3)", fontSize: "0.55rem", letterSpacing: "0.4em" }}>✦ ✦ ✦</span>
            <div
              className="w-32 h-px"
              style={{ background: "linear-gradient(to right, transparent, rgba(212,146,42,0.45), transparent)" }}
            />
            <span style={{ color: "rgba(212,146,42,0.3)", fontSize: "0.55rem", letterSpacing: "0.4em" }}>✦ ✦ ✦</span>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="mt-10 pointer-events-auto">
            <motion.a
              href="#ideas-forming"
              className="cta-pulse inline-flex items-center gap-3 px-10 py-4 rounded-full font-mono tracking-[0.3em] uppercase"
              style={{
                fontSize: "clamp(0.7rem, 1vw, 0.8rem)",
                border: "1px solid rgba(212,146,42,0.4)",
                color: "var(--color-soft-gold)",
                background: "rgba(255,255,255,0.11)",
              }}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.16)" }}
              whileTap={{ scale: 0.97 }}
            >
              <span>Enter the Universe</span>
              <span style={{ color: "rgba(212,146,42,0.65)" }}>→</span>
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll invitation — amber dot descending, fades at 8% scroll */}
      <div
        style={{
          position: "absolute", bottom: "2.5rem",
          left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
          opacity: inviteOpacity, pointerEvents: "none",
        }}
      >
        <div style={{ position: "relative", width: "1px", height: "44px", background: "rgba(212,146,42,0.25)" }}>
          <motion.div
            style={{
              position: "absolute", left: "-2px", top: 0,
              width: "5px", height: "5px", borderRadius: "50%",
              background: "rgba(212,146,42,0.9)",
              boxShadow: "0 0 8px rgba(212,146,42,0.6)",
            }}
            animate={{ top: [0, 39], opacity: [1, 0] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeIn" }}
          />
        </div>
        <span
          className="font-mono"
          style={{
            color: "rgba(232,223,192,0.3)",
            fontSize: "9px", letterSpacing: "0.45em",
            textTransform: "uppercase",
          }}
        >
          scroll
        </span>
      </div>
    </div>
  );
}
