/**
 * Chahar bagh geometry and plant placement (pure).
 * viewBox 0 0 1000 1000; channels cross at the centre.
 */
import type { Plant, PlantSpecies, Stage } from './engine';
import { rngFor } from './random';

export const VIEW = 1000;
export const C = 500;          // centre
export const ARM = 46;         // half-width of each channel + its paths
export const WATER = 14;       // half-width of the water itself
export const INNER = 46;       // garden inner edge (inside the wall)
export const FOUNTAIN_R = 92;  // octagonal fountain radius

export type QuadId = 'subhanallah' | 'alhamdulillah' | 'la-ilaha-illallah' | 'allahu-akbar';
export type Rect = { x0: number; y0: number; x1: number; y1: number };

export const QUADS: Record<QuadId, Rect> = {
  subhanallah: { x0: INNER, y0: INNER, x1: C - ARM, y1: C - ARM },
  alhamdulillah: { x0: C + ARM, y0: INNER, x1: VIEW - INNER, y1: C - ARM },
  'la-ilaha-illallah': { x0: INNER, y0: C + ARM, x1: C - ARM, y1: VIEW - INNER },
  'allahu-akbar': { x0: C + ARM, y0: C + ARM, x1: VIEW - INNER, y1: VIEW - INNER },
};

export type Point = { x: number; y: number };

const SPACING = 46;
const slotCache = new Map<string, Point[]>();

/** Grid slots in a quadrant, ordered as a spiral outward from the central fountain. */
export function quadSlots(id: QuadId): Point[] {
  const hit = slotCache.get(id);
  if (hit) return hit;
  const q = QUADS[id];
  const rnd = rngFor(`slots:${id}`);
  const pts: (Point & { d: number; a: number })[] = [];
  for (let y = q.y0 + 34; y <= q.y1 - 10; y += SPACING) {
    for (let x = q.x0 + 24; x <= q.x1 - 22; x += SPACING) {
      const px = x + (rnd() - 0.5) * 10;
      const py = y + (rnd() - 0.5) * 10;
      const d = Math.hypot(px - C, py - C);
      if (d < FOUNTAIN_R + 40) continue;
      pts.push({ x: px, y: py, d, a: Math.atan2(py - C, px - C) });
    }
  }
  // Spiral: by ring distance, then by angle within a ring.
  pts.sort((p, q2) => Math.round(p.d / SPACING) - Math.round(q2.d / SPACING) || p.a - q2.a);
  const out = pts.map(({ x, y }) => ({ x, y }));
  slotCache.set(id, out);
  return out;
}

let palmCache: Point[] | undefined;

/** Palm slots on the paths either side of the water, nearest the fountain first. */
export function palmSlots(): Point[] {
  if (palmCache) return palmCache;
  const pts: (Point & { d: number; k: number })[] = [];
  const off = (WATER + ARM) / 2 + 1;
  let k = 0;
  for (let t = FOUNTAIN_R + 36; t <= C - INNER - 22; t += 42) {
    for (const side of [-1, 1]) {
      pts.push({ x: C + side * off, y: C - t, d: t, k: k++ }); // north arm
      pts.push({ x: C + t, y: C + side * off, d: t, k: k++ }); // east arm
      pts.push({ x: C + side * off, y: C + t, d: t, k: k++ }); // south arm
      pts.push({ x: C - t, y: C + side * off, d: t, k: k++ }); // west arm
    }
  }
  pts.sort((a, b) => a.d - b.d || a.k - b.k);
  palmCache = pts.map(({ x, y }) => ({ x, y }));
  return palmCache;
}

export type PlacedStage = Stage | 'grove';
export type Placed = {
  key: string;
  dhikrId: string;
  species: PlantSpecies;
  stage: PlacedStage;
  seed: string;
  weight: number; // how many plants this one stands for (groves > 1)
  x: number;
  y: number;
};

type Item = Omit<Placed, 'x' | 'y'>;

/**
 * Keep a plot readable: while there are more items than slots, merge the
 * ten oldest smallest-weight trees into one grove tree.
 */
export function mergeToFit(items: Item[], cap: number): Item[] {
  let list = items.slice();
  let guard = 0;
  while (list.length > cap && guard++ < 10000) {
    const done = list.map((it, i) => ({ it, i })).filter(({ it }) => it.stage === 'tree' || it.stage === 'blossom' || it.stage === 'grove');
    if (done.length < 2) break;
    const take = done
      .slice()
      .sort((a, b) => a.it.weight - b.it.weight || a.i - b.i)
      .slice(0, 10)
      .sort((a, b) => a.i - b.i);
    const weight = take.reduce((n, t) => n + t.it.weight, 0);
    const first = take[0].it;
    const grove: Item = {
      key: `grove:${first.dhikrId}:${first.key}:${weight}`,
      dhikrId: first.dhikrId,
      species: first.species,
      stage: 'grove',
      seed: `${first.seed}:grove`,
      weight,
    };
    const drop = new Set(take.map(t => t.i));
    const next: Item[] = [];
    list.forEach((it, i) => {
      if (i === take[0].i) next.push(grove);
      else if (!drop.has(i)) next.push(it);
    });
    list = next;
  }
  return list;
}

/** Place every plant: four quadrants for the four phrases, palms along the channels. */
export function placePlants(plants: Plant[]): Placed[] {
  const groups = new Map<string, Plant[]>();
  for (const p of plants) {
    const g = groups.get(p.dhikrId) ?? [];
    g.push(p);
    groups.set(p.dhikrId, g);
  }
  const out: Placed[] = [];
  for (const [dhikrId, list] of groups) {
    const slots = dhikrId in QUADS ? quadSlots(dhikrId as QuadId) : list[0].species === 'palm' ? palmSlots() : null;
    if (!slots) continue;
    const sorted = list.slice().sort((a, b) => a.index - b.index);
    const items: Item[] = sorted.map(p => ({
      key: `${p.dhikrId}:${p.index}`,
      dhikrId: p.dhikrId,
      species: p.species,
      stage: p.stage,
      seed: p.seed,
      weight: 1,
    }));
    mergeToFit(items, slots.length).forEach((it, i) => out.push({ ...it, ...slots[i] }));
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}
