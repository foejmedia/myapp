/** Deterministic tree for the Tooba tasbeeh theme. ViewBox is 0 0 400 400. */

export interface Branch { d: string; w: number; depth: number }
export interface Slot { x: number; y: number; rot: number; kind: 'leaf' | 'blossom'; depth: number; shade: number }
export interface Tree { branches: Branch[]; slots: Slot[] }

export const VB = 400;
const MAX_DEPTH = 5;

/** Small seeded PRNG so the tree is identical on every visit. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildTree(seed = 3): Tree {
  const r = rng(seed);
  const branches: Branch[] = [];
  const slots: (Slot & { order: number })[] = [];

  const grow = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
    const ex = x + Math.cos(ang) * len;
    const ey = y + Math.sin(ang) * len;
    // bend each limb a little, perpendicular to its direction
    const bend = (r() - 0.5) * 0.35 * len;
    const cx = (x + ex) / 2 - Math.sin(ang) * bend;
    const cy = (y + ey) / 2 + Math.cos(ang) * bend;
    branches.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`, w, depth });

    if (depth >= 2) {
      const ts = depth === MAX_DEPTH ? [0.45, 0.75, 1] : [0.55, 0.95];
      ts.forEach((t, k) => {
        const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * cx + t * t * ex;
        const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy + t * t * ey;
        const side = k % 2 === 0 ? 1 : -1;
        const tip = t === 1 && depth === MAX_DEPTH;
        slots.push({
          x: px, y: py,
          rot: (ang * 180) / Math.PI + side * (35 + r() * 30),
          kind: tip && r() < 0.45 ? 'blossom' : 'leaf',
          depth,
          shade: Math.floor(r() * 3),
          // leaves sprout inner branches first, with some randomness
          order: depth + r() * 2.2,
        });
      });
    }

    if (depth >= MAX_DEPTH) return;
    const kids = depth >= 2 && r() < 0.3 ? 3 : 2;
    const spread = 0.36 + r() * 0.2;
    for (let k = 0; k < kids; k++) {
      const f = kids === 2 ? (k === 0 ? -1 : 1) : k - 1;
      // a gentle upward pull keeps the crown rounded
      const a = ang + f * spread + (r() - 0.5) * 0.22 + (-Math.PI / 2 - ang) * 0.12;
      grow(ex, ey, a, len * (0.76 + r() * 0.1), Math.max(1.3, w * 0.64), depth + 1);
    }
  };

  grow(VB / 2, 354, -Math.PI / 2, 74, 17, 0);
  slots.sort((a, b) => a.order - b.order);
  return { branches, slots: slots.map(({ order: _o, ...s }) => s) };
}

/** How many leaf slots are filled: the tree is in full leaf exactly at the goal. */
export function leavesShown(count: number, goal: number, slots: number): number {
  if (count <= 0 || goal <= 0) return 0;
  const inRound = ((count - 1) % goal) + 1;
  return Math.max(1, Math.round((inRound / goal) * slots));
}

/**
 * A date palm: a curved trunk with fronds. Leaflets fill the fronds and date
 * clusters hang under the crown, using the same slot model as the tree.
 */
export function buildPalm(seed = 5): Tree {
  const r = rng(seed);
  const branches: Branch[] = [];
  const slots: (Slot & { order: number })[] = [];
  const top = { x: 214, y: 150 };
  branches.push({ d: `M200 354 Q186 250 ${top.x} ${top.y}`, w: 15, depth: 0 });
  // trunk rings
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    const x = (1 - t) * (1 - t) * 200 + 2 * (1 - t) * t * 186 + t * t * top.x;
    const y = (1 - t) * (1 - t) * 354 + 2 * (1 - t) * t * 250 + t * t * top.y;
    branches.push({ d: `M${(x - 7).toFixed(1)} ${y.toFixed(1)} Q${x.toFixed(1)} ${(y + 3).toFixed(1)} ${(x + 7).toFixed(1)} ${y.toFixed(1)}`, w: 1.2, depth: 9 });
  }
  const FRONDS = 11;
  for (let f = 0; f < FRONDS; f++) {
    const ang = -Math.PI + (f / (FRONDS - 1)) * Math.PI + (r() - 0.5) * 0.12; // -180°..0°
    const len = 112 + r() * 26;
    const droop = Math.abs(Math.cos(ang)) * 70;
    const ex = top.x + Math.cos(ang) * len;
    const ey = top.y + Math.sin(ang) * len * 0.75 + droop;
    const cx = top.x + Math.cos(ang) * len * 0.55;
    const cy = top.y + Math.sin(ang) * len * 0.75 - 18;
    branches.push({ d: `M${top.x} ${top.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`, w: 2.4, depth: 3 });
    for (let k = 1; k <= 9; k++) {
      const t = 0.12 + (k / 9) * 0.86;
      const px = (1 - t) * (1 - t) * top.x + 2 * (1 - t) * t * cx + t * t * ex;
      const py = (1 - t) * (1 - t) * top.y + 2 * (1 - t) * t * cy + t * t * ey;
      // tangent direction of the frond at t
      const tx = 2 * (1 - t) * (cx - top.x) + 2 * t * (ex - cx);
      const ty = 2 * (1 - t) * (cy - top.y) + 2 * t * (ey - cy);
      const dir = (Math.atan2(ty, tx) * 180) / Math.PI;
      for (const side of [1, -1]) {
        slots.push({ x: px, y: py, rot: dir + side * 58, kind: 'leaf', depth: 4, shade: Math.floor(r() * 3), order: t + r() * 0.5 });
      }
    }
  }
  // date clusters under the crown
  for (let k = 0; k < 8; k++) {
    const a = Math.PI * (0.2 + (k / 7) * 0.6);
    slots.push({
      x: top.x + Math.cos(a) * 18, y: top.y + 8 + Math.sin(a) * 10,
      rot: 0, kind: 'blossom', depth: 4, shade: 0, order: 1.2 + k * 0.05,
    });
  }
  slots.sort((a, b) => a.order - b.order);
  return { branches, slots: slots.map(({ order: _o, ...s }) => s) };
}
