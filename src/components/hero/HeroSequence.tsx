"use client";

import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 192; // frames 0–191
const FRAME_PATH = "/hero-sequence/frame_";

function padFrame(n: number): string {
  return String(n).padStart(3, "0");
}

export default function HeroSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Preload all frames
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `${FRAME_PATH}${padFrame(i)}_delay-0.041s.webp`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          setLoaded(true);
        }
      };
      images.push(img);
    }

    imagesRef.current = images;
  }, []);

  // Scroll-driven frame rendering
  useEffect(() => {
    if (!loaded) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resizeCanvas() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      drawFrame(getCurrentFrame());
    }

    function getCurrentFrame(): number {
      const rect = container!.getBoundingClientRect();
      const scrollHeight = rect.height - window.innerHeight;
      if (scrollHeight <= 0) return 0;
      const progress = Math.max(0, Math.min(1, -rect.top / scrollHeight));
      return Math.floor(progress * (TOTAL_FRAMES - 1));
    }

    function drawFrame(index: number) {
      const img = imagesRef.current[index];
      if (!img || !ctx) return;

      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      // Cover-fit the image to canvas
      const scale = Math.max(
        canvas!.width / img.width,
        canvas!.height / img.height
      );
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas!.width - w) / 2;
      const y = (canvas!.height - h) / 2;

      ctx.drawImage(img, x, y, w, h);
    }

    function onScroll() {
      requestAnimationFrame(() => {
        const rect = container!.getBoundingClientRect();
        const scrollHeight = rect.height - window.innerHeight;
        const progress = scrollHeight > 0 ? Math.max(0, Math.min(1, -rect.top / scrollHeight)) : 0;
        // Fade canvas out as hero exits
        if (progress > 0.7) {
          canvas!.style.opacity = String(Math.max(0, 1 - (progress - 0.7) / 0.3));
        } else {
          canvas!.style.opacity = "1";
        }
        drawFrame(getCurrentFrame());
      });
    }

    resizeCanvas();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [loaded]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
    >
      <canvas
        ref={canvasRef}
        className="sticky top-0 w-full h-screen"
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
          maskImage: "linear-gradient(to bottom, black 45%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 45%, transparent 100%)",
        }}
      />
    </div>
  );
}
