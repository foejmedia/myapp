import { describe, expect, it } from 'vitest';
import { VB, buildTree, leavesShown } from '../tasbih-tree';

describe('buildTree', () => {
  const t = buildTree();
  it('is deterministic', () => {
    expect(buildTree()).toEqual(t);
  });
  it('has a full crown that fits the canvas', () => {
    expect(t.slots.length).toBeGreaterThan(80);
    expect(t.slots.some(s => s.kind === 'blossom')).toBe(true);
    for (const s of t.slots) {
      expect(s.x).toBeGreaterThan(8);
      expect(s.x).toBeLessThan(VB - 8);
      expect(s.y).toBeGreaterThan(8);
      expect(s.y).toBeLessThan(VB - 8);
    }
  });
});

describe('leavesShown', () => {
  it('grows to full at the goal and restarts after', () => {
    expect(leavesShown(0, 100, 150)).toBe(0);
    expect(leavesShown(1, 1000, 150)).toBe(1);
    expect(leavesShown(50, 100, 150)).toBe(75);
    expect(leavesShown(100, 100, 150)).toBe(150);
    expect(leavesShown(101, 100, 150)).toBe(2);
  });
});
