"use client";

import Starfield from "./Starfield";

export default function AstraBackground() {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      {/* Layer 1 — Void Navy → Deep Indigo gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse 130% 90% at 50% 20%,
              #1A2240 0%,
              #0D1530 35%,
              #080E1C 65%,
              #080E1C 100%
            )
          `,
        }}
      />

      {/* Layer 2 — Starfield (Star Blue particles) */}
      <Starfield />

      {/* Layer 3 — Subtle nebula tint: Lavender cloud at top */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse 80% 40% at 20% 10%,
              rgba(139, 127, 184, 0.06) 0%,
              transparent 70%
            ),
            radial-gradient(
              ellipse 60% 30% at 80% 15%,
              rgba(155, 184, 212, 0.04) 0%,
              transparent 70%
            )
          `,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
