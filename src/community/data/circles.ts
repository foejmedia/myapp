export type CircleIcon =
  | 'sprout' | 'mic' | 'bookmark' | 'repeat' | 'languages' | 'lightbulb' | 'flower' | 'home' | 'cap' | 'door';

export interface Circle {
  id: string;
  name: string;
  /** one line, for cards */
  blurb: string;
  /** who it suits, for the circles page */
  suits: string;
  /** what a normal week looks like */
  week: string;
  level: 'Beginner' | 'Any level' | 'Reading fluently' | 'For teachers' | 'Sisters only';
  icon: CircleIcon;
  /** the Learn Quran tool this circle practises with (a path on the main site) */
  tool?: { label: string; href: string };
}

export const CIRCLES: Circle[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    blurb: 'Learning to read Arabic, from the letters up. No question is too basic here.',
    suits: 'Anyone who cannot yet read the mushaf, including those who learned once and forgot.',
    week: 'A few letters or one joining rule, a short reading to practise, and someone to hear it.',
    level: 'Beginner',
    icon: 'sprout',
    tool: { label: 'Learn Quran lessons', href: '/learn-quran' },
  },
  {
    id: 'tajweed',
    name: 'Tajweed',
    blurb: 'The rules of recitation, one at a time. Send a voice note, get a correction.',
    suits: 'Readers who can get through a page and want to recite it correctly.',
    week: 'One rule, the ayahs where it appears, and feedback on your own recording.',
    level: 'Any level',
    icon: 'mic',
    tool: { label: 'Tajweed rules', href: '/tajweed' },
  },
  {
    id: 'hifz',
    name: 'Hifz',
    blurb: 'New memorisation, a daily target, and a listener for every lesson.',
    suits: 'Anyone memorising, whether it is your first surah or your twentieth juz.',
    week: 'You set a target, recite it to a partner, and log it. The circle keeps the count honest.',
    level: 'Any level',
    icon: 'bookmark',
    tool: { label: 'Hifz program', href: '/memorize-quran' },
  },
  {
    id: 'revision',
    name: 'Revision Partners',
    blurb: 'Paired review of what you already know, so it does not slip away.',
    suits: 'Those who have memorised portions and find revision harder than memorising.',
    week: 'Two or three short calls with one partner. You recite, they follow in the mushaf, then swap.',
    level: 'Any level',
    icon: 'repeat',
    tool: { label: 'Hifz program', href: '/memorize-quran' },
  },
  {
    id: 'word-by-word',
    name: 'Word by Word',
    blurb: 'Quranic Arabic one word at a time, until the recitation starts to mean something.',
    suits: 'Readers who recite fluently and want to understand without waiting for the translation.',
    week: 'A set of frequent words, the ayahs they come from, and a short quiz among yourselves.',
    level: 'Reading fluently',
    icon: 'languages',
    tool: { label: 'Word by Word reader', href: '/read-quran/1?mode=word-by-word' },
  },
  {
    id: 'tafseer',
    name: 'Tafseer & Reflection',
    blurb: 'Reading the established works of tafseer together, one passage a week.',
    suits: 'Anyone who wants to study meaning from the scholars, not from guesswork.',
    week: 'A passage, the commentary on it, and a conversation about what it asks of us.',
    level: 'Any level',
    icon: 'lightbulb',
    tool: { label: 'Tafseer', href: '/tafseer' },
  },
  {
    id: 'sisters',
    name: 'Sisters’ Circle',
    blurb: 'A women-only space, moderated by sisters, for every level.',
    suits: 'Sisters who prefer to recite, ask and be corrected among women.',
    week: 'Reading, tajweed and memorisation tracks, each with its own listener.',
    level: 'Sisters only',
    icon: 'flower',
  },
  {
    id: 'parents',
    name: 'Parents & Children',
    blurb: 'Teaching the Quran at home: routines, patience, and what works with children.',
    suits: 'Parents and guardians teaching their own children, at any age.',
    week: 'One small routine to try at home, and an honest report of how it went.',
    level: 'Any level',
    icon: 'home',
    tool: { label: 'Learn in 1 Minute', href: '/learn-1-min' },
  },
  {
    id: 'teachers',
    name: 'Teachers’ Room',
    blurb: 'For those who teach the Quran: methods, lesson plans and hard cases.',
    suits: 'Teachers of children or adults, in a madrasa, a masjid or online.',
    week: 'One teaching problem brought by a member, and how others have handled it.',
    level: 'For teachers',
    icon: 'cap',
    tool: { label: 'Quran Quiz', href: '/quiz' },
  },
  {
    id: 'courtyard',
    name: 'The Courtyard',
    blurb: 'Introductions, good news, and everything that fits nowhere else.',
    suits: 'Everyone. It is where you say salaam on your first day.',
    week: 'No programme. Milestones are announced here so the whole community can make dua.',
    level: 'Any level',
    icon: 'door',
  },
];
