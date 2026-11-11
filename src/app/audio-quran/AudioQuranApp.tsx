"use client";
/**
 * Audio Quran (/audio-quran): stream any surah ayah by ayah, follow the text as it is
 * recited, and keep listening across surahs. Audio and text come from alquran.cloud;
 * preferences, favourites and the last position are kept in this browser.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./AudioQuran.css";

// ─── data ────────────────────────────────────────────────────────────────────
const API = "https://api.alquran.cloud/v1";
const QURAN_COM = "https://api.quran.com/api/v4";
const TEXT_AR = "quran-uthmani";
const TEXT_EN = "en.sahih";
const STORE = "audio-quran-v2";
const DEFAULT_RECITER = "ar.alafasy";

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
}
interface Reciter { identifier: string; englishName: string; language: string }
interface Ayah { n: number; audio: string; alt: string[]; ar: string; en: string }
interface Recent { s: number; a: number; t: number }
type Repeat = "off" | "surah" | "ayah";
type Filter = "all" | "Meccan" | "Medinan" | "favs";
type Sort = "order" | "short" | "long";
type Sleep = null | { kind: "min"; until: number } | { kind: "surah" };

interface Prefs {
  reciter: string;
  volume: number;
  muted: boolean;
  speed: number;
  autoNext: boolean;
  showText: boolean;
  favs: number[];
  recent: Recent[];
}
const DEFAULT_PREFS: Prefs = { reciter: DEFAULT_RECITER, volume: 0.85, muted: false, speed: 1, autoNext: true, showText: true, favs: [], recent: [] };
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const SLEEP_STEPS: (number | "surah" | null)[] = [null, 15, 30, 60, "surah"];

const LANG: Record<string, string> = { ar: "Arabic", en: "English", ur: "Urdu", fr: "French", ru: "Russian", zh: "Chinese", kk: "Kazakh", uz: "Uzbek" };
// "Bismillah ar-Rahman ar-Raheem" prefixed to ayah 1 of every surah but 1 and 9: four words starting with bismi
const BISMILLAH = /^بِسْمِ\s+\S+\s+\S+\s+\S+\s*/;

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  return `${m}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}
const toArabicDigits = (n: number) => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[+d]);
const reciterLabel = (r?: Reciter) => (r ? r.englishName.trim() + (/-2$/.test(r.identifier) ? " · alt." : "") : "");

function loadPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || "{}");
    return {
      ...DEFAULT_PREFS,
      ...raw,
      favs: Array.isArray(raw.favs) ? raw.favs.filter((n: unknown) => typeof n === "number") : [],
      recent: Array.isArray(raw.recent) ? raw.recent.filter((r: Recent) => r && typeof r.s === "number" && typeof r.a === "number").slice(0, 8) : [],
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Arabic in the KFGQPC (qpc_hafs) encoding the site's UthmanicHafs font is drawn for; other
 * Uthmani texts mark silent alifs with U+06DF, which this font shows as a dotted circle.
 * Ayah 1 here carries no Bismillah; the trailing ayah number is dropped (we draw our own).
 */
async function fetchArabic(surah: number, signal?: AbortSignal): Promise<string[] | null> {
  try {
    const res = await fetch(`${QURAN_COM}/quran/verses/qpc_hafs?chapter_number=${surah}`, { signal });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.verses as { text_qpc_hafs: string }[]).map(v => v.text_qpc_hafs.replace(/\s*[٠-٩]+\s*$/, "").trim());
  } catch {
    return null;
  }
}

/** All ayahs of a surah for one reciter: audio from the reciter, Arabic from Quran.com, meaning from Sahih International. */
async function fetchSurah(surah: number, reciter: string, signal?: AbortSignal): Promise<Ayah[]> {
  const [res, qpc] = await Promise.all([
    fetch(`${API}/surah/${surah}/editions/${reciter},${TEXT_AR},${TEXT_EN}`, { signal }),
    fetchArabic(surah, signal),
  ]);
  if (!res.ok) throw new Error("fetch failed");
  const json = await res.json();
  const [audio, ar, en] = json.data as { ayahs: { numberInSurah: number; audio?: string; audioSecondary?: string[]; text: string }[] }[];
  return audio.ayahs.map((a, i) => {
    // fallback text (if Quran.com is unreachable) still has the Bismillah on ayah 1
    let text = qpc?.[i] ?? (ar.ayahs[i]?.text ?? "").replace(/^﻿/, "");
    if (!qpc && surah !== 1 && i === 0) text = text.replace(BISMILLAH, "");
    return { n: a.numberInSurah, audio: a.audio ?? "", alt: a.audioSecondary ?? [], ar: text, en: en.ayahs[i]?.text ?? "" };
  });
}

// ─── component ───────────────────────────────────────────────────────────────
export default function AudioQuranApp() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loadError, setLoadError] = useState("");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false); // prefs read from storage

  // playback
  const [pos, setPos] = useState<{ surah: number; idx: number } | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [loadingSurah, setLoadingSurah] = useState<number | null>(null);
  const [surahError, setSurahError] = useState<Record<number, string>>({});
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [repeat, setRepeat] = useState<Repeat>("off");
  const [shuffle, setShuffle] = useState(false);
  const [sleep, setSleep] = useState<Sleep>(null);
  const [now, setNow] = useState(() => Date.now());

  // library
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("order");
  const [tab, setTab] = useState<"ayahs" | "reciters">("reciters");
  const [reciterQuery, setReciterQuery] = useState("");
  const [sheet, setSheet] = useState<null | "ayahs" | "reciters">(null);
  const [toast, setToast] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const cache = useRef(new Map<string, Ayah[]>());
  const loadId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const altTried = useRef(false);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  // ── initial data + saved prefs ──
  useEffect(() => {
    setPrefs(loadPrefs());
    setReady(true);
    const ctrl = new AbortController();
    (async () => {
      try {
        const [s, r] = await Promise.all([
          fetch(`${API}/surah`, { signal: ctrl.signal }).then(x => x.json()),
          fetch(`${API}/edition?format=audio&type=versebyverse`, { signal: ctrl.signal }).then(x => x.json()),
        ]);
        setSurahs(s.data ?? []);
        setReciters(r.data ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setLoadError("Couldn't reach the Quran audio service. Check your connection and refresh.");
      }
    })();
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORE, JSON.stringify(prefs)); } catch { /* storage full or blocked */ }
  }, [prefs, ready]);

  // ── the audio element ──
  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    audioRef.current = a;
    return () => { a.pause(); a.src = ""; };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = prefs.muted ? 0 : prefs.volume;
  }, [prefs.volume, prefs.muted]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.defaultPlaybackRate = prefs.speed;
    a.playbackRate = prefs.speed;
  }, [prefs.speed]);

  // latest values for the audio event handlers (they are bound once)
  const live = useRef({ pos, ayahs, repeat, shuffle, sleep, prefs, surahs });
  live.current = { pos, ayahs, repeat, shuffle, sleep, prefs, surahs };

  const remember = useCallback((surah: number, idx: number) => {
    setPrefs(p => ({ ...p, recent: [{ s: surah, a: idx, t: Date.now() }, ...p.recent.filter(r => r.s !== surah)].slice(0, 8) }));
  }, []);

  /** Load a surah (cached per reciter) and start it at `idx`. */
  const start = useCallback(async (surah: number, idx = 0, reciter?: string) => {
    const a = audioRef.current;
    if (!a) return;
    const rec = reciter ?? live.current.prefs.reciter;
    const key = `${rec}:${surah}`;
    const id = ++loadId.current;
    let list = cache.current.get(key);
    if (!list) {
      setLoadingSurah(surah);
      try {
        list = await fetchSurah(surah, rec);
        cache.current.set(key, list);
        setSurahError(e => { const n = { ...e }; delete n[surah]; return n; });
      } catch {
        if (id === loadId.current) {
          setLoadingSurah(null);
          setSurahError(e => ({ ...e, [surah]: "Audio unavailable right now" }));
          flash("Couldn't load that surah. Try again.");
        }
        return;
      }
    }
    if (id !== loadId.current) return; // a newer request won
    setLoadingSurah(null);
    const i = Math.max(0, Math.min(idx, list.length - 1));
    setAyahs(list);
    setPos({ surah, idx: i });
    altTried.current = false;
    a.src = list[i].audio;
    a.playbackRate = live.current.prefs.speed;
    setTime(0);
    setDur(0);
    try {
      await a.play();
    } catch (e) {
      if ((e as Error).name !== "AbortError") setPlaying(false);
    }
    remember(surah, i);
  }, [flash, remember]);

  const playIdx = useCallback((idx: number) => {
    const { pos: p, ayahs: list } = live.current;
    if (!p || idx < 0 || idx >= list.length) return;
    start(p.surah, idx);
  }, [start]);

  const nextSurahNumber = useCallback((from: number) => {
    if (live.current.shuffle) {
      let n = from;
      while (n === from) n = 1 + Math.floor(Math.random() * 114);
      return n;
    }
    return from < 114 ? from + 1 : null;
  }, []);

  const stopAtEnd = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  /** What happens when an ayah finishes. */
  const advance = useCallback(() => {
    const { pos: p, ayahs: list, repeat: rep, sleep: sl, prefs: pr } = live.current;
    if (!p) return;
    if (rep === "ayah") { start(p.surah, p.idx); return; }
    if (p.idx + 1 < list.length) { start(p.surah, p.idx + 1); return; }
    // end of the surah
    if (sl?.kind === "surah") { setSleep(null); stopAtEnd(); flash("Sleep timer: stopped at the end of the surah"); return; }
    if (rep === "surah") { start(p.surah, 0); return; }
    const next = pr.autoNext ? nextSurahNumber(p.surah) : null;
    if (next) start(next, 0);
    else stopAtEnd();
  }, [start, stopAtEnd, flash, nextSurahNumber]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDur(a.duration);
    const onWait = () => setBuffering(true);
    const onGo = () => setBuffering(false);
    const onEnd = () => advance();
    const onErr = () => {
      const { pos: p, ayahs: list } = live.current;
      if (!p || !a.src) return;
      const alt = list[p.idx]?.alt[0];
      if (alt && !altTried.current) { altTried.current = true; a.src = alt; a.play().catch(() => {}); return; }
      advance(); // skip an ayah that won't load
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("waiting", onWait);
    a.addEventListener("playing", onGo);
    a.addEventListener("canplay", onGo);
    a.addEventListener("ended", onEnd);
    a.addEventListener("error", onErr);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("waiting", onWait);
      a.removeEventListener("playing", onGo);
      a.removeEventListener("canplay", onGo);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("error", onErr);
    };
  }, [advance]);

  // warm the next ayah so the recitation flows without a gap
  useEffect(() => {
    if (!pos) return;
    const next = ayahs[pos.idx + 1];
    if (!next) return;
    const p = preloadRef.current ?? (preloadRef.current = new Audio());
    p.preload = "auto";
    p.src = next.audio;
  }, [pos, ayahs]);

  // ── controls ──
  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!live.current.pos) {
      const last = live.current.prefs.recent[0];
      start(last?.s ?? 1, last?.a ?? 0);
      return;
    }
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, [start]);

  const close = () => {
    loadId.current++;
    audioRef.current?.pause();
    setPos(null);
    setAyahs([]);
    setPlaying(false);
    setSleep(null);
    setSheet(null);
  };

  const prevAyah = () => {
    const a = audioRef.current;
    if (!pos || !a) return;
    if (a.currentTime > 3 || pos.idx === 0) { a.currentTime = 0; return; }
    playIdx(pos.idx - 1);
  };
  const nextAyah = () => { if (pos) (pos.idx + 1 < ayahs.length ? playIdx(pos.idx + 1) : advance()); };
  const prevSurah = () => { if (pos && pos.surah > 1) start(pos.surah - 1); };
  const nextSurah = () => { if (pos) { const n = nextSurahNumber(pos.surah); if (n) start(n); } };

  const playSurah = (n: number) => {
    if (pos?.surah === n) { toggle(); return; }
    start(n, 0);
  };

  const chooseReciter = (id: string) => {
    if (id === prefs.reciter) return;
    setPrefs(p => ({ ...p, reciter: id }));
    setSheet(null);
    const r = reciters.find(x => x.identifier === id);
    flash(`Reciter: ${reciterLabel(r)}`);
    if (pos) start(pos.surah, pos.idx, id); // carry on from the same ayah in the new voice
  };

  /** Ayahs/reciters: the side panel on wide screens, a bottom sheet otherwise. */
  const openPanel = (k: "ayahs" | "reciters") => {
    if (window.matchMedia("(min-width: 1025px)").matches) setTab(k);
    else setSheet(k);
  };

  const toggleFav = (n: number) =>
    setPrefs(p => ({ ...p, favs: p.favs.includes(n) ? p.favs.filter(x => x !== n) : [...p.favs, n] }));

  const cycleRepeat = () => {
    const next: Repeat = repeat === "off" ? "surah" : repeat === "surah" ? "ayah" : "off";
    setRepeat(next);
    flash(next === "off" ? "Repeat off" : next === "surah" ? "Repeating this surah" : "Repeating this ayah");
  };
  const cycleSpeed = () => {
    const speed = SPEEDS[(SPEEDS.indexOf(prefs.speed) + 1) % SPEEDS.length] ?? 1;
    setPrefs(p => ({ ...p, speed }));
    flash(`Speed ${speed}×`);
  };
  const cycleSleep = () => {
    const cur = sleep === null ? null : sleep.kind === "surah" ? "surah" : SLEEP_STEPS.find(s => typeof s === "number" && sleep.until - Date.now() <= s * 60000 + 1000) ?? null;
    const step = SLEEP_STEPS[(SLEEP_STEPS.indexOf(cur) + 1) % SLEEP_STEPS.length];
    setNow(Date.now());
    if (step === null) { setSleep(null); flash("Sleep timer off"); }
    else if (step === "surah") { setSleep({ kind: "surah" }); flash("Stops at the end of this surah"); }
    else { setSleep({ kind: "min", until: Date.now() + step * 60000 }); flash(`Stops in ${step} minutes`); }
  };

  // sleep timer countdown
  useEffect(() => {
    if (sleep?.kind !== "min") return;
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= sleep.until) {
        audioRef.current?.pause();
        setSleep(null);
        flash("Sleep timer: playback stopped");
      }
    }, 1000);
    return () => clearInterval(t);
  }, [sleep, flash]);

  // ── keyboard: space, arrows, shift+arrows ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.key === " " && !t.closest("button")) { e.preventDefault(); toggle(); }
      else if (e.key === "ArrowRight" && pos) { e.preventDefault(); if (e.shiftKey) nextSurah(); else nextAyah(); }
      else if (e.key === "ArrowLeft" && pos) { e.preventDefault(); if (e.shiftKey) prevSurah(); else prevAyah(); }
      else if (e.key === "Escape") setSheet(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── lock screen / headset controls ──
  const surah = surahs.find(s => s.number === pos?.surah);
  const reciter = reciters.find(r => r.identifier === prefs.reciter);
  const ayah = pos ? ayahs[pos.idx] : undefined;
  useEffect(() => {
    if (!("mediaSession" in navigator) || !pos || !surah) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${surah.englishName} · Ayah ${pos.idx + 1}`,
      artist: reciterLabel(reciter),
      album: "The Holy Quran",
    });
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => audioRef.current?.play());
    ms.setActionHandler("pause", () => audioRef.current?.pause());
    ms.setActionHandler("previoustrack", () => prevAyah());
    ms.setActionHandler("nexttrack", () => nextAyah());
    return () => {
      (["play", "pause", "previoustrack", "nexttrack"] as MediaSessionAction[]).forEach(a => ms.setActionHandler(a, null));
    };
  });

  // keep the current ayah in view inside the follow-along list
  useEffect(() => {
    if (!pos) return;
    document.querySelectorAll<HTMLElement>(`[data-aq-ayah="${pos.idx}"]`).forEach(el => el.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }, [pos, tab, sheet]);

  useEffect(() => { if (pos) setTab("ayahs"); }, [pos?.surah]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── derived ──
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = surahs.filter(s => {
      if (filter === "favs" && !prefs.favs.includes(s.number)) return false;
      if ((filter === "Meccan" || filter === "Medinan") && s.revelationType !== filter) return false;
      if (!q) return true;
      return s.englishName.toLowerCase().includes(q) || s.englishNameTranslation.toLowerCase().includes(q) || s.name.includes(query.trim()) || String(s.number) === q;
    });
    if (sort === "short") list = [...list].sort((a, b) => a.numberOfAyahs - b.numberOfAyahs);
    if (sort === "long") list = [...list].sort((a, b) => b.numberOfAyahs - a.numberOfAyahs);
    return list;
  }, [surahs, query, filter, sort, prefs.favs]);

  const counts = useMemo(() => ({
    all: surahs.length,
    Meccan: surahs.filter(s => s.revelationType === "Meccan").length,
    Medinan: surahs.filter(s => s.revelationType === "Medinan").length,
    favs: prefs.favs.length,
  }), [surahs, prefs.favs]);

  const reciterGroups = useMemo(() => {
    const q = reciterQuery.trim().toLowerCase();
    const list = reciters.filter(r => !q || r.englishName.toLowerCase().includes(q) || (LANG[r.language] ?? r.language).toLowerCase().includes(q));
    return [
      { title: "Recitation", items: list.filter(r => r.language === "ar") },
      { title: "Translation audio", items: list.filter(r => r.language !== "ar") },
    ].filter(g => g.items.length);
  }, [reciters, reciterQuery]);

  const recent = prefs.recent.map(r => ({ ...r, surah: surahs.find(s => s.number === r.s) })).filter(r => r.surah);
  const resume = !pos ? recent[0] : undefined;
  const surahPct = pos && ayahs.length ? ((pos.idx + (dur ? Math.min(1, time / dur) : 0)) / ayahs.length) * 100 : 0;
  const sleepLabel = sleep === null ? "" : sleep.kind === "surah" ? "End" : `${Math.max(1, Math.ceil((sleep.until - now) / 60000))}m`;
  const loading = surahs.length === 0 && !loadError;

  // ── pieces ──
  const ayahList = (
    <ol className="aq-ayahs">
      {ayahs.map((a, i) => (
        <li key={a.n}>
          <button data-aq-ayah={i} className={`aq-ayah${pos?.idx === i ? " on" : ""}`} onClick={() => playIdx(i)} aria-current={pos?.idx === i ? "true" : undefined}>
            <span className="aq-ayah-n">{a.n}</span>
            <span className="aq-ayah-body">
              <span className="aq-ayah-ar" lang="ar" dir="rtl">{a.ar}</span>
              {prefs.showText && <span className="aq-ayah-en">{a.en}</span>}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );

  const reciterList = (
    <div className="aq-reciters">
      <label className="aq-search sm">
        <span className="material-symbols-outlined">search</span>
        <input value={reciterQuery} onChange={e => setReciterQuery(e.target.value)} placeholder="Find a reciter or language" aria-label="Find a reciter" />
      </label>
      {reciterGroups.map(g => (
        <div key={g.title} className="aq-rgroup">
          <p className="aq-kicker">{g.title}</p>
          {g.items.map(r => (
            <button key={r.identifier} className={`aq-reciter${r.identifier === prefs.reciter ? " on" : ""}`} onClick={() => chooseReciter(r.identifier)}>
              <span className="aq-avatar" aria-hidden="true">{r.englishName.trim().charAt(0)}</span>
              <span className="aq-reciter-txt">
                <b>{reciterLabel(r)}</b>
                <small>{LANG[r.language] ?? r.language.toUpperCase()}</small>
              </span>
              {r.identifier === prefs.reciter && <span className="material-symbols-outlined aq-check">{playing ? "graphic_eq" : "check"}</span>}
            </button>
          ))}
        </div>
      ))}
      {reciters.length > 0 && reciterGroups.length === 0 && <p className="aq-empty-sm">No reciter matches “{reciterQuery}”.</p>}
    </div>
  );

  return (
    <div className={`aq${pos ? " has-player" : ""}`}>
      <div className="aq-wrap">
        <div className="aq-main">
          {/* ── hero: now playing, or a way in ── */}
          <section className={`aq-hero${playing ? " is-playing" : ""}`} aria-label={pos ? "Now playing" : "Audio Quran"}>
            <div className="aq-hero-pattern" aria-hidden="true" />
            {pos && surah ? (
              <div className="aq-hero-in">
                <div className="aq-hero-top">
                  <span className="aq-kicker light">{playing ? "Now reciting" : "Paused"} · Surah {surah.number}</span>
                  <span className="aq-chip light">{reciterLabel(reciter)}</span>
                </div>
                <div className="aq-hero-title">
                  <div>
                    <h1>{surah.englishName}</h1>
                    <p>{surah.englishNameTranslation} · {surah.revelationType} · {surah.numberOfAyahs} ayahs</p>
                  </div>
                  <span className="aq-hero-ar" lang="ar" dir="rtl">{surah.name}</span>
                </div>

                {ayah && (
                  <div className="aq-now" key={`${pos.surah}-${pos.idx}`}>
                    <p className="aq-now-ar" lang="ar" dir="rtl">
                      {ayah.ar} <span className="aq-now-mark">﴿{toArabicDigits(ayah.n)}﴾</span>
                    </p>
                    {prefs.showText && <p className="aq-now-en">{ayah.en}</p>}
                  </div>
                )}

                <div className="aq-hero-foot">
                  <div className="aq-surah-progress" aria-label={`Ayah ${pos.idx + 1} of ${ayahs.length}`}>
                    <span style={{ width: `${surahPct}%` }} />
                  </div>
                  <div className="aq-hero-row">
                    <span className="aq-hero-count">Ayah <b>{pos.idx + 1}</b> of {ayahs.length}</span>
                    <div className="aq-hero-ctrl">
                      <button className="aq-hbtn" onClick={prevAyah} aria-label="Previous ayah"><span className="material-symbols-outlined">skip_previous</span></button>
                      <button className="aq-hplay" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
                        {buffering && playing ? <span className="aq-spin" /> : <span className="material-symbols-outlined">{playing ? "pause" : "play_arrow"}</span>}
                      </button>
                      <button className="aq-hbtn" onClick={nextAyah} aria-label="Next ayah"><span className="material-symbols-outlined">skip_next</span></button>
                    </div>
                    <button className={`aq-texttoggle${prefs.showText ? " on" : ""}`} onClick={() => setPrefs(p => ({ ...p, showText: !p.showText }))} aria-pressed={prefs.showText}>
                      <span className="material-symbols-outlined">translate</span>
                      <span>Translation</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aq-hero-in idle">
                <span className="aq-kicker light">Audio Quran</span>
                <h1>Listen to the Quran, ayah by ayah</h1>
                <p className="aq-hero-sub">{reciters.length || 30}+ reciters and translation voices. Follow the Arabic and its meaning as each ayah is recited, and carry on from surah to surah.</p>
                <div className="aq-hero-actions">
                  {resume?.surah ? (
                    <button className="aq-cta" onClick={() => start(resume.s, resume.a)} disabled={loading}>
                      <span className="material-symbols-outlined">play_arrow</span>
                      Continue {resume.surah.englishName} · ayah {resume.a + 1}
                    </button>
                  ) : (
                    <button className="aq-cta" onClick={() => start(1, 0)} disabled={loading}>
                      <span className="material-symbols-outlined">play_arrow</span>
                      Start with Al-Fatihah
                    </button>
                  )}
                  <button className="aq-cta ghost" onClick={() => openPanel("reciters")}>
                    <span className="material-symbols-outlined">record_voice_over</span>
                    {reciter ? reciterLabel(reciter) : "Choose reciter"}
                  </button>
                </div>
                <span className="aq-hero-ar idle" lang="ar" dir="rtl" aria-hidden="true">القرآن الكريم</span>
              </div>
            )}
          </section>

          {loadError && <div className="aq-alert" role="alert"><span className="material-symbols-outlined">wifi_off</span>{loadError}</div>}

          {/* ── continue listening ── */}
          {recent.length > 0 && (
            <section className="aq-recent" aria-labelledby="aq-recent-h">
              <h2 id="aq-recent-h" className="aq-h2">Continue listening</h2>
              <div className="aq-recent-row">
                {recent.map(r => (
                  <button key={r.s} className={`aq-recent-item${pos?.surah === r.s ? " on" : ""}`} onClick={() => start(r.s, r.a)}>
                    <span className="aq-num sm">{r.s}</span>
                    <span className="aq-recent-txt">
                      <b>{r.surah!.englishName}</b>
                      <small>Ayah {r.a + 1} of {r.surah!.numberOfAyahs}</small>
                    </span>
                    <span className="aq-recent-bar"><span style={{ width: `${((r.a + 1) / r.surah!.numberOfAyahs) * 100}%` }} /></span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── library ── */}
          <section className="aq-lib" aria-labelledby="aq-lib-h">
            <div className="aq-lib-head">
              <h2 id="aq-lib-h" className="aq-h2">All surahs</h2>
              <label className="aq-search">
                <span className="material-symbols-outlined">search</span>
                <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, meaning or number" aria-label="Search surahs" />
              </label>
            </div>
            <div className="aq-toolbar">
              <div className="aq-chips" role="tablist" aria-label="Filter surahs">
                {([["all", "All", "apps"], ["Meccan", "Meccan", "wb_sunny"], ["Medinan", "Medinan", "location_city"], ["favs", "Favourites", "favorite"]] as const).map(([id, label, icon]) => (
                  <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? "on" : ""} onClick={() => setFilter(id)}>
                    <span className="material-symbols-outlined">{icon}</span>{label}<small>{counts[id]}</small>
                  </button>
                ))}
              </div>
              <div className="aq-tools-right">
                <button className="aq-reciter-pill" onClick={() => openPanel("reciters")}>
                  <span className="material-symbols-outlined">record_voice_over</span>
                  <span>{reciter ? reciterLabel(reciter) : "Reciter"}</span>
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
                <label className="aq-sort">
                  <span className="material-symbols-outlined">swap_vert</span>
                  <select value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sort surahs">
                    <option value="order">Mushaf order</option>
                    <option value="short">Shortest first</option>
                    <option value="long">Longest first</option>
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="aq-grid">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="aq-card skeleton" />)}</div>
            ) : visible.length === 0 ? (
              <div className="aq-empty">
                <span className="material-symbols-outlined">{filter === "favs" ? "favorite" : "search_off"}</span>
                <h3>{filter === "favs" && !query ? "No favourites yet" : "No surahs found"}</h3>
                <p>{filter === "favs" && !query ? "Tap the heart on any surah to keep it here." : "Try another name, meaning or number."}</p>
                {(query || filter !== "all") && <button onClick={() => { setQuery(""); setFilter("all"); }}>Show all surahs</button>}
              </div>
            ) : (
              <div className="aq-grid">
                {visible.map(s => {
                  const isNow = pos?.surah === s.number;
                  const fav = prefs.favs.includes(s.number);
                  return (
                    <div key={s.number} className={`aq-card${isNow ? " now" : ""}`}>
                      <button className="aq-card-main" onClick={() => playSurah(s.number)} aria-label={`${isNow && playing ? "Pause" : "Play"} ${s.englishName}`}>
                        <span className="aq-num">{s.number}</span>
                        <span className="aq-card-txt">
                          <b>{s.englishName}{isNow && playing && <span className="aq-eq" aria-hidden="true"><i /><i /><i /></span>}</b>
                          <small>{s.englishNameTranslation}</small>
                          <span className="aq-card-meta">
                            <span className={`aq-tag ${s.revelationType === "Meccan" ? "mec" : "med"}`}>{s.revelationType}</span>
                            {s.numberOfAyahs} ayahs
                            {surahError[s.number] && <span className="aq-err">· {surahError[s.number]}</span>}
                          </span>
                        </span>
                        <span className="aq-card-ar" lang="ar" dir="rtl">{s.name.replace(/^سُورَةُ\s*/, "")}</span>
                        <span className="aq-card-play" aria-hidden="true">
                          {loadingSurah === s.number ? <span className="aq-spin dark" /> : <span className="material-symbols-outlined">{isNow && playing ? "pause" : "play_arrow"}</span>}
                        </span>
                      </button>
                      <button className={`aq-fav${fav ? " on" : ""}`} onClick={() => toggleFav(s.number)} aria-pressed={fav} aria-label={fav ? `Remove ${s.englishName} from favourites` : `Add ${s.englishName} to favourites`}>
                        <span className="material-symbols-outlined">favorite</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── side panel (desktop): follow along / reciters ── */}
        <aside className="aq-side" aria-label="Ayahs and reciters">
          <div className="aq-side-card">
            <div className="aq-tabs" role="tablist">
              <button role="tab" aria-selected={tab === "ayahs"} className={tab === "ayahs" ? "on" : ""} onClick={() => setTab("ayahs")} disabled={!pos}>
                <span className="material-symbols-outlined">format_list_numbered_rtl</span>Follow along
              </button>
              <button role="tab" aria-selected={tab === "reciters"} className={tab === "reciters" ? "on" : ""} onClick={() => setTab("reciters")}>
                <span className="material-symbols-outlined">record_voice_over</span>Reciters
              </button>
            </div>
            <div className="aq-side-body">
              {tab === "ayahs" && pos ? ayahList : reciterList}
            </div>
          </div>
        </aside>
      </div>

      {/* ── bottom player ── */}
      {pos && surah && (
        <footer className="aq-player" aria-label="Player">
          <input
            className="aq-seek"
            type="range"
            min={0}
            max={dur || 0}
            step={0.1}
            value={Math.min(time, dur || 0)}
            onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }}
            aria-label="Seek within this ayah"
            aria-valuetext={`${fmt(time)} of ${fmt(dur)}`}
            style={{ ["--p" as string]: `${dur ? (time / dur) * 100 : 0}%` }}
          />
          <div className="aq-player-in">
            <button className="aq-track" onClick={() => openPanel("ayahs")} aria-label="Show the ayahs of this surah">
              <span className="aq-num">{surah.number}</span>
              <span className="aq-track-txt">
                <b>{surah.englishName} <span className="aq-track-ayah">· Ayah {pos.idx + 1}/{ayahs.length}</span></b>
                <small>{reciterLabel(reciter)} · {fmt(time)} / {fmt(dur)}</small>
              </span>
            </button>

            <div className="aq-ctrl">
              <button className={`aq-ic${shuffle ? " on" : ""}`} onClick={() => { setShuffle(v => !v); flash(shuffle ? "Shuffle off" : "Shuffle on: a random surah plays next"); }} aria-pressed={shuffle} aria-label="Shuffle surahs" title="Shuffle surahs">
                <span className="material-symbols-outlined">shuffle</span>
              </button>
              <button className="aq-ic hide-sm" onClick={prevSurah} disabled={pos.surah === 1} aria-label="Previous surah" title="Previous surah (Shift+←)">
                <span className="material-symbols-outlined">keyboard_double_arrow_left</span>
              </button>
              <button className="aq-ic big" onClick={prevAyah} aria-label="Previous ayah" title="Previous ayah (←)">
                <span className="material-symbols-outlined">skip_previous</span>
              </button>
              <button className="aq-play" onClick={toggle} aria-label={playing ? "Pause" : "Play"} title="Play/pause (Space)">
                {buffering && playing ? <span className="aq-spin" /> : <span className="material-symbols-outlined">{playing ? "pause" : "play_arrow"}</span>}
              </button>
              <button className="aq-ic big" onClick={nextAyah} aria-label="Next ayah" title="Next ayah (→)">
                <span className="material-symbols-outlined">skip_next</span>
              </button>
              <button className="aq-ic hide-sm" onClick={nextSurah} disabled={!shuffle && pos.surah === 114} aria-label="Next surah" title="Next surah (Shift+→)">
                <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
              </button>
              <button className={`aq-ic${repeat !== "off" ? " on" : ""}`} onClick={cycleRepeat} aria-label={`Repeat: ${repeat}`} title={repeat === "off" ? "Repeat off" : repeat === "surah" ? "Repeat surah" : "Repeat ayah"}>
                <span className="material-symbols-outlined">{repeat === "ayah" ? "repeat_one" : "repeat"}</span>
              </button>
            </div>

            <div className="aq-extra">
              <button className="aq-pill" onClick={cycleSpeed} aria-label={`Playback speed ${prefs.speed} times`} title="Playback speed">{prefs.speed}×</button>
              <button className={`aq-pill${sleep ? " on" : ""}`} onClick={cycleSleep} aria-label={sleep ? `Sleep timer ${sleepLabel}` : "Sleep timer off"} title="Sleep timer">
                <span className="material-symbols-outlined">bedtime</span>{sleepLabel}
              </button>
              <button className={`aq-pill${prefs.autoNext ? " on" : ""}`} onClick={() => { setPrefs(p => ({ ...p, autoNext: !p.autoNext })); flash(prefs.autoNext ? "Stops after this surah" : "Next surah plays automatically"); }} aria-pressed={prefs.autoNext} title="Play the next surah automatically">
                <span className="material-symbols-outlined">playlist_play</span><span className="hide-md">Autoplay</span>
              </button>
              <div className="aq-vol hide-md">
                <button className="aq-ic" onClick={() => setPrefs(p => ({ ...p, muted: !p.muted }))} aria-label={prefs.muted ? "Unmute" : "Mute"}>
                  <span className="material-symbols-outlined">{prefs.muted || prefs.volume === 0 ? "volume_off" : prefs.volume < 0.45 ? "volume_down" : "volume_up"}</span>
                </button>
                <input type="range" min={0} max={1} step={0.01} value={prefs.muted ? 0 : prefs.volume} onChange={e => setPrefs(p => ({ ...p, volume: Number(e.target.value), muted: false }))} aria-label="Volume" style={{ ["--p" as string]: `${(prefs.muted ? 0 : prefs.volume) * 100}%` }} />
              </div>
              <button className="aq-ic" onClick={close} aria-label="Close player and stop" title="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* ── bottom sheet (phones/tablets): ayahs or reciters ── */}
      {sheet && (
        <div className="aq-sheet-bg" onClick={() => setSheet(null)}>
          <div className="aq-sheet" role="dialog" aria-modal="true" aria-label={sheet === "ayahs" ? "Ayahs" : "Choose a reciter"} onClick={e => e.stopPropagation()}>
            <div className="aq-sheet-head">
              <span className="aq-sheet-grip" aria-hidden="true" />
              <h3>{sheet === "ayahs" && surah ? `${surah.englishName} · ${ayahs.length} ayahs` : "Choose a reciter"}</h3>
              <button className="aq-ic" onClick={() => setSheet(null)} aria-label="Close"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="aq-sheet-body">{sheet === "ayahs" && pos ? ayahList : reciterList}</div>
          </div>
        </div>
      )}

      {toast && <div className="aq-toast" role="status">{toast}</div>}
    </div>
  );
}
