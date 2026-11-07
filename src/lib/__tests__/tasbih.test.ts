import { describe, expect, it } from 'vitest';
import { DEFAULT_GOAL, parseState, roundProgress, roundsDone, slotLayer } from '../tasbih';

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
