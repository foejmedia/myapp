import { describe, expect, it } from 'vitest';
import { computeHours, prayerTimes } from '../lib/prayer';
import { toHijri } from '../lib/hijri';
import { seasonsFor } from '../content/seasons';


describe('prayer times', () => {
  // Expected values are approximate astronomical sanity bounds, not an official timetable.
  // Before launch, check against trusted local timetables in five cities (see the plan's gate).
  it('Makkah at the March equinox (Umm al-Qura)', () => {
    const h = computeHours({ lat: 21.4225, lng: 39.8262, date: new Date(2026, 2, 20), tzHours: 3, method: 'UmmAlQura', asr: 'standard' });
    expect(h.dhuhr).toBeGreaterThan(12 + 24 / 60);
    expect(h.dhuhr).toBeLessThan(12 + 33 / 60);
    expect(h.sunrise).toBeGreaterThan(6 + 15 / 60);
    expect(h.sunrise).toBeLessThan(6 + 35 / 60);
    expect(h.maghrib - h.sunrise).toBeGreaterThan(11.9);
    expect(h.maghrib - h.sunrise).toBeLessThan(12.3);
    expect(h.isha - h.maghrib).toBeCloseTo(1.5, 5);
  });

  it('keeps prayer order and Hanafi Asr is later', () => {
    const base = { lat: 12.9716, lng: 77.5946, date: new Date(2026, 10, 8), tzHours: 5.5, method: 'Karachi' as const };
    const s = computeHours({ ...base, asr: 'standard' });
    const h = computeHours({ ...base, asr: 'hanafi' });
    expect(s.fajr < s.sunrise && s.sunrise < s.dhuhr && s.dhuhr < s.asr && s.asr < s.maghrib && s.maghrib < s.isha).toBe(true);
    expect(h.asr).toBeGreaterThan(s.asr + 0.5);
  });

  it('London midsummer gets finite Fajr and Isha via the high-latitude rule', () => {
    const t = prayerTimes({ lat: 51.5074, lng: -0.1278, date: new Date(2026, 5, 21), tzHours: 1, method: 'MWL', asr: 'standard' });
    expect(t).not.toBeNull();
    expect(t!.fajr.getTime()).toBeLessThan(t!.sunrise.getTime());
    expect(t!.isha.getTime()).toBeGreaterThan(t!.maghrib.getTime());
  });
});

describe('hijri', () => {
  it('converts and applies the sighting offset', () => {
    const h = toHijri(new Date(2026, 10, 8));
    expect(h).not.toBeNull();
    expect(h!.year).toBe(1448);
    const plus = toHijri(new Date(2026, 10, 8), 1)!;
    expect(plus.day === h!.day + 1 || plus.day === 1).toBe(true);
  });

  it('seasons: Ramadan and Arafah', () => {
    const r = seasonsFor(new Date(2027, 1, 20), { day: 25, month: 9, year: 1448, monthName: 'Ramadan' }, false).map(s => s.id);
    expect(r).toContain('ramadan');
    expect(r).toContain('lastTen');
    const a = seasonsFor(new Date(2027, 4, 15), { day: 9, month: 12, year: 1448, monthName: 'Dhul Hijjah' }, false).map(s => s.id);
    expect(a).toEqual(['arafah']);
  });
});
