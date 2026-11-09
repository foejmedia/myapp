'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CHAPTERS, SURAH_ORDER } from '../content/chapters';
import { bareArabic } from '../lib/quiz';
import { useLearn } from '../store/LearnProvider';
import { IconCheck, IconSearch } from './Icons';
import { EmptyState, PageHeader, Progress, Ready, SaveButton } from './ui';
import s from '../learn.module.css';

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-'’ʿ]/g, '');

function Inner() {
  const { data } = useLearn();
  const [q, setQ] = useState('');
  const [view, setView] = useState<'all' | 'started' | 'saved' | 'learned'>('all');
  const [order, setOrder] = useState<'number' | 'learning'>('learning');

  const list = useMemo(() => {
    const nq = norm(q.trim());
    const aq = bareArabic(q.trim());
    const ids = order === 'number' ? CHAPTERS.map(c => c.id) : SURAH_ORDER;
    return ids
      .map(id => CHAPTERS[id - 1])
      .filter(c => {
        const id = `s:${c.id}`;
        if (view === 'started' && !data.ayat[String(c.id)]?.length) return false;
        if (view === 'saved' && !data.saved[id]) return false;
        if (view === 'learned' && !data.known[id]) return false;
        if (!nq) return true;
        return /[؀-ۿ]/.test(q) ? bareArabic(c.nameArabic).includes(aq) : norm(c.nameSimple).includes(nq) || norm(c.meaning).includes(nq) || String(c.id) === nq;
      });
  }, [q, view, order, data.ayat, data.saved, data.known]);

  const started = Object.keys(data.ayat).length;
  const totalAyat = Object.values(data.ayat).reduce((n, l) => n + l.length, 0);

  return (
    <>
      <PageHeader
        eyebrow="Module"
        title="Surah learning"
        lead={`Read, listen and learn ayah by ayah. You have started ${started} ${started === 1 ? 'surah' : 'surahs'} and learned ${totalAyat} ${totalAyat === 1 ? 'ayah' : 'ayat'}.`}
      />
      <div className={s.toolbar}>
        <label className={s.searchField}>
          <IconSearch className={s.i18} />
          <span className={s.srOnly}>Search surahs</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, meaning or number" />
        </label>
        <label className={s.selectField}>
          <span className={s.srOnly}>Order</span>
          <select value={order} onChange={e => setOrder(e.target.value as 'number' | 'learning')}>
            <option value="learning">Suggested learning order</option>
            <option value="number">Mushaf order (1–114)</option>
          </select>
        </label>
      </div>
      <div className={s.chips} role="group" aria-label="Show">
        {(
          [
            ['all', 'All 114'], ['started', 'In progress'], ['learned', 'Learned'], ['saved', 'Saved'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" className={view === k ? s.chipOn : s.chipBtn} aria-pressed={view === k} onClick={() => setView(k)}>
            {label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<IconSearch className={s.i20} />} title="No surahs here yet" body={view === 'all' ? 'Try another search.' : 'Open a surah and mark ayat as you learn them.'} />
      ) : (
        <ul className={s.surahGrid}>
          {list.map(c => {
            const learned = data.ayat[String(c.id)]?.length ?? 0;
            const known = !!data.known[`s:${c.id}`];
            return (
              <li key={c.id} className={s.surahTile}>
                <Link href={`/learn-1-min/surahs/${c.id}`} className={s.surahTileMain}>
                  <span className={s.surahNum} aria-hidden>
                    {c.id}
                  </span>
                  <span className={s.surahTileText}>
                    <strong>{c.nameSimple}</strong>
                    <span>
                      {c.meaning} · {c.versesCount} ayat
                    </span>
                  </span>
                  <span className={s.surahTileAr} lang="ar" dir="rtl">
                    {c.nameArabic}
                  </span>
                </Link>
                <div className={s.surahTileFoot}>
                  <Progress value={learned / c.versesCount} label={`${c.nameSimple}: ${learned} of ${c.versesCount} ayat learned`} />
                  <span className={s.muted}>{known ? <><IconCheck className={s.i14} /> Learned</> : `${learned}/${c.versesCount}`}</span>
                  <SaveButton itemId={`s:${c.id}`} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className={s.sourceNote}>Surah names and meanings: Quran.com. Text, translation and recitation load from Quran.com when you open a surah.</p>
    </>
  );
}

export default function SurahsPage() {
  return (
    <Ready>
      <Inner />
    </Ready>
  );
}
