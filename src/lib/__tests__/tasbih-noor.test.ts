import { describe, expect, it } from 'vitest';
import { MOON, SKY, constellation, moonShadowOffset, starPos } from '../tasbih-noor';

describe('starPos', () => {
  it('is deterministic and stays in the sky, clear of the moon', () => {
    for (let i = 0; i < 1000; i++) {
      const p = starPos(i);
      expect(p).toEqual(starPos(i));
      expect(p.x).toBeGreaterThanOrEqual(SKY.x0);
      expect(p.x).toBeLessThanOrEqual(SKY.x1);
      expect(p.y).toBeGreaterThanOrEqual(SKY.y0);
      expect(p.y).toBeLessThanOrEqual(SKY.y1);
      expect(Math.hypot((p.x - MOON.x) * 1.2, p.y - MOON.y)).toBeGreaterThan(MOON.r);
    }
  });
  it('spreads stars out (no two of the first 33 nearly overlap)', () => {
    const pts = Array.from({ length: 33 }, (_, i) => starPos(i));
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        expect(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)).toBeGreaterThan(0.02);
  });
});

describe('constellation', () => {
  it('links each star to its nearest earlier star within range', () => {
    const links = constellation([{ x: 0, y: 0 }, { x: 0.1, y: 0 }, { x: 0.12, y: 0.05 }, { x: 0.9, y: 0.9 }]);
    expect(links).toEqual([[0, 1], [1, 2]]);
  });
});

describe('moonShadowOffset', () => {
  it('waxes from crescent to full', () => {
    expect(moonShadowOffset(0)).toBeCloseTo(0.2);
    expect(moonShadowOffset(0.5)).toBeGreaterThan(moonShadowOffset(0.2));
    expect(moonShadowOffset(1)).toBeGreaterThan(2);
  });
});
