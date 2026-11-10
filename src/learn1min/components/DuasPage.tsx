'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DUAS, DUA_CATEGORIES } from '../content/duas';
import { bareArabic } from '../lib/quiz';
import { useLearn } from '../store/LearnProvider';
import { DuaBody } from './cards';
import { IconCheck, IconSearch } from './Icons';
import { EmptyState, NoteEditor, PageHeader, Ready, SaveButton } from './ui';
import s from '../learn.module.css';

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function Inner() {
  const { data, dispatch, clock } = useLearn();
  const params = useSearchParams();
  const focus = params?.get('dua') ?? null;
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'all' | 'saved' | 'learned' | 'quran'>('all');

  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(`dua-${focus}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  }, [focus]);

  const list = useMemo(() => {
    const nq = norm(q.trim());
    const aq = bareArabic(q.trim());
    const arabic = /[؀-ۿ]/.test(q);
    return DUAS.filter(d => {
      const id = `d:${d.id}`;
      if (cat !== 'all' && d.category !== cat) return false;
      if (view === 'saved' && !data.saved[id]) return false;
      if (view === 'learned' && !data.known[id]) return false;
      if (view === 'quran' && d.source !== 'Quran') return false;
      if (!nq) return true;
      return arabic ? bareArabic(d.arabic).includes(aq) : [d.title, d.translation, d.transliteration, d.reference].some(f => norm(f).includes(nq));
    });
  }, [cat, q, view, data.saved, data.known]);

  const learnedCount = DUAS.filter(d => data.known[`d:${d.id}`]).length;

  return (
    <>
      <PageHeader
        eyebrow="Module"
        title="Daily duas"
        lead={`${DUAS.length} duas for everyday moments, each with its source. You have learned ${learnedCount}.`}
      />
      <div className={s.toolbar}>
        <label className={s.searchField}>
          <IconSearch className={s.i18} />
          <span className={s.srOnly}>Search duas</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by occasion, meaning or Arabic" />
        </label>
        <div className={s.segmented} role="group" aria-label="Show">
          {(
            [
              ['all', 'All'], ['saved', 'Favourites'], ['learned', 'Learned'], ['quran', 'From the Qur’an'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" className={view === k ? s.segOn : s.seg} aria-pressed={view === k} onClick={() => setView(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={s.chips} role="group" aria-label="Categories">
        <button type="button" className={cat === 'all' ? s.chipOn : s.chipBtn} aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
          All categories
        </button>
        {DUA_CATEGORIES.map(c => (
          <button key={c.id} type="button" className={cat === c.id ? s.chipOn : s.chipBtn} aria-pressed={cat === c.id} onClick={() => setCat(c.id)} title={c.description}>
            {c.title} <span className={s.chipCount}>{c.count}</span>
          </button>
        ))}
      </div>
      <p className={s.resultCount} aria-live="polite">
        {list.length} {list.length === 1 ? 'dua' : 'duas'}
      </p>

      {list.length === 0 ? (
        <EmptyState
          icon={<IconSearch className={s.i20} />}
          title={view === 'saved' ? 'No favourite duas yet' : view === 'learned' ? 'No learned duas yet' : 'No duas match'}
          body={view === 'saved' ? 'Tap the bookmark on a dua to keep it here.' : 'Try another category or search.'}
        />
      ) : (
        <ul className={s.duaGrid}>
          {list.map(d => {
            const id = `d:${d.id}`;
            const known = !!data.known[id];
            return (
              <li key={d.id}>
                <article id={`dua-${d.id}`} tabIndex={-1} className={`${s.duaCard} ${focus === d.id ? s.duaFocus : ''}`} aria-labelledby={`dua-t-${d.id}`}>
                  <div className={s.rowBetween}>
                    <div>
                      <p className={s.eyebrowSm}>{DUA_CATEGORIES.find(c => c.id === d.category)?.title}</p>
                      <h2 id={`dua-t-${d.id}`} className={s.duaTitle}>
                        {d.title}
                      </h2>
                    </div>
                    <SaveButton itemId={id} />
                  </div>
                  <DuaBody d={d} />
                  {d.ayat.length === 0 && !d.hisn && <p className={s.fine}>No verified recording of this dua yet.</p>}
                  <div className={s.duaFoot}>
                    <button
                      type="button"
                      className={known ? s.btnKnown : s.btnGhost}
                      aria-pressed={known}
                      onClick={() => dispatch({ type: 'setKnown', itemId: id, known: !known, day: clock!.today })}
                    >
                      <IconCheck className={s.i16} /> {known ? 'Learned' : 'Mark as learned'}
                    </button>
                    <NoteEditor itemId={id} compact />
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function DuasPage() {
  return (
    <Ready>
      <Inner />
    </Ready>
  );
}
