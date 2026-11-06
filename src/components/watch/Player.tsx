'use client';
import { useEffect, useRef, useState } from 'react';
import { saveProgress, type Snap } from './store';

/* Minimal typing for the parts of the YouTube IFrame Player API used here */
interface YTPlayer { getCurrentTime(): number; getDuration(): number; destroy(): void }
interface YTNamespace {
  Player: new (el: HTMLElement, opts: {
    videoId: string; host?: string;
    playerVars?: Record<string, number | string>;
    events?: { onStateChange?: (e: { data: number }) => void; onError?: () => void };
  }) => YTPlayer;
}
declare global {
  interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void }
}

let api: Promise<YTNamespace> | null = null;
function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  api ??= new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT!); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => { api = null; reject(new Error('blocked')); };
    document.head.appendChild(s);
  });
  return api;
}

const ENDED = 0;

/**
 * YouTube's player (privacy-enhanced youtube-nocookie host), saving the position every few
 * seconds so "Continue watching" can resume it. If the player script is blocked, a plain
 * embed still plays — just without resume.
 */
export default function Player({ video, start, onEnded }: { video: Snap; start: number; onEnded?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const ended = useRef(onEnded);
  ended.current = onEnded;
  const [plain, setPlain] = useState(false);

  useEffect(() => {
    let player: YTPlayer | null = null;
    let timer = 0;
    let cancelled = false;
    const save = () => {
      try {
        const t = player?.getCurrentTime() ?? 0, d = player?.getDuration() ?? 0;
        if (d > 0 && t > 0) saveProgress(video, t, d);
      } catch { /* player gone */ }
    };
    loadApi().then(YT => {
      if (cancelled || !host.current) return;
      const el = document.createElement('div');
      host.current.replaceChildren(el);
      player = new YT.Player(el, {
        videoId: video.id,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1, start },
        events: { onStateChange: e => { if (e.data === ENDED) { save(); ended.current?.(); } } },
      });
      timer = window.setInterval(save, 4000);
    }).catch(() => { if (!cancelled) setPlain(true); });
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      save();
      try { player?.destroy(); } catch { /* already gone */ }
    };
    // a new video gets a new player; `start` only matters when it's created
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  return (
    <div className="wt-player">
      {plain ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1&start=${start}`}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <div ref={host} className="wt-player-host" />
      )}
    </div>
  );
}
