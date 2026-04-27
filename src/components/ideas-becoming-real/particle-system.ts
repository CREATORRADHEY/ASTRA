/**
 * Particle definitions for the "Ideas Becoming Real" section.
 * Particles drift freely at low scroll, cluster toward shape anchors
 * at mid scroll, and fade out as final objects appear.
 */

export interface Particle {
  /** Current position */
  x: number;
  y: number;
  /** Idle drift velocity */
  vx: number;
  vy: number;
  /** Which cluster this particle belongs to (0=book, 1=panel, 2=orb) */
  cluster: number;
  /** Target position within the cluster shape */
  targetX: number;
  targetY: number;
  radius: number;
  /** Base alpha */
  alpha: number;
}

/** Cluster center positions (normalized 0–1) */
export const CLUSTER_CENTERS = [
  { x: 0.22, y: 0.5, label: "book" },
  { x: 0.5, y: 0.5, label: "panel" },
  { x: 0.78, y: 0.5, label: "orb" },
] as const;

export function createParticles(count: number, seed: number = 77): Particle[] {
  let s = seed;
  function rand() {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  }

  const particles: Particle[] = [];
  const perCluster = Math.floor(count / 3);

  for (let i = 0; i < count; i++) {
    const cluster = Math.min(2, Math.floor(i / perCluster));
    const center = CLUSTER_CENTERS[cluster];

    // Scattered start position — spread across viewport
    const x = rand();
    const y = rand();

    // Target position: cluster around the center with some shape-specific spread
    let tx: number, ty: number;
    if (cluster === 0) {
      // Book shape — rectangular spread
      tx = center.x + (rand() - 0.5) * 0.08;
      ty = center.y + (rand() - 0.5) * 0.12;
    } else if (cluster === 1) {
      // Panel — wider rectangle
      tx = center.x + (rand() - 0.5) * 0.12;
      ty = center.y + (rand() - 0.5) * 0.08;
    } else {
      // Orb — circular spread
      const angle = rand() * Math.PI * 2;
      const dist = rand() * 0.06;
      tx = center.x + Math.cos(angle) * dist;
      ty = center.y + Math.sin(angle) * dist;
    }

    particles.push({
      x,
      y,
      vx: (rand() - 0.5) * 0.0004,
      vy: (rand() - 0.5) * 0.0004,
      cluster,
      targetX: tx,
      targetY: ty,
      radius: 2.5 + rand() * 2.5,
      alpha: 0.5 + rand() * 0.4,
    });
  }

  return particles;
}
