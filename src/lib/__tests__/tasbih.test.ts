import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GOAL, DHIKR, applyTap, applyUndo, blankState, isoDay, lastDays, parseState, progressOf,
  roundProgress, roundsDone, slotLayer, streak, switchDhikr,
} from '../tasbih';
import { SPECIES, speciesOf, treeOf } from '../tasbih-species';
import { VB } from '../tasbih-tree';

describe('slotLayer', () => {
  it('is empty until the slot is reached', () => {
    expect(slotLayer(0, 0)).toBe(-1);
    expect(slotLayer(10, 10)).toBe(-1);
    expect(slotLayer(10, 11)).toBe(0);
  });
  it('replants in a new layer once the garden is full', () => {
    expect(slotLayer(0, 44)).toBe(0);
    expect(slotLayer(0, 45)).toBe(1);
    expect(slotLayer(1, 45)).toBe(0);
    expect(slotLayer(43, 88)).toBe(1);
    expect(slotLayer(0, 89)).toBe(2);
  });
});

describe('roundProgress', () => {
  it('fills up to the goal and restarts after', () => {
    expect(roundProgress(0, 100)).toBe(0);
    expect(roundProgress(50, 100)).toBe(0.5);
    expect(roundProgress(100, 100)).toBe(1);
    expect(roundProgress(101, 100)).toBe(0.01);
    expect(roundsDone(100, 100)).toBe(1);
    expect(roundsDone(99, 100)).toBe(0);
  });
});

describe('parseState', () => {
  it('falls back to defaults on bad input', () => {
    expect(parseState(null).goal).toBe(DEFAULT_GOAL);
    expect(parseState('{nope').count).toBe(0);
    expect(parseState(JSON.stringify({ goal: -4, count: 'x' })).goal).toBe(DEFAULT_GOAL);
  });
  it('rolls the daily counter over on a new day', () => {
    const raw = JSON.stringify({ todayDate: 'Mon Jan 01 2024', today: 40, total: 900, count: 12 });
    const s = parseState(raw, 'Tue Jan 02 2024');
    expect(s.today).toBe(0);
    expect(s.total).toBe(900);
    expect(s.count).toBe(12);
  });
});

describe('per-dhikr trees', () => {
  it('parks and resumes each dhikr’s own count and goal', () => {
    let s = { ...blankState(), dhikrId: 'subhanallah', count: 40, goal: 100 };
    s = switchDhikr(s, 'salawat');
    expect(s.count).toBe(0);
    expect(s.dhikrId).toBe('salawat');
    s = { ...s, count: 7, goal: 33 };
    s = switchDhikr(s, 'subhanallah');
    expect([s.count, s.goal]).toEqual([40, 100]);
    expect(progressOf(s, 'salawat')).toEqual({ count: 7, goal: 33 });
  });

  it('plants a tree of the active dhikr when a round completes, and undo takes it back', () => {
    const now = new Date(2026, 10, 8, 10);
    let s = { ...blankState(), dhikrId: 'salawat', goal: 3, count: 2, todayDate: now.toDateString() };
    const r = applyTap(s, now);
    expect(r.hit).toBe(true);
    expect(r.next.grove).toEqual([{ d: 'salawat', t: now.getTime() }]);
    expect(r.next.history[isoDay(now)]).toBe(1);
    s = applyUndo(r.next, now);
    expect(s.grove).toEqual([]);
    expect(s.count).toBe(2);
    expect(s.history[isoDay(now)]).toBe(0);
  });
});

describe('history', () => {
  const now = new Date(2026, 10, 8, 12);
  it('counts a streak ending today or yesterday', () => {
    expect(streak({ '2026-11-08': 3, '2026-11-07': 1, '2026-11-05': 9 }, now)).toBe(2);
    expect(streak({ '2026-11-07': 1, '2026-11-06': 1 }, now)).toBe(2);
    expect(streak({ '2026-11-05': 1 }, now)).toBe(0);
  });
  it('lists the last 7 days oldest first', () => {
    const d = lastDays({ '2026-11-08': 5, '2026-11-02': 2 }, 7, now);
    expect(d).toHaveLength(7);
    expect(d[0]).toMatchObject({ iso: '2026-11-02', count: 2, today: false });
    expect(d[6]).toMatchObject({ iso: '2026-11-08', count: 5, today: true });
  });
});

describe('species', () => {
  it('every preset dhikr has its own species, and every tree fits the canvas', () => {
    for (const d of DHIKR) expect(SPECIES[d.id], d.id).toBeDefined();
    for (const sp of Object.values(SPECIES)) {
      const t = treeOf(sp);
      expect(t.slots.length).toBeGreaterThan(120);
      for (const s of t.slots) {
        expect(s.x).toBeGreaterThan(8); expect(s.x).toBeLessThan(VB - 8);
        expect(s.y).toBeGreaterThan(8); expect(s.y).toBeLessThan(VB - 8);
      }
    }
    expect(speciesOf('unknown-id').name).toBe('Green tree');
  });
});
