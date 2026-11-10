'use client';
/** Content cards for a word, a dua and a surah — used by the daily lesson and the module pages. */
import Link from 'next/link';
import { ayahAudio, chapter, type ChapterInfo } from '../content/chapters';
import { duaDownloadHref, hasDuaAudio, type Dua } from '../content/duas';
import { POS_LABEL, meaningVerse, type VocabExample, type VocabWord } from '../content/vocabulary';
import { IconArrow, IconDownload } from './Icons';
import { AudioButton, NoteEditor, SaveButton } from './ui';
import s from '../learn.module.css';

export function ExampleAyah({ ex }: { ex: VocabExample }) {
  const c = chapter(Number(ex.key.split(':')[0]));
  return (
    <figure className={s.ayah}>
      <p className={s.ayahText} lang="ar" dir="rtl">
        {ex.words.map((w, i) => (
          <span key={i} className={i === ex.wordIndex ? s.ayahMark : undefined}>
            {w}{' '}
          </span>
        ))}
      </p>
      <figcaption className={s.ayahCaption}>
        <span>“{ex.translation}”</span>
        <span className={s.ayahRef}>
          <cite>
            {c ? `${c.nameSimple} ` : 'Qur’an '}
            {ex.key}
          </cite>
          <AudioButton src={ayahAudio(ex.key)} label={`recitation of ayah ${ex.key}`} small />
        </span>
      </figcaption>
    </figure>
  );
}

export function WordHead({ w, size = 'lg' }: { w: VocabWord; size?: 'lg' | 'md' }) {
  return (
    <div className={s.wordHead}>
      <div className={s.wordArRow}>
        <p className={size === 'lg' ? s.wordAr : s.wordArMd} lang="ar" dir="rtl">
          {w.form}
        </p>
        <AudioButton src={w.audio} label={`pronunciation of ${w.translit ?? 'the word'}`} />
      </div>
      {w.translit && <p className={s.translit}>{w.translit}</p>}
      <p className={s.meaning}>{w.meaning}</p>
      <p className={s.meaningNote}>Meaning in {meaningVerse(w)} (Quran.com word by word)</p>
    </div>
  );
}

export function WordFacts({ w }: { w: VocabWord }) {
  return (
    <dl className={s.facts}>
      <div>
        <dt>Root</dt>
        <dd lang="ar" dir="rtl" className={s.factAr}>
          {w.root}
        </dd>
      </div>
      <div>
        <dt>Dictionary form</dt>
        <dd lang="ar" dir="rtl" className={s.factAr}>
          {w.lemma}
        </dd>
      </div>
      <div>
        <dt>Type</dt>
        <dd>{POS_LABEL[w.pos]}</dd>
      </div>
      <div>
        <dt>In the Qur’an</dt>
        <dd>{w.occurrences.toLocaleString()} times</dd>
      </div>
    </dl>
  );
}

export function WordDetail({ w, withNotes = true }: { w: VocabWord; withNotes?: boolean }) {
  return (
    <div className={s.detail}>
      <WordHead w={w} />
      <WordFacts w={w} />
      <div>
        <p className={s.label}>Examples from the Qur’an</p>
        <div className={s.stack}>
          {w.examples.map(ex => (
            <ExampleAyah key={ex.key} ex={ex} />
          ))}
        </div>
      </div>
      {withNotes && (
        <div className={s.detailActions}>
          <SaveButton itemId={`v:${w.id}`} withText />
          <NoteEditor itemId={`v:${w.id}`} />
        </div>
      )}
      <p className={s.sourceNote}>
        Root, dictionary form and count: Quranic Arabic Corpus. Word, meaning, audio and ayat: Quran.com (Saheeh International).
      </p>
    </div>
  );
}

export function DuaBody({ d }: { d: Dua }) {
  return (
    <>
      <p className={s.duaAr} lang="ar" dir="rtl">
        {d.arabic}
      </p>
      <p className={s.translit}>{d.transliteration}</p>
      <p className={s.duaEn}>{d.translation}</p>
      <div className={s.duaMeta}>
        <span className={s.refPill}>{d.reference}</span>
        {d.ayat.length > 0 &&
          d.ayat.map(k => <AudioButton key={k} src={ayahAudio(k)} label={`recitation of ${k}`} text={d.ayat.length > 1 ? `Ayah ${k}` : 'Listen to the ayah'} small />)}
        {d.hisn && <AudioButton src={d.hisn.url} label={`recitation of ${d.title}`} text="Listen" small />}
        {hasDuaAudio(d) && (
          <a
            href={duaDownloadHref(d)}
            download
            className={s.downloadBtn}
            aria-label={`Download the audio of ${d.title}`}
            title="Download audio (MP3)"
            onClick={e => e.stopPropagation()}
          >
            <IconDownload className={s.i18} />
          </a>
        )}
      </div>
      {d.hisn && (
        <p className={s.fine}>
          Recitation from Hisn al-Muslim{d.hisn.longer ? ' — the recording is the full dua, which continues past the text above.' : '.'}
        </p>
      )}
    </>
  );
}

export function SurahSummary({ c, learnedAyat }: { c: ChapterInfo; learnedAyat: number }) {
  return (
    <div className={s.surahSummary}>
      <p className={s.surahNameAr} lang="ar" dir="rtl">
        {c.nameArabic}
      </p>
      <p className={s.surahName}>Surah {c.nameSimple}</p>
      <p className={s.meaning}>“{c.meaning}”</p>
      <dl className={s.facts}>
        <div>
          <dt>Surah</dt>
          <dd>{c.id}</dd>
        </div>
        <div>
          <dt>Ayat</dt>
          <dd>{c.versesCount}</dd>
        </div>
        <div>
          <dt>You learned</dt>
          <dd>
            {learnedAyat} / {c.versesCount}
          </dd>
        </div>
      </dl>
      <Link href={`/learn-1-min/surahs/${c.id}`} className={s.btnGhost}>
        Open the surah <IconArrow className={s.i18} />
      </Link>
    </div>
  );
}
