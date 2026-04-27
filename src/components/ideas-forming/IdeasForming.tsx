"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { generateNodes, generateConnections } from "./constellation-data";

gsap.registerPlugin(ScrollTrigger);

const NODE_COUNT = 28;
const nodes = generateNodes(NODE_COUNT);
const connections = generateConnections(NODE_COUNT);

/** Smooth opacity for a content stage — fades in over fadeIn, holds, fades out */
function stageAlpha(p: number, inAt: number, holdTo: number, outAt: number, outEnd: number): number {
  if (p < inAt || p > outEnd) return 0;
  if (p < holdTo) return Math.min(1, (p - inAt) / Math.max(0.001, holdTo - inAt));
  if (p > outAt)  return 1 - (p - outAt) / Math.max(0.001, outEnd - outAt);
  return 1;
}

interface StageTextProps {
  alpha: number;
  align?: "left" | "center" | "right";
  eyebrow?: string;
  lines: string[];
  sub?: string;
  style?: React.CSSProperties;
}

function StageText({ alpha, align = "center", eyebrow, lines, sub, style }: StageTextProps) {
  const textAlign = align === "left" ? "left" : align === "right" ? "right" : "center";
  return (
    <div
      style={{
        opacity: alpha,
        transition: "opacity 0.4s ease",
        textAlign,
        pointerEvents: "none",
        ...style,
      }}
    >
      {eyebrow && (
        <p
          className="font-mono text-xs tracking-[0.3em] uppercase mb-3"
          style={{ color: "rgba(155,184,212,0.55)" }}
        >
          {eyebrow}
        </p>
      )}
      {lines.map((line, i) => (
        <p
          key={i}
          className="font-display font-normal"
          style={{
            fontSize: "clamp(1.1rem, 2.2vw, 1.6rem)",
            color: i === 0
              ? "rgba(232,223,192,0.85)"
              : "rgba(232,223,192,0.55)",
            letterSpacing: "0.02em",
            lineHeight: 1.45,
          }}
        >
          {line}
        </p>
      ))}
      {sub && (
        <p
          className="font-sans font-light mt-3 text-sm"
          style={{ color: "rgba(168,170,191,0.5)", letterSpacing: "0.01em" }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export default function IdeasForming() {
  const sectionRef   = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const progressRef  = useRef(0);
  const animFrameRef = useRef<number>(0);
  const isPausedRef  = useRef(false);
  const [progress, setProgress] = useState(0);

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
      canvas!.width  = canvas!.clientWidth  * window.devicePixelRatio;
      canvas!.height = canvas!.clientHeight * window.devicePixelRatio;
      ctx!.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    function draw() {
      if (isPausedRef.current) { animFrameRef.current = requestAnimationFrame(draw); return; }
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      const p = progressRef.current;

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const resolved = nodes.map((node) => ({
        x:      lerp(node.x + node.scatterX, node.x, p) * w,
        y:      lerp(node.y + node.scatterY, node.y, p) * h,
        radius: node.radius,
      }));

      // Connections — Star Blue
      for (const conn of connections) {
        const cp = Math.max(0, Math.min(1, (p - conn.appearAt) / 0.15));
        if (cp <= 0) continue;
        const from = resolved[conn.from], to = resolved[conn.to];
        const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
        ctx!.beginPath();
        ctx!.moveTo(lerp(mx, from.x, cp), lerp(my, from.y, cp));
        ctx!.lineTo(lerp(mx, to.x,   cp), lerp(my, to.y,   cp));
        ctx!.strokeStyle = `rgba(155,184,212,${0.38 * cp})`;
        ctx!.lineWidth   = 1.1;
        ctx!.stroke();
      }

      // Nodes — Lavender glow, Moon White core
      for (const node of resolved) {
        const gr = node.radius * 4.5;
        const alpha = 0.45 + p * 0.35;
        const grad = ctx!.createRadialGradient(node.x, node.y, 0, node.x, node.y, gr);
        grad.addColorStop(0,   `rgba(139,127,184,${alpha})`);
        grad.addColorStop(0.5, `rgba(139,127,184,${alpha * 0.3})`);
        grad.addColorStop(1,   `rgba(139,127,184,0)`);
        ctx!.beginPath(); ctx!.arc(node.x, node.y, gr, 0, Math.PI * 2);
        ctx!.fillStyle = grad; ctx!.fill();

        ctx!.beginPath(); ctx!.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(232,223,192,${0.7 + p * 0.25})`; ctx!.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    resize();
    animFrameRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        setProgress(self.progress);
      },
    });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      trigger.kill();
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Stage alphas: (progress, inAt, holdTo, outAt, outEnd)
  const s1 = stageAlpha(progress, 0,    0.06, 0.16, 0.22);
  const s2 = stageAlpha(progress, 0.22, 0.28, 0.44, 0.50);
  const s3 = stageAlpha(progress, 0.50, 0.56, 0.70, 0.76);
  const s4 = stageAlpha(progress, 0.68, 0.74, 0.94, 1.00);

  return (
    <section
      ref={sectionRef}
      id="ideas-forming"
      className="relative"
      style={{ height: "250vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Constellation canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* ── Stage 1: The void (0–20%) ── */}
        <div
          className="absolute inset-x-0 flex flex-col items-center pointer-events-none"
          style={{ top: "18%" }}
        >
          <StageText
            alpha={s1}
            eyebrow="Ideas Forming"
            lines={["In the beginning,", "nothing connects."]}
            sub="Observe the silence between."
          />
        </div>

        {/* ── Stage 2: First sparks (22–50%) ── */}
        <div
          className="absolute pointer-events-none"
          style={{ left: "7%", top: "38%" }}
        >
          <StageText
            alpha={s2}
            align="left"
            eyebrow="01 — emergence"
            lines={["A thought appears.", "Then another."]}
            sub="The distance between them — everything."
          />
        </div>

        {/* ── Stage 3: Connections forming (50–76%) ── */}
        <div
          className="absolute pointer-events-none"
          style={{ right: "7%", top: "52%" }}
        >
          <StageText
            alpha={s3}
            align="right"
            eyebrow="02 — connection"
            lines={["Lines emerge from silence.", "Each connection, a recognition"]}
            sub="of kinship between distant ideas."
          />
        </div>

        {/* ── Stage 4: Constellation complete (76–100%) ── */}
        <div
          className="absolute inset-x-0 flex flex-col items-center pointer-events-none"
          style={{ top: "62%" }}
        >
          <StageText
            alpha={s4}
            eyebrow="03 — constellation"
            lines={["The map settles.", "What seemed random"]}
            sub="was always waiting to be read."
          />
        </div>

        {/* ── Persistent bottom label ── */}
        <div
          className="absolute inset-x-0 bottom-12 flex flex-col items-center pointer-events-none"
          style={{ opacity: 0.6 + progress * 0.4 }}
        >
          <div
            className="w-16 h-px mb-4"
            style={{ background: "linear-gradient(to right, transparent, rgba(155,184,212,0.4), transparent)" }}
          />
          <p
            className="font-display text-lg md:text-2xl font-normal"
            style={{ color: "rgba(232,223,192,0.8)", letterSpacing: "0.04em" }}
          >
            Every connection starts as a spark.
          </p>
        </div>
      </div>
    </section>
  );
}
