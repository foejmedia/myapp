/** Inline stroke icons (no icon library, no emoji). All are decorative: give the control its own label. */
type P = { className?: string };
const base = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
};
const I = (d: React.ReactNode) => function Icon({ className }: P) {
  return <svg {...base} className={className}>{d}</svg>;
};

export const IconHome = I(<><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M5.5 9v10.5h13V9" /><path d="M10 19.5v-5h4v5" /></>);
export const IconWord = I(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" /><path d="M9 8h7M9 11.5h5" /></>);
export const IconDua = I(<><path d="M7 21v-4.5c0-1-.4-2-1.1-2.7L3.5 11.4a1.6 1.6 0 0 1 2.3-2.3L8 11.3V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M17 21v-4.5c0-1 .4-2 1.1-2.7l2.4-2.4a1.6 1.6 0 0 0-2.3-2.3L16 11.3V5.5a1.5 1.5 0 0 0-3 0V12" /></>);
export const IconSurah = I(<><path d="M12 2.8 14.2 5h3.1l-.1 3.1L19.2 10 17.2 12l.1 3.1h-3.1L12 17.2 9.8 15.1H6.7l.1-3.1L4.8 10l2-1.9L6.7 5h3.1L12 2.8Z" /><path d="M8 21h8" /></>);
export const IconCards = I(<><rect x="3.5" y="6" width="13" height="15" rx="2.5" /><path d="M7.5 3h10a3 3 0 0 1 3 3v12" /></>);
export const IconQuiz = I(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8v.5" /><path d="M12 17h.01" /></>);
export const IconRepeat = I(<><path d="M4 12a7 7 0 0 1 12-4.9L18 9M20 12a7 7 0 0 1-12 4.9L6 15" /><path d="M18 4.5V9h-4.5M6 19.5V15h4.5" /></>);
export const IconNotebook = I(<><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M9 3v18M12.5 8H16M12.5 11.5H16" /></>);
export const IconSearch = I(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>);
export const IconSun = I(<><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></>);
export const IconMoon = I(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />);
export const IconUser = I(<><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>);
export const IconMenu = I(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconClose = I(<path d="M6 6l12 12M18 6 6 18" />);
export const IconCheck = I(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconPlay = I(<path d="M7 4.5v15l12-7.5z" />);
export const IconPause = I(<path d="M8 4.5v15M16 4.5v15" />);
export const IconSpeaker = I(<><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>);
export const IconLock = I(<><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>);
export const IconArrow = I(<path d="M5 12h14M13 6l6 6-6 6" />);
export const IconChevron = I(<path d="m9 5 7 7-7 7" />);
export const IconChevronLeft = I(<path d="m15 5-7 7 7 7" />);
export const IconPencil = I(<><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>);
export const IconTrash = I(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>);
export const IconFlip = I(<><path d="M4 9a8 8 0 0 1 14-3l2 2" /><path d="M20 4v4h-4" /><path d="M20 15a8 8 0 0 1-14 3l-2-2" /><path d="M4 20v-4h4" /></>);
export const IconFlame = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M12 2.5c.6 3-1.3 4.6-2.7 6.2C7.9 10.3 7 12 7 14a5 5 0 0 0 10 0c0-2.4-1.2-4.1-2.2-5.2.1 1.4-.4 2.6-1.4 3.2.4-3.4-.6-7-1.4-9.5Z" fill="currentColor" />
  </svg>
);
export const IconBookmark = ({ className, filled }: P & { filled?: boolean }) => (
  <svg {...base} className={className} fill={filled ? 'currentColor' : 'none'}>
    <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />
  </svg>
);
export const IconSpark = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M12 2.5 13.8 9 20.5 12l-6.7 3L12 21.5 10.2 15 3.5 12l6.7-3z" fill="currentColor" />
  </svg>
);
