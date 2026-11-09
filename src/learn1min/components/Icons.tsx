/** Small inline icons (no icon library, no emoji). */
type P = { className?: string };
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconWord = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
    <path d="M9 8h7M9 11.5h5" />
  </svg>
);

export const IconDua = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M7 21v-4.5c0-1-.4-2-1.1-2.7L3.5 11.4a1.6 1.6 0 0 1 2.3-2.3L8 11.3V5.5a1.5 1.5 0 0 1 3 0V12" />
    <path d="M17 21v-4.5c0-1 .4-2 1.1-2.7l2.4-2.4a1.6 1.6 0 0 0-2.3-2.3L16 11.3V5.5a1.5 1.5 0 0 0-3 0V12" />
  </svg>
);

export const IconSurah = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M12 2.8 14.2 5h3.1l-.1 3.1L19.2 10 17.2 12l.1 3.1h-3.1L12 17.2 9.8 15.1H6.7l.1-3.1L4.8 10l2-1.9L6.7 5h3.1L12 2.8Z" />
    <path d="M8 21h8" />
  </svg>
);

export const IconFlame = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      d="M12 2.5c.6 3-1.3 4.6-2.7 6.2C7.9 10.3 7 12 7 14a5 5 0 0 0 10 0c0-2.4-1.2-4.1-2.2-5.2.1 1.4-.4 2.6-1.4 3.2.4-3.4-.6-7-1.4-9.5Z"
      fill="currentColor"
    />
  </svg>
);

export const IconCheck = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base} strokeWidth={2.4}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconSpeaker = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);

export const IconBookmark = ({ className, filled }: P & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base} fill={filled ? 'currentColor' : 'none'}>
    <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />
  </svg>
);

export const IconClose = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconChevron = ({ className, dir = 'right' }: P & { dir?: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base} style={dir === 'left' ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const IconLock = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);

export const IconSpark = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M12 2.5 13.8 9 20.5 12l-6.7 3L12 21.5 10.2 15 3.5 12l6.7-3z" fill="currentColor" />
  </svg>
);

export const IconRepeat = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
    <path d="M4 12a7 7 0 0 1 12-4.9L18 9M20 12a7 7 0 0 1-12 4.9L6 15" />
    <path d="M18 4.5V9h-4.5M6 19.5V15h4.5" />
  </svg>
);
