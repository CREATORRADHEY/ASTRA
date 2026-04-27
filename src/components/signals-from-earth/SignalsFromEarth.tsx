"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEonetEvents } from "@/lib/use-eonet";
import type { AstraEvent, EventKind } from "@/lib/eonet";
import { relativeTime } from "@/lib/eonet";

// ── Palette ────────────────────────────────────────────────────────────────────
const KIND_COLORS: Record<EventKind, { r: number; g: number; b: number; hex: string }> = {
  "thermal-surge":           { r: 212, g: 146, b: 42,  hex: "#D4922A" },
  "atmospheric-disturbance": { r: 139, g: 127, b: 184, hex: "#8B7FB8" },
  "geological-activity":     { r: 242, g: 201, b: 109, hex: "#F2C96D" },
};

const KIND_LABELS: Record<EventKind, string> = {
  "thermal-surge":           "Thermal Surge",
  "atmospheric-disturbance": "Atmospheric Disturbance",
  "geological-activity":     "Geological Activity",
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

// ── Projection helpers ─────────────────────────────────────────────────────────
function lngLatToXY(lng: number, lat: number, w: number, h: number) {
  return { x: ((lng + 180) / 360) * w, y: ((90 - lat) / 180) * h };
}

function clampPan(px: number, py: number, zoom: number, w: number, h: number) {
  if (zoom <= 1) return { x: 0, y: 0 };
  return {
    x: Math.max(w * (1 - zoom), Math.min(0, px)),
    y: Math.max(h * (1 - zoom), Math.min(0, py)),
  };
}

// ── GeoJSON types ──────────────────────────────────────────────────────────────
interface GeoFeature { geometry: { type: string; coordinates: unknown } }
interface GeoData    { features: GeoFeature[] }

// ── Draw land to any canvas context ───────────────────────────────────────────
function drawLand(ctx: CanvasRenderingContext2D, geo: GeoData, w: number, h: number) {
  ctx.beginPath();
  for (const feat of geo.features) {
    const { type, coordinates } = feat.geometry;
    const polys = type === "MultiPolygon"
      ? (coordinates as number[][][][])
      : [(coordinates as number[][][])];
    for (const poly of polys) {
      for (const ring of poly) {
        (ring as number[][]).forEach(([lng, lat], i) => {
          const x = ((lng + 180) / 360) * w;
          const y = ((90 - lat) / 180) * h;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
      }
    }
  }
  ctx.fillStyle   = "rgba(55,85,145,0.8)";
  ctx.fill();
  ctx.strokeStyle = "rgba(155,184,212,0.45)";
  ctx.lineWidth   = 0.5;
  ctx.stroke();
}

// ── Info card ──────────────────────────────────────────────────────────────────
function InfoCard({ event, onClose }: { event: AstraEvent; onClose: () => void }) {
  const c = KIND_COLORS[event.kind];
  return (
    <div style={{
      position: "absolute", top: "12px", right: "12px", width: "220px", zIndex: 20,
      background: "rgba(8,14,28,0.97)", border: `1px solid ${c.hex}35`,
      borderRadius: "12px", padding: "15px", backdropFilter: "blur(20px)",
      boxShadow: `0 0 40px ${c.hex}15, 0 8px 32px rgba(0,0,0,0.7)`,
      animation: "fadeInCard 0.22s ease",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: "10px", right: "11px",
        background: "none", border: "none", color: "rgba(168,170,191,0.5)",
        cursor: "pointer", fontSize: "12px",
      }}>✕</button>
      <span style={{
        display: "block", fontFamily: "var(--font-geist-mono, monospace)",
        fontSize: "8px", letterSpacing: "0.3em", textTransform: "uppercase",
        color: c.hex, marginBottom: "7px",
      }}>{KIND_LABELS[event.kind]}</span>
      <h3 style={{
        fontFamily: "var(--font-display, serif)", fontSize: "14px", fontWeight: 400,
        letterSpacing: "0.04em", color: "rgba(232,223,192,0.88)", marginBottom: "10px", lineHeight: 1.35,
      }}>{event.location}</h3>
      <div style={{ height: "1px", background: `linear-gradient(to right, ${c.hex}30, transparent)`, marginBottom: "10px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "10px", color: "rgba(168,170,191,0.55)" }}>
          {relativeTime(event.date)}
        </span>
        <span style={{
          fontFamily: "var(--font-geist-mono, monospace)", fontSize: "9px",
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: event.status === "active" ? c.hex : "rgba(168,170,191,0.4)",
          padding: "2px 8px", borderRadius: "100px",
          border: `1px solid ${event.status === "active" ? c.hex + "40" : "rgba(168,170,191,0.2)"}`,
        }}>{event.status}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SignalsFromEarth() {
  const sectionRef   = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const animRef      = useRef<number>(0);
  const isPausedRef  = useRef(false);
  const geoRef       = useRef<GeoData | null>(null);
  const eventsRef    = useRef<AstraEvent[]>([]);

  // Zoom / pan in refs — no re-renders during interaction
  const zoomRef = useRef(MIN_ZOOM);
  const panRef  = useRef({ x: 0, y: 0 });

  // Pointer drag
  const isDraggingRef = useRef(false);
  const panStartRef   = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const dragDistRef   = useRef(0);

  // Slider DOM refs (uncontrolled — we write `.value` imperatively)
  const zoomSliderRef = useRef<HTMLInputElement>(null);
  const panSliderRef  = useRef<HTMLInputElement>(null);

  // Minimal state for conditional rendering only
  const [selected, setSelected] = useState<AstraEvent | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const { events, loading }     = useEonetEvents();

  // Keep eventsRef in sync (draw loop reads this, not events directly)
  useEffect(() => { eventsRef.current = events; }, [events]);

  // ── Offscreen land cache ────────────────────────────────────────────────────
  const buildOffscreen = useCallback(() => {
    const canvas = canvasRef.current;
    const geo    = geoRef.current;
    if (!canvas || !geo) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    const dpr = window.devicePixelRatio;
    const off  = document.createElement("canvas");
    off.width  = Math.round(w * dpr);
    off.height = Math.round(h * dpr);
    const octx = off.getContext("2d")!;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLand(octx, geo, w, h);
    offscreenRef.current = off;
  }, []);

  // ── Fetch GeoJSON ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson")
      .then(r => r.json())
      .then((d: GeoData) => {
        geoRef.current = d;
        buildOffscreen();
      })
      .catch(() => {});
  }, [buildOffscreen]);

  // ── Pause when section is off-screen ────────────────────────────────────────
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([e]) => { isPausedRef.current = !e.isIntersecting; },
      { threshold: 0.05 }
    );
    obs.observe(section);
    const onVis = () => { isPausedRef.current = document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    return () => { obs.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // ── Sync pan slider position imperatively ────────────────────────────────────
  function syncPanSlider() {
    const canvas = canvasRef.current;
    const slider = panSliderRef.current;
    if (!canvas || !slider) return;
    const w      = canvas.clientWidth;
    const maxPan = w * (zoomRef.current - 1);
    if (maxPan <= 0) { slider.value = "0"; return; }
    const pct = (-panRef.current.x / maxPan) * 100;
    slider.value = String(Math.max(0, Math.min(100, pct)));
  }

  // ── Canvas render loop ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio;
      canvas!.width  = Math.round(canvas!.clientWidth  * dpr);
      canvas!.height = Math.round(canvas!.clientHeight * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildOffscreen();
    }

    function draw(time: number) {
      if (isPausedRef.current) { animRef.current = requestAnimationFrame(draw); return; }

      const w    = canvas!.clientWidth, h = canvas!.clientHeight;

      // Self-heal: if the bitmap is stale (flex/aspectRatio layout settled after
      // the last resize call), re-sync now rather than waiting for an observer.
      const dpr = window.devicePixelRatio;
      if (canvas!.width !== Math.round(w * dpr) || canvas!.height !== Math.round(h * dpr)) {
        resize();
      }

      const zoom = zoomRef.current, pan = panRef.current;

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.save();
      ctx!.translate(pan.x, pan.y);
      ctx!.scale(zoom, zoom);

      // Grid lines (cheap, always draw)
      ctx!.save();
      for (let lng = -180; lng <= 180; lng += 30) {
        const x = ((lng + 180) / 360) * w;
        ctx!.strokeStyle = "rgba(60,90,155,0.55)";
        ctx!.lineWidth   = 0.5 / zoom;
        ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, h); ctx!.stroke();
      }
      for (let lat = -90; lat <= 90; lat += 30) {
        const y = ((90 - lat) / 180) * h;
        ctx!.strokeStyle = lat === 0 ? "rgba(155,184,212,0.5)" : "rgba(60,90,155,0.55)";
        ctx!.lineWidth   = (lat === 0 ? 1 : 0.5) / zoom;
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(w, y); ctx!.stroke();
      }
      ctx!.restore();

      // Land — use offscreen cache (single drawImage, ~0 cost vs 100+ polygon fills)
      if (offscreenRef.current) {
        ctx!.drawImage(offscreenRef.current, 0, 0, w, h);
      } else if (geoRef.current) {
        drawLand(ctx!, geoRef.current, w, h); // fallback before cache ready
      }

      // Event dots with pulsing glow
      const t = time * 0.001;
      for (const ev of eventsRef.current) {
        const { x, y } = lngLatToXY(ev.lng, ev.lat, w, h);
        const c         = KIND_COLORS[ev.kind];
        const age       = (Date.now() - new Date(ev.date).getTime()) / 86400000;
        const intensity = Math.max(0.3, 1 - age / 30);
        const phase     = (x + y) * 0.005;
        const strobe    = 0.5 + Math.sin(t * 2.5 + phase) * 0.5;
        const ringR     = (10 + strobe * 8) / zoom;
        const ringA     = intensity * strobe * 0.55;

        const grad = ctx!.createRadialGradient(x, y, 0, x, y, ringR);
        grad.addColorStop(0,   `rgba(${c.r},${c.g},${c.b},${ringA})`);
        grad.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},${ringA * 0.3})`);
        grad.addColorStop(1,   `rgba(${c.r},${c.g},${c.b},0)`);
        ctx!.beginPath(); ctx!.arc(x, y, ringR, 0, Math.PI * 2);
        ctx!.fillStyle = grad; ctx!.fill();

        ctx!.beginPath(); ctx!.arc(x, y, Math.max(2, 3.5 / zoom), 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${c.r},${c.g},${c.b},${intensity * (0.75 + strobe * 0.25)})`;
        ctx!.fill();
      }

      ctx!.restore();

      // Lat labels (screen-space, outside zoom transform)
      ctx!.save();
      ctx!.font      = "10px monospace";
      ctx!.fillStyle = "rgba(155,184,212,0.25)";
      [90, 60, 30, 0, -30, -60, -90].forEach(lat => {
        const rawY    = ((90 - lat) / 180) * h;
        const screenY = rawY * zoom + pan.y;
        if (screenY < 5 || screenY > h - 5) return;
        ctx!.fillText(lat === 0 ? "EQ" : `${Math.abs(lat)}°${lat > 0 ? "N" : "S"}`, 6, screenY + 4);
      });
      ctx!.restore();

      animRef.current = requestAnimationFrame(draw);
    }

    // ResizeObserver fires on initial layout AND any subsequent size change,
    // catching flex/aspectRatio settling that window resize misses.
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [buildOffscreen]);

  // ── Pointer handlers (canvas drag-to-pan + click-to-select) ─────────────────
  function handlePointerDown(e: React.PointerEvent) {
    isDraggingRef.current = true;
    dragDistRef.current   = 0;
    panStartRef.current   = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch (_) { /* */ }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - panStartRef.current.mx;
    const dy = e.clientY - panStartRef.current.my;
    dragDistRef.current = Math.sqrt(dx * dx + dy * dy);
    if (zoomRef.current > 1 && dragDistRef.current > 3) {
      const canvas = canvasRef.current!;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const rect = canvas.getBoundingClientRect();
      panRef.current = clampPan(
        panStartRef.current.px + dx * (w / rect.width),
        panStartRef.current.py + dy * (h / rect.height),
        zoomRef.current, w, h,
      );
      syncPanSlider();
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragDistRef.current < 8) {
      // Short tap — check for dot hit
      const canvas = canvasRef.current!;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const rect   = canvas.getBoundingClientRect();
      const sx     = (e.clientX - rect.left) * (w / rect.width);
      const sy     = (e.clientY - rect.top)  * (h / rect.height);
      const mapX   = (sx - panRef.current.x) / zoomRef.current;
      const mapY   = (sy - panRef.current.y) / zoomRef.current;
      const hitR   = 14 / zoomRef.current;
      let hit: AstraEvent | null = null;
      for (const ev of eventsRef.current) {
        const pos = lngLatToXY(ev.lng, ev.lat, w, h);
        const dx  = mapX - pos.x, dy = mapY - pos.y;
        if (dx * dx + dy * dy <= hitR * hitR) { hit = ev; break; }
      }
      setSelected(prev => hit ? (prev?.id === hit!.id ? null : hit) : null);
    }
  }

  // ── Zoom slider (right side — vertical) ─────────────────────────────────────
  function handleZoomSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const newZoom = parseFloat(e.target.value);
    const canvas  = canvasRef.current!;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    panRef.current  = clampPan(panRef.current.x, panRef.current.y, newZoom, w, h);
    zoomRef.current = newZoom;
    const zoomed    = newZoom > 1.05;
    setIsZoomed(zoomed);
    syncPanSlider();
    if (!zoomed) panRef.current = { x: 0, y: 0 };
  }

  // ── Pan slider (bottom — horizontal) ────────────────────────────────────────
  function handlePanSlider(e: React.ChangeEvent<HTMLInputElement>) {
    if (zoomRef.current <= 1) return;
    const canvas = canvasRef.current!;
    const w      = canvas.clientWidth;
    const maxPan = w * (zoomRef.current - 1);
    const pct    = parseFloat(e.target.value) / 100;
    panRef.current = { x: -pct * maxPan, y: panRef.current.y };
  }

  // ── Reset zoom ───────────────────────────────────────────────────────────────
  function resetZoom() {
    zoomRef.current = MIN_ZOOM;
    panRef.current  = { x: 0, y: 0 };
    setIsZoomed(false);
    if (zoomSliderRef.current) zoomSliderRef.current.value = String(MIN_ZOOM);
    if (panSliderRef.current)  panSliderRef.current.value  = "0";
  }

  return (
    <section ref={sectionRef} id="signals" className="relative py-4" style={{ background: "var(--color-void-navy)", borderTop: "1px solid rgba(155,184,212,0.1)" }}>
      {/* Header */}
      <div className="text-center mb-4 px-8 relative z-10">
        <p className="font-mono text-xs tracking-[0.35em] uppercase mb-3" style={{ color: "rgba(155,184,212,0.5)" }}>
          Live Signals
        </p>
        <h2 className="font-display font-normal text-2xl md:text-3xl mb-2" style={{ color: "var(--color-moon-white)", letterSpacing: "0.04em" }}>
          Signals from Earth
        </h2>
        <p className="font-sans font-light text-sm tracking-widest" style={{ color: "var(--color-dim-text)" }}>
          Real-world planetary events — click a signal to read it
        </p>
      </div>

      {/* Map container */}
      <div style={{ position: "relative", margin: "0 auto", maxWidth: "1600px", padding: "0 2rem" }}>

        {/* Row: canvas + vertical zoom slider */}
        <div style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>

          {/* Canvas */}
          <div
            style={{
              flex: 1,
              alignSelf: "flex-start",
              position: "relative",
              aspectRatio: "2 / 1",
              maxHeight: "720px",
              background: "rgba(18,32,68,1)",
              isolation: "isolate",
              border: "1px solid rgba(155,184,212,0.22)",
              borderRadius: "8px",
              overflow: "hidden",
              cursor: isZoomed ? "grab" : "crosshair",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { isDraggingRef.current = false; }}
          >
            <canvas
              ref={canvasRef}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", background: "rgba(18,32,68,1)" }}
            />

            {loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p className="font-mono text-xs tracking-widest animate-pulse" style={{ color: "rgba(168,170,191,0.5)" }}>
                  Scanning for signals...
                </p>
              </div>
            )}

            {selected && <InfoCard event={selected} onClose={() => setSelected(null)} />}
          </div>

          {/* Vertical zoom slider — right of map */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 0",
            width: "32px",
            height: "min(720px, calc(50vw - 32px))",
          }}>
            {/* Max label */}
            <span style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: "8px",
              color: "rgba(155,184,212,0.4)",
              letterSpacing: "0.1em",
            }}>{MAX_ZOOM}×</span>

            {/* Rotated range input */}
            <div style={{ position: "relative", flex: 1, width: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <input
                ref={zoomSliderRef}
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.1}
                defaultValue={MIN_ZOOM}
                onChange={handleZoomSlider}
                className="astra-slider astra-slider-vertical"
              />
            </div>

            {/* Min label + reset */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <span style={{
                fontFamily: "var(--font-geist-mono, monospace)",
                fontSize: "8px",
                color: "rgba(155,184,212,0.4)",
                letterSpacing: "0.1em",
              }}>1×</span>
              {isZoomed && (
                <button
                  onClick={resetZoom}
                  title="Reset zoom"
                  style={{
                    width: "22px", height: "22px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(8,14,28,0.88)",
                    border: "1px solid rgba(155,184,212,0.2)",
                    borderRadius: "4px",
                    color: "rgba(155,184,212,0.6)",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >⊙</button>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal pan slider — below map */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "10px",
          paddingRight: "44px", // align with canvas edge (not slider column)
          opacity: isZoomed ? 1 : 0.35,
          transition: "opacity 0.3s ease",
        }}>
          <span style={{
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: "8px",
            color: "rgba(155,184,212,0.5)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>PAN</span>
          <input
            ref={panSliderRef}
            type="range"
            min={0}
            max={100}
            step={0.5}
            defaultValue={0}
            disabled={!isZoomed}
            onChange={handlePanSlider}
            className="astra-slider astra-slider-horizontal"
            style={{ flex: 1 }}
          />
        </div>

        {/* Legend footer */}
        {!loading && events.length > 0 && (
          <div className="flex items-center justify-between mt-5 px-1">
            <p className="font-mono text-xs tracking-widest" style={{ color: "rgba(168,170,191,0.35)" }}>
              {events.length} signals · last 30 days
            </p>
            <div className="flex gap-5 flex-wrap justify-end">
              {(Object.keys(KIND_COLORS) as EventKind[]).map(kind => {
                const c     = KIND_COLORS[kind];
                const count = events.filter(e => e.kind === kind).length;
                return (
                  <div key={kind} className="flex items-center gap-2">
                    <span style={{
                      display: "inline-block", width: "8px", height: "8px", borderRadius: "50%",
                      backgroundColor: `rgb(${c.r},${c.g},${c.b})`,
                      boxShadow: `0 0 6px rgb(${c.r},${c.g},${c.b})`,
                    }} />
                    <span className="font-mono text-xs" style={{ color: "rgba(168,170,191,0.45)" }}>
                      {KIND_LABELS[kind]} ({count})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInCard {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Astra range slider base ── */
        .astra-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          outline: none;
          cursor: pointer;
        }

        /* Horizontal track */
        .astra-slider-horizontal {
          height: 28px;
        }
        .astra-slider-horizontal::-webkit-slider-runnable-track {
          height: 2px;
          background: rgba(155,184,212,0.15);
          border-radius: 2px;
        }
        .astra-slider-horizontal::-moz-range-track {
          height: 2px;
          background: rgba(155,184,212,0.15);
          border-radius: 2px;
        }

        /* Vertical — rotated so min is at bottom, max at top */
        .astra-slider-vertical {
          writing-mode: vertical-lr;
          direction: rtl;
          width: 28px;
          height: 100%;
          min-height: 80px;
        }
        .astra-slider-vertical::-webkit-slider-runnable-track {
          width: 2px;
          background: rgba(155,184,212,0.15);
          border-radius: 2px;
        }
        .astra-slider-vertical::-moz-range-track {
          width: 2px;
          background: rgba(155,184,212,0.15);
          border-radius: 2px;
        }

        /* Thumb — shared */
        .astra-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgba(155,184,212,0.75);
          border: 1px solid rgba(155,184,212,0.4);
          box-shadow: 0 0 8px rgba(155,184,212,0.4);
          cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .astra-slider::-webkit-slider-thumb:hover {
          background: rgba(155,184,212,1);
          box-shadow: 0 0 14px rgba(155,184,212,0.7);
        }
        .astra-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgba(155,184,212,0.75);
          border: 1px solid rgba(155,184,212,0.4);
          box-shadow: 0 0 8px rgba(155,184,212,0.4);
          cursor: pointer;
        }
        .astra-slider:disabled::-webkit-slider-thumb {
          background: rgba(155,184,212,0.2);
          box-shadow: none;
          cursor: not-allowed;
        }
        .astra-slider:disabled::-moz-range-thumb {
          background: rgba(155,184,212,0.2);
          box-shadow: none;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
}
