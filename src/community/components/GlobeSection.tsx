'use client';

import createGlobe from 'cobe';
import { useEffect, useRef, useState } from 'react';
import s from '../community.module.css';

/*
 * A world globe on a white background: it turns by itself and can be dragged (with a little momentum).
 * Clicking the globe picks the nearest country: the globe turns to it and its name appears there.
 */

const COUNTRIES: { name: string; at: [number, number] }[] = [
  { name: 'Saudi Arabia', at: [24, 45] },
  { name: 'India', at: [22, 79] },
  { name: 'Pakistan', at: [30, 70] },
  { name: 'Bangladesh', at: [24, 90] },
  { name: 'Sri Lanka', at: [7.8, 80.7] },
  { name: 'Afghanistan', at: [34, 66] },
  { name: 'Iran', at: [32, 53] },
  { name: 'Iraq', at: [33, 44] },
  { name: 'Palestine', at: [31.9, 35.2] },
  { name: 'Turkey', at: [39, 35] },
  { name: 'UAE', at: [24, 54] },
  { name: 'Yemen', at: [15.5, 48] },
  { name: 'Uzbekistan', at: [41, 64] },
  { name: 'Kazakhstan', at: [48, 67] },
  { name: 'Egypt', at: [26, 30] },
  { name: 'Sudan', at: [15, 30] },
  { name: 'Ethiopia', at: [9, 40] },
  { name: 'Somalia', at: [6, 46] },
  { name: 'Kenya', at: [0, 38] },
  { name: 'Tanzania', at: [-6, 35] },
  { name: 'Nigeria', at: [9, 8] },
  { name: 'Senegal', at: [14.5, -14.5] },
  { name: 'Morocco', at: [32, -6] },
  { name: 'Algeria', at: [28, 2] },
  { name: 'South Africa', at: [-29, 24] },
  { name: 'Indonesia', at: [-2, 118] },
  { name: 'Malaysia', at: [4, 102] },
  { name: 'Thailand', at: [15, 101] },
  { name: 'Philippines', at: [12, 122] },
  { name: 'China', at: [35, 103] },
  { name: 'Japan', at: [36, 138] },
  { name: 'Russia', at: [60, 90] },
  { name: 'Australia', at: [-25, 134] },
  { name: 'New Zealand', at: [-41, 174] },
  { name: 'United Kingdom', at: [54, -2] },
  { name: 'France', at: [46.5, 2.5] },
  { name: 'Germany', at: [51, 10] },
  { name: 'Spain', at: [40, -4] },
  { name: 'Bosnia', at: [44, 18] },
  { name: 'Canada', at: [56, -106] },
  { name: 'United States', at: [39, -98] },
  { name: 'Mexico', at: [23, -102] },
  { name: 'Brazil', at: [-10, -52] },
  { name: 'Argentina', at: [-34, -64] },
];

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
/** cobe draws the sphere at 80% of the canvas half-width */
const RADIUS = 0.4;
/** the globe angles that put a point in front of the viewer */
const toAngles = ([lat, lng]: [number, number]): [number, number] => [Math.PI - (lng * RAD - Math.PI / 2), lat * RAD];
const clampTheta = (t: number) => Math.max(-0.9, Math.min(0.9, t));

export default function GlobeSection() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const drag = useRef<{ x: number; y: number; phi: number; theta: number; lastX: number; t: number; moved: boolean } | null>(null);
  const view = useRef({ phi: 0, theta: 0.3, spin: 0, target: null as [number, number] | null });
  const [active, setActive] = useState<(typeof COUNTRIES)[number] | null>(null);
  const activeRef = useRef<(typeof COUNTRIES)[number] | null>(null);
  const widthRef = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = el.offsetWidth;
    widthRef.current = width;
    const onResize = () => (widthRef.current = width = el.offsetWidth);
    window.addEventListener('resize', onResize);

    // open on the visitor's side of the world, judged from their time zone
    const lng = Math.max(-170, Math.min(170, -new Date().getTimezoneOffset() / 4));
    view.current.phi = toAngles([20, lng])[0];

    const place = () => {
      const node = label.current;
      const k = activeRef.current;
      if (!node) return;
      if (!k) {
        node.style.opacity = '0';
        return;
      }
      const { phi, theta } = view.current;
      const lng0 = 1.5 * Math.PI - phi;
      const r = width * RADIUS;
      const c = width / 2;
      const la = k.at[0] * RAD;
      const dl = k.at[1] * RAD - lng0;
      const z = Math.sin(theta) * Math.sin(la) + Math.cos(theta) * Math.cos(la) * Math.cos(dl);
      const x = c + Math.cos(la) * Math.sin(dl) * r;
      const y = c - (Math.cos(theta) * Math.sin(la) - Math.sin(theta) * Math.cos(la) * Math.cos(dl)) * r;
      node.style.transform = `translate(${x}px, ${y}px)`;
      node.style.opacity = z > 0.1 ? String(Math.min(1, (z - 0.1) * 4)) : '0';
    };

    const globe = createGlobe(el, {
      devicePixelRatio: dpr,
      width: width * dpr,
      height: width * dpr,
      phi: view.current.phi,
      theta: view.current.theta,
      // drawn as white land on black, then screen-blended over the CSS sphere (.globeBall),
      // so the black becomes the blue gradient and the land stays white
      dark: 1,
      diffuse: 1.2,
      mapSamples: 14000,
      mapBrightness: 11,
      mapBaseBrightness: 0,
      baseColor: [0.12, 0.12, 0.14],
      markerColor: [1, 0.8, 0.25],
      glowColor: [0, 0, 0],
      markers: COUNTRIES.map((k, i) => ({ location: k.at, size: i === 0 ? 0.07 : 0.025 })),
      onRender: state => {
        const v = view.current;
        if (!drag.current) {
          if (v.target) {
            const dPhi = ((((v.target[0] - v.phi) % TAU) + TAU + Math.PI) % TAU) - Math.PI;
            const dTheta = v.target[1] - v.theta;
            v.phi += dPhi * 0.07;
            v.theta += dTheta * 0.07;
            if (Math.abs(dPhi) < 0.002 && Math.abs(dTheta) < 0.002) v.target = null;
          } else if (Math.abs(v.spin) > 0.0005) {
            v.phi += v.spin;
            v.spin *= 0.95;
          } else if (!still) {
            v.phi += 0.003;
          }
        }
        state.phi = v.phi;
        state.theta = v.theta;
        state.width = width * dpr;
        state.height = width * dpr;
        place();
      },
    });
    const t = setTimeout(() => setReady(true), 60);
    return () => {
      clearTimeout(t);
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const focus = (k: (typeof COUNTRIES)[number] | null) => {
    activeRef.current = k;
    setActive(k);
    if (!k) return;
    const [phi, theta] = toAngles(k.at);
    view.current.target = [phi, clampTheta(theta)];
    view.current.spin = 0;
  };

  /** the country nearest to a click on the globe, or null for open ocean and clicks off the sphere */
  const pick = (clientX: number, clientY: number, box: DOMRect) => {
    const w = widthRef.current;
    const r = w * RADIUS;
    const x = (clientX - box.left - w / 2) / r;
    const y = (w / 2 - (clientY - box.top)) / r;
    if (x * x + y * y > 1) return null;
    const z = Math.sqrt(1 - x * x - y * y);
    const { phi, theta } = view.current;
    const lat = Math.asin(y * Math.cos(theta) + z * Math.sin(theta));
    const lng = 1.5 * Math.PI - phi + Math.atan2(x, z * Math.cos(theta) - y * Math.sin(theta));
    let best: (typeof COUNTRIES)[number] | null = null;
    let bestD = 14 * RAD;
    for (const k of COUNTRIES) {
      const la = k.at[0] * RAD;
      const d = Math.acos(
        Math.min(1, Math.sin(lat) * Math.sin(la) + Math.cos(lat) * Math.cos(la) * Math.cos(k.at[1] * RAD - lng)),
      );
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best;
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const v = view.current;
    drag.current = { x: e.clientX, y: e.clientY, phi: v.phi, theta: v.theta, lastX: e.clientX, t: performance.now(), moved: false };
    v.spin = 0;
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
    d.moved = true;
    const v = view.current;
    v.target = null;
    v.phi = d.phi + (e.clientX - d.x) / 150;
    v.theta = clampTheta(d.theta + (e.clientY - d.y) / 250);
    const now = performance.now();
    v.spin = ((e.clientX - d.lastX) / 150) * (16 / Math.max(1, now - d.t));
    d.lastX = e.clientX;
    d.t = now;
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    // a press that did not move is a click: show the country under it
    if (d && !d.moved) focus(pick(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()));
  };
  const onCancel = () => (drag.current = null);

  return (
    <section className={s.globeBand} aria-label="World globe: drag to turn it, click a country to see its name">
      <div
        className={s.globeStage}
        style={{ opacity: ready ? 1 : 0 }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        <div className={s.globeBall} aria-hidden="true" />
        <canvas ref={canvas} className={s.globeCanvas} aria-hidden="true" />
        <div className={s.globeShine} aria-hidden="true" />
        <span ref={label} className={s.globePin} aria-live="polite">
          {active && (
            <span key={active.name} className={s.globePinIn}>
              {active.name}
            </span>
          )}
        </span>
      </div>
      {/* the same countries for keyboard and screen-reader users */}
      <ul className={s.globeList}>
        {COUNTRIES.map(k => (
          <li key={k.name}>
            <button type="button" onClick={() => focus(k)}>
              {k.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
