/** The Learn Quran tools the circles practise with. Every `href` is a real page on the main site. */

export const RESOURCE_KINDS = ['Read', 'Listen', 'Memorise', 'Learn', 'Daily practice'] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export interface Resource {
  name: string;
  href: string;
  text: string;
  kind: ResourceKind;
}

export const RESOURCES: Resource[] = [
  { name: 'Read Quran', href: '/read-quran/1', text: 'All 114 surahs with translation, in a reader made for long sittings.', kind: 'Read' },
  { name: 'Mushaf', href: '/quran-pages', text: 'The Quran page by page, laid out like the printed mushaf.', kind: 'Read' },
  { name: 'Word by Word', href: '/read-quran/1?mode=word-by-word', text: 'Every word with its meaning underneath. The Word by Word circle works from here.', kind: 'Read' },
  { name: 'Tafseer', href: '/tafseer', text: 'Classical commentary, surah by surah, for the Tafseer & Reflection circle.', kind: 'Read' },

  { name: 'Audio Quran', href: '/audio-quran', text: 'Full recitations to stream. Listen to your lesson before you recite it.', kind: 'Listen' },
  { name: 'Quran Player', href: '/quran-player', text: 'Well-known reciters, surah by surah.', kind: 'Listen' },
  { name: 'Translation Audio', href: '/translation-audio', text: 'Listen to the translation, ayah by ayah, in several languages.', kind: 'Listen' },
  { name: 'Quran Radio', href: '/radio', text: 'Continuous recitation on live channels.', kind: 'Listen' },

  { name: 'Hifz Program', href: '/memorize-quran', text: 'Memorise ayah by ayah with repetition, then come back for revision. Used by the Hifz and Revision circles.', kind: 'Memorise' },
  { name: 'Learn in 1 Minute', href: '/learn-1-min', text: 'A one-minute lesson each day: words, duas and short surahs, with flashcards.', kind: 'Memorise' },

  { name: 'Learn Quran lessons', href: '/learn-quran', text: 'Structured lessons that start at Alif. The First Steps circle follows them.', kind: 'Learn' },
  { name: 'Tajweed', href: '/tajweed', text: 'The rules of recitation, explained one by one.', kind: 'Learn' },
  { name: 'Quran Quiz', href: '/quiz', text: 'Test what you have learned, one question at a time.', kind: 'Learn' },

  { name: 'Duas', href: '/dua', text: 'Supplications for the moments of an ordinary day.', kind: 'Daily practice' },
  { name: 'Hadith', href: '/hadees', text: 'Collections of the sayings of the Prophet ﷺ.', kind: 'Daily practice' },
  { name: 'Namaz Tracker', href: '/namaz-tracker', text: 'Log the five prayers and see the month at a glance.', kind: 'Daily practice' },
  { name: 'My Schedule', href: '/my-schedule', text: 'Plan the day around the prayers, with a slot for your lesson.', kind: 'Daily practice' },
  { name: 'Tasbih', href: '/tasbih', text: 'A counter for dhikr.', kind: 'Daily practice' },
  { name: 'Qibla', href: '/qibla', text: 'Find the direction of prayer from where you are.', kind: 'Daily practice' },
];
