"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  driftX: number;
  driftY: number;
  /** 0=Star Blue, 1=Lavender tint */
  colorBias: number;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      initStars();
    }

    function initStars() {
      const count = Math.floor((canvas!.width * canvas!.height) / 7000);
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        radius: Math.random() * 1.1 + 0.25,
        baseAlpha: Math.random() * 0.28 + 0.06,
        twinkleSpeed: Math.random() * 0.0007 + 0.0002,
        twinkleOffset: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.018,
        driftY: (Math.random() - 0.5) * 0.009,
        colorBias: Math.random(),
      }));
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const star of starsRef.current) {
        star.x += star.driftX;
        star.y += star.driftY;
        if (star.x < 0) star.x = canvas!.width;
        if (star.x > canvas!.width) star.x = 0;
        if (star.y < 0) star.y = canvas!.height;
        if (star.y > canvas!.height) star.y = 0;

        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const alpha = star.baseAlpha + twinkle * 0.1;

        // Mix Star Blue (#9BB8D4) with Lavender (#8B7FB8)
        const r = Math.round(155 + star.colorBias * (139 - 155));
        const g = Math.round(184 + star.colorBias * (127 - 184));
        const b = Math.round(212 + star.colorBias * (184 - 212));

        const gradient = ctx!.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.radius * 3
        );
        gradient.addColorStop(0,   `rgba(${r}, ${g}, ${b}, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${alpha * 0.45})`);
        gradient.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`);

        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
        ctx!.fillStyle = gradient;
        ctx!.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    resize();
    animFrameRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
