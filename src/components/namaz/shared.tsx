/** Small pieces shared by the Namaz Tracker components */
import type { Code } from '@/lib/namaz';

export type Filter = 'all' | 'M' | 'Q' | 'O' | 'J';
export const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'M', label: 'Missed' },
  { id: 'Q', label: 'Qaza' },
  { id: 'O', label: 'On time' },
  { id: 'J', label: 'Jamaat' },
];

export const BLOCK_LABEL: Record<Code | 'none', string> = {
  J: 'Jamaat',
  O: 'On time',
  L: 'Late',
  Q: 'Made up',
  M: 'Missed',
  none: 'Not logged',
};

export const STATUS_OPTIONS: { code: Code; label: string; hint: string }[] = [
  { code: 'J', label: 'Jamaat', hint: 'Prayed in congregation' },
  { code: 'O', label: 'On time', hint: 'Prayed alone, on time' },
  { code: 'L', label: 'Late', hint: 'Prayed, but late' },
  { code: 'M', label: 'Missed', hint: 'Qaza owed' },
];

export const longDate = (d: Date) => d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });
export const shortDate = (d: Date) => d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });

const I = (path: React.ReactNode) =>
  function Icon({ className }: { className?: string }) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {path}
      </svg>
    );
  };

export const Icons = {
  Calendar: I(<><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>),
  Qaza: I(<><path d="M20 11a8 8 0 1 0-2.4 5.7" /><path d="M20 4.5V11h-6.5" /><path d="M12 8v4.5l2.5 1.5" /></>),
  Insights: I(<><path d="M4 20V11M10 20V5M16 20v-6M3 20h18" /></>),
  Bell: I(<><path d="M6 9a6 6 0 1 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9" /><path d="M10.3 20.5a2 2 0 0 0 3.4 0" /></>),
  Settings: I(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>),
  Download: I(<><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /></>),
  Filter: I(<><path d="M4 6h16M7 12h10M10 18h4" /></>),
  Plus: I(<path d="M12 5v14M5 12h14" />),
  Dots: I(<><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></>),
  Chevron: I(<path d="M6 9l6 6 6-6" />),
  Left: I(<path d="M15 18l-6-6 6-6" />),
  Right: I(<path d="M9 18l6-6-6-6" />),
  Close: I(<path d="M6 6l12 12M18 6L6 18" />),
  Check: I(<path d="M5 12.5l4.5 4.5L19 7.5" />),
  Pin: I(<><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>),
  Print: I(<><path d="M7 9V3.5h10V9" /><rect x="3.5" y="9" width="17" height="8" rx="2" /><path d="M7 14h10v6.5H7z" /></>),
  User: I(<><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>),
  Upload: I(<><path d="M12 20V9M7 13.5l5-5 5 5M5 4h14" /></>),
};
