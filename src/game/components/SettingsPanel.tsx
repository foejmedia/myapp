'use client';
import { useState } from 'react';
import { METHODS, PRAYER_LABEL, formatTime } from '../lib/prayer';
import type { HijriOffset, Method, Settings } from '../lib/storage';
import { useGarden } from '../state/GardenProvider';
import { useLivingTime } from '../state/useLivingTime';
import BackupPanel from './BackupPanel';
import s from '../game.module.css';

const CITIES: [string, number, number][] = [
  ['Makkah', 21.4225, 39.8262], ['Madinah', 24.4672, 39.6111], ['Bengaluru', 12.9716, 77.5946],
  ['Hyderabad', 17.385, 78.4867], ['Delhi', 28.6139, 77.209], ['Mumbai', 19.076, 72.8777],
  ['Karachi', 24.8607, 67.0011], ['Lahore', 31.5204, 74.3587], ['Dhaka', 23.8103, 90.4125],
  ['Jakarta', -6.2088, 106.8456], ['Kuala Lumpur', 3.139, 101.6869], ['Istanbul', 41.0082, 28.9784],
  ['Cairo', 30.0444, 31.2357], ['Dubai', 25.2048, 55.2708], ['London', 51.5074, -0.1278],
  ['New York', 40.7128, -74.006], ['Toronto', 43.6532, -79.3832],
];

export default function SettingsPanel() {
  const { state, dispatch, ready } = useGarden();
  const lt = useLivingTime();
  const st = state.settings;
  const set = (patch: Partial<Settings>) => dispatch({ type: 'setSettings', patch });
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  if (!ready) return <p className={s.card}>&nbsp;</p>;

  return (
    <div className={s.panelStack}>
      <h1 className={s.pageTitle}>Settings</h1>

      <section className={s.card} aria-labelledby="gd-loc">
        <h2 id="gd-loc" className={s.cardTitle}>
          Location and prayer times
        </h2>
        <p className={s.refLine}>Your location stays only on this device. Times use this device&apos;s time zone.</p>
        <p>
          Current: <strong>{st.lat !== undefined ? `${st.city ?? 'Custom'} (${st.lat.toFixed(2)}, ${st.lng?.toFixed(2)})` : 'not set'}</strong>
        </p>
        <div className={s.rowBtns}>
          <button
            type="button"
            className={s.primaryBtn}
            onClick={() => {
              if (!('geolocation' in navigator)) return setGeoMsg('Location is not available in this browser.');
              setGeoMsg('Finding you…');
              navigator.geolocation.getCurrentPosition(
                p => {
                  set({ lat: +p.coords.latitude.toFixed(4), lng: +p.coords.longitude.toFixed(4), city: 'My location' });
                  setGeoMsg(null);
                },
                () => setGeoMsg('Location was not shared. You can choose a city instead.'),
                { maximumAge: 3600_000, timeout: 15_000 },
              );
            }}
          >
            Use my location
          </button>
        </div>
        {geoMsg && <p role="status" className={s.note}>{geoMsg}</p>}
        <label className={s.field}>
          <span>Or choose a city</span>
          <select
            value={CITIES.find(c => c[0] === st.city)?.[0] ?? ''}
            onChange={e => {
              const c = CITIES.find(x => x[0] === e.target.value);
              if (c) set({ city: c[0], lat: c[1], lng: c[2] });
            }}
          >
            <option value="">Select…</option>
            {CITIES.map(c => (
              <option key={c[0]} value={c[0]}>
                {c[0]}
              </option>
            ))}
          </select>
        </label>
        <form
          className={s.inlineForm}
          onSubmit={e => {
            e.preventDefault();
            const a = parseFloat(lat);
            const b = parseFloat(lng);
            if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180) {
              set({ lat: a, lng: b, city: 'Custom' });
              setLat('');
              setLng('');
            }
          }}
        >
          <label className={s.field}>
            <span>Latitude</span>
            <input inputMode="decimal" value={lat} onChange={e => setLat(e.target.value)} placeholder="12.97" />
          </label>
          <label className={s.field}>
            <span>Longitude</span>
            <input inputMode="decimal" value={lng} onChange={e => setLng(e.target.value)} placeholder="77.59" />
          </label>
          <button type="submit" className={s.ghostBtn}>
            Save
          </button>
        </form>

        <label className={s.field}>
          <span>Calculation method</span>
          <select value={st.method} onChange={e => set({ method: e.target.value as Method })}>
            {(Object.keys(METHODS) as Method[]).map(m => (
              <option key={m} value={m}>
                {METHODS[m].label}
              </option>
            ))}
          </select>
        </label>
        <label className={s.field}>
          <span>Asr</span>
          <select value={st.asr} onChange={e => set({ asr: e.target.value as Settings['asr'] })}>
            <option value="standard">Standard (Shafi&apos;i, Maliki, Hanbali)</option>
            <option value="hanafi">Hanafi</option>
          </select>
        </label>

        {lt?.real && (
          <ul className={s.timesList}>
            {(Object.keys(PRAYER_LABEL) as (keyof typeof PRAYER_LABEL)[]).map(k => (
              <li key={k}>
                <span>{PRAYER_LABEL[k]}</span>
                <span>{formatTime(lt.real![k])}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={s.card} aria-labelledby="gd-hijri">
        <h2 id="gd-hijri" className={s.cardTitle}>
          Hijri date
        </h2>
        <p className={s.refLine}>Moon sighting where you live may differ from Umm al-Qura by a day or two.</p>
        <label className={s.field}>
          <span>Adjustment</span>
          <select value={st.hijriOffset} onChange={e => set({ hijriOffset: Number(e.target.value) as HijriOffset })}>
            {[-2, -1, 0, 1, 2].map(n => (
              <option key={n} value={n}>
                {n > 0 ? `+${n}` : n} {Math.abs(n) === 1 ? 'day' : 'days'}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className={s.card} aria-labelledby="gd-feel">
        <h2 id="gd-feel" className={s.cardTitle}>
          Counting
        </h2>
        <Toggle label="Khushu mode" hint="Hide every number; one bead moves at breathing pace." checked={st.khushuMode} onChange={v => set({ khushuMode: v })} />
        <Toggle label="Haptics" hint="A light tick per count (Android)." checked={st.haptics} onChange={v => set({ haptics: v })} />
        <Toggle label="Sound" hint="A wooden bead click. No music, no bells." checked={st.sound} onChange={v => set({ sound: v })} />
        <label className={s.field}>
          <span>Slowest pace between counts: {st.minTapGapMs} ms</span>
          <input
            type="range"
            min={0}
            max={1500}
            step={50}
            value={st.minTapGapMs}
            onChange={e => set({ minTapGapMs: Number(e.target.value) })}
          />
        </label>
        <p className={s.refLine}>Taps faster than this make a ripple but are not counted.</p>
      </section>

      <BackupPanel />
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={s.toggle}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span>
        <strong>{label}</strong>
        <br />
        <span className={s.refLine}>{hint}</span>
      </span>
    </label>
  );
}
