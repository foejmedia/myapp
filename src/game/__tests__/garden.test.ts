import { describe, expect, it } from 'vitest';
import { buildGarden, fountainFlows, growingStage, ringDays, rainLevel } from '../lib/engine';
import { mergeToFit, placePlants, quadSlots, palmSlots } from '../lib/layout';
import { plantGeometry } from '../lib/lsystem';
import { createState, migrate, type SavedState } from '../lib/storage';
import { reducer } from '../state/reducer';
import { localDay } from '../lib/day';

const T0 = new Date(2026, 10, 8, 9, 0).getTime();

function countN(s: SavedState, dhikrId: string, n: number, at = T0): SavedState {
  for (let i = 0; i < n; i++) s = reducer(s, { type: 'count', dhikrId, at: at + i * 1000 });
  return s;
}

describe('reducer', () => {
  it('counts totals, days and a milestone at every hundred', () => {
    let s = createState(T0, 'seed');
    s = countN(s, 'subhanallah', 205);
    expect(s.totals.subhanallah).toBe(205);
    expect(s.milestones.subhanallah).toHaveLength(2);
    expect(s.days[localDay(T0)].subhanallah).toBe(205);
  });
});

describe('engine', () => {
  it('stages follow total % 100', () => {
    expect(growingStage(0)).toBeUndefined();
    expect(growingStage(1)).toBe('seed');
    expect(growingStage(10)).toBe('sprout');
    expect(growingStage(33)).toBe('sapling');
    expect(growingStage(66)).toBe('young');
    expect(growingStage(99)).toBe('young');
    expect(growingStage(100)).toBeUndefined();
  });

  it('completed plants are trees, then blossom after 40 days', () => {
    let s = createState(T0, 'seed');
    s = countN(s, 'alhamdulillah', 140);
    const now = buildGarden(s, T0 + 1000 * 200);
    expect(now.map(p => p.stage)).toEqual(['tree', 'sapling']);
    const later = buildGarden(s, T0 + 41 * 864e5);
    expect(later[0].stage).toBe('blossom');
  });

  it('istighfar is rain, not a plant', () => {
    let s = createState(T0, 'seed');
    s = countN(s, 'astaghfirullah', 150);
    expect(buildGarden(s, T0)).toHaveLength(0);
    expect(rainLevel(s, T0)).toBeGreaterThan(0.9);
  });

  it('the same seed gives the same garden and the same drawing', () => {
    const a = countN(createState(T0, 'same'), 'la-ilaha-illallah', 250);
    const b = countN(createState(T0, 'same'), 'la-ilaha-illallah', 250);
    expect(buildGarden(a, T0)).toEqual(buildGarden(b, T0));
    const p = buildGarden(a, T0)[0];
    expect(plantGeometry(p.species, p.stage, p.seed)).toEqual(plantGeometry(p.species, p.stage, `${p.seed}`));
    expect(plantGeometry('olive', 'tree', 'x:1').trunk).not.toEqual(plantGeometry('olive', 'tree', 'x:2').trunk);
  });

  it('fountain flows after a 33/33/34 set today', () => {
    let s = createState(T0, 'seed');
    s = countN(s, 'subhanallah', 33);
    s = countN(s, 'alhamdulillah', 33);
    expect(fountainFlows(s, T0)).toBe(false);
    s = countN(s, 'allahu-akbar', 34);
    expect(fountainFlows(s, T0)).toBe(true);
  });

  it('rings are days returned; missed days remove nothing', () => {
    let s = createState(T0, 'seed');
    s = countN(s, 'subhanallah', 1, T0);
    s = countN(s, 'subhanallah', 1, T0 + 5 * 864e5);
    expect(ringDays(s)).toHaveLength(2);
  });
});

describe('layout', () => {
  it('slots spiral outward from the fountain', () => {
    const slots = quadSlots('subhanallah');
    const d = (p: { x: number; y: number }) => Math.hypot(p.x - 500, p.y - 500);
    expect(d(slots[0])).toBeLessThan(d(slots[slots.length - 1]));
    expect(palmSlots().length).toBeGreaterThan(20);
  });

  it('merges every ten oldest trees into a grove when a quadrant is full', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      key: `k${i}`, dhikrId: 'subhanallah', species: 'jasmine' as const, stage: 'tree' as const, seed: `s${i}`, weight: 1,
    }));
    const merged = mergeToFit(items, 16);
    expect(merged.length).toBeLessThanOrEqual(16);
    expect(merged[0].stage).toBe('grove');
    expect(merged[0].weight).toBe(10);
    expect(merged.reduce((n, it) => n + it.weight, 0)).toBe(25);
  });

  it('places thousands of counts within capacity', () => {
    let s = createState(T0, 'big');
    s = { ...s, totals: { subhanallah: 50_050 }, milestones: { subhanallah: Array.from({ length: 500 }, () => new Date(T0).toISOString()) } };
    const placed = placePlants(buildGarden(s, T0));
    expect(placed.length).toBeLessThanOrEqual(quadSlots('subhanallah').length);
    expect(placed.reduce((n, p) => n + p.weight, 0)).toBe(501);
  });
});

describe('storage migration', () => {
  it('accepts v1 and fills defaults', () => {
    const s = migrate({ version: 1, totals: { subhanallah: 3, bad: -1 }, settings: { method: 'ISNA', minTapGapMs: 'x' } });
    expect(s.totals).toEqual({ subhanallah: 3 });
    expect(s.settings.method).toBe('ISNA');
    expect(s.settings.minTapGapMs).toBe(400);
    expect(s.settings.sound).toBe(false);
  });

  it('rejects other versions and non-objects', () => {
    expect(() => migrate({ version: 2 })).toThrow();
    expect(() => migrate('nope')).toThrow();
  });

  it('round-trips a saved state', () => {
    const s = countN(createState(T0, 'rt'), 'subhanallah', 120);
    expect(migrate(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});
