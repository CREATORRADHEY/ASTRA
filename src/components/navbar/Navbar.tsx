"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Ideas",    href: "#ideas-forming" },
  { label: "Universe", href: "#planets" },
  { label: "Signals",  href: "#signals" },
  { label: "Feed",     href: "#event-feed" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 transition-all duration-500"
      animate={{
        backdropFilter: scrolled ? "blur(18px)" : "blur(0px)",
        backgroundColor: scrolled ? "rgba(8,14,28,0.65)" : "rgba(8,14,28,0)",
        borderBottomColor: scrolled ? "rgba(139,127,184,0.14)" : "rgba(139,127,184,0)",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Logo — Cinzel display font with amber star */}
      <a href="#" className="flex items-center gap-3 group">
        <span
          className="star-pulse"
          style={{ color: "var(--color-amber-glow)", lineHeight: 1, fontSize: "1.25rem" }}
        >
          ✦
        </span>
        <span
          className="font-display tracking-[0.4em] uppercase"
          style={{ fontSize: "1rem", color: "var(--color-moon-white)" }}
        >
          Astra
        </span>
      </a>

      {/* Nav links */}
      <ul className="hidden md:flex items-center gap-12">
        {navLinks.map((link) => (
          <li key={link.label}>
            <motion.a
              href={link.href}
              className="relative font-mono tracking-[0.22em] uppercase transition-colors duration-300"
              style={{ fontSize: "0.8rem", color: "var(--color-dim-text)" }}
              whileHover="hover"
              onHoverStart={(e) => {
                const el = e.target as HTMLElement;
                el.style.color = "var(--color-moon-white)";
              }}
              onHoverEnd={(e) => {
                const el = e.target as HTMLElement;
                el.style.color = "var(--color-dim-text)";
              }}
            >
              {link.label}

              {/* Amber underline glow */}
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-px"
                style={{
                  background: "linear-gradient(to right, transparent, var(--color-amber-glow), transparent)",
                  originX: 0.5,
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                variants={{ hover: { scaleX: 1, opacity: 0.7 } }}
                transition={{ duration: 0.22 }}
              />

              {/* Ambient glow blur behind link on hover */}
              <motion.span
                className="absolute inset-0 -mx-2 -my-1 rounded"
                style={{ background: "rgba(212,146,42,0.06)", pointerEvents: "none" }}
                initial={{ opacity: 0 }}
                variants={{ hover: { opacity: 1 } }}
                transition={{ duration: 0.2 }}
              />
            </motion.a>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
