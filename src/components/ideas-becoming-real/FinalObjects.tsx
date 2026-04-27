"use client";

import { forwardRef } from "react";

interface FinalObjectsProps {
  progress: number;
  width: number;
  height: number;
}

const FinalObjects = forwardRef<SVGSVGElement, FinalObjectsProps>(
  ({ progress, width, height }, ref) => {
    const objectAlpha = Math.max(0, Math.min(1, (progress - 0.7) / 0.25));
    const objectScale = 1.2 + objectAlpha * 0.8;
    const blurAmount  = (1 - objectAlpha) * 6;

    if (objectAlpha <= 0) return null;

    const cx1 = width * 0.22;
    const cx2 = width * 0.5;
    const cx3 = width * 0.78;
    const cy  = height * 0.5;

    return (
      <svg
        ref={ref}
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${width} ${height}`}
        style={{ opacity: objectAlpha, filter: `blur(${blurAmount}px)` }}
      >
        {/* Book — Star Blue strokes */}
        <g transform={`translate(${cx1}, ${cy}) scale(${objectScale})`} opacity={objectAlpha}>
          <path
            d="M-30 -20 L-2 -15 L-2 25 L-30 20 Z"
            fill="rgba(155, 184, 212, 0.05)"
            stroke="rgba(155, 184, 212, 0.78)"
            strokeWidth="1.5"
          />
          <path
            d="M30 -20 L2 -15 L2 25 L30 20 Z"
            fill="rgba(155, 184, 212, 0.05)"
            stroke="rgba(155, 184, 212, 0.78)"
            strokeWidth="1.5"
          />
          <line x1="0" y1="-18" x2="0" y2="27"
            stroke="rgba(155, 184, 212, 0.5)" strokeWidth="1.2" />
          {[-8, -2, 4, 10].map((y) => (
            <line key={y} x1="-24" y1={y} x2="-6" y2={y - 1}
              stroke="rgba(155, 184, 212, 0.35)" strokeWidth="0.8" />
          ))}
          <ellipse cx="0" cy="3" rx="35" ry="28" fill="rgba(155, 184, 212, 0.06)" />
        </g>

        {/* Interface Panel — Lavender strokes */}
        <g transform={`translate(${cx2}, ${cy}) scale(${objectScale})`} opacity={objectAlpha}>
          <rect x="-40" y="-28" width="80" height="56" rx="3"
            fill="rgba(139, 127, 184, 0.04)"
            stroke="rgba(139, 127, 184, 0.78)" strokeWidth="1.5" />
          <line x1="-40" y1="-16" x2="40" y2="-16"
            stroke="rgba(139, 127, 184, 0.45)" strokeWidth="0.8" />
          {[-32, -26, -20].map((x) => (
            <circle key={x} cx={x} cy="-22" r="2" fill="rgba(139, 127, 184, 0.65)" />
          ))}
          {[{ y: -6, len: 52 }, { y: 2, len: 44 }, { y: 10, len: 48 }, { y: 18, len: 38 }].map(({ y, len }) => (
            <line key={y} x1="-32" y1={y} x2={-32 + len} y2={y}
              stroke="rgba(139, 127, 184, 0.35)" strokeWidth="0.8" />
          ))}
          <rect x="16" y="-8" width="18" height="26" rx="1"
            fill="rgba(139, 127, 184, 0.08)"
            stroke="rgba(139, 127, 184, 0.4)" strokeWidth="0.8" />
          <ellipse cx="0" cy="0" rx="50" ry="35" fill="rgba(139, 127, 184, 0.06)" />
        </g>

        {/* Orb / Core — Amber/Gold strokes */}
        <g transform={`translate(${cx3}, ${cy}) scale(${objectScale})`} opacity={objectAlpha}>
          <circle cx="0" cy="0" r="24"
            fill="none" stroke="rgba(212, 146, 42, 0.65)" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="16"
            fill="none" stroke="rgba(212, 146, 42, 0.75)" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="6" fill="rgba(242, 201, 109, 0.6)" />
          <circle cx="0" cy="0" r="32" fill="rgba(212, 146, 42, 0.08)" />
          <ellipse cx="0" cy="0" rx="32" ry="12"
            fill="none" stroke="rgba(212, 146, 42, 0.35)" strokeWidth="0.8"
            transform="rotate(-20)" />
        </g>
      </svg>
    );
  }
);

FinalObjects.displayName = "FinalObjects";
export default FinalObjects;
