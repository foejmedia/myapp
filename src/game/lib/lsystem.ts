/**
 * Seeded L-system plants -> SVG path data.
 * Local coordinates: the plant stands on (0, 0) and grows toward negative y.
 * The same (species, stage, seed) always yields the same drawing.
 */
import type { PlantSpecies, Stage } from './engine';
import { rngFor } from './random';

export type GeoSpecies = PlantSpecies | 'goodtree';

export type Geo = {
  mound: string;    // soil for seeds
  trunk: string;    // depth 0 segments
  branches: string; // depth 1
  twigs: string;    // depth 2+
  foliage: string;  // solid crown shapes (cypress)
  leavesA: string;
  leavesB: string;
  flowers: string;
  fruits: string;
  widths: [number, number, number];
  height: number;
};

type Rule = [weight: number, out: string][];
type Params = {
  axiom: string;
  rules: Record<string, Rule>;
  angle: number;
  angleJitter: number;
  len: number;
  lenJitter: number;
  decay: number;
  up: number;      // tropism toward the sky, 0..1
  leafR: number;
  height: number;  // full-grown height
  width: number;   // trunk stroke at full size
};

const SPECIES: Record<Exclude<GeoSpecies, 'cypress' | 'palm'>, Params> = {
  jasmine: {
    axiom: '[--X][-X][X][+X][++X]',
    rules: { X: [[2, 'F[+X][-X]L'], [1, 'F[-X]FXL'], [1, 'F[+X]FXL']] },
    angle: 22, angleJitter: 0.6, len: 10, lenJitter: 0.4, decay: 0.82, up: 0.06,
    leafR: 3.4, height: 52, width: 2.2,
  },
  pomegranate: {
    axiom: 'FFX',
    rules: { X: [[3, 'F[+X][-X]L'], [1, 'F[+X]FX'], [1, 'F[-X]FX']] },
    angle: 27, angleJitter: 0.5, len: 14, lenJitter: 0.35, decay: 0.8, up: 0.05,
    leafR: 6.4, height: 96, width: 5.5,
  },
  olive: {
    axiom: 'F+F-X',
    rules: { X: [[2, 'F[-X][+X]L'], [1, 'F-F[-X]L[+X]'], [1, 'F+F[+X]L[-X]']] },
    angle: 33, angleJitter: 0.8, len: 13, lenJitter: 0.5, decay: 0.78, up: 0.03,
    leafR: 4.6, height: 88, width: 6.5,
  },
  goodtree: {
    axiom: 'FF[-X][+X]X',
    rules: { X: [[3, 'F[+X][-X]L'], [1, 'F[-X]F[+X]L'], [1, 'FF[+X][-X]']] },
    angle: 25, angleJitter: 0.45, len: 16, lenJitter: 0.3, decay: 0.8, up: 0.04,
    leafR: 7, height: 150, width: 10,
  },
};

const STAGE_SIZE: Record<Stage, number> = { seed: 0.12, sprout: 0.22, sapling: 0.42, young: 0.66, tree: 1, blossom: 1 };
const STAGE_ITER: Record<Stage, number> = { seed: 0, sprout: 1, sapling: 2, young: 3, tree: 4, blossom: 4 };

const f = (n: number) => (Math.round(n * 10) / 10).toString();
export const circle = (x: number, y: number, r: number) =>
  `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`;

function pick(rule: Rule, r: number): string {
  const total = rule.reduce((n, [w]) => n + w, 0);
  let x = r * total;
  for (const [w, out] of rule) if ((x -= w) < 0) return out;
  return rule[rule.length - 1][1];
}

function expand(axiom: string, rules: Record<string, Rule>, n: number, rnd: () => number): string {
  let s = axiom;
  for (let i = 0; i < n; i++) {
    let next = '';
    for (const ch of s) next += rules[ch] ? pick(rules[ch], rnd()) : ch;
    s = next;
  }
  return s;
}

type Seg = [number, number, number, number, number];

function interpret(s: string, p: Params, rnd: () => number) {
  const segs: Seg[] = [];
  const tips: [number, number][] = [];
  const leaves: [number, number][] = [];
  let x = 0, y = 0, a = -90, d = 0, len = p.len;
  const stack: [number, number, number, number, number][] = [];
  const rad = Math.PI / 180;
  for (const ch of s) {
    switch (ch) {
      case 'F': {
        const l = len * (1 + (rnd() - 0.5) * p.lenJitter);
        const nx = x + Math.cos(a * rad) * l;
        const ny = y + Math.sin(a * rad) * l;
        segs.push([x, y, nx, ny, d]);
        x = nx; y = ny;
        a += (-90 - a) * p.up;
        break;
      }
      case '+': a += p.angle * (1 + (rnd() - 0.5) * p.angleJitter); break;
      case '-': a -= p.angle * (1 + (rnd() - 0.5) * p.angleJitter); break;
      case '[': stack.push([x, y, a, d, len]); d++; len *= p.decay; break;
      case ']': { const t = stack.pop(); if (t) [x, y, a, d, len] = t; break; }
      case 'X': tips.push([x, y]); break;
      case 'L': leaves.push([x, y]); break;
    }
  }
  return { segs, tips, leaves };
}

const empty = (height: number): Geo => ({
  mound: '', trunk: '', branches: '', twigs: '', foliage: '', leavesA: '', leavesB: '',
  flowers: '', fruits: '', widths: [1, 1, 1], height,
});

function seedGeo(rnd: () => number): Geo {
  const g = empty(8);
  g.mound = `M-9 0Q0 ${f(-6 - rnd() * 2)} 9 0Z`;
  g.fruits = circle((rnd() - 0.5) * 3, -3.5, 1.6);
  return g;
}

function lsystemGeo(species: keyof typeof SPECIES, stage: Stage, rnd: () => number): Geo {
  const p = SPECIES[species];
  const size = STAGE_SIZE[stage];
  const str = expand(p.axiom, p.rules, STAGE_ITER[stage], rnd);
  const { segs, tips, leaves } = interpret(str, p, rnd);
  let minY = -1;
  for (const s of segs) minY = Math.min(minY, s[1], s[3]);
  const k = (p.height * size) / -minY;
  const buckets = ['', '', ''];
  for (const [x1, y1, x2, y2, d] of segs) buckets[Math.min(2, d)] += `M${f(x1 * k)} ${f(y1 * k)}L${f(x2 * k)} ${f(y2 * k)}`;

  const g = empty(p.height * size);
  [g.trunk, g.branches, g.twigs] = buckets;
  const w = p.width * Math.max(0.35, size);
  g.widths = [w, w * 0.6, Math.max(0.8, w * 0.32)];

  const lr = p.leafR * (0.55 + 0.45 * size);
  const spots = [...tips, ...leaves];
  for (const [tx, ty] of spots) {
    const n = species === 'olive' ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const cx = tx * k + (rnd() - 0.5) * lr * 1.6;
      const cy = ty * k + (rnd() - 0.6) * lr * 1.4;
      const r = lr * (0.7 + rnd() * 0.5);
      if (rnd() < 0.5) g.leavesA += circle(cx, cy, r);
      else g.leavesB += circle(cx, cy, r);
    }
  }

  const mature = stage === 'tree' || stage === 'blossom';
  for (const [tx, ty] of tips) {
    const cx = tx * k + (rnd() - 0.5) * lr;
    const cy = ty * k + (rnd() - 0.3) * lr;
    const r = rnd();
    if (species === 'jasmine' && (mature || stage === 'young') && r < (stage === 'blossom' ? 0.9 : 0.5)) {
      g.flowers += star5(cx, cy, 2.6 * (0.7 + size * 0.4));
    } else if (species === 'pomegranate' && mature && r < 0.3) {
      g.fruits += circle(cx, cy + lr * 0.6, 3.6);
    } else if (species === 'pomegranate' && stage === 'blossom' && r < 0.55) {
      g.flowers += circle(cx, cy, 2.2);
    } else if (species === 'olive' && mature && r < 0.35) {
      g.fruits += circle(cx, cy, 1.6);
    } else if (species === 'olive' && stage === 'blossom' && r < 0.7) {
      g.flowers += circle(cx, cy - 1, 1.5);
    } else if (species === 'goodtree' && r < 0.3) {
      g.flowers += circle(cx, cy, 2.6);
    }
  }
  return g;
}

function star5(cx: number, cy: number, r: number): string {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * (Math.PI / 180);
    d += circle(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.5);
  }
  return d;
}

function cypressGeo(stage: Stage, rnd: () => number): Geo {
  const size = STAGE_SIZE[stage];
  const H = 128 * size;
  const W = 15 * (0.5 + size * 0.5);
  const g = empty(H);
  g.trunk = `M0 0L0 ${f(-H * 0.12)}`;
  g.widths = [Math.max(1.5, 4 * size), 1, 1];
  const steps = 18;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = -H * 0.06 - t * H * 0.94;
    const w = W * Math.pow(1 - t, 0.85) * Math.min(1, t * 5 + 0.25);
    left.push(`${f(-w * (0.85 + rnd() * 0.3))} ${f(y)}`);
    right.unshift(`${f(w * (0.85 + rnd() * 0.3))} ${f(y)}`);
  }
  g.foliage = `M${left.join('L')}L${right.join('L')}Z`;
  const n = Math.round(10 + 22 * size);
  for (let i = 0; i < n; i++) {
    const t = 0.08 + rnd() * 0.85;
    const w = W * Math.pow(1 - t, 0.85) * 0.75;
    const cx = (rnd() - 0.5) * 2 * w;
    const cy = -H * 0.06 - t * H * 0.94;
    if (rnd() < 0.5) g.leavesA += circle(cx, cy, 2 + size * 1.6);
    else g.leavesB += circle(cx, cy, 1.6 + size * 1.4);
  }
  if (stage === 'blossom') for (let i = 0; i < 7; i++) {
    const t = 0.15 + rnd() * 0.7;
    g.flowers += circle((rnd() - 0.5) * W * (1 - t), -H * 0.06 - t * H * 0.94, 1.5);
  }
  return g;
}

function palmGeo(stage: Stage, rnd: () => number): Geo {
  const size = STAGE_SIZE[stage];
  const H = 108 * size;
  const g = empty(H + 20 * size);
  const lean = (rnd() - 0.5) * 22 * size;
  const tx = lean, ty = -H;
  g.trunk = `M0 0Q${f(lean * 0.2)} ${f(-H * 0.55)} ${f(tx)} ${f(ty)}`;
  g.widths = [Math.max(1.6, 6 * size), Math.max(1, 2 * size), Math.max(0.6, 1 * size)];
  // trunk rings
  for (let i = 1; i < 9 * size + 2; i++) {
    const t = i / (9 * size + 2);
    const x = 2 * (1 - t) * t * lean * 0.2 + t * t * tx;
    const y = -H * (2 * (1 - t) * t * 0.55 + t * t);
    const w = 3.4 * Math.max(0.4, size);
    g.twigs += `M${f(x - w)} ${f(y)}L${f(x + w)} ${f(y + 1)}`;
  }
  const fronds = stage === 'sprout' ? 3 : stage === 'sapling' ? 5 : 8;
  const L = (stage === 'sprout' ? 16 : 46) * Math.max(0.5, size);
  for (let i = 0; i < fronds; i++) {
    const a = (-90 + (i - (fronds - 1) / 2) * (300 / fronds) + (rnd() - 0.5) * 14) * (Math.PI / 180);
    const ex = tx + Math.cos(a) * L;
    const ey = ty + Math.sin(a) * L * 0.75 + L * 0.35;
    const mx = tx + Math.cos(a) * L * 0.55;
    const my = ty + Math.sin(a) * L * 0.55 - L * 0.12;
    g.branches += `M${f(tx)} ${f(ty)}Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}`;
    // leaflets along the frond
    for (let j = 1; j <= 7; j++) {
      const t = j / 8;
      const px = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * mx + t * t * ex;
      const py = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * my + t * t * ey;
      const ll = (1 - t * 0.6) * 7 * Math.max(0.5, size);
      if (rnd() < 0.5) g.leavesA += `M${f(px)} ${f(py)}l${f(-ll * 0.3)} ${f(ll)}`;
      else g.leavesB += `M${f(px)} ${f(py)}l${f(ll * 0.3)} ${f(ll)}`;
    }
  }
  if (stage === 'tree' || stage === 'blossom') {
    for (let i = 0; i < (stage === 'blossom' ? 14 : 8); i++) {
      g.fruits += circle(tx + (rnd() - 0.5) * 12, ty + 4 + rnd() * 8, 2);
    }
  }
  return g;
}

const cache = new Map<string, Geo>();

export function plantGeometry(species: GeoSpecies, stage: Stage, seed: string): Geo {
  const key = `${species}|${stage}|${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rnd = rngFor(key);
  const g =
    stage === 'seed' ? seedGeo(rnd)
    : species === 'cypress' ? cypressGeo(stage, rnd)
    : species === 'palm' ? palmGeo(stage, rnd)
    : lsystemGeo(species, stage, rnd);
  if (cache.size > 4000) cache.clear();
  cache.set(key, g);
  return g;
}
