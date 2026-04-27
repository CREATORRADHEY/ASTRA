"use client";

import { useEffect, useRef } from "react";

type CursorState = "default" | "hover" | "cta" | "canvas";

export default function AstraCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<CursorState>("default");
  const ringPos = useRef({ x: -100, y: -100 });
  const dotPos = useRef({ x: -100, y: -100 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    // Disable on touch devices
    if ("ontouchstart" in window) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    function setPos(x: number, y: number) {
      dotPos.current = { x, y };
      dot!.style.transform = `translate(${x}px, ${y}px)`;
    }

    function onMouseMove(e: MouseEvent) {
      setPos(e.clientX, e.clientY);
    }

    // rAF lerp loop for ring
    function tick() {
      const { x: tx, y: ty } = dotPos.current;
      const rx = ringPos.current.x + (tx - ringPos.current.x) * 0.12;
      const ry = ringPos.current.y + (ty - ringPos.current.y) * 0.12;
      ringPos.current = { x: rx, y: ry };
      ring!.style.transform = `translate(${rx}px, ${ry}px)`;
      animRef.current = requestAnimationFrame(tick);
    }

    // Per-state visual spec — Amber default, Star Blue hover, Gold CTA, Lavender canvas
    const STATE_STYLES: Record<CursorState, {
      dotSize: string; dotColor: string;
      ringSize: string; ringColor: string; ringBg: string;
    }> = {
      default: {
        dotSize:   "9px",
        dotColor:  "rgba(212, 146, 42, 0.92)",   // Amber
        ringSize:  "40px",
        ringColor: "rgba(212, 146, 42, 0.38)",
        ringBg:    "transparent",
      },
      hover: {
        dotSize:   "5px",
        dotColor:  "rgba(155, 184, 212, 0.92)",   // Star Blue
        ringSize:  "58px",
        ringColor: "rgba(155, 184, 212, 0.22)",
        ringBg:    "rgba(155, 184, 212, 0.05)",
      },
      cta: {
        dotSize:   "6px",
        dotColor:  "rgba(242, 201, 109, 0.95)",   // Soft Gold
        ringSize:  "58px",
        ringColor: "rgba(242, 201, 109, 0.3)",
        ringBg:    "rgba(242, 201, 109, 0.06)",
      },
      canvas: {
        dotSize:   "8px",
        dotColor:  "rgba(139, 127, 184, 0.8)",    // Lavender
        ringSize:  "48px",
        ringColor: "rgba(139, 127, 184, 0.25)",
        ringBg:    "transparent",
      },
    };

    function applyState(state: CursorState) {
      if (stateRef.current === state) return;
      stateRef.current = state;
      const s = STATE_STYLES[state];
      dot!.style.width  = s.dotSize;
      dot!.style.height = s.dotSize;
      dot!.style.marginLeft = `calc(-${s.dotSize} / 2)`;
      dot!.style.marginTop  = `calc(-${s.dotSize} / 2)`;
      dot!.style.backgroundColor = s.dotColor;
      ring!.style.width  = s.ringSize;
      ring!.style.height = s.ringSize;
      ring!.style.marginLeft = `calc(-${s.ringSize} / 2)`;
      ring!.style.marginTop  = `calc(-${s.ringSize} / 2)`;
      ring!.style.borderColor     = s.ringColor;
      ring!.style.backgroundColor = s.ringBg;
    }

    // Event delegation — single listener on document instead of per-element attachment
    function onMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (target.closest(".cta-pulse")) {
        applyState("cta");
      } else if (target.tagName === "CANVAS") {
        applyState("canvas");
      } else if (target.closest("a, button, [role='button']")) {
        applyState("hover");
      } else {
        applyState("default");
      }
    }

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);
    animRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: "fixed", top: 0, left: 0,
          width: "9px", height: "9px",
          marginLeft: "-4.5px", marginTop: "-4.5px",
          borderRadius: "50%",
          backgroundColor: "rgba(212, 146, 42, 0.92)",
          pointerEvents: "none", zIndex: 99999,
          transition: "width 0.18s ease, height 0.18s ease, background-color 0.18s ease",
          willChange: "transform",
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: "fixed", top: 0, left: 0,
          width: "40px", height: "40px",
          marginLeft: "-20px", marginTop: "-20px",
          borderRadius: "50%",
          border: "1px solid rgba(212, 146, 42, 0.38)",
          backgroundColor: "transparent",
          pointerEvents: "none", zIndex: 99998,
          transition: "width 0.22s ease, height 0.22s ease, border-color 0.22s ease, background-color 0.22s ease",
          willChange: "transform",
        }}
      />
    </>
  );
}
