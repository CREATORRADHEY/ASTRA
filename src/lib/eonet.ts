/**
 * EONET data fetching and transformation.
 * Fetches wildfires, severe storms, and volcanoes separately so each category
 * is equally represented regardless of how many exist in the database.
 */

export type EventKind = "thermal-surge" | "atmospheric-disturbance" | "geological-activity";

export interface AstraEvent {
  id:       string;
  kind:     EventKind;
  label:    string;
  location: string;
  date:     string;
  status:   string;
  lat:      number;
  lng:      number;
}

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORIES: Array<{ slug: string; kind: EventKind; label: string }> = [
  { slug: "wildfires",    kind: "thermal-surge",           label: "Thermal Surge"           },
  { slug: "severeStorms", kind: "atmospheric-disturbance", label: "Atmospheric Disturbance" },
  { slug: "volcanoes",    kind: "geological-activity",     label: "Geological Activity"      },
];

// ── Raw API types ──────────────────────────────────────────────────────────────
interface EonetGeometry {
  date: string;
  type: string;
  coordinates: number[];
}

interface EonetRawEvent {
  id:         string;
  title:      string;
  categories: Array<{ id: string; title: string }>;
  geometry:   EonetGeometry[];
  closed:     string | null;
}

interface EonetResponse {
  events: EonetRawEvent[];
}

// ── Location string cleanup ────────────────────────────────────────────────────
function simplifyLocation(title: string): string {
  let loc = title
    .replace(/^(Wildfire|Volcano|Severe Storm|Storm|Tropical|Super Typhoon|Typhoon|Hurricane)[\s\-–—]*/i, "")
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/^rx[\s\-]*/i, "")
    .replace(/\bRX\b\s*/g, "")
    .replace(/\s*(Prescribed Fire|Wildfire|Non-Statistical\/Other)/gi, "")
    .replace(/\b([NSEW])\s+of\b/gi, (_, d: string) => ({N:"North",S:"South",E:"East",W:"West"}[d.toUpperCase() as "N"|"S"|"E"|"W"] ?? d) + " of")
    .replace(/&#0?39;/g, "'").replace(/&amp;/g, "&")
    .replace(/[\s\-–—]+/g, " ").trim();

  const parts = loc.split(",").map(s => s.trim());
  if (parts.length >= 3) loc = `${parts[0]}, ${parts[parts.length - 1]}`;
  return loc.length >= 3 ? loc : "Unknown region";
}

// ── Transform one raw event ────────────────────────────────────────────────────
function transformEvent(raw: EonetRawEvent, kind: EventKind, label: string): AstraEvent | null {
  const latestGeo = raw.geometry[raw.geometry.length - 1];
  if (!latestGeo?.coordinates?.length) return null;

  // GeoJSON coordinates: [longitude, latitude]
  const [lng, lat] = latestGeo.coordinates;
  // Skip events with invalid coordinates
  if (lat === 0 && lng === 0) return null;

  return {
    id:       raw.id,
    kind,
    label,
    location: simplifyLocation(raw.title),
    date:     latestGeo.date ?? new Date().toISOString(),
    status:   raw.closed ? "closed" : "active",
    lat,
    lng,
  };
}

// ── Fetch ──────────────────────────────────────────────────────────────────────
// Fetch each category separately → guaranteed representation of all three types.
// 50 events per category, open only, last 30 days.
const BASE = "https://eonet.gsfc.nasa.gov/api/v3/events";

export async function fetchEonetEvents(): Promise<AstraEvent[]> {
  const responses = await Promise.all(
    CATEGORIES.map(({ slug }) =>
      fetch(`${BASE}?days=30&limit=50&status=open&category=${slug}`, {
        next: { revalidate: 600 },
      })
        .then(r => r.ok ? (r.json() as Promise<EonetResponse>) : Promise.resolve({ events: [] }))
        .catch((): EonetResponse => ({ events: [] }))
    )
  );

  const all: AstraEvent[] = [];
  responses.forEach((data, i) => {
    const { kind, label } = CATEGORIES[i];
    data.events.forEach(raw => {
      const ev = transformEvent(raw, kind, label);
      if (ev) all.push(ev);
    });
  });

  return all;
}

// ── Utilities ──────────────────────────────────────────────────────────────────
export function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
