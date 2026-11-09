'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { VOCAB, VOCAB_BY_ID, POS_LABEL, type PartOfSpeech } from '../content/vocabulary';
import { bareArabic } from '../lib/quiz';
import { isDue, needsPractice, status } from '../lib/srs';
import { useLearn } from '../store/LearnProvider';
import { WordDetail } from './cards';
import { IconCheck, IconClose, IconSearch } from './Icons';
import { AudioButton, EmptyState, PageHeader, Ready } from './ui';
import s from '../learn.module.css';

type StatusFilter = 'all' | 'new' | 'learning' | 'mastered' | 'practice' | 'saved';
type Sort = 'frequency' | 'az' | 'root';

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ'`’]/g, '');

function Inner() {
  const { data, dispatch, clock } = useLearn();
  const params = useSearchParams();
  const router = useRouter();
  const selected = params?.get('word') ?? null;
  const [q, setQ] = useState('');
  const [pos, setPos] = useState<'all' | PartOfSpeech>('all');
  const [st, setSt] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<Sort>('frequency');
  const detailRef = useRef<HTMLDivElement>(null);
  const today = clock!.today;

  const statusOf = (id: string) => {
    const c = data.cards[`v:${id}`];
    return c ? status(c) : 'new';
  };

  const list = useMemo(() => {
    const nq = norm(q.trim());
    const aq = bareArabic(q.trim());
    const arabic = /[؀-ۿ]/.test(q);
    const out = VOCAB.filter(w => {
      if (pos !== 'all' && w.pos !== pos) return false;
      const c = data.cards[`v:${w.id}`];
      if (st === 'saved' && !data.saved[`v:${w.id}`]) return false;
      if (st === 'practice' && !(c && needsPractice(c))) return false;
      if (st !== 'all' && st !== 'saved' && st !== 'practice' && (c ? status(c) : 'new') !== st) return false;
      if (!nq) return true;
      return arabic
        ? [w.form, w.lemma, w.root.replace(/ /g, '')].some(x => bareArabic(x).includes(aq))
        : norm(w.meaning).includes(nq) || norm(w.translit ?? '').includes(nq);
    });
    if (sort === 'az') out.sort((a, b) => (a.translit ?? '').localeCompare(b.translit ?? ''));
    if (sort === 'root') out.sort((a, b) => a.root.localeCompare(b.root, 'ar'));
    return out;
  }, [q, pos, st, sort, data.cards, data.saved]);

  const word = selected ? VOCAB_BY_ID[selected] : undefined;
  useEffect(() => {
    if (word && window.innerWidth < 1000) detailRef.current?.focus();
  }, [word]);

  const open = (id: string | null) => router.replace(id ? `/learn-1-min/vocabulary?word=${id}` : '/learn-1-min/vocabulary', { scroll: false });
  const card = word ? data.cards[`v:${word.id}`] : undefined;

  return (
    <div className={word ? s.vocabOpen : s.vocabPage}>
      <PageHeader
        eyebrow="Module"
        title="Qur’an vocabulary"
        lead={`The ${VOCAB.length} most frequent words of the Qur’an, with their roots, how often they occur and real examples.`}
      />
      <div className={s.toolbar}>
        <label className={s.searchField}>
          <IconSearch className={s.i18} />
          <span className={s.srOnly}>Search vocabulary</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search meaning, transliteration or Arabic" />
        </label>
        <label className={s.selectField}>
          <span className={s.srOnly}>Sort</span>
          <select value={sort} onChange={e => setSort(e.target.value as Sort)}>
            <option value="frequency">Most frequent first</option>
            <option value="az">A–Z (transliteration)</option>
            <option value="root">By root</option>
          </select>
        </label>
      </div>
      <div className={s.chips} role="group" aria-label="Filter by status">
        {(
          [
            ['all', 'All'], ['new', 'New'], ['learning', 'Learning'], ['mastered', 'Mastered'], ['practice', 'Needs practice'], ['saved', 'Saved'],
          ] as [StatusFilter, string][]
        ).map(([k, label]) => (
          <button key={k} type="button" className={st === k ? s.chipOn : s.chipBtn} aria-pressed={st === k} onClick={() => setSt(k)}>
            {label}
          </button>
        ))}
        <span className={s.chipSep} aria-hidden />
        {(['all', 'noun', 'verb', 'adjective'] as const).map(p => (
          <button key={p} type="button" className={pos === p ? s.chipOn : s.chipBtn} aria-pressed={pos === p} onClick={() => setPos(p)}>
            {p === 'all' ? 'All types' : `${POS_LABEL[p]}s`}
          </button>
        ))}
      </div>
      <p className={s.resultCount} aria-live="polite">
        {list.length} {list.length === 1 ? 'word' : 'words'}
      </p>

      <div className={word ? s.splitOpen : s.split}>
        <div>
          {list.length === 0 ? (
            <EmptyState icon={<IconSearch className={s.i20} />} title="No words match" body="Try another search or clear the filters." />
          ) : (
            <ul className={s.wordGrid}>
              {list.map(w => {
                const stt = statusOf(w.id);
                const c = data.cards[`v:${w.id}`];
                return (
                  <li key={w.id}>
                    <div className={`${s.wordTile} ${selected === w.id ? s.wordTileOn : ''}`}>
                      <button type="button" className={s.wordTileMain} onClick={() => open(w.id)} aria-current={selected === w.id}>
                        <span className={s.wordTileAr} lang="ar" dir="rtl">
                          {w.form}
                        </span>
                        <span className={s.wordTileTr}>{w.translit}</span>
                        <span className={s.wordTileEn}>{w.meaning}</span>
                        <span className={s.wordTileMeta}>
                          <span lang="ar" dir="rtl">{w.root}</span> · {w.occurrences}×
                        </span>
                      </button>
                      <span className={`${s.statusDot} ${s[`st_${stt}`]}`} title={stt === 'new' ? 'Not learned yet' : stt === 'mastered' ? 'Mastered' : c && isDue(c, today) ? 'Due for revision' : 'Learning'}>
                        {stt === 'mastered' && <IconCheck className={s.i12} />}
                      </span>
                      <AudioButton src={w.audio} label={`pronunciation of ${w.translit}`} small />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {word && (
          <aside className={s.detailPanel} aria-label={`${word.translit} details`} tabIndex={-1} ref={detailRef}>
            <div className={s.rowBetween}>
              <span className={`${s.chip} ${s.chip_v}`}>{statusOf(word.id) === 'new' ? 'Not learned yet' : statusOf(word.id) === 'mastered' ? 'Mastered' : 'Learning'}</span>
              <button type="button" className={s.iconBtn} onClick={() => open(null)} aria-label="Close details">
                <IconClose className={s.i18} />
              </button>
            </div>
            <WordDetail w={word} />
            {!card ? (
              <button type="button" className={s.btnPrimaryWide} onClick={() => dispatch({ type: 'grade', itemId: `v:${word.id}`, grade: 2, day: today })}>
                I know this word — add it to revision
              </button>
            ) : (
              <p className={s.muted}>
                Next revision: {card.due <= today ? 'today' : new Date(card.due + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · reviewed{' '}
                {card.history.length} {card.history.length === 1 ? 'time' : 'times'}
              </p>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

export default function VocabularyPage() {
  return (
    <Ready>
      <Inner />
    </Ready>
  );
}
