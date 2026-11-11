"use client";
/**
 * Glass "Now Playing" view for /quran-player — opens when a recitation is played.
 * Desktop: visualizer + up-next (left) · now playing (centre) · reciter + queue & volume (right).
 * Mobile: the now-playing card first, then queue, then the rest, in one scroll.
 * Uses the page's existing audio element, queue, likes and volume — no separate playback.
 */
import React, { RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RECITERS, RICH_GRADIENTS, Track, formatTime } from "@/data/quran-player-data";
import { Icons } from "./PlayerIcons";
import "./GlassNowPlaying.css";

type Props = {
  open: boolean;
  /** minimise: hide this view, keep playing (the mini player stays) */
  onClose: () => void;
  /** close: stop playback and dismiss the player */
  onStop: () => void;
  audioRef: RefObject<HTMLAudioElement | null>;
  track: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  playTrack: (t: Track) => void;
  isShuffled: boolean;
  setIsShuffled: (v: boolean) => void;
  isRepeating: boolean;
  setIsRepeating: (v: boolean) => void;
  volume: number; // 0..100
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean | ((p: boolean) => boolean)) => void;
  isLiked: (id: number) => boolean;
  toggleLike: (id: number) => void;
  queue: Track[];
  duration: number;
};

const SPEEDS = [1, 1.25, 1.5, 0.75];
const BARS = Array.from({ length: 34 }, (_, i) => ({
  h: 28 + ((i * 37) % 60),
  d: 0.6 + ((i * 13) % 9) / 10,
  delay: -((i * 7) % 10) / 10,
}));

const artFor = (t: Track) => RICH_GRADIENTS[(t.id - 1) % RICH_GRADIENTS.length];

/** Live playback position, read every animation frame while the view is open. */
function useCurrentTime(audioRef: RefObject<HTMLAudioElement | null>, active: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    let id = 0;
    const tick = () => {
      setT(audioRef.current?.currentTime ?? 0);
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, [audioRef, active]);
  return t;
}

function Seek({ audioRef, duration, time, thin = false, label }: { audioRef: RefObject<HTMLAudioElement | null>; duration: number; time: number; thin?: boolean; label: string }) {
  const [drag, setDrag] = useState<number | null>(null);
  const pct = (x: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (x - r.left) / r.width));
  };
  const shown = drag ?? time;
  const p = duration > 0 ? (shown / duration) * 100 : 0;
  const seekTo = (s: number) => {
    if (audioRef.current && duration > 0) audioRef.current.currentTime = Math.max(0, Math.min(duration, s));
  };
  return (
    <div
      className={`gnp-seek${thin ? " thin" : ""}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration || 0)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={`${formatTime(shown)} of ${formatTime(duration)}`}
      onKeyDown={e => {
        if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); seekTo(time + 5); }
        if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); seekTo(time - 5); }
      }}
      onPointerDown={e => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag(pct(e.clientX, e.currentTarget) * duration);
      }}
      onPointerMove={e => drag !== null && setDrag(pct(e.clientX, e.currentTarget) * duration)}
      onPointerUp={e => {
        if (drag === null) return;
        seekTo(pct(e.clientX, e.currentTarget) * duration);
        setDrag(null);
      }}
      style={{ touchAction: "none" }}
    >
      <div className="gnp-seek-track">
        <div className="gnp-seek-fill" style={{ width: `${p}%` }}>
          <span className="gnp-seek-knob" />
        </div>
      </div>
    </div>
  );
}

function Controls({ p, size = "lg" }: { p: Props; size?: "lg" | "sm" }) {
  return (
    <div className={`gnp-controls ${size}`}>
      <button type="button" className={`gnp-ic${p.isShuffled ? " on" : ""}`} onClick={() => p.setIsShuffled(!p.isShuffled)} aria-label="Shuffle" aria-pressed={p.isShuffled}>
        <Icons.Shuffle />
      </button>
      <button type="button" className="gnp-round" onClick={p.playPrev} aria-label="Previous">
        <Icons.SkipPrev />
      </button>
      <button type="button" className="gnp-play" onClick={p.togglePlay} aria-label={p.isPlaying ? "Pause" : "Play"}>
        {p.isLoading ? <span className="gnp-spin" aria-hidden /> : p.isPlaying ? <Icons.Pause /> : <Icons.Play />}
      </button>
      <button type="button" className="gnp-round" onClick={p.playNext} aria-label="Next">
        <Icons.SkipNext />
      </button>
      <button type="button" className={`gnp-ic${p.isRepeating ? " on" : ""}`} onClick={() => p.setIsRepeating(!p.isRepeating)} aria-label="Repeat" aria-pressed={p.isRepeating}>
        <Icons.Repeat />
      </button>
    </div>
  );
}

export function GlassNowPlaying(p: Props) {
  const { open, onClose, audioRef, track, duration } = p;
  const time = useCurrentTime(audioRef, open);
  const [speed, setSpeed] = useState(1);
  const closeRef = useRef<HTMLButtonElement>(null);

  // keep the chosen speed across tracks
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    // defaultPlaybackRate survives load() when the next ayah's src is set
    const apply = () => {
      a.defaultPlaybackRate = speed;
      if (a.playbackRate !== speed) a.playbackRate = speed;
    };
    apply();
    const evs = ["loadedmetadata", "play"] as const;
    evs.forEach(e => a.addEventListener(e, apply));
    return () => evs.forEach(e => a.removeEventListener(e, apply));
  }, [audioRef, speed]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !track || typeof document === "undefined") return null;

  const reciter = RECITERS.find(r => r.id === track.reciterId);
  const art = artFor(track);
  const liked = p.isLiked(track.id);
  const next = p.queue[0];
  const remaining = Math.max(0, (duration || 0) - time);
  const vol = p.isMuted ? 0 : p.volume;

  // Rendered into <body>: the site's page wrapper animates with a transform, which would
  // otherwise trap this fixed full-screen view under the site navbar.
  return createPortal(
    <div className={`gnp${p.isPlaying ? " playing" : ""}`} role="dialog" aria-modal="true" aria-label={`Now playing: ${track.name}`}>
      <div className="gnp-bg" style={{ background: art }} aria-hidden />
      <div className="gnp-veil" aria-hidden />

      <div className="gnp-bar" role="toolbar" aria-label="Player window">
        <button type="button" className="gnp-win" onClick={onClose} aria-label="Minimise player, keep playing" title="Minimise (Esc)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
          </svg>
          <span>Minimise</span>
        </button>
        <button type="button" className="gnp-win danger" onClick={p.onStop} aria-label="Close player and stop playback" title="Close and stop">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
          <span>Close</span>
        </button>
      </div>

      <div className="gnp-grid">
        {/* ---------- left: visualizer + up next ---------- */}
        <div className="gnp-col gnp-left">
          <section className="gnp-card gnp-viz" aria-label="Track">
            <div className="gnp-row">
              <span className="gnp-tile" style={{ background: art }} aria-hidden>
                {track.id}
              </span>
              <div className="gnp-meta">
                <strong>{track.name}</strong>
                <span>{track.translation}</span>
                <em>
                  {track.ayahs} ayahs · MP3
                </em>
              </div>
              <button type="button" className={`gnp-heart${liked ? " on" : ""}`} onClick={() => p.toggleLike(track.id)} aria-label={liked ? "Remove from liked" : "Add to liked"} aria-pressed={liked}>
                {liked ? <Icons.HeartFilled /> : <Icons.Heart />}
              </button>
            </div>
            <div className="gnp-bars" aria-hidden>
              {BARS.map((b, i) => (
                <span key={i} style={{ height: `${b.h}%`, animationDuration: `${b.d}s`, animationDelay: `${b.delay}s` }} />
              ))}
            </div>
            <Seek audioRef={audioRef} duration={duration} time={time} thin label="Seek" />
            <div className="gnp-times">
              <span>{formatTime(time)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <Controls p={p} size="sm" />
          </section>

          {next && (
            <section className="gnp-card gnp-pill" aria-label="Up next">
              <span className="gnp-orb" style={{ background: artFor(next) }} aria-hidden>
                {next.id}
              </span>
              <div className="gnp-meta">
                <small>Up next</small>
                <strong>{next.name}</strong>
                <span>{next.reciter}</span>
              </div>
              <button type="button" className="gnp-round sm" onClick={() => p.playTrack(next)} aria-label={`Play ${next.name} now`}>
                <Icons.SkipNext />
              </button>
            </section>
          )}
        </div>

        {/* ---------- centre: now playing ---------- */}
        <section className="gnp-card gnp-main" aria-label="Now playing">
          <div className="gnp-top">
            <button ref={closeRef} type="button" className="gnp-round sm" onClick={onClose} aria-label="Minimise player, keep playing" title="Minimise">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <span className="gnp-label">Now playing</span>
            <button type="button" className={`gnp-round sm gnp-heart-sm${liked ? " on" : ""}`} onClick={() => p.toggleLike(track.id)} aria-label={liked ? "Remove from liked" : "Add to liked"} aria-pressed={liked}>
              {liked ? <Icons.HeartFilled /> : <Icons.Heart />}
            </button>
          </div>

          <div className="gnp-disc-wrap">
            <div className="gnp-halo" style={{ background: art }} aria-hidden />
            <div className="gnp-disc" aria-hidden>
              <div className="gnp-label-art" style={{ background: art }}>
                <small className="gnp-label-kicker">Surah</small>
                <strong className="gnp-label-num">{track.id}</strong>
              </div>
            </div>
          </div>

          <div className="gnp-title">
            <h2>{track.name}</h2>
            <p>
              {track.reciter} · {track.translation}
            </p>
            <span className="gnp-badge">{track.ayahs} ayahs</span>
          </div>

          <div className="gnp-progress">
            <Seek audioRef={audioRef} duration={duration} time={time} label="Seek" />
            <div className="gnp-times">
              <span>{formatTime(time)}</span>
              <span>-{formatTime(remaining)}</span>
            </div>
          </div>

          <Controls p={p} />

          <button
            type="button"
            className="gnp-output"
            onClick={() => setSpeed(s => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
            aria-label={`Playback speed ${speed} times. Change speed`}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M12 21a9 9 0 1 1 9-9" />
              <path d="m12 12 4-3" />
            </svg>
            Speed {speed}×
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </section>

        {/* ---------- right: reciter + queue & volume ---------- */}
        <div className="gnp-col gnp-right">
          {reciter && (
            <section className="gnp-card gnp-reciter" aria-label="Reciter">
              <div className="gnp-row">
                <div className="gnp-cover">
                  <img src={reciter.image} alt="" />
                  <span className="gnp-mini-disc" aria-hidden />
                </div>
                <div className="gnp-meta">
                  <strong>{reciter.name}</strong>
                  <span className="gnp-ar" lang="ar" dir="rtl">
                    {reciter.arabicName}
                  </span>
                  <em>{track.name}</em>
                </div>
              </div>
              <Seek audioRef={audioRef} duration={duration} time={time} thin label="Seek" />
              <div className="gnp-times">
                <span>{formatTime(time)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </section>
          )}

          <section className="gnp-card gnp-queue" aria-label="Queue and volume">
            <div className="gnp-row gnp-queue-head">
              <span className="gnp-label">Queue & sound</span>
              <span className={`gnp-dot${p.isShuffled ? " on" : ""}`}>{p.isShuffled ? "Shuffle on" : "In order"}</span>
            </div>
            <ul className="gnp-list">
              <li className="active">
                <span className="gnp-qart" style={{ background: art }}>
                  <span className="gnp-eq" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                </span>
                <span className="gnp-meta">
                  <strong>{track.name}</strong>
                  <span>{track.reciter}</span>
                </span>
                <span className="gnp-qtime">{formatTime(duration)}</span>
              </li>
              {p.queue.slice(0, 3).map(q => (
                <li key={`${q.reciterId}-${q.id}`}>
                  <button type="button" onClick={() => p.playTrack(q)} aria-label={`Play ${q.name}`}>
                    <span className="gnp-qart" style={{ background: artFor(q) }}>
                      {q.id}
                    </span>
                    <span className="gnp-meta">
                      <strong>{q.name}</strong>
                      <span>{q.translation}</span>
                    </span>
                    <span className="gnp-qtime">≈{q.duration}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="gnp-volume">
              <button type="button" className="gnp-ic" onClick={() => p.setIsMuted(m => !m)} aria-label={p.isMuted ? "Unmute" : "Mute"} aria-pressed={p.isMuted}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
                  {p.isMuted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M15.5 9a4 4 0 0 1 0 6" />}
                </svg>
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={vol}
                onChange={e => {
                  p.setVolume(Number(e.target.value));
                  if (p.isMuted) p.setIsMuted(false);
                }}
                aria-label="Volume"
                style={{ ["--v" as string]: `${vol}%` }}
              />
              <span className="gnp-vol-num">{vol}</span>
            </div>
            <Controls p={p} size="sm" />
          </section>
        </div>
      </div>

      <p className="gnp-foot" aria-hidden>
        Quran Player · Now playing
      </p>
    </div>,
    document.body,
  );
}
