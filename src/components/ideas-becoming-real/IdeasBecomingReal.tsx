"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createParticles } from "./particle-system";
import FinalObjects from "./FinalObjects";

gsap.registerPlugin(ScrollTrigger);

const PARTICLE_COUNT = 150;
const particles = createParticles(PARTICLE_COUNT);

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function fade(p: number, inAt: number, inEnd: number, outAt: number, outEnd: number): number {
  if (p < inAt || p > outEnd) return 0;
  if (p <= inEnd)  return (p - inAt) / (inEnd - inAt);
  if (p >= outAt)  return 1 - (p - outAt) / (outEnd - outAt);
  return 1;
}

// Cluster definitions match particle-system.ts CLUSTER_CENTERS
const CLUSTERS = [
  { id: "book",      label: "Knowledge",  desc: "Every idea needs a vessel.", objLabel: "The Book",      objDesc: "Accumulated wisdom, bound." },
  { id: "interface", label: "Interface",  desc: "Every thought seeks form.",  objLabel: "The Interface", objDesc: "The language of interaction." },
  { id: "orb",       label: "Essence",    desc: "Every form seeks meaning.",  objLabel: "The Orb",       objDesc: "The core of every idea."     },
] as const;

export default function IdeasBecomingReal() {
  const sectionRef      = useRef<HTMLDivElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const svgRef          = useRef<SVGSVGElement>(null);
  const progressRef     = useRef(0);
  const prevProgressRef = useRef(0);
  const animFrameRef    = useRef<number>(0);
  const isPausedRef     = useRef(false);
  const [progress, setProgress]     = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Pause canvas loop when section is off-screen
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([e]) => { isPausedRef.current = !e.isIntersecting; },
      { threshold: 0.01 }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas  = canvasRef.current;
    if (!section || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio;
      canvas!.width  = canvas!.clientWidth  * dpr;
      canvas!.height = canvas!.clientHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      setDimensions({ width: canvas!.clientWidth, height: canvas!.clientHeight });
    }

    function draw() {
      if (isPausedRef.current) { animFrameRef.current = requestAnimationFrame(draw); return; }
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      const p = progressRef.current;

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const particleAlpha = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
      if (particleAlpha <= 0) { animFrameRef.current = requestAnimationFrame(draw); return; }

      const clusterFactor = p < 0.3 ? 0 : Math.min(1, (p - 0.3) / 0.4);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0) particle.x = 1;
        if (particle.x > 1) particle.x = 0;
        if (particle.y < 0) particle.y = 1;
        if (particle.y > 1) particle.y = 0;

        const drawX  = lerp(particle.x, particle.targetX, clusterFactor) * w;
        const drawY  = lerp(particle.y, particle.targetY, clusterFactor) * h;
        const radius = particle.radius * (1 + clusterFactor * 0.6);
        const alpha  = particle.alpha * particleAlpha;

        // Lavender → Star Blue → Moon White/Gold arc
        const cr = Math.round(139 + clusterFactor * (232 - 139));
        const cg = Math.round(127 + clusterFactor * (213 - 127));
        const cb = Math.round(184 + clusterFactor * (42  - 184));

        const glowR = radius * (3 + clusterFactor * 2.5);
        const grad  = ctx!.createRadialGradient(drawX, drawY, 0, drawX, drawY, glowR);
        grad.addColorStop(0,   `rgba(${cr},${cg},${cb},${alpha * 0.9})`);
        grad.addColorStop(0.4, `rgba(${cr},${cg},${cb},${alpha * 0.35})`);
        grad.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
        ctx!.beginPath(); ctx!.arc(drawX, drawY, glowR, 0, Math.PI * 2);
        ctx!.fillStyle = grad; ctx!.fill();
        ctx!.beginPath(); ctx!.arc(drawX, drawY, radius * 0.65, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`; ctx!.fill();
      }

      // Intermediate shape hints
      if (clusterFactor > 0 && p < 0.85) {
        const sa = clusterFactor * (p < 0.7 ? 1 : 1 - (p - 0.7) / 0.15);
        ctx!.save();
        ctx!.globalAlpha = sa * 0.22;
        ctx!.lineWidth   = 0.8;
        ctx!.filter = `blur(${(1 - clusterFactor) * 5}px)`;
        ctx!.strokeStyle = "rgba(155,184,212,0.5)";
        const bx = w * 0.22, by = h * 0.5;
        ctx!.beginPath();
        ctx!.moveTo(bx - 25, by - 18); ctx!.lineTo(bx, by - 13); ctx!.lineTo(bx + 25, by - 18);
        ctx!.moveTo(bx - 25, by + 18); ctx!.lineTo(bx, by + 22); ctx!.lineTo(bx + 25, by + 18);
        ctx!.stroke();
        ctx!.strokeStyle = "rgba(139,127,184,0.5)";
        ctx!.strokeRect(w * 0.5 - 35, h * 0.5 - 24, 70, 48);
        ctx!.strokeStyle = "rgba(212,146,42,0.5)";
        ctx!.beginPath(); ctx!.arc(w * 0.78, h * 0.5, 20, 0, Math.PI * 2); ctx!.stroke();
        ctx!.restore();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    resize();
    animFrameRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    const trigger = ScrollTrigger.create({
      trigger: section, start: "top top", end: "bottom bottom", scrub: 0.8,
      onUpdate: (self) => {
        if (prevProgressRef.current < 0.95 && self.progress >= 0.95 && svgRef.current) {
          gsap.fromTo(svgRef.current, { scale: 1 }, { scale: 1.06, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" });
        }
        prevProgressRef.current = self.progress;
        progressRef.current     = self.progress;
        setProgress(self.progress);
      },
    });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      trigger.kill();
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Overlay opacities
  // Opening fades out to make room for cluster view
  const openingAlpha   = fade(progress, 0, 0.06, 0.25, 0.32);
  // Cluster labels: fade in only — once visible, stay visible (no fade-out on forward scroll)
  const clusterAlpha   = Math.min(1, Math.max(0, (progress - 0.38) / 0.08));
  // Final objects/labels: fade in only
  const finalAlpha     = Math.min(1, Math.max(0, (progress - 0.74) / 0.08));
  const centreAlpha    = fade(progress, 0.15, 0.22, 0.82, 0.88);

  // Cluster label positions (match CLUSTER_CENTERS: 0.22, 0.5, 0.78)
  const clusterXPct = ["22%", "50%", "78%"];

  return (
    <section
      ref={sectionRef}
      id="ideas-becoming-real"
      className="relative"
      style={{ height: "300vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Final object SVGs */}
        {dimensions.width > 0 && (
          <FinalObjects
            ref={svgRef}
            progress={progress}
            width={dimensions.width}
            height={dimensions.height}
          />
        )}

        {/* ── Opening text (0–32%) ── */}
        <div
          className="absolute inset-x-0 top-[14%] flex flex-col items-center text-center pointer-events-none"
          style={{ opacity: openingAlpha, transition: "opacity 0.4s ease" }}
        >
          <p className="font-mono text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "rgba(139,127,184,0.55)" }}>
            Ideas Becoming Real
          </p>
          <h2
            className="font-display font-normal"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "rgba(232,223,192,0.82)", letterSpacing: "0.04em" }}
          >
            Raw energy. Undirected thought.
          </h2>
          <p className="mt-4 font-sans font-light" style={{ fontSize: "clamp(0.9rem, 1.6vw, 1.1rem)", color: "rgba(168,170,191,0.5)" }}>
            Three futures wait within the noise.
          </p>
        </div>

        {/* ── Centre "from thought to form" (15–88%) ── */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: centreAlpha * 0.9, transition: "opacity 0.4s ease" }}
        >
          <p
            className="font-display text-lg md:text-xl font-normal tracking-widest"
            style={{ color: "var(--color-dim-text)" }}
          >
            From thought to form.
          </p>
        </div>

        {/* ── Cluster labels (38–74%) ── */}
        {CLUSTERS.map((cluster, i) => (
          <div
            key={cluster.id}
            className="absolute pointer-events-none text-center"
            style={{
              left: clusterXPct[i],
              top: "30%",
              transform: "translateX(-50%)",
              opacity: clusterAlpha,
              transition: "opacity 0.4s ease",
              width: "160px",
            }}
          >
            <p
              className="font-mono tracking-[0.25em] uppercase"
              style={{ fontSize: "clamp(0.7rem, 1.2vw, 0.85rem)", color: i === 2 ? "rgba(212,146,42,0.7)" : i === 1 ? "rgba(139,127,184,0.7)" : "rgba(155,184,212,0.7)" }}
            >
              {cluster.label}
            </p>
            <p className="mt-2 font-sans font-light" style={{ fontSize: "clamp(0.75rem, 1.2vw, 0.9rem)", color: "rgba(168,170,191,0.5)" }}>
              {cluster.desc}
            </p>
          </div>
        ))}

        {/* ── Object labels (74–100%) — below each crystallized object ── */}
        {CLUSTERS.map((cluster, i) => (
          <div
            key={`label-${cluster.id}`}
            className="absolute pointer-events-none text-center"
            style={{
              left: clusterXPct[i],
              top: "62%",
              transform: "translateX(-50%)",
              opacity: finalAlpha,
              transition: "opacity 0.4s ease",
              width: "160px",
            }}
          >
            <p
              className="font-display font-normal"
              style={{
                fontSize: "clamp(0.9rem, 1.6vw, 1.1rem)",
                color: i === 2 ? "rgba(212,146,42,0.85)" : i === 1 ? "rgba(139,127,184,0.85)" : "rgba(155,184,212,0.85)",
                letterSpacing: "0.05em",
              }}
            >
              {cluster.objLabel}
            </p>
            <p className="mt-1 font-sans font-light" style={{ fontSize: "clamp(0.75rem, 1.2vw, 0.9rem)", color: "rgba(168,170,191,0.5)" }}>
              {cluster.objDesc}
            </p>
          </div>
        ))}

        {/* ── Final revelation (74–100%) ── */}
        <div
          className="absolute inset-x-0 bottom-14 flex flex-col items-center text-center pointer-events-none"
          style={{ opacity: finalAlpha, transition: "opacity 0.4s ease" }}
        >
          <div className="w-20 h-px mb-5" style={{ background: "linear-gradient(to right, transparent, rgba(212,146,42,0.4), transparent)" }} />
          <p
            className="font-display font-normal"
            style={{ fontSize: "clamp(1.3rem, 2.8vw, 2rem)", color: "rgba(242,201,109,0.85)", letterSpacing: "0.06em" }}
          >
            Every idea wants to become real.
          </p>
          <p className="mt-3 font-mono tracking-[0.25em] uppercase" style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.85rem)", color: "rgba(168,170,191,0.4)" }}>
            Knowledge · Interface · Essence
          </p>
        </div>
      </div>
    </section>
  );
}
