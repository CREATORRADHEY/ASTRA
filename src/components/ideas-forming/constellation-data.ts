/**
 * Pre-defined node positions and connection pairs for the constellation.
 * Positions are normalized 0–1 so they scale to any viewport.
 * Connections reference node indices and define at what scroll progress
 * (0–1) each connection should be fully visible.
 */

export interface Node {
  /** Final resting position (normalized 0–1) */
  x: number;
  y: number;
  /** Random offset applied at scroll 0 — node drifts from scattered → final */
  scatterX: number;
  scatterY: number;
  /** Base radius for the node dot */
  radius: number;
}

export interface Connection {
  from: number;
  to: number;
  /** Scroll progress at which this connection starts appearing (0–1) */
  appearAt: number;
}

export function generateNodes(count: number, seed: number = 42): Node[] {
  // Use a simple seeded pseudo-random for reproducibility
  let s = seed;
  function rand() {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  }

  const nodes: Node[] = [];
  // Place nodes in a loose grid with jitter for organic feel
  const cols = Math.ceil(Math.sqrt(count * 1.5));
  const rows = Math.ceil(count / cols);

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 0.1 + (col / (cols - 1)) * 0.8 + (rand() - 0.5) * 0.06;
    const y = 0.1 + (row / (rows - 1)) * 0.8 + (rand() - 0.5) * 0.06;

    nodes.push({
      x: Math.max(0.05, Math.min(0.95, x)),
      y: Math.max(0.05, Math.min(0.95, y)),
      scatterX: (rand() - 0.5) * 0.3,
      scatterY: (rand() - 0.5) * 0.3,
      radius: 4 + rand() * 3,
    });
  }

  return nodes;
}

export function generateConnections(nodeCount: number, seed: number = 42): Connection[] {
  let s = seed + 100;
  function rand() {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  }

  const connections: Connection[] = [];
  const used = new Set<string>();

  // Connect nearby nodes with staggered appear times
  for (let i = 0; i < nodeCount; i++) {
    // Each node connects to 1–3 others
    const connectionCount = 1 + Math.floor(rand() * 2);
    for (let c = 0; c < connectionCount; c++) {
      const offset = 1 + Math.floor(rand() * 4);
      const j = (i + offset) % nodeCount;
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      if (i !== j && !used.has(key)) {
        used.add(key);
        connections.push({
          from: i,
          to: j,
          appearAt: 0.1 + rand() * 0.75,
        });
      }
    }
  }

  // Sort by appearAt for smooth progressive reveal
  connections.sort((a, b) => a.appearAt - b.appearAt);
  return connections;
}
