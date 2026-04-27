"use client";

import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const barRef   = useRef<HTMLDivElement>(null);
  const headRef  = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const bar   = barRef.current;
    const head  = headRef.current;
    const track = trackRef.current;
    if (!bar || !head || !track) return;

    function updateBar() {
      const scrolled = window.scrollY;
      const total    = document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? Math.min(1, scrolled / total) : 0;
      const pct = progress * 100;
      bar!.style.height = `${pct}vh`;
      head!.style.top   = `${pct}vh`;
    }

    function scrollToRatio(clientY: number) {
      const rect  = track!.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const total = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: ratio * total, behavior: "instant" });
    }

    function onPointerDown(e: PointerEvent) {
      e.preventDefault();
      isDragging.current = true;
      try { track!.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      scrollToRatio(e.clientY);
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging.current) return;
      scrollToRatio(e.clientY);
    }

    function onPointerUp() {
      isDragging.current = false;
    }

    function onClick(e: MouseEvent) {
      scrollToRatio(e.clientY);
    }

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("click", onClick);
    window.addEventListener("scroll", updateBar, { passive: true });
    updateBar();

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
      track.removeEventListener("click", onClick);
      window.removeEventListener("scroll", updateBar);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      style={{
        position: "fixed", top: 0, right: 0,
        width: "16px", height: "100vh",
        zIndex: 9999,
        cursor: "pointer",
        pointerEvents: "auto",
        // Transparent hit area — visual bar is centered within it
        display: "flex", justifyContent: "center",
      }}
    >
      {/* Visual track — 2px centered line */}
      <div style={{ position: "relative", width: "2px", height: "100%" }}>
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(212, 146, 42, 0.08)" }} />
        {/* Filled bar — Amber */}
        <div
          ref={barRef}
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: "0vh",
            backgroundColor: "rgba(212, 146, 42, 0.5)",
            transition: "height 0.05s linear",
          }}
        />
        {/* Leading dot */}
        <div
          ref={headRef}
          style={{
            position: "absolute", left: "-1px", top: 0,
            width: "4px", height: "4px",
            borderRadius: "50%",
            backgroundColor: "rgba(212, 146, 42, 0.85)",
            transform: "translateY(-2px)",
            transition: "top 0.05s linear",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
