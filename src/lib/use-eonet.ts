"use client";

import { useEffect, useState } from "react";
import type { AstraEvent } from "./eonet";

export function useEonetEvents() {
  const [events, setEvents] = useState<AstraEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/eonet");
        if (!res.ok) throw new Error(`${res.status}`);
        const data: AstraEvent[] = await res.json();
        if (!cancelled) setEvents(data);
      } catch (err) {
        console.error("Failed to fetch EONET events:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { events, loading };
}
