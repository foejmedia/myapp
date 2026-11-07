'use client';
import { useEffect, useRef } from 'react';
import { constellation, hash, starPos } from '@/lib/tasbih-noor';

interface Props {
  count: number;
  goal: number;
  /** bumps on every completed round — fires shooting stars */
  celebrate: number;
}

const SPARK_MS = 520; // flight time from the beads to the sky
const FLARE_MS = 1100;
const MAX_BRIGHT = 200; // stars drawn bright in the current round
const MAX_DIM = 160; // remembered stars from earlier rounds

interface Shoot { x: number; y: number; vx: number; vy: number; t0: number; life: number }

/** Pre-rendered soft glow so we never build radial gradients per frame. */
function makeGlow(color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, color);
  grd.addColorStop(0.25, color.replace(/[\d.]+\)$/, '0.35)'));
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export default function NightSky({ count, goal, celebrate }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ count, goal });
  live.current = { count, goal };
  const ignite = useRef(new Map<number, number>());
  const prev = useRef<number | null>(null);
  const shoots = useRef<Shoot[]>([]);

  // record when each star was lit so it can fly in and flare
  useEffect(() => {
    const now = performance.now();
    const map = ignite.current;
    if (prev.current === null) {
      for (let i = Math.max(0, count - MAX_BRIGHT - MAX_DIM); i < count; i++) map.set(i, -1e9);
    } else if (count > prev.current) {
      for (let i = prev.current; i < count; i++) map.set(i, now + (i - prev.current) * 60);
    } else {
      for (const k of map.keys()) if (k >= count) map.delete(k);
    }
    prev.current = count;
  }, [count]);

  useEffect(() => {
    if (!celebrate) return;
    const now = performance.now();
    for (let k = 0; k < 3; k++) {
      shoots.current.push({ x: 0.15 + Math.random() * 0.5, y: 0.05 + Math.random() * 0.15, vx: 0.9, vy: 0.42, t0: now + k * 380, life: 900 });
    }
  }, [celebrate]);

  useEffect(() => {
    const cv = ref.current!;
    const g = cv.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const glowGold = makeGlow('rgba(255,214,140,1)');
    const glowWhite = makeGlow('rgba(220,232,255,1)');
    let w = 0, h = 0, dpr = 1, raf = 0;

    const bg = Array.from({ length: 170 }, (_, i) => ({
      x: hash(i, 11), y: Math.pow(hash(i, 12), 1.4) * 0.78,
      r: 0.3 + hash(i, 13) * 0.9, ph: hash(i, 14) * 6.28, sp: 0.6 + hash(i, 15) * 1.8,
    }));

    const resize = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    let linkKey = '';
    let links: [number, number][] = [];
    let nextShoot = performance.now() + 4000;

    const frame = (t: number) => {
      const { count: n, goal: gl } = live.current;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const unit = Math.min(w, h) / 400; // scale details with the canvas

      // ── background twinkle ──
      for (const s of bg) {
        const a = reduce ? 0.5 : 0.28 + 0.32 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.sp + s.ph));
        g.globalAlpha = a;
        g.fillStyle = '#dfe7ff';
        g.beginPath();
        g.arc(s.x * w, s.y * h, s.r * unit * 1.2, 0, 6.283);
        g.fill();
      }

      const roundStart = n === 0 ? 0 : n - (((n - 1) % gl) + 1);
      const from = Math.max(roundStart, n - MAX_BRIGHT);

      // ── stars from earlier rounds, dim ──
      g.globalCompositeOperation = 'lighter';
      for (let i = Math.max(0, roundStart - MAX_DIM); i < roundStart; i++) {
        const p = starPos(i);
        g.globalAlpha = 0.22;
        const s = 7 * unit * p.size;
        g.drawImage(glowWhite, p.x * w - s, p.y * h - s, s * 2, s * 2);
      }

      // ── constellation lines for this round ──
      const key = `${from}-${n}`;
      if (key !== linkKey) {
        const pts = [];
        for (let i = from; i < n; i++) pts.push(starPos(i));
        links = constellation(pts, 0.17);
        linkKey = key;
      }
      g.lineWidth = Math.max(0.6, 0.8 * unit);
      for (const [a, b] of links) {
        const ta = ignite.current.get(from + a) ?? -1e9;
        const tb = ignite.current.get(from + b) ?? -1e9;
        const age = t - (Math.max(ta, tb) + SPARK_MS);
        if (age < 0) continue;
        const k = Math.min(1, age / 700);
        const pa = starPos(from + a), pb = starPos(from + b);
        g.globalAlpha = 0.22 * k;
        g.strokeStyle = '#ffe2a8';
        g.beginPath();
        g.moveTo(pa.x * w, pa.y * h);
        g.lineTo(pa.x * w + (pb.x - pa.x) * w * k, pa.y * h + (pb.y - pa.y) * h * k);
        g.stroke();
      }

      // ── this round's stars: spark → flare → steady ──
      const ox = w / 2, oy = h + 30 * unit;
      for (let i = from; i < n; i++) {
        const t0 = ignite.current.get(i) ?? -1e9;
        if (t < t0) continue;
        const p = starPos(i);
        const sx = p.x * w, sy = p.y * h;
        const fly = reduce ? 1 : (t - t0) / SPARK_MS;

        if (fly < 1) {
          // curved flight with a fading tail
          const cx = ox + (sx - ox) * 0.2 + (hash(i, 5) - 0.5) * 120 * unit, cy = sy + (oy - sy) * 0.35;
          for (let k = 0; k < 10; k++) {
            const q = Math.max(0, fly - k * 0.035);
            const e = 1 - Math.pow(1 - q, 2.2);
            const x = (1 - e) * (1 - e) * ox + 2 * (1 - e) * e * cx + e * e * sx;
            const y = (1 - e) * (1 - e) * oy + 2 * (1 - e) * e * cy + e * e * sy;
            g.globalAlpha = (1 - k / 10) * 0.9;
            const s = (9 - k * 0.6) * unit;
            g.drawImage(glowGold, x - s, y - s, s * 2, s * 2);
          }
          continue;
        }

        const age = reduce ? 1e9 : t - t0 - SPARK_MS;
        const flare = age < FLARE_MS ? Math.exp(-age / 220) : 0;
        const tw = reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 0.002 + i * 1.7);
        const base = (6 + p.size * 4) * unit;
        const s = base * (1 + flare * 2.6) * tw;
        g.globalAlpha = 0.95;
        g.drawImage(glowGold, sx - s, sy - s, s * 2, s * 2);
        g.globalAlpha = 1;
        g.fillStyle = '#fffaf0';
        g.beginPath();
        g.arc(sx, sy, (0.9 + p.size * 0.6) * unit * (1 + flare), 0, 6.283);
        g.fill();
        if (flare > 0.02) {
          // four-point glint as the star is born
          const L = 26 * unit * flare;
          g.globalAlpha = flare;
          g.strokeStyle = '#fff3d6';
          g.lineWidth = 1.2 * unit;
          g.beginPath();
          g.moveTo(sx - L, sy); g.lineTo(sx + L, sy);
          g.moveTo(sx, sy - L); g.lineTo(sx, sy + L);
          g.stroke();
          g.beginPath();
          g.arc(sx, sy, (1 - flare) * 34 * unit, 0, 6.283);
          g.globalAlpha = flare * 0.5;
          g.stroke();
        }
      }

      // ── shooting stars ──
      if (!reduce && t > nextShoot) {
        shoots.current.push({ x: Math.random() * 0.6, y: Math.random() * 0.25, vx: 0.8, vy: 0.35, t0: t, life: 800 });
        nextShoot = t + 7000 + Math.random() * 9000;
      }
      shoots.current = shoots.current.filter(s => t < s.t0 + s.life);
      for (const s of shoots.current) {
        if (t < s.t0 || reduce) continue;
        const k = (t - s.t0) / s.life;
        const hx = (s.x + s.vx * k * 0.6) * w, hy = (s.y + s.vy * k * 0.6) * h;
        const tx = hx - s.vx * 90 * unit, ty = hy - s.vy * 90 * unit * (h / w);
        const grd = g.createLinearGradient(tx, ty, hx, hy);
        grd.addColorStop(0, 'rgba(255,255,255,0)');
        grd.addColorStop(1, 'rgba(255,244,220,0.95)');
        g.globalAlpha = Math.sin(k * Math.PI);
        g.strokeStyle = grd;
        g.lineWidth = 1.6 * unit;
        g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke();
        const s2 = 6 * unit;
        g.drawImage(glowWhite, hx - s2, hy - s2, s2 * 2, s2 * 2);
      }

      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} className="nr-sky" aria-hidden="true" />;
}
