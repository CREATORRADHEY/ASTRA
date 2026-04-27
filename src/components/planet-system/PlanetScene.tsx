"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// Procedural planet texture generation
// Each planet is a 256×128 DataTexture generated from fractal noise.
// ─────────────────────────────────────────────────────────────────────────────

/** Deterministic 2D hash → 0..1 */
function h2(ix: number, iy: number): number {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Bilinear smooth noise */
function sn(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return h2(ix,iy)*(1-ux)*(1-uy) + h2(ix+1,iy)*ux*(1-uy)
       + h2(ix,iy+1)*(1-ux)*uy   + h2(ix+1,iy+1)*ux*uy;
}

/** Fractal Brownian Motion */
function fbm(x: number, y: number, oct: number): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * sn(x*f, y*f); a *= 0.5; f *= 2; }
  return v;
}

function clamp255(n: number) { return Math.max(0, Math.min(255, Math.round(n))); }

function genTex(
  w: number, h: number,
  fn: (u: number, v: number) => [number,number,number],
): THREE.DataTexture {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r,g,b] = fn(x/w, y/h);
      const i = (y*w + x) * 4;
      data[i] = clamp255(r); data[i+1] = clamp255(g); data[i+2] = clamp255(b); data[i+3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Mercury — grey-brown cratered terrain */
function mercuryTex() {
  return genTex(256, 128, (u, v) => {
    const n = fbm(u*5, v*5, 5)*0.65 + fbm(u*13, v*13, 3)*0.35;
    const c = 92 + n * 78;
    return [c+10, c+4, c-2];
  });
}

/** Venus — horizontal amber cloud bands */
function venusTex() {
  return genTex(256, 128, (u, v) => {
    const warp = fbm(u*2.5, v*2.5, 4)*0.45;
    const band = (Math.sin((v + warp)*Math.PI*14)*0.5 + 0.5);
    const cloud = fbm(u*5, v*5, 5)*0.5 + 0.5;
    const t = band*0.55 + cloud*0.45;
    return [175+t*72, 108+t*95, 14+t*52];
  });
}

/** Earth — blue ocean, green land, polar ice caps */
function earthTex() {
  return genTex(256, 128, (u, v) => {
    const lat = Math.abs(v - 0.5) * 2;
    // Ice caps
    if (lat > 0.84 || (lat > 0.77 && fbm(u*10, v*10, 3) > 0.52))
      return [215, 228, 240];
    // Land / ocean split via noise
    const n = fbm(u*4.5, v*4.5, 6);
    if (n > 0.55) {
      // Land — green/brown vegetation
      const veg = fbm(u*9, v*9, 3);
      return [55+veg*52, 82+veg*48, 32+veg*26];
    }
    // Ocean — deep blue
    const dep = fbm(u*6, v*6, 4)*0.4 + 0.6;
    return [14+dep*26, 48+dep*62, 108+dep*68];
  });
}

/** Mars — rust red surface with polar ice */
function marsTex() {
  return genTex(256, 128, (u, v) => {
    const lat = Math.abs(v - 0.5) * 2;
    if (lat > 0.87 || (lat > 0.80 && fbm(u*8, v*8, 3) > 0.54))
      return [208, 218, 224]; // polar ice
    const n = fbm(u*5, v*5, 5)*0.62 + fbm(u*12, v*12, 3)*0.38;
    return [148+n*84, 48+n*44, 12+n*28];
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Planet data
// ─────────────────────────────────────────────────────────────────────────────
const PLANETS = [
  {
    id: "mercury", name: "Mercury", subtitle: "The Swift Messenger",
    description: "The smallest planet and closest to the Sun. Mercury has no atmosphere to retain heat — days reach 430 °C while nights plunge to −180 °C. A world of pure extremes, completing an orbit in just 88 Earth days.",
    x: -5.5, size: 0.62, spinSpeed: 0.003,
    roughness: 0.92, metalness: 0.05,
    glowColor: "#D4922A", accentHex: "#D4922A",
    makeTex: mercuryTex,
  },
  {
    id: "venus", name: "Venus", subtitle: "The Veiled World",
    description: "Our sister planet, cloaked in thick clouds of sulfuric acid. Despite being farther from the Sun than Mercury, Venus burns hotter — a runaway greenhouse effect that makes it the most inhospitable place in the solar system.",
    x: -1.85, size: 0.94, spinSpeed: 0.001,
    roughness: 0.35, metalness: 0.0,
    glowColor: "#F2C96D", accentHex: "#F2C96D",
    makeTex: venusTex,
  },
  {
    id: "earth", name: "Earth", subtitle: "The Living Planet",
    description: "Our pale blue dot. The only known world to harbor life, wrapped in an atmosphere that breathes, a hydrosphere that flows, and a biosphere that thinks. Everything we have ever known exists here.",
    x: 1.85, size: 1.0, spinSpeed: 0.004,
    roughness: 0.55, metalness: 0.1,
    glowColor: "#9BB8D4", accentHex: "#9BB8D4",
    makeTex: earthTex,
  },
  {
    id: "mars", name: "Mars", subtitle: "The Red Frontier",
    description: "Ancient riverbeds trace the memory of water across Mars's rust-red surface. This world was once warmer, wetter, and perhaps alive. The next chapter of human exploration begins here.",
    x: 5.5, size: 0.72, spinSpeed: 0.0038,
    roughness: 0.88, metalness: 0.02,
    glowColor: "#E87040", accentHex: "#E87040",
    makeTex: marsTex,
  },
] as const;

type Planet = typeof PLANETS[number];

// ─────────────────────────────────────────────────────────────────────────────
// Star field — Points-based, white flickering stars
// Using Points + BufferAttribute avoids all InstancedMesh/instanceColor issues.
// ─────────────────────────────────────────────────────────────────────────────
const STAR_COUNT = 2000;

function StarField() {
  const pointsRef  = useRef<THREE.Points>(null);
  const flickerRef = useRef<Float32Array | null>(null);

  useFrame(({ clock }) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const geo = pts.geometry;
    const t   = clock.elapsedTime;

    // Guard on the geometry's color attribute — null on first frame AND after
    // StrictMode remount (new geometry object each mount).
    if (!geo.attributes.color) {
      const pos = new Float32Array(STAR_COUNT * 3);
      const col = new Float32Array(STAR_COUNT * 3);
      const flk = new Float32Array(STAR_COUNT * 3); // phase, speed, base

      for (let i = 0; i < STAR_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const r     = 35 + Math.random() * 55;
        pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);

        flk[i*3]   = Math.random() * Math.PI * 2;      // phase
        flk[i*3+1] = 0.5 + Math.random() * 2.2;        // speed
        flk[i*3+2] = 0.45 + Math.random() * 0.55;      // base brightness

        const b    = flk[i*3+2];
        col[i*3]   = b;
        col[i*3+1] = b;
        col[i*3+2] = b;
      }

      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color",    new THREE.BufferAttribute(col, 3));
      flickerRef.current = flk;
      return;
    }

    const flk = flickerRef.current;
    if (!flk) return;

    const colorAttr = geo.getAttribute("color") as THREE.BufferAttribute;
    const col = colorAttr.array as Float32Array;

    for (let i = 0; i < STAR_COUNT; i++) {
      // floor at 0.15 so stars never go fully black
      const v = flk[i*3+2] * (0.15 + Math.abs(Math.sin(t * flk[i*3+1] + flk[i*3])) * 0.85);
      col[i*3]   = v;
      col[i*3+1] = v;
      col[i*3+2] = v;
    }
    colorAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial vertexColors size={1.8} sizeAttenuation={false} />
    </points>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Planet mesh — textured sphere with atmosphere glow
// ─────────────────────────────────────────────────────────────────────────────
interface PlanetMeshProps {
  planet: Planet;
  texture: THREE.DataTexture;
  isSelected: boolean;
  onSelect: () => void;
}

function PlanetMesh({ planet, texture, isSelected, onSelect }: PlanetMeshProps) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (bodyRef.current) bodyRef.current.rotation.y += planet.spinSpeed;
    if (glowRef.current) {
      const pulse = 1 + Math.sin(t * 1.2 + planet.x) * 0.03;
      const active = hovered || isSelected;
      glowRef.current.scale.setScalar(active ? pulse * 1.25 : pulse);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = active ? 0.25 : 0.1;
    }
  });

  return (
    <group position={[planet.x, 0, 0]}>
      {/* Atmosphere halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[planet.size * 1.5, 32, 32]} />
        <meshBasicMaterial color={planet.glowColor} transparent opacity={0.1} side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Planet body — textured */}
      <mesh
        ref={bodyRef}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerEnter={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[planet.size, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          roughness={planet.roughness}
          metalness={planet.metalness}
        />
      </mesh>

      {/* Hover label */}
      {hovered && !isSelected && (
        <Html center position={[0, planet.size + 0.6, 0]} style={{ pointerEvents: "none" }}>
          <div style={{
            color: planet.accentHex, fontSize: "10px",
            letterSpacing: "0.3em", textTransform: "uppercase",
            fontFamily: "var(--font-display, serif)", whiteSpace: "nowrap",
            textShadow: "0 0 12px rgba(0,0,0,0.9)",
          }}>
            {planet.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bubble info card
// ─────────────────────────────────────────────────────────────────────────────
function BubbleCard({ planet, onClose }: { planet: Planet; onClose: () => void }) {
  return (
    <Html center position={[planet.x, planet.size + 1.7, 0]} style={{ pointerEvents: "none" }}>
      <div style={{
        pointerEvents: "auto", width: "210px",
        background: "rgba(8,14,28,0.97)",
        border: `1px solid ${planet.accentHex}35`,
        borderRadius: "14px", padding: "16px 18px 15px",
        backdropFilter: "blur(24px)",
        boxShadow: `0 0 60px ${planet.accentHex}18, 0 8px 32px rgba(0,0,0,0.7)`,
        position: "relative",
      }}>
        {/* Bubble tail */}
        <div style={{
          position: "absolute", bottom: "-9px", left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "9px solid transparent", borderRight: "9px solid transparent",
          borderTop: `9px solid ${planet.accentHex}35`,
        }} />
        <button onClick={onClose} style={{
          position: "absolute", top: "10px", right: "12px",
          background: "none", border: "none", color: "rgba(168,170,191,0.5)",
          cursor: "pointer", fontSize: "12px",
        }}>✕</button>
        <div style={{
          width: "24px", height: "24px", borderRadius: "50%", marginBottom: "10px",
          background: `radial-gradient(circle, ${planet.accentHex}55 0%, ${planet.accentHex}10 70%, transparent 100%)`,
          border: `1px solid ${planet.accentHex}30`,
        }} />
        <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "8px", letterSpacing: "0.3em", textTransform: "uppercase", color: planet.accentHex, marginBottom: "4px" }}>
          {planet.subtitle}
        </p>
        <h3 style={{ fontFamily: "var(--font-display, serif)", fontSize: "17px", fontWeight: 400, letterSpacing: "0.04em", color: "rgba(232,223,192,0.9)", marginBottom: "10px" }}>
          {planet.name}
        </h3>
        <div style={{ height: "1px", background: `linear-gradient(to right, ${planet.accentHex}30, transparent)`, marginBottom: "10px" }} />
        <p style={{ fontFamily: "var(--font-geist-sans, sans-serif)", fontSize: "11px", fontWeight: 300, lineHeight: 1.6, color: "rgba(168,170,191,0.75)" }}>
          {planet.description}
        </p>
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner R3F scene
// ─────────────────────────────────────────────────────────────────────────────
function Scene() {
  const [selected, setSelected] = useState<Planet | null>(null);

  // Generate textures once — DataTexture from procedural noise, no external URLs
  const textures = useMemo(() => ({
    mercury: mercuryTex(),
    venus:   venusTex(),
    earth:   earthTex(),
    mars:    marsTex(),
  }), []);

  const texMap: Record<string, THREE.DataTexture> = {
    mercury: textures.mercury,
    venus:   textures.venus,
    earth:   textures.earth,
    mars:    textures.mars,
  };

  return (
    <>
      <ambientLight color="#0D1530" intensity={1.4} />
      {/* Main light — directional from upper-left, like a distant sun */}
      <directionalLight color="#F2C96D" intensity={3.2} position={[-14, 5, 7]} />
      {/* Cool rim fill from the right */}
      <directionalLight color="#9BB8D4" intensity={0.7} position={[12, -3, -5]} />

      <StarField />

      {PLANETS.map((planet) => (
        <PlanetMesh
          key={planet.id}
          planet={planet}
          texture={texMap[planet.id]}
          isSelected={selected?.id === planet.id}
          onSelect={() => setSelected(prev => prev?.id === planet.id ? null : planet)}
        />
      ))}

      {selected && <BubbleCard planet={selected} onClose={() => setSelected(null)} />}

      {/* Click-away deselect */}
      <mesh visible={false} onClick={() => setSelected(null)}>
        <sphereGeometry args={[80, 4, 4]} />
        <meshBasicMaterial side={THREE.BackSide} />
      </mesh>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public component
// ─────────────────────────────────────────────────────────────────────────────
export default function PlanetScene() {
  return (
    <section
      id="planets"
      className="relative"
      style={{ height: "72vh", minHeight: "480px", maxHeight: "680px", background: "var(--color-void-navy)" }}
    >
      <div className="absolute top-7 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none">
        <p className="font-mono text-xs tracking-[0.35em] uppercase" style={{ color: "rgba(155,184,212,0.5)" }}>
          Inner Solar System
        </p>
        <h2 className="mt-2 font-display font-normal text-2xl md:text-3xl" style={{ color: "rgba(232,223,192,0.8)", letterSpacing: "0.04em" }}>
          Four worlds, four natures
        </h2>
      </div>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs tracking-widest uppercase z-10 pointer-events-none" style={{ color: "rgba(168,170,191,0.35)" }}>
        Click a planet to explore
      </p>

      <Canvas
        camera={{ position: [0, 1.2, 13], fov: 56 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color("#080E1C"))}
      >
        <Scene />
      </Canvas>
    </section>
  );
}
