'use client';
/** Global search across vocabulary, duas, surahs and personal notes. Ctrl/⌘ K or "/" opens it. */
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CHAPTERS } from '../content/chapters';
import { DUAS } from '../content/duas';
import { VOCAB } from '../content/vocabulary';
import { describe, kindOf, KIND_PLURAL, type Kind } from '../lib/items';
import { bareArabic } from '../lib/quiz';
import { useLearn } from '../store/LearnProvider';
import { IconSearch } from './Icons';
import { KindIcon } from './TrackIcon';
import s from '../learn.module.css';

type Hit = { itemId: string; title: string; subtitle: string; arabic: string; href: string; note?: string };

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ'`’]/g, '');

export function searchItems(query: string, notes: Record<string, { text: string }>): Hit[] {
  const q = norm(query.trim());
  const qa = bareArabic(query.trim());
  if (q.length < 2 && qa.length < 2) return [];
  const isArabic = /[؀-ۿ]/.test(query);
  const hits: (Hit & { score: number })[] = [];
  const consider = (itemId: string, fields: string[], arabicFields: string[], boost = 0) => {
    let score = 0;
    if (isArabic) {
      for (const a of arabicFields) {
        const b = bareArabic(a);
        if (b === qa) score = Math.max(score, 3);
        else if (b.includes(qa)) score = Math.max(score, 2);
      }
    } else {
      for (const f of fields) {
        const n = norm(f);
        if (n === q) score = Math.max(score, 3);
        else if (n.startsWith(q)) score = Math.max(score, 2.5);
        else if (n.includes(q)) score = Math.max(score, 1.5);
      }
    }
    const note = notes[itemId]?.text;
    if (!isArabic && note && norm(note).includes(q)) score = Math.max(score, 1.2);
    if (score > 0) {
      const d = describe(itemId)!;
      hits.push({ itemId, ...d, note, score: score + boost });
    }
  };
  for (const w of VOCAB) consider(`v:${w.id}`, [w.meaning, w.translit ?? ''], [w.form, w.lemma, w.root.replace(/ /g, '')], w.occurrences / 10000);
  for (const d of DUAS) consider(`d:${d.id}`, [d.title, d.translation, d.transliteration, d.reference], [d.arabic]);
  for (const c of CHAPTERS) consider(`s:${c.id}`, [c.nameSimple, c.meaning, String(c.id)], [c.nameArabic], 0.1);
  return hits.sort((a, b) => b.score - a.score).slice(0, 24);
}

/** Ask the shell to open the search dialog (used by search boxes outside the header). */
export const OPEN_SEARCH_EVENT = 'l1m:open-search';
export const openSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useLearn();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchItems(q, data.notes), [q, data.notes]);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => input.current?.focus(), 10);
    }
  }, [open]);
  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  const go = (h: Hit) => {
    onClose();
    router.push(h.href);
  };
  const groups = (['v', 'd', 's'] as Kind[]).map(k => ({ k, items: results.filter(r => kindOf(r.itemId) === k) })).filter(g => g.items.length);
  const flat = groups.flatMap(g => g.items);

  return (
    <div className={s.searchBack} onMouseDown={onClose}>
      <div className={s.searchBox} role="dialog" aria-modal="true" aria-label="Search" onMouseDown={e => e.stopPropagation()}>
        <div className={s.searchInputRow}>
          <IconSearch className={s.i20} />
          <input
            ref={input}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search words, meanings, duas, surahs or your notes…"
            aria-label="Search"
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls="l1m-search-results"
            aria-activedescendant={flat[active] ? `sr-${flat[active].itemId}` : undefined}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive(a => Math.min(flat.length - 1, a + 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive(a => Math.max(0, a - 1));
              }
              if (e.key === 'Enter' && flat[active]) go(flat[active]);
            }}
          />
          <kbd className={s.kbd}>Esc</kbd>
        </div>
        <div id="l1m-search-results" role="listbox" className={s.searchResults}>
          {q.trim().length < 2 ? (
            <p className={s.searchHint}>Try “mercy”, “Lord”, “sleep”, “Ikhlas” or type in Arabic, e.g. رحم</p>
          ) : flat.length === 0 ? (
            <p className={s.searchHint}>No matches for “{q}”.</p>
          ) : (
            groups.map(g => (
              <div key={g.k}>
                <p className={s.searchGroup}>{KIND_PLURAL[g.k]}</p>
                {g.items.map(h => {
                  const idx = flat.indexOf(h);
                  return (
                    <button
                      key={h.itemId}
                      id={`sr-${h.itemId}`}
                      type="button"
                      role="option"
                      aria-selected={idx === active}
                      className={idx === active ? s.searchHitOn : s.searchHit}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => go(h)}
                    >
                      <KindIcon kind={g.k} className={s.i18} />
                      <span className={s.searchHitText}>
                        <strong>{h.title}</strong>
                        <span>{h.note ? `Note: ${h.note}` : h.subtitle}</span>
                      </span>
                      <span className={s.searchHitAr} lang="ar" dir="rtl">
                        {h.arabic}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
