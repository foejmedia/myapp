/** Pure geometry for the Noor (night sky) tasbeeh theme. Coordinates are 0..1. */

const frac = (x: number) => x - Math.floor(x);

/** Deterministic 0..1 hash of an integer. */
export function hash(i: number, salt = 0): number {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453123;
  return frac(s);
}

/** Moon sits top-right; keep stars out of its halo and off the horizon. */
export const MOON = { x: 0.8, y: 0.17, r: 0.13 };
export const SKY = { x0: 0.05, x1: 0.95, y0: 0.05, y1: 0.6 };

/**
 * Where the star for count index `i` (0-based) sits. Uses the R2
 * low-discrepancy sequence so stars spread evenly instead of clumping,
 * with a little jitter so it never looks like a grid.
 */
export interface Star { x: number; y: number; size: number }

const MIN_GAP = 0.045; // keep clear of recent neighbours
const LOOKBACK = 60;
const cache: Star[] = [];

function candidate(n: number) {
  return {
    x: SKY.x0 + (SKY.x1 - SKY.x0) * frac(0.5 + n * 0.7548776662 + (hash(n, 1) - 0.5) * 0.03),
    y: SKY.y0 + (SKY.y1 - SKY.y0) * frac(0.5 + n * 0.569840291 + (hash(n, 2) - 0.5) * 0.03),
  };
}

function place(i: number): Star {
  let best = { x: 0.15, y: 0.4 };
  let bestGap = -1;
  for (let k = 0; k < 10; k++) {
    const c = candidate(i + k * 7919);
    if (Math.hypot((c.x - MOON.x) * 1.2, c.y - MOON.y) <= MOON.r) continue;
    let gap = Infinity;
    for (let j = Math.max(0, i - LOOKBACK); j < i; j++) {
      gap = Math.min(gap, Math.hypot(c.x - cache[j].x, c.y - cache[j].y));
    }
    if (gap >= MIN_GAP) { best = c; break; }
    if (gap > bestGap) { bestGap = gap; best = c; }
  }
  return { ...best, size: 0.7 + hash(i, 3) * 0.9 };
}

export function starPos(i: number): Star {
  // positions depend on earlier stars, so fill the cache in order (deterministic)
  while (cache.length <= i) cache.push(place(cache.length));
  return cache[i];
}

/**
 * Constellation links: each star joins its nearest earlier star in the same
 * round, if close enough. Returns pairs of indices into `pts`.
 */
export function constellation(pts: { x: number; y: number }[], maxDist = 0.2): [number, number][] {
  const links: [number, number][] = [];
  for (let i = 1; i < pts.length; i++) {
    let best = -1;
    let bd = maxDist;
    for (let j = 0; j < i; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < bd) { bd = d; best = j; }
    }
    if (best >= 0) links.push([best, i]);
  }
  return links;
}

/**
 * Moon phase: a thin crescent (0.1) at the start of a round, full (1) at the goal.
 * Returns the x-offset of the shadow disc in moon radii (2 = no shadow).
 */
export function moonShadowOffset(progress: number): number {
  const p = 0.1 + 0.9 * Math.min(1, Math.max(0, progress));
  return p >= 1 ? 2.2 : p * 2;
}
