'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpenText, ChevronDown, ChevronLeft, ChevronRight, Headphones, Loader2, Pause, Play, Repeat, RotateCcw,
  RotateCw, Search, Square, Volume2, X,
} from 'lucide-react';
import { ARABIC_TABARI_AUDIO, TAFSIR_SURAHS, URDU_BAYAN_AUDIO, type TafsirSurah } from '@/data/tafsir-audio';
import s from './TafsirAudio.module.css';

/*
 * Tafsir Audio: pick a surah and a language, listen to a recorded tafsir where one exists,
 * and read the detailed tafsir of every ayah underneath.
 *   Recorded audio: Arabic (al-Khulasa min Tafsir al-Tabari, mp3quran.net), Urdu (Bayan ul Quran, Dr. Israr Ahmed).
 *   Text: quran.com API v4 tafsirs, in English, Urdu, Arabic, Bengali, Russian and Kurdish.
 *   Other languages can be read aloud with the device's own voice, when it has one for that language.
 */

interface Source { id: number; name: string; by: string }
interface Lang {
  code: string;
  label: string;
  native: string;
  dir: 'ltr' | 'rtl';
  /** BCP-47 prefix used to find a device voice */
  speech: string;
  audio?: { kind: 'ar' | 'ur'; title: string; by: string };
  sources: Source[];
}

const LANGS: Lang[] = [
  {
    code: 'en', label: 'English', native: 'English', dir: 'ltr', speech: 'en',
    sources: [
      { id: 169, name: 'Tafsir Ibn Kathir (Abridged)', by: 'Hafiz Ibn Kathir' },
      { id: 168, name: "Ma'arif al-Qur'an", by: 'Mufti Muhammad Shafi' },
      { id: 817, name: 'Tazkirul Quran', by: 'Maulana Wahiduddin Khan' },
    ],
  },
  {
    code: 'ur', label: 'Urdu', native: 'اردو', dir: 'rtl', speech: 'ur',
    audio: { kind: 'ur', title: 'Bayan ul Quran', by: 'Dr. Israr Ahmed' },
    sources: [
      { id: 159, name: 'Bayan ul Quran', by: 'Dr. Israr Ahmed' },
      { id: 160, name: 'Tafsir Ibn Kathir', by: 'Hafiz Ibn Kathir' },
      { id: 818, name: 'Tazkir ul Quran', by: 'Maulana Wahiduddin Khan' },
      { id: 157, name: 'Fi Zilal al-Quran', by: 'Sayyid Qutb' },
    ],
  },
  {
    code: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl', speech: 'ar',
    audio: { kind: 'ar', title: 'الخلاصة من تفسير الطبري', by: 'Summary of Tafsir al-Tabari' },
    sources: [
      { id: 16, name: 'التفسير الميسر', by: 'Tafsir Muyassar' },
      { id: 91, name: 'تفسير السعدي', by: "Al-Sa'di" },
      { id: 14, name: 'تفسير ابن كثير', by: 'Ibn Kathir' },
      { id: 15, name: 'تفسير الطبري', by: 'Al-Tabari' },
      { id: 90, name: 'تفسير القرطبي', by: 'Al-Qurtubi' },
      { id: 94, name: 'تفسير البغوي', by: 'Al-Baghawi' },
      { id: 93, name: 'التفسير الوسيط', by: 'Tantawi' },
    ],
  },
  {
    code: 'bn', label: 'Bengali', native: 'বাংলা', dir: 'ltr', speech: 'bn',
    sources: [
      { id: 165, name: 'Tafsir Ahsanul Bayaan', by: 'Bayaan Foundation' },
      { id: 166, name: 'Tafsir Abu Bakr Zakaria', by: 'King Fahd Complex' },
      { id: 164, name: 'Tafseer Ibn Kathir', by: 'Tawheed Publication' },
      { id: 381, name: 'Tafsir Fathul Majid', by: 'Al-Alshaikh' },
    ],
  },
  { code: 'ru', label: 'Russian', native: 'Русский', dir: 'ltr', speech: 'ru', sources: [{ id: 170, name: "Тафсир ас-Саади", by: "Al-Sa'di" }] },
  { code: 'ku', label: 'Kurdish', native: 'کوردی', dir: 'rtl', speech: 'ku', sources: [{ id: 804, name: 'Rebar Kurdish Tafsir', by: 'Rebar' }] },
];

interface Track { url: string; label: string }
interface Group { from: number; to: number; html: string; text: string }

const STORE = 'tafsir-audio:v1';
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/* ---------- helpers ---------- */

function tracksFor(lang: Lang, surah: number): Track[] {
  if (lang.audio?.kind === 'ur') {
    const url = URDU_BAYAN_AUDIO[surah];
    return url ? [{ url, label: 'Complete surah' }] : [];
  }
  if (lang.audio?.kind === 'ar') {
    return (ARABIC_TABARI_AUDIO[surah] ?? []).map(p => ({
      url: p.url,
      label: p.from ? `Ayahs ${p.from}–${p.to}` : 'Complete surah',
    }));
  }
  return [];
}

const fmt = (t: number) => {
  if (!isFinite(t) || t < 0) return '0:00';
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = Math.floor(t % 60).toString().padStart(2, '0');
  return h ? `${h}:${m.toString().padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

const ALLOWED = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'B', 'STRONG', 'I', 'EM', 'U', 'BR', 'SPAN', 'BLOCKQUOTE', 'OL', 'UL', 'LI', 'DIV', 'SUP', 'SUB']);

/** keeps only plain formatting tags from the tafsir HTML; every attribute is dropped */
function sanitize(html: string): { html: string; text: string } {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const walk = (node: Element) => {
    [...node.children].forEach(child => {
      walk(child);
      if (!ALLOWED.has(child.tagName)) {
        child.replaceWith(...[...child.childNodes]);
        return;
      }
      [...child.attributes].forEach(a => child.removeAttribute(a.name));
      if (child.tagName === 'H1' || child.tagName === 'H2') {
        const h = doc.createElement('h3');
        h.append(...[...child.childNodes]);
        child.replaceWith(h);
      }
    });
  };
  const root = doc.body.firstElementChild as HTMLElement;
  walk(root);
  return { html: root.innerHTML, text: (root.textContent ?? '').replace(/\s+/g, ' ').trim() };
}

const cache = new Map<string, Group[]>();

async function loadTafsir(id: number, surah: number, signal: AbortSignal): Promise<Group[]> {
  const key = `${id}:${surah}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rows: { verse_key: string; text: string }[] = [];
  for (let page = 1; page < 20; page++) {
    const r = await fetch(`https://api.quran.com/api/v4/tafsirs/${id}/by_chapter/${surah}?per_page=50&page=${page}`, { signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    rows.push(...(j.tafsirs ?? []));
    if (!j.pagination?.next_page) break;
  }
  // an empty entry shares the explanation of the ayah before it
  const groups: Group[] = [];
  for (const row of rows) {
    const ayah = Number(row.verse_key.split(':')[1]);
    if (!row.text?.trim()) {
      if (groups.length) groups[groups.length - 1].to = ayah;
      continue;
    }
    const clean = sanitize(row.text);
    groups.push({ from: ayah, to: ayah, ...clean });
  }
  cache.set(key, groups);
  return groups;
}

/** splits text into pieces short enough for speech engines that stop on long utterances */
function chunks(text: string, max = 220): string[] {
  const parts = text.match(/[^.!?؟।۔\n]+[.!?؟।۔]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > max && cur) {
      out.push(cur.trim());
      cur = '';
    }
    if (p.length > max) {
      for (let i = 0; i < p.length; i += max) out.push(p.slice(i, i + max));
    } else cur += p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/* ---------- component ---------- */

export default function TafsirAudio() {
  const [surah, setSurah] = useState(1);
  const [langCode, setLangCode] = useState('en');
  const [sourceId, setSourceId] = useState(169);
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState('');

  const lang = LANGS.find(l => l.code === langCode) ?? LANGS[0];
  const source = lang.sources.find(x => x.id === sourceId) ?? lang.sources[0];
  const meta = TAFSIR_SURAHS[surah - 1] as TafsirSurah;

  // restore the last choice, or take it from the address (?surah=2&lang=ur&src=159)
  useEffect(() => {
    let saved: { surah?: number; lang?: string; src?: number } = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORE) ?? '{}');
    } catch {}
    const q = new URLSearchParams(window.location.search);
    const n = Number(q.get('surah') ?? saved.surah);
    const l = LANGS.find(x => x.code === (q.get('lang') ?? saved.lang));
    if (n >= 1 && n <= 114) setSurah(n);
    if (l) {
      setLangCode(l.code);
      const src = Number(q.get('src') ?? saved.src);
      setSourceId(l.sources.some(x => x.id === src) ? src : l.sources[0].id);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ surah, lang: langCode, src: source.id }));
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set('surah', String(surah));
    url.searchParams.set('lang', langCode);
    url.searchParams.set('src', String(source.id));
    window.history.replaceState(null, '', url.toString());
  }, [surah, langCode, source.id]);

  const chooseLang = (l: Lang) => {
    setLangCode(l.code);
    setSourceId(l.sources[0].id);
  };

  /* ----- tafsir text ----- */
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [open, setOpen] = useState<Set<number>>(new Set());

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    setFailed(false);
    setGroups([]);
    setOpen(new Set());
    loadTafsir(source.id, surah, ctl.signal)
      .then(g => setGroups(g))
      .catch(e => {
        if (e?.name !== 'AbortError') setFailed(true);
      })
      .finally(() => !ctl.signal.aborted && setLoading(false));
    return () => ctl.abort();
  }, [source.id, surah, retry]);

  /* ----- recorded audio ----- */
  const tracks = useMemo(() => tracksFor(lang, surah), [lang, surah]);
  const audio = useRef<HTMLAudioElement>(null);
  const [part, setPart] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [autoNext, setAutoNext] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const resume = useRef(false);

  useEffect(() => {
    setPart(0);
    setTime(0);
    setDur(0);
    setAudioError(false);
  }, [tracks]);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.playbackRate = speed;
  }, [speed, part, tracks]);

  // after the source changes, keep playing if we were playing
  useEffect(() => {
    const el = audio.current;
    if (!el || !resume.current) return;
    resume.current = false;
    el.play().catch(() => setPlaying(false));
  }, [part, tracks]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !tracks[part]) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${meta.name} · ${tracks[part].label}`,
      artist: lang.audio ? `${lang.audio.title} — ${lang.audio.by}` : '',
      album: 'Tafsir Audio',
    });
  }, [meta.name, tracks, part, lang.audio]);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    stopSpeech();
    if (el.paused) el.play().catch(() => setAudioError(true));
    else el.pause();
  };
  const goPart = (i: number, keepPlaying = playing) => {
    resume.current = keepPlaying;
    setPart(i);
    setTime(0);
  };
  const onEnded = () => {
    if (part < tracks.length - 1) goPart(part + 1, true);
    else if (autoNext && surah < 114) {
      resume.current = true;
      setSurah(surah + 1);
    } else setPlaying(false);
  };
  const skip = (d: number) => {
    const el = audio.current;
    if (el) el.currentTime = Math.max(0, Math.min((el.duration || 0) - 0.5, el.currentTime + d));
  };

  /* ----- read aloud with the device voice ----- */
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const speechRun = useRef(0);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const pick = () => {
      const vs = window.speechSynthesis.getVoices();
      setVoice(vs.find(v => v.lang.toLowerCase().startsWith(lang.speech)) ?? null);
    };
    pick();
    window.speechSynthesis.addEventListener('voiceschanged', pick);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pick);
  }, [lang.speech]);

  const stopSpeech = useCallback(() => {
    speechRun.current++;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(null);
  }, []);

  useEffect(() => stopSpeech, [stopSpeech, surah, source.id]);

  const speakFrom = (start: number) => {
    if (!voice) return;
    audio.current?.pause();
    stopSpeech();
    const run = ++speechRun.current;
    const say = (gi: number) => {
      if (run !== speechRun.current) return;
      if (gi >= groups.length) {
        setSpeaking(null);
        return;
      }
      setSpeaking(gi);
      document.getElementById(`tg-${gi}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const pieces = chunks(groups[gi].text);
      let k = 0;
      const next = () => {
        if (run !== speechRun.current) return;
        if (k >= pieces.length) return say(gi + 1);
        const u = new SpeechSynthesisUtterance(pieces[k++]);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = speed;
        u.onend = next;
        u.onerror = next;
        window.speechSynthesis.speak(u);
      };
      next();
    };
    say(start);
  };

  /* ----- surah picker ----- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TAFSIR_SURAHS;
    return TAFSIR_SURAHS.filter(x => x.name.toLowerCase().includes(q) || x.meaning.toLowerCase().includes(q) || x.ar.includes(query.trim()) || String(x.n) === q);
  }, [query]);

  const pickSurah = (n: number) => {
    resume.current = playing;
    setSurah(n);
    setPicker(false);
    setQuery('');
  };

  useEffect(() => {
    if (!picker) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPicker(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picker]);

  const track = tracks[part];
  const pct = dur ? (time / dur) * 100 : 0;

  return (
    <div className={s.root}>
      <header className={s.head}>
        <span className={s.badge}>
          <Headphones size={15} aria-hidden="true" /> Tafsir Audio
        </span>
        <h1 className={s.title}>Listen to the tafsir of every surah</h1>
        <p className={s.lead}>
          Recorded tafsir in Arabic and Urdu, and the detailed explanation of each ayah in six languages. Pick a surah and a
          language to begin.
        </p>
      </header>

      {/* ---------- choices ---------- */}
      <section className={s.panel} aria-label="Choose surah, language and tafsir">
        <button type="button" className={s.surahBtn} onClick={() => setPicker(true)} aria-haspopup="dialog">
          <span className={s.surahNo}>{surah}</span>
          <span className={s.surahName}>
            <b>{meta.name}</b>
            <small>{meta.meaning} · {meta.ayahs} ayahs</small>
          </span>
          <span className={s.surahAr} lang="ar">{meta.ar}</span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>

        <div className={s.langs} role="tablist" aria-label="Language">
          {LANGS.map(l => (
            <button
              key={l.code}
              type="button"
              role="tab"
              aria-selected={l.code === langCode}
              className={l.code === langCode ? s.langOn : s.lang}
              onClick={() => chooseLang(l)}
            >
              <span lang={l.code}>{l.native}</span>
              {l.audio && <Headphones size={13} aria-label="recorded audio" />}
            </button>
          ))}
        </div>

        <label className={s.sourceRow}>
          <BookOpenText size={16} aria-hidden="true" />
          <span className={s.sourceLabel}>Tafsir</span>
          <select className={s.select} value={source.id} onChange={e => setSourceId(Number(e.target.value))}>
            {lang.sources.map(x => (
              <option key={x.id} value={x.id}>
                {x.name} — {x.by}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* ---------- player ---------- */}
      {track ? (
        <section className={s.player} aria-label="Tafsir audio player">
          <audio
            ref={audio}
            src={track.url}
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onCanPlay={() => setBuffering(false)}
            onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={e => setDur(e.currentTarget.duration)}
            onEnded={onEnded}
            onError={() => {
              setAudioError(true);
              setBuffering(false);
            }}
          />
          <div className={s.playerTop}>
            <div className={s.cover} aria-hidden="true">
              <span lang="ar">{meta.ar}</span>
            </div>
            <div className={s.nowText}>
              <small>{lang.audio?.by}</small>
              <b lang={lang.code === 'ar' ? 'ar' : undefined}>{lang.audio?.title}</b>
              <span>
                Surah {meta.name} · {track.label}
                {tracks.length > 1 && ` · part ${part + 1} of ${tracks.length}`}
              </span>
            </div>
          </div>

          <div className={s.seekRow}>
            <span>{fmt(time)}</span>
            <input
              type="range"
              className={s.seek}
              min={0}
              max={dur || 0}
              step={1}
              value={Math.min(time, dur || 0)}
              onChange={e => {
                const el = audio.current;
                if (el) el.currentTime = Number(e.target.value);
              }}
              style={{ ['--pct' as string]: `${pct}%` }}
              aria-label="Seek"
            />
            <span>{fmt(dur)}</span>
          </div>

          <div className={s.controls}>
            <button type="button" className={s.ctl} onClick={() => (part > 0 ? goPart(part - 1) : surah > 1 && pickSurah(surah - 1))} aria-label="Previous">
              <ChevronLeft size={22} />
            </button>
            <button type="button" className={s.ctl} onClick={() => skip(-15)} aria-label="Back 15 seconds">
              <RotateCcw size={20} />
            </button>
            <button type="button" className={s.play} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
              {buffering && playing ? <Loader2 size={28} className={s.spin} /> : playing ? <Pause size={28} /> : <Play size={28} />}
            </button>
            <button type="button" className={s.ctl} onClick={() => skip(15)} aria-label="Forward 15 seconds">
              <RotateCw size={20} />
            </button>
            <button type="button" className={s.ctl} onClick={() => (part < tracks.length - 1 ? goPart(part + 1) : surah < 114 && pickSurah(surah + 1))} aria-label="Next">
              <ChevronRight size={22} />
            </button>
          </div>

          <div className={s.extras}>
            <button type="button" className={s.pill} onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label="Playback speed">
              {speed}×
            </button>
            <button type="button" className={autoNext ? s.pillOn : s.pill} onClick={() => setAutoNext(v => !v)} aria-pressed={autoNext}>
              <Repeat size={14} aria-hidden="true" /> Continue to next surah
            </button>
          </div>

          {tracks.length > 1 && (
            <div className={s.parts} role="list" aria-label="Parts of this surah">
              {tracks.map((t, i) => (
                <button key={t.url} type="button" role="listitem" className={i === part ? s.partOn : s.part} onClick={() => goPart(i, true)}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {audioError && (
            <p className={s.warn}>
              This recording could not be loaded right now. Check your connection, or try again in a moment.
            </p>
          )}
        </section>
      ) : (
        <section className={s.player} aria-label="Read aloud">
          <div className={s.playerTop}>
            <div className={s.cover} aria-hidden="true">
              <Volume2 size={30} />
            </div>
            <div className={s.nowText}>
              <small>No recorded tafsir in {lang.label} yet</small>
              <b>Read aloud</b>
              <span>
                {voice
                  ? `Your device can read the ${source.name} tafsir aloud in ${lang.label}.`
                  : `Your device has no ${lang.label} voice installed, so it cannot read this tafsir aloud. Recorded audio is available in Arabic and Urdu.`}
              </span>
            </div>
          </div>
          {voice && (
            <div className={s.controls}>
              {speaking === null ? (
                <button type="button" className={s.play} onClick={() => speakFrom(0)} disabled={!groups.length} aria-label="Read the tafsir aloud">
                  <Play size={28} />
                </button>
              ) : (
                <button type="button" className={s.play} onClick={stopSpeech} aria-label="Stop reading">
                  <Square size={24} />
                </button>
              )}
              <button type="button" className={s.pill} onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label="Reading speed">
                {speed}×
              </button>
            </div>
          )}
        </section>
      )}

      {/* ---------- detailed tafsir ---------- */}
      <section className={s.textCard} aria-labelledby="ta-text">
        <div className={s.textHead}>
          <div>
            <p className={s.kicker}>Detailed tafsir</p>
            <h2 id="ta-text" className={s.h2}>
              Surah {meta.name} <span lang="ar">{meta.ar}</span>
            </h2>
            <p className={s.metaLine}>
              {meta.meaning} · {meta.ayahs} ayahs · {meta.place === 'makkah' ? 'Makki' : 'Madani'} · {source.name}, {source.by}
            </p>
          </div>
          {voice && groups.length > 0 && speaking === null && (
            <button type="button" className={s.pill} onClick={() => speakFrom(0)}>
              <Volume2 size={14} aria-hidden="true" /> Read aloud
            </button>
          )}
        </div>

        {loading && (
          <div className={s.state}>
            <Loader2 size={22} className={s.spin} aria-hidden="true" /> Loading the tafsir…
          </div>
        )}
        {failed && (
          <div className={s.state}>
            The tafsir could not be loaded.
            <button type="button" className={s.pill} onClick={() => setRetry(r => r + 1)}>
              Try again
            </button>
          </div>
        )}

        {!loading && !failed && (
          <ol className={s.groups} dir={lang.dir} lang={lang.code}>
            {groups.map((g, i) => {
              const long = g.text.length > 900;
              const isOpen = open.has(i) || !long;
              return (
                <li key={`${g.from}-${i}`} id={`tg-${i}`} className={speaking === i ? s.groupOn : s.group}>
                  <div className={s.groupHead} dir="ltr">
                    <span className={s.ayahTag}>
                      {g.from === g.to ? `Ayah ${surah}:${g.from}` : `Ayahs ${surah}:${g.from}–${g.to}`}
                    </span>
                    {voice && (
                      <button type="button" className={s.mini} onClick={() => (speaking === i ? stopSpeech() : speakFrom(i))} aria-label={speaking === i ? 'Stop reading' : 'Read from here'}>
                        {speaking === i ? <Square size={13} /> : <Volume2 size={14} />}
                      </button>
                    )}
                  </div>
                  <div className={isOpen ? s.body : s.bodyClosed} dangerouslySetInnerHTML={{ __html: g.html }} />
                  {long && (
                    <button
                      type="button"
                      className={s.more}
                      onClick={() =>
                        setOpen(prev => {
                          const n = new Set(prev);
                          if (n.has(i)) n.delete(i);
                          else n.add(i);
                          return n;
                        })
                      }
                    >
                      {isOpen ? 'Show less' : 'Read the full explanation'}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <div className={s.pager}>
          <button type="button" className={s.pill} disabled={surah <= 1} onClick={() => pickSurah(surah - 1)}>
            <ChevronLeft size={15} aria-hidden="true" /> {surah > 1 ? TAFSIR_SURAHS[surah - 2].name : 'Previous'}
          </button>
          <button type="button" className={s.pill} disabled={surah >= 114} onClick={() => pickSurah(surah + 1)}>
            {surah < 114 ? TAFSIR_SURAHS[surah].name : 'Next'} <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
        <p className={s.credit}>
          Tafsir text from quran.com. Recorded tafsir: Arabic from mp3quran.net, Urdu (Bayan ul Quran, Dr. Israr Ahmed) from
          archive.org.
        </p>
      </section>

      {/* ---------- surah picker ---------- */}
      {picker && (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-label="Choose a surah" onClick={() => setPicker(false)}>
          <div className={s.sheet} onClick={e => e.stopPropagation()}>
            <div className={s.sheetHead}>
              <div className={s.searchBox}>
                <Search size={17} aria-hidden="true" />
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or number" aria-label="Search surahs" />
              </div>
              <button type="button" className={s.ctl} onClick={() => setPicker(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <ul className={s.surahList}>
              {filtered.map(x => (
                <li key={x.n}>
                  <button type="button" className={x.n === surah ? s.rowOn : s.row} onClick={() => pickSurah(x.n)}>
                    <span className={s.rowNo}>{x.n}</span>
                    <span className={s.rowName}>
                      <b>{x.name}</b>
                      <small>{x.meaning} · {x.ayahs} ayahs</small>
                    </span>
                    <span className={s.rowAr} lang="ar">{x.ar}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className={s.state}>No surah matches “{query}”.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
