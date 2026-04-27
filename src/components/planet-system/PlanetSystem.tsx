"use client";

import dynamic from "next/dynamic";

// R3F canvas must be client-only — no SSR
const PlanetScene = dynamic(() => import("./PlanetScene"), {
  ssr: false,
  loading: () => (
    <section
      id="planets"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-void-navy)",
      }}
    >
      <p
        style={{
          color: "rgba(168,170,191,0.5)",
          fontSize: "12px",
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          fontFamily: "var(--font-geist-mono, monospace)",
          animation: "pulse 2s ease-in-out infinite",
        }}
      >
        Initializing universe…
      </p>
    </section>
  ),
});

export default function PlanetSystem() {
  return <PlanetScene />;
}
