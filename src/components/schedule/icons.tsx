/* Small stroke icons for My Schedule (24px grid, currentColor) */
import type { Cat } from '@/lib/schedule';

type P = { className?: string };
const S = ({ children, className }: P & { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const IconLeft = (p: P) => <S {...p}><path d="M15 6l-6 6 6 6" /></S>;
export const IconRight = (p: P) => <S {...p}><path d="M9 6l6 6-6 6" /></S>;
export const IconPlus = (p: P) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const IconCheck = (p: P) => <S {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></S>;
export const IconClose = (p: P) => <S {...p}><path d="M6 6l12 12M18 6L6 18" /></S>;
export const IconClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></S>;
export const IconRepeat = (p: P) => <S {...p}><path d="M4 11V9a3 3 0 0 1 3-3h12l-3-3M20 13v2a3 3 0 0 1-3 3H5l3 3" /></S>;
export const IconTrash = (p: P) => <S {...p}><path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></S>;
export const IconPin = (p: P) => <S {...p}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></S>;
export const IconMoon = (p: P) => <S {...p}><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" /></S>;
export const IconAnchor = (p: P) => <S {...p}><path d="M12 3v3M5 13a7 7 0 0 0 14 0M12 6v14M8 10h8" /></S>;
export const IconSpark = (p: P) => <S {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></S>;

/** One icon per category */
export function CatIcon({ cat, className }: { cat: Cat; className?: string }) {
  switch (cat) {
    case 'salah':
      return <S className={className}><path d="M4 20h16M6 20v-7a6 6 0 0 1 12 0v7M12 7V3.5M10 20v-3a2 2 0 0 1 4 0v3" /></S>;
    case 'quran':
      return <S className={className}><path d="M12 6.5c-2-1.3-5-1.5-8-.8v12.5c3-.7 6-.5 8 .8 2-1.3 5-1.5 8-.8V5.7c-3-.7-6-.5-8 .8zM12 6.5v12.5" /></S>;
    case 'study':
      return <S className={className}><path d="M3 9l9-4.5L21 9l-9 4.5zM7 11v4.5c1.5 1.5 3.2 2 5 2s3.5-.5 5-2V11M21 9v5" /></S>;
    case 'dhikr':
      return <S className={className}><circle cx="12" cy="11" r="6.5" /><circle cx="12" cy="4.5" r="1.4" /><path d="M12 17.5V21M10.5 21h3" /></S>;
    case 'fast':
      return <S className={className}><path d="M17.5 13.5A6.5 6.5 0 0 1 10.5 4a7 7 0 1 0 7 9.5zM18 4v3M16.5 5.5h3" /></S>;
    default:
      return <S className={className}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></S>;
  }
}
