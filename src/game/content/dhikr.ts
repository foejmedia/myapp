/**
 * The Garden of Dhikr — religious content catalogue.
 *
 * ALL religious text shown by the game comes from this file. Every entry is
 * `reviewStatus: 'pending'` until a qualified scholar has reviewed the Arabic,
 * the meaning, the virtue, the grading and the reflection. Only the reviewer
 * may change an entry to 'approved' — never an automated tool.
 *
 * Hadith texts here are short summaries with their reference, not full
 * translations. Qur'an meanings are quoted from Saheeh International.
 */

export type Species = 'jasmine' | 'pomegranate' | 'olive' | 'cypress' | 'palm' | 'rain';
export type ReviewStatus = 'pending' | 'approved';

export type Source = { ref: string; note: string };

export type Dhikr = {
  id: string;
  arabic: string;            // full tashkeel
  transliteration: string;
  translation: string;
  plant: string;             // what it grows, in words
  species: Species;
  place: string;             // where it grows in the chahar bagh
  why: string;               // why this plant
  reflection: string;        // one line
  sources: Source[];
  defaultTarget: 33 | 100;
  audio?: string;            // e.g. '/audio/subhanallah.mp3' once a qari recording exists (with written permission)
  reviewStatus: ReviewStatus;
};

export const DHIKR: Dhikr[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'SubhanAllah',
    translation: 'Glory be to Allah.',
    plant: 'White jasmine',
    species: 'jasmine',
    place: 'First quadrant (north-west)',
    why: 'Purity: declaring Allah above every flaw.',
    reflection: 'As jasmine is white and clean, this phrase declares Allah free of every imperfection.',
    sources: [
      { ref: 'Tirmidhi 3462', note: 'Named among the plantings of Paradise in the hadith of Ibrahim (AS).' },
      { ref: 'Ibn Majah 3807', note: 'Each of the four phrases plants a tree in Paradise.' },
    ],
    defaultTarget: 33,
    reviewStatus: 'pending',
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    translation: 'All praise is for Allah.',
    plant: 'Pomegranate tree',
    species: 'pomegranate',
    place: 'Second quadrant (north-east)',
    why: 'Gratitude for provision; the pomegranate is named among the fruits of Paradise (Ar-Rahman 55:68).',
    reflection: 'Every fruit on the tree is a provision to be thankful for.',
    sources: [
      { ref: 'Tirmidhi 3462', note: 'Named among the plantings of Paradise in the hadith of Ibrahim (AS).' },
      { ref: 'Muslim 223', note: 'Alhamdulillah fills the scale.' },
      { ref: "Qur'an 55:68", note: 'In both of them are fruit and palm trees and pomegranates.' },
    ],
    defaultTarget: 33,
    reviewStatus: 'pending',
  },
  {
    id: 'la-ilaha-illallah',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    transliteration: 'La ilaha illallah',
    translation: 'There is no god but Allah.',
    plant: 'Olive grove and the central Good Tree',
    species: 'olive',
    place: 'Third quadrant (south-west), and the Good Tree at the centre',
    why: 'The good word as a good tree (Ibrahim 14:24); the blessed olive of the Light verse (An-Nur 24:35).',
    reflection: 'A root firm in the heart, and branches reaching toward the sky.',
    sources: [
      { ref: 'Tirmidhi 3462', note: 'Named among the plantings of Paradise in the hadith of Ibrahim (AS).' },
      {
        ref: "Qur'an 14:24",
        note:
          'Have you not considered how Allah presents an example, [making] a good word like a good tree, whose root is firmly fixed and its branches [high] in the sky? Many mufassirun explain the good word as La ilaha illallah.',
      },
    ],
    defaultTarget: 100,
    reviewStatus: 'pending',
  },
  {
    id: 'allahu-akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest.',
    plant: 'Tall cypress',
    species: 'cypress',
    place: 'Fourth quadrant (south-east)',
    why: 'The cypress rises above everything around it.',
    reflection: 'Whatever seems large today, Allah is greater.',
    sources: [
      { ref: 'Tirmidhi 3462', note: 'Named among the plantings of Paradise in the hadith of Ibrahim (AS).' },
    ],
    defaultTarget: 33,
    reviewStatus: 'pending',
  },
  {
    id: 'subhanallahil-azeem',
    arabic: 'سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِهِ',
    transliteration: "SubhanAllahil-'Azeem wa bihamdihi",
    translation: 'Glory be to Allah, the Magnificent, and praise be to Him.',
    plant: 'Date palm',
    species: 'palm',
    place: 'Along the water channels',
    why: 'A date palm is planted in Paradise for whoever says it.',
    reflection: 'A palm gives shade and fruit for a lifetime; so does a word said sincerely.',
    sources: [{ ref: 'Tirmidhi 3464', note: 'Whoever says it has a date palm planted for him in Paradise.' }],
    defaultTarget: 100,
    reviewStatus: 'pending',
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    translation: 'I seek the forgiveness of Allah.',
    plant: 'Rain over the whole garden',
    species: 'rain',
    place: 'Falls on every quadrant',
    why: 'Seeking forgiveness brings rain, gardens and rivers.',
    reflection: 'Forgiveness falls like rain, and everything it touches turns green.',
    sources: [
      {
        ref: "Qur'an 71:10–12",
        note:
          'And said, "Ask forgiveness of your Lord. Indeed, He is ever a Perpetual Forgiver. He will send [rain from] the sky upon you in [continuing] showers and give you increase in wealth and children and provide for you gardens and provide for you rivers."',
      },
    ],
    defaultTarget: 100,
    reviewStatus: 'pending',
  },
];

export const DHIKR_BY_ID: Record<string, Dhikr> = Object.fromEntries(DHIKR.map(d => [d.id, d]));

/** The four phrases of the hadith of Ibrahim (AS), one per quadrant. */
export const QUADRANT_IDS = ['subhanallah', 'alhamdulillah', 'la-ilaha-illallah', 'allahu-akbar'] as const;

/** Post-salah tasbih: 33 / 33 / 34. Completing it today makes the fountain flow. */
export const AFTER_SALAH = {
  label: 'After-salah tasbih',
  steps: [
    { dhikrId: 'subhanallah', target: 33 },
    { dhikrId: 'alhamdulillah', target: 33 },
    { dhikrId: 'allahu-akbar', target: 34 },
  ],
  source: { ref: 'Muslim 597', note: 'The completed set after each prayer.' } as Source,
};

/** Framing texts used by onboarding, cards and the Dua Garden. Summaries, pending review. */
export const TEXTS = {
  ibrahim: {
    body:
      'On the Night Journey, Ibrahim (AS) asked the Prophet ﷺ to tell his ummah that Paradise has pure soil and sweet water, and that its plantings are SubhanAllah, Alhamdulillah, La ilaha illallah and Allahu Akbar.',
    ref: 'Tirmidhi 3462, graded hasan',
  },
  betterPlanting: {
    body:
      'The Prophet ﷺ saw Abu Hurairah planting and told him of a better planting: each of these four phrases plants a tree in Paradise.',
    ref: 'Ibn Majah 3807',
  },
  consistency: {
    body: 'The most beloved deeds to Allah are the most consistent, even if small.',
    ref: 'Bukhari 6464, Muslim 783',
  },
  duaInAbsence: {
    body:
      'When a Muslim makes dua for his brother in his absence, an angel replies: "And for you the same."',
    ref: 'Muslim 2732',
  },
  honesty: 'Each one is a tree with Allah; your garden shows one for every hundred.',
  reminder:
    "This garden is a tadhkirah, a reminder of the promised garden. It is not a picture of anyone's reward, which is with Allah alone.",
};

/** Seeds that will join through the Seed Library (titles and references only for now). */
export const UPCOMING: { title: string; grows: string; ref: string }[] = [
  { title: 'SubhanAllahi wa bihamdihi (100×)', grows: 'Water lilies on the pond', ref: 'Bukhari 6405, Muslim 2691' },
  { title: 'Salawat on the Prophet ﷺ', grows: 'Lanterns along the paths', ref: 'Muslim 408' },
  { title: 'La hawla wa la quwwata illa billah', grows: 'Gemstones hidden in the soil', ref: 'Bukhari 6384, Muslim 2704' },
  { title: 'Sayyid al-Istighfar', grows: 'A rainbow after the rain', ref: 'Bukhari 6306' },
  { title: 'Morning and evening adhkar', grows: 'The Dawn Gate and the Moon Gate', ref: 'Hisn al-Muslim collection' },
];
