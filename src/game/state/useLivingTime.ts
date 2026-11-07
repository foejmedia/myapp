'use client';
/** The Muslim day as the garden sees it: prayer times, sky, Hijri date and seasons. */
import { useEffect, useMemo, useState } from 'react';
import { seasonsFor } from '../content/seasons';
import { localDay } from '../lib/day';
import { toHijri } from '../lib/hijri';
import { prayerTimes, type PrayerTimes } from '../lib/prayer';
import { SKY, adhkarWindows, approximateTimes, phaseAt } from '../lib/sky';
import { useGarden } from './GardenProvider';

/** The clock, read only after mount. Ticks every 30 s. */
export function useNow(intervalMs = 30_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    const onVis = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [intervalMs]);
  return now;
}

export function useLivingTime() {
  const { state } = useGarden();
  const now = useNow();
  const { lat, lng, method, asr, hijriOffset } = state.settings;
  const dayKey = now ? localDay(now) : '';

  return useMemo(() => {
    if (!now) return null;
    const hijri = toHijri(now, hijriOffset);
    const hasLocation = lat !== undefined && lng !== undefined;
    const real: PrayerTimes | null = hasLocation
      ? prayerTimes({
          lat: lat!, lng: lng!, date: now, tzHours: -now.getTimezoneOffset() / 60, method, asr,
          ramadan: hijri?.month === 9,
        })
      : null;
    const times = real ?? approximateTimes(now);
    const phase = phaseAt(now, times);
    const seasons = seasonsFor(now, hijri, now.getTime() >= times.maghrib.getTime());
    return {
      now, hijri, times, real, hasLocation, phase, sky: SKY[phase], seasons,
      windows: adhkarWindows(now, times),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, dayKey, lat, lng, method, asr, hijriOffset]);
}

export type LivingTime = NonNullable<ReturnType<typeof useLivingTime>>;
