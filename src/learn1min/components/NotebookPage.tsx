'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { describe, kindOf, KIND_PLURAL, type Kind } from '../lib/items';
import { bareArabic } from '../lib/quiz';
import { useLearn } from '../store/LearnProvider';
import { IconArrow, IconNotebook, IconSearch } from './Icons';
import { KindIcon } from './TrackIcon';
import { EmptyState, NoteEditor, PageHeader, Ready, SaveButton } from './ui';
import s from '../learn.module.css';

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function Inner() {
  const { data } = useLearn();
  const [filter, setFilter] = useState<'all' | Kind | 'notes'>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'recent' | 'az'>('recent');

  // Everything saved, plus anything with a note (a note keeps an item in the notebook).
  const entries = useMemo(() => {
    const ids = new Set([...Object.keys(data.saved), ...Object.keys(data.notes)]);
    const out: { id: string; d: NonNullable<ReturnType<typeof describe>>; at: string; note?: string }[] = [];
    for (const id of ids) {
      const d = describe(id);
      if (d) out.push({ id, d, at: data.saved[id] ?? data.notes[id]?.updatedAt ?? '', note: data.notes[id]?.text });
    }
    return out;
  }, [data.saved, data.notes]);

  const list = useMemo(() => {
    const nq = norm(q.trim());
    const aq = bareArabic(q.trim());
    const ar = /[؀-ۿ]/.test(q);
    const out = entries.filter(e => {
      if (filter === 'notes' ? !e.note : filter !== 'all' && kindOf(e.id) !== filter) return false;
      if (!nq) return true;
      return ar ? bareArabic(e.d.arabic).includes(aq) : [e.d.title, e.d.subtitle, e.note ?? ''].some(f => norm(f).includes(nq));
    });
    return out.sort((a, b) => (sort === 'az' ? a.d.title.localeCompare(b.d.title) : a.at < b.at ? 1 : -1));
  }, [entries, filter, q, sort]);

  const counts = { v: 0, d: 0, s: 0 } as Record<Kind, number>;
  entries.forEach(e => counts[kindOf(e.id)]++);

  return (
    <>
      <PageHeader eyebrow="Personal" title="Notebook" lead="Your saved words, duas and surahs, with your own notes. Everything here is private to your profile." />
      <div className={s.toolbar}>
        <label className={s.searchField}>
          <IconSearch className={s.i18} />
          <span className={s.srOnly}>Search notebook</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search saved items and notes" />
        </label>
        <label className={s.selectField}>
          <span className={s.srOnly}>Sort</span>
          <select value={sort} onChange={e => setSort(e.target.value as 'recent' | 'az')}>
            <option value="recent">Recently saved</option>
            <option value="az">A–Z</option>
          </select>
        </label>
      </div>
      <div className={s.chips} role="group" aria-label="Filter">
        <button type="button" className={filter === 'all' ? s.chipOn : s.chipBtn} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          All <span className={s.chipCount}>{entries.length}</span>
        </button>
        {(['v', 'd', 's'] as Kind[]).map(k => (
          <button key={k} type="button" className={filter === k ? s.chipOn : s.chipBtn} aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {KIND_PLURAL[k]} <span className={s.chipCount}>{counts[k]}</span>
          </button>
        ))}
        <button type="button" className={filter === 'notes' ? s.chipOn : s.chipBtn} aria-pressed={filter === 'notes'} onClick={() => setFilter('notes')}>
          With notes <span className={s.chipCount}>{entries.filter(e => e.note).length}</span>
        </button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<IconNotebook className={s.i20} />}
          title="Your notebook is empty"
          body="Save vocabulary, bookmark duas and save surahs with the bookmark button. Add notes to remember why they matter to you."
          action={
            <Link href="/learn-1-min/vocabulary" className={s.btnPrimary}>
              Browse vocabulary
            </Link>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState icon={<IconSearch className={s.i20} />} title="Nothing matches" body="Try another search or filter." />
      ) : (
        <ul className={s.noteGrid}>
          {list.map(e => (
            <li key={e.id} className={`${s.noteCard} ${s[`noteCard_${kindOf(e.id)}`]}`}>
              <div className={s.rowBetween}>
                <span className={s.noteKind}>
                  <KindIcon kind={kindOf(e.id)} className={s.i14} /> {KIND_PLURAL[kindOf(e.id)].slice(0, -1)}
                  {e.at && ` · ${new Date(e.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
                </span>
                <SaveButton itemId={e.id} />
              </div>
              <p className={kindOf(e.id) === 'd' ? s.noteArSm : s.noteAr} lang="ar" dir="rtl">
                {e.d.arabic}
              </p>
              <h2 className={s.noteTitle}>{e.d.title}</h2>
              <p className={s.noteSub}>{e.d.subtitle}</p>
              <NoteEditor itemId={e.id} compact />
              <Link href={e.d.href} className={s.textLink}>
                Open <IconArrow className={s.i16} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function NotebookPage() {
  return (
    <Ready>
      <Inner />
    </Ready>
  );
}
