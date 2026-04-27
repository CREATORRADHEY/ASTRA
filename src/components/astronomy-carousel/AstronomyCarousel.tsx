"use client";

import { useEffect, useRef } from "react";
import { ASTRONOMY_CARDS } from "./astronomy-data";
import AstronomyCard from "./AstronomyCard";

const DRIFT_SPEED = 0.85; // px per frame at 60fps
const GAP         = 32;
const CARD_WIDTH  = 340;

const tripled        = [...ASTRONOMY_CARDS, ...ASTRONOMY_CARDS, ...ASTRONOMY_CARDS];
const singleSetWidth = ASTRONOMY_CARDS.length * (CARD_WIDTH + GAP);

export default function AstronomyCarousel() {
  const trackRef          = useRef<HTMLDivElement>(null);
  const cardRefs          = useRef<(HTMLDivElement | null)[]>([]);
  const offsetRef         = useRef(0);
  const isDragging        = useRef(false);
  const dragStartX        = useRef(0);
  const dragStartOffset   = useRef(0);
  const animRef           = useRef<number>(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // ── Helpers ──────────────────────────────────────────────────────────────
    function applyTransform(offset: number) {
      track!.style.transform = `translateX(${offset}px)`;
    }

    function wrapOffset(v: number): number {
      if (v < -singleSetWidth) return v + singleSetWidth;
      if (v > 0)               return v - singleSetWidth;
      return v;
    }

    // Per-card proximity → CSS vars on each card wrapper (no React re-render)
    function updateProximity(offset: number) {
      const vpCenter = window.innerWidth / 2;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const cardCenter = offset + i * (CARD_WIDTH + GAP) + CARD_WIDTH / 2;
        const dist = Math.abs(cardCenter - vpCenter);
        const prox = Math.max(0, 1 - dist / vpCenter);
        el.style.setProperty("--card-scale",  `${(1 + prox * 0.04).toFixed(4)}`);
        el.style.setProperty("--card-border", `rgba(139,127,184,${(0.1 + prox * 0.28).toFixed(3)})`);
        el.style.setProperty("--card-shadow",
          `0 0 60px rgba(212,146,42,${(0.03 + prox * 0.22).toFixed(3)}), 0 12px 40px rgba(0,0,0,0.55)`);
      });
    }

    // ── Animation loop ────────────────────────────────────────────────────────
    let lastTime = performance.now();

    function tick(now: number) {
      const delta = now - lastTime;
      lastTime = now;

      if (!isDragging.current) {
        offsetRef.current = wrapOffset(
          offsetRef.current - DRIFT_SPEED * (delta / 16.67)
        );
        applyTransform(offsetRef.current);
        updateProximity(offsetRef.current);
      }

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);

    // ── Pointer handlers (attached imperatively to avoid inline re-bind) ─────
    function onPointerDown(e: PointerEvent) {
      isDragging.current    = true;
      dragStartX.current    = e.clientX;
      dragStartOffset.current = offsetRef.current;
      try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch (_) { /* */ }
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging.current) return;
      const next = wrapOffset(dragStartOffset.current + (e.clientX - dragStartX.current));
      offsetRef.current = next;
      applyTransform(next);
      updateProximity(next);
    }

    function onPointerUp() { isDragging.current = false; }

    track.addEventListener("pointerdown",   onPointerDown);
    track.addEventListener("pointermove",   onPointerMove);
    track.addEventListener("pointerup",     onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);

    return () => {
      cancelAnimationFrame(animRef.current);
      track.removeEventListener("pointerdown",   onPointerDown);
      track.removeEventListener("pointermove",   onPointerMove);
      track.removeEventListener("pointerup",     onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <section id="astronomy" className="relative py-24 overflow-hidden">
      {/* Edge-fade mask — replaces JS-driven per-card dimming */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to right, var(--color-void-navy) 0%, transparent 12%, transparent 88%, var(--color-void-navy) 100%)",
        }}
      />

      {/* Section header */}
      <div className="text-center mb-16 px-8">
        <p className="text-xs font-mono tracking-[0.35em] uppercase mb-3"
           style={{ color: "rgba(155,184,212,0.5)" }}>
          Astronomy Through Time
        </p>
        <h2 className="font-display font-normal text-2xl md:text-3xl mb-2"
            style={{ color: "var(--color-moon-white)", letterSpacing: "0.04em" }}>
          How we learned to read the sky
        </h2>
        <p className="text-sm font-light tracking-widest"
           style={{ color: "var(--color-dim-text)" }}>
          From pattern to proof — seven turning points
        </p>
      </div>

      {/* Carousel track — no inline transform state, CSS var driven */}
      <div
        ref={trackRef}
        className="flex items-center cursor-grab active:cursor-grabbing"
        style={{
          gap: `${GAP}px`,
          paddingLeft: "10vw",
          willChange: "transform",
        }}
      >
        {tripled.map((card, i) => (
          <AstronomyCard
            key={`${card.id}-${Math.floor(i / ASTRONOMY_CARDS.length)}`}
            ref={(el) => { cardRefs.current[i] = el; }}
            card={card}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}
