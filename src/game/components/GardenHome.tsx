'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AFTER_SALAH, DHIKR, DHIKR_BY_ID } from '../content/dhikr';
import { DAY_MS, localDay } from '../lib/day';
import { buildGarden, fountainFlows, goodTreeScale, rainLevel, ringDays, todayCounts } from '../lib/engine';
import { placePlants } from '../lib/layout';
import { PRAYER_LABEL, formatTime } from '../lib/prayer';
import { currentSalah, nextSalah } from '../lib/sky';
import { useGarden } from '../state/GardenProvider';
import { useLivingTime } from '../state/useLivingTime';
import GardenView from './GardenView';
import Onboarding from './Onboarding';
import RingsView from './RingsView';
import TasbihRing, { type Session } from './TasbihRing';
import s from '../game.module.css';

const ADHAN_CARD_MS = 15 * 60_000;
const AFTER_SALAH_WINDOW_MS = 45 * 60_000;
const DISMISS_KEY = 'garden-of-dhikr:adhan-dismissed';

export default function GardenHome() {
  const { state, ready, firstVisit, finishOnboarding } = useGarden();
  const lt = useLivingTime();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [showRings, setShowRings] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [offer, setOffer] = useState(false);

  const dayKey = lt ? localDay(lt.now) : '';

  useEffect(() => {
    try {
      setDismissed(JSON.parse(sessionStorage.getItem(DISMISS_KEY) ?? '[]'));
    } catch {
      /* session storage blocked */
    }
  }, []);

  // Deep link from a seed card: /game#count=<id>
  useEffect(() => {
    if (!ready) return;
    const m = window.location.hash.match(/^#count=([\w-]+)$/);
    if (!m) return;
    if (m[1] === 'after-salah') setSession({ kind: 'set' });
    else if (DHIKR_BY_ID[m[1]]) setSession({ kind: 'single', dhikrId: m[1] });
    history.replaceState(null, '', window.location.pathname);
  }, [ready]);

  const placed = useMemo(
    () => (ready ? placePlants(buildGarden(state, Date.now())) : []),
    // dayKey: blossoming depends on the date, not the second
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.totals, state.milestones, state.userSeed, ready, dayKey],
  );

  const today = ready ? todayCounts(state) : {};
  const rings = ready ? ringDays(state) : [];
  const todayTotal = Object.values(today).reduce((a, b) => a + b, 0);

  // Adhan card: real prayer times only (needs a location).
  const due = useMemo(() => {
    if (!lt?.real) return null;
    const cur = currentSalah(lt.now, lt.real);
    if (!cur) return null;
    const key = `${dayKey}:${cur.name}`;
    if (lt.now.getTime() - cur.start.getTime() > ADHAN_CARD_MS || dismissed.includes(key)) return null;
    return { ...cur, key };
  }, [lt, dayKey, dismissed]);

  const dismiss = useCallback((key: string) => {
    setDismissed(list => {
      const next = [...list, key];
      try {
        sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const afterSalahNow = useMemo(() => {
    if (!lt?.real) return false;
    const cur = currentSalah(lt.now, lt.real);
    return !!cur && lt.now.getTime() - cur.start.getTime() < AFTER_SALAH_WINDOW_MS;
  }, [lt]);

  const suggestion = useMemo(() => {
    if (afterSalahNow) return 'after-salah';
    let best = DHIKR[0].id;
    for (const d of DHIKR) if ((today[d.id] ?? 0) < (today[best] ?? 0)) best = d.id;
    return best;
  }, [afterSalahNow, today]);

  const needsBackup = useMemo(() => {
    if (!ready || rings.length === 0) return false;
    const since = Date.parse(state.lastBackupAt ?? state.createdAt);
    return Date.now() - since > 30 * DAY_MS;
  }, [ready, rings.length, state.lastBackupAt, state.createdAt]);

  const plantCount = placed.reduce((n, p) => n + p.weight, 0);
  const label = ready
    ? `Your garden: ${plantCount} ${plantCount === 1 ? 'plant' : 'plants'} across four quadrants, with the Good Tree at the centre.`
    : 'A quiet garden is waking.';

  const next = lt ? nextSalah(lt.now, lt.times) : null;

  return (
    <div className={s.home}>
      <section className={`${s.gardenFrame} ${due ? s.dimmed : ''}`} aria-label="The garden">
        <GardenView
          placed={placed}
          goodTreeScale={ready ? goodTreeScale(state) : 0.75}
          goodTreeSeed={`${state.userSeed}:good-tree`}
          phase={lt?.phase ?? 'morning'}
          rain={ready ? rainLevel(state) : 0}
          fountain={due ? 'paused' : ready && fountainFlows(state) ? 'flowing' : 'still'}
          looks={lt?.seasons.map(x => x.id) ?? []}
          gates={{ dawn: !!lt?.windows.morning, moon: !!lt?.windows.evening }}
          label={label}
          onSelect={id => (id === 'good-tree' ? setShowRings(true) : router.push(`/game/seeds/${id}`))}
        />
      </section>

      <div className={s.panelStack}>
        {ready && todayTotal === 0 && rings.length > 0 && (
          <p className={s.dew}>Your garden kept your place. Morning dew is on the leaves, and a seed is waiting.</p>
        )}

        {lt && lt.seasons.length > 0 && (
          <div className={s.card}>
            {lt.seasons.map(se => (
              <p key={se.id} className={s.season}>
                <strong>{se.label}.</strong> {se.featured}
                {se.ref && <span className={s.refInline}> ({se.ref})</span>}
              </p>
            ))}
          </div>
        )}

        <div className={s.timeStrip}>
          {lt?.hasLocation && next ? (
            <span>
              Next: {PRAYER_LABEL[next.name]} at {formatTime(next.start)}
            </span>
          ) : lt?.hasLocation ? (
            <span>Isha has begun. Rest well.</span>
          ) : (
            <Link href="/game/settings" className={s.textLink}>
              Set your location for prayer times and a true sky
            </Link>
          )}
          <span className={s.phaseTag}>{lt?.sky.label ?? ''}</span>
        </div>

        <section className={s.card} aria-labelledby="gd-pouch">
          <h2 id="gd-pouch" className={s.cardTitle}>
            Seed pouch
          </h2>
          <ul className={s.pouch}>
            <li>
              <button
                type="button"
                className={`${s.seedBtn} ${suggestion === 'after-salah' ? s.suggested : ''}`}
                onClick={() => setSession({ kind: 'set' })}
                disabled={!ready}
              >
                <span className={s.seedName}>{AFTER_SALAH.label}</span>
                <span className={s.seedMeta}>33 · 33 · 34 — the fountain flows</span>
                {suggestion === 'after-salah' && <span className={s.suggestTag}>Suggested now</span>}
              </button>
            </li>
            {DHIKR.map(d => (
              <li key={d.id}>
                <button
                  type="button"
                  className={`${s.seedBtn} ${suggestion === d.id ? s.suggested : ''}`}
                  onClick={() => setSession({ kind: 'single', dhikrId: d.id })}
                  disabled={!ready}
                >
                  <span className={s.seedArabic} lang="ar" dir="rtl">
                    {d.arabic}
                  </span>
                  <span className={s.seedName}>{d.transliteration}</span>
                  <span className={s.seedMeta}>
                    {d.plant}
                    {!state.settings.khushuMode && ready && (today[d.id] ?? 0) > 0 ? ` · today ${today[d.id]}` : ''}
                  </span>
                  {suggestion === d.id && <span className={s.suggestTag}>A gentle suggestion</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className={s.rowBtns}>
          <button type="button" className={s.ghostBtn} onClick={() => setShowRings(true)} disabled={!ready}>
            Rings of the Good Tree
          </button>
          <Link href="/game/library" className={s.ghostBtn}>
            Meanings of each seed
          </Link>
        </div>

        {needsBackup && (
          <p className={s.note}>
            It has been a while since your last backup. Your garden lives only in this browser.{' '}
            <Link href="/game/settings#backup" className={s.textLink}>
              Export a backup
            </Link>
          </p>
        )}
      </div>

      {due && (
        <div className={s.modalBack} role="dialog" aria-modal="true" aria-labelledby="gd-adhan">
          <div className={s.modal}>
            <h2 id="gd-adhan" className={s.modalTitle}>
              It is time for {PRAYER_LABEL[due.name]}.
            </h2>
            <p className={s.modalBody}>The garden will wait for you.</p>
            <div className={s.modalActions}>
              <button type="button" className={s.ghostBtn} onClick={() => dismiss(due.key)}>
                Close
              </button>
              <button
                type="button"
                className={s.primaryBtn}
                autoFocus
                onClick={() => {
                  dismiss(due.key);
                  setOffer(true);
                }}
              >
                I have prayed
              </button>
            </div>
          </div>
        </div>
      )}

      {offer && !due && (
        <div className={s.modalBack} role="dialog" aria-modal="true" aria-labelledby="gd-offer">
          <div className={s.modal}>
            <h2 id="gd-offer" className={s.modalTitle}>
              Would you like the after-salah tasbih?
            </h2>
            <p className={s.modalBody}>SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34.</p>
            <p className={s.refLine}>{AFTER_SALAH.source.ref}</p>
            <div className={s.modalActions}>
              <button type="button" className={s.ghostBtn} onClick={() => setOffer(false)}>
                Not now
              </button>
              <button
                type="button"
                className={s.primaryBtn}
                autoFocus
                onClick={() => {
                  setOffer(false);
                  setSession({ kind: 'set' });
                }}
              >
                Begin
              </button>
            </div>
          </div>
        </div>
      )}

      {session && <TasbihRing key={JSON.stringify(session)} session={session} onClose={() => setSession(null)} />}
      {showRings && <RingsView onClose={() => setShowRings(false)} />}
      {ready && firstVisit && <Onboarding onDone={finishOnboarding} />}
    </div>
  );
}
