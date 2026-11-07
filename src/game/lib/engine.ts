/**
 * Pure growth engine: saved state + time -> plants.
 * Growth is permanent: nothing here ever shrinks or wilts.
 */
import { DHIKR_BY_ID, type Species } from '../content/dhikr';
import { localDay, DAY_MS } from './day';
import type { SavedState } from './storage';

export type Stage = 'seed' | 'sprout' | 'sapling' | 'young' | 'tree' | 'blossom';
export type PlantSpecies = Exclude<Species, 'rain'>;
export type Plant = { dhikrId: string; species: PlantSpecies; index: number; stage: Stage; seed: string };

export const PER_PLANT = 100; // one visible plant per 100 counts
export const BLOSSOM_AFTER_DAYS = 40; // trees blossom with time, not grinding
const GROWTH: [number, Stage][] = [[66, 'young'], [33, 'sapling'], [10, 'sprout'], [1, 'seed']];

/** Stage of the plant currently growing, from the count since the last full hundred. */
export function growingStage(total: number): Stage | undefined {
  return GROWTH.find(([min]) => total % PER_PLANT >= min)?.[1];
}

export function buildGarden(s: SavedState, now = Date.now()): Plant[] {
  const plants: Plant[] = [];
  for (const [dhikrId, total] of Object.entries(s.totals)) {
    const species = DHIKR_BY_ID[dhikrId]?.species;
    if (!species || species === 'rain') continue; // istighfar is rain, not a plant
    const done = s.milestones[dhikrId] ?? [];
    done.forEach((iso, index) =>
      plants.push({
        dhikrId,
        species,
        index,
        stage: (now - Date.parse(iso)) / DAY_MS >= BLOSSOM_AFTER_DAYS ? 'blossom' : 'tree',
        seed: `${s.userSeed}:${dhikrId}:${index}`,
      }),
    );
    const stage = growingStage(total);
    if (stage) plants.push({ dhikrId, species, index: done.length, stage, seed: `${s.userSeed}:${dhikrId}:${done.length}` });
  }
  return plants;
}

/** Consistency rings: one per day with any remembrance. Missed days add nothing and remove nothing. */
export function ringDays(s: SavedState): string[] {
  return Object.keys(s.days)
    .filter(k => Object.values(s.days[k]).some(n => n > 0))
    .sort();
}

export function todayCounts(s: SavedState, now = Date.now()): Record<string, number> {
  return s.days[localDay(now)] ?? {};
}

/** Rain intensity 0..1 from today's istighfar. Changes the look only, never the score. */
export function rainLevel(s: SavedState, now = Date.now()): number {
  const n = todayCounts(s, now).astaghfirullah ?? 0;
  return n <= 0 ? 0 : Math.min(1, 0.25 + n / 133);
}

/** The fountain flows once today's counts cover a 33/33/34 set. */
export function fountainFlows(s: SavedState, now = Date.now()): boolean {
  const t = todayCounts(s, now);
  return (t.subhanallah ?? 0) >= 33 && (t.alhamdulillah ?? 0) >= 33 && (t['allahu-akbar'] ?? 0) >= 34;
}

/** Good Tree size grows with La ilaha illallah and with the days of return. */
export function goodTreeScale(s: SavedState): number {
  const total = s.totals['la-ilaha-illallah'] ?? 0;
  const rings = ringDays(s).length;
  return 0.75 + Math.min(0.75, Math.log10(1 + total) / 5) + Math.min(0.5, rings / 300);
}
