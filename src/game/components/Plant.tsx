import { memo } from 'react';
import type { Stage } from '../lib/engine';
import type { Placed } from '../lib/layout';
import { plantGeometry, type GeoSpecies } from '../lib/lsystem';

type Palette = { trunk: string; a: string; b: string; flower: string; fruit: string; foliage?: string };

export const PALETTE: Record<GeoSpecies, Palette> = {
  jasmine: { trunk: '#6d5a43', a: '#5b8c50', b: '#82ab69', flower: '#fffdf4', fruit: '#7b6a4a' },
  pomegranate: { trunk: '#6b4a35', a: '#3d6d44', b: '#5d8d4e', flower: '#e2603c', fruit: '#bf3a2e' },
  olive: { trunk: '#7a6a55', a: '#7a9577', b: '#a2b49a', flower: '#f3efd6', fruit: '#3d4a2c' },
  cypress: { trunk: '#5b4634', a: '#2f6143', b: '#3f7752', flower: '#e0bd62', fruit: '#3d4a2c', foliage: '#244c34' },
  palm: { trunk: '#8a6a45', a: '#4f7f45', b: '#6d9b58', flower: '#fffdf4', fruit: '#b5652b' },
  goodtree: { trunk: '#5d4632', a: '#4f8546', b: '#82b562', flower: '#e8c362', fruit: '#e8c362' },
};

/** One plant in its own local coordinates (standing on 0,0). */
export function PlantShape({ species, stage, seed }: { species: GeoSpecies; stage: Stage; seed: string }) {
  const g = plantGeometry(species, stage, seed);
  const c = PALETTE[species];
  const palm = species === 'palm';
  return (
    <>
      {g.mound && <path d={g.mound} fill="#8a6b4a" />}
      {g.trunk && <path d={g.trunk} stroke={c.trunk} strokeWidth={g.widths[0]} strokeLinecap="round" fill="none" />}
      {g.branches && (
        <path d={g.branches} stroke={palm ? c.a : c.trunk} strokeWidth={g.widths[1]} strokeLinecap="round" fill="none" />
      )}
      {g.twigs && (
        <path d={g.twigs} stroke={palm ? '#6e5236' : c.trunk} strokeWidth={g.widths[2]} strokeLinecap="round" fill="none" />
      )}
      {g.foliage && <path d={g.foliage} fill={c.foliage} />}
      {palm ? (
        <>
          {g.leavesA && <path d={g.leavesA} stroke={c.a} strokeWidth={1.4} strokeLinecap="round" fill="none" />}
          {g.leavesB && <path d={g.leavesB} stroke={c.b} strokeWidth={1.4} strokeLinecap="round" fill="none" />}
        </>
      ) : (
        <>
          {g.leavesA && <path d={g.leavesA} fill={c.a} />}
          {g.leavesB && <path d={g.leavesB} fill={c.b} />}
        </>
      )}
      {g.fruits && <path d={g.fruits} fill={stage === 'seed' ? '#e8d39c' : c.fruit} />}
      {g.flowers && <path d={g.flowers} fill={c.flower} />}
    </>
  );
}

const SPRITE = 0.64;

/** A placed plant in the garden. Groves draw three trees standing together. */
export const Plant = memo(function Plant({ p }: { p: Placed }) {
  if (p.stage === 'grove') {
    const s = SPRITE * (1.05 + Math.min(0.35, Math.log10(p.weight) * 0.15));
    return (
      <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`} data-dhikr={p.dhikrId}>
        <ellipse cx={0} cy={2} rx={24} ry={7} fill="rgba(48,58,26,.2)" />
        <g transform={`translate(-11 -4) scale(${s * 0.9})`}><PlantShape species={p.species} stage="blossom" seed={`${p.seed}:a`} /></g>
        <g transform={`translate(11 -3) scale(${s * 0.95})`}><PlantShape species={p.species} stage="tree" seed={`${p.seed}:b`} /></g>
        <g transform={`translate(0 3) scale(${s})`}><PlantShape species={p.species} stage="blossom" seed={`${p.seed}:c`} /></g>
      </g>
    );
  }
  return (
    <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${SPRITE})`} data-dhikr={p.dhikrId}>
      <ellipse cx={0} cy={2} rx={p.stage === 'seed' ? 10 : 20} ry={p.stage === 'seed' ? 3 : 6} fill="rgba(48,58,26,.2)" />
      <PlantShape species={p.species} stage={p.stage} seed={p.seed} />
    </g>
  );
});
