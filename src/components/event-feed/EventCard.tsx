"use client";

import type { AstraEvent, EventKind } from "@/lib/eonet";
import { relativeTime } from "@/lib/eonet";

interface Props { event: AstraEvent; }

// PRD palette: Amber / Lavender / Soft Gold per kind
const KIND_ACCENT: Record<EventKind, string> = {
  "thermal-surge":           "212, 146, 42",   // Amber
  "atmospheric-disturbance": "139, 127, 184",  // Lavender
  "geological-activity":     "242, 201, 109",  // Soft Gold
};

export default function EventCard({ event }: Props) {
  const accent   = KIND_ACCENT[event.kind];
  const isActive = event.status === "active";

  return (
    <div
      className="flex-shrink-0 rounded-xl p-5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03]"
      style={{
        width: "240px",
        border: `1px solid rgba(139, 127, 184, 0.18)`,   // Lavender border for all cards
        background: "linear-gradient(135deg, rgba(26,34,64,0.55) 0%, rgba(8,14,28,0.85) 100%)",
        boxShadow: isActive
          ? `0 0 28px rgba(${accent}, 0.14), 0 4px 20px rgba(0,0,0,0.35)`
          : `0 4px 20px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Kind label row with pulsing active dot */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          {isActive && (
            <span
              className="absolute inline-flex h-full w-full rounded-full dot-ping"
              style={{ backgroundColor: `rgba(${accent}, 0.5)` }}
            />
          )}
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{
              backgroundColor: `rgba(${accent}, ${isActive ? 0.9 : 0.35})`,
              boxShadow: isActive ? `0 0 8px rgba(${accent}, 0.7)` : "none",
            }}
          />
        </span>
        <span
          className="text-xs font-mono tracking-[0.15em] uppercase"
          style={{ color: `rgba(${accent}, 0.88)` }}
        >
          {event.label}
        </span>
      </div>

      {/* Location — Moon White */}
      <p
        className="text-sm font-light leading-relaxed mb-3 truncate"
        style={{ color: "rgba(232, 223, 192, 0.9)" }}
      >
        {event.location}
      </p>

      {/* Lavender divider */}
      <div
        className="h-px mb-3"
        style={{ background: "linear-gradient(to right, rgba(139,127,184,0.2), transparent)" }}
      />

      {/* Time + Status */}
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wide" style={{ color: "rgba(168,170,191,0.7)" }}>
          {relativeTime(event.date)}
        </span>
        <span
          className="text-xs tracking-wider uppercase font-mono"
          style={{
            color: isActive
              ? `rgba(${accent}, 0.85)`     // Amber/Gold/Lavender per kind
              : "rgba(168, 170, 191, 0.45)", // Dim Text
          }}
        >
          {isActive ? "Active" : "Resolved"}
        </span>
      </div>
    </div>
  );
}
