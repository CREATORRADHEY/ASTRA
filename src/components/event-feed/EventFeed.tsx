"use client";

import { useEffect, useRef } from "react";
import { useEonetEvents } from "@/lib/use-eonet";
import EventCard from "./EventCard";

const DRIFT_SPEED = 0.3;
const GAP         = 24;
const CARD_WIDTH  = 256;

export default function EventFeed() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const trackRef    = useRef<HTMLDivElement>(null);
  const offsetRef   = useRef(0);
  const isPausedRef = useRef(false);
  const isDragging  = useRef(false);
  const dragStartX  = useRef(0);
  const dragStartOffset = useRef(0);
  const animRef     = useRef<number>(0);

  const { events, loading } = useEonetEvents();

  const tripled        = events.length > 0 ? [...events, ...events, ...events] : [];
  const singleSetWidth = events.length * (CARD_WIDTH + GAP);

  // Pause when off-screen
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([e]) => { isPausedRef.current = !e.isIntersecting; },
      { threshold: 0.05 }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  // Animation loop — direct DOM mutation, zero React re-renders per frame
  useEffect(() => {
    if (events.length === 0) return;
    const track = trackRef.current;
    if (!track) return;

    function wrapOffset(v: number) {
      if (v < -singleSetWidth) return v + singleSetWidth;
      if (v > 0)               return v - singleSetWidth;
      return v;
    }

    let lastTime = performance.now();

    function tick(now: number) {
      const delta = now - lastTime;
      lastTime = now;

      if (!isPausedRef.current && !isDragging.current) {
        offsetRef.current = wrapOffset(offsetRef.current - DRIFT_SPEED * (delta / 16.67));
        track!.style.transform = `translateX(${offsetRef.current}px)`;
      }

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);

    function onPointerDown(e: PointerEvent) {
      isDragging.current      = true;
      dragStartX.current      = e.clientX;
      dragStartOffset.current = offsetRef.current;
      try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch (_) { /* */ }
    }
    function onPointerMove(e: PointerEvent) {
      if (!isDragging.current) return;
      const next = wrapOffset(dragStartOffset.current + (e.clientX - dragStartX.current));
      offsetRef.current = next;
      track!.style.transform = `translateX(${next}px)`;
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
  }, [events.length, singleSetWidth]);

  return (
    <section ref={sectionRef} id="event-feed" className="relative py-20 overflow-hidden">
      <div className="text-center mb-12 px-8">
        <p className="font-mono text-xs tracking-[0.35em] uppercase mb-3" style={{ color: "rgba(155,184,212,0.5)" }}>
          Live Signals
        </p>
        <h2 className="font-display font-normal text-2xl md:text-3xl mb-2"
            style={{ color: "var(--color-moon-white)", letterSpacing: "0.04em" }}>
          Event Feed
        </h2>
        <p className="font-sans font-light text-sm tracking-widest" style={{ color: "var(--color-dim-text)" }}>
          A continuous stream of planetary signals
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <p className="text-astra-text-dim text-sm tracking-widest animate-pulse">Receiving transmissions...</p>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <p className="text-astra-text-dim text-sm tracking-widest">No active signals detected.</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div
          ref={trackRef}
          className="flex items-stretch cursor-grab active:cursor-grabbing"
          style={{ gap: `${GAP}px`, paddingLeft: "8vw", willChange: "transform" }}
        >
          {tripled.map((event, i) => (
            <EventCard
              key={`${event.id}-${Math.floor(i / events.length)}`}
              event={event}
            />
          ))}
        </div>
      )}
    </section>
  );
}
