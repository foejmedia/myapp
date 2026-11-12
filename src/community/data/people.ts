/**
 * Members and their stories.
 *
 * There is no backend yet, so the entries below are EXAMPLES that show how the pages look.
 * They are not real people. Each has `example: true`, which puts an "Example" tag on the card,
 * and they are only shown while PREVIEW is true (see ../config.ts).
 *
 * When real data arrives, return it from here (or fetch it in the page components) in the same shape.
 */

export const FOCUSES = ['Reading', 'Tajweed', 'Hifz', 'Understanding', 'Teaching'] as const;
export type Focus = (typeof FOCUSES)[number];

export interface Member {
  id: string;
  name: string;
  /** what they are working on, in their own words */
  line: string;
  city: string;
  focus: Focus;
  example?: boolean;
}

export interface Story {
  id: string;
  name: string;
  /** e.g. the circle they belong to */
  role: string;
  focus: Focus;
  /** short, upper-cased on the card: the milestone itself */
  milestone: string;
  body: string[];
  example?: boolean;
}

export const MEMBERS: Member[] = [
  { id: 'e1', name: 'Ayesha R.', line: 'Learning to read, a few letters a week', city: 'Lucknow', focus: 'Reading', example: true },
  { id: 'e2', name: 'Bilal K.', line: 'Memorising Juz 30 after Fajr', city: 'Hyderabad', focus: 'Hifz', example: true },
  { id: 'e3', name: 'Maryam S.', line: 'Teaches tajweed to children', city: 'Bengaluru', focus: 'Teaching', example: true },
  { id: 'e4', name: 'Yusuf A.', line: 'Working through the rules of noon saakin', city: 'Delhi', focus: 'Tajweed', example: true },
  { id: 'e5', name: 'Fatima N.', line: 'Revising five juz with a partner', city: 'Mumbai', focus: 'Hifz', example: true },
  { id: 'e6', name: 'Imran H.', line: 'Building vocabulary, ten words a week', city: 'Pune', focus: 'Understanding', example: true },
  { id: 'e7', name: 'Zainab M.', line: 'Back to recitation after years away', city: 'Kolkata', focus: 'Tajweed', example: true },
  { id: 'e8', name: 'Hamza T.', line: 'Teaching his two sons at home', city: 'Chennai', focus: 'Teaching', example: true },
  { id: 'e9', name: 'Khadija F.', line: 'Reading tafseer, one passage a week', city: 'Bhopal', focus: 'Understanding', example: true },
  { id: 'e10', name: 'Omar D.', line: 'New to Islam, starting from Alif', city: 'London', focus: 'Reading', example: true },
  { id: 'e11', name: 'Sumayyah B.', line: 'Hafizah, listens to others revise', city: 'Kuala Lumpur', focus: 'Teaching', example: true },
  { id: 'e12', name: 'Ibrahim Q.', line: 'Halfway through Surah Al-Baqarah', city: 'Srinagar', focus: 'Hifz', example: true },
];

export const STORIES: Story[] = [
  {
    id: 's1',
    name: 'Bilal K.',
    role: 'Hifz circle',
    focus: 'Hifz',
    milestone: 'First juz memorised',
    body: [
      'Alhamdulillah, I finished Juz 30 last night.',
      'I had started and stopped three times on my own. What changed this time was simple: someone was waiting to hear my lesson every morning, and I did not want to turn up empty-handed.',
      'Please keep me in your duas as I begin Juz 29.',
    ],
    example: true,
  },
  {
    id: 's2',
    name: 'Ayesha R.',
    role: 'First Steps circle',
    focus: 'Reading',
    milestone: 'Reading on my own',
    body: [
      'When I joined I could not tell ba from ta.',
      'This week I read Surah Al-Ikhlas from the mushaf without help. My daughter sat next to me and corrected me once. I am not sure which of us was happier.',
    ],
    example: true,
  },
  {
    id: 's3',
    name: 'Zainab M.',
    role: 'Tajweed circle',
    focus: 'Tajweed',
    milestone: 'Back after ten years',
    body: [
      'I learned to recite as a child and then let it go for ten years. I was embarrassed by how much I had lost.',
      'Nobody in the circle made me feel that. My first voice note came back with two corrections and a dua. I have sent one every day since.',
    ],
    example: true,
  },
  {
    id: 's4',
    name: 'Hamza T.',
    role: 'Parents & Children circle',
    focus: 'Teaching',
    milestone: 'A routine that stuck',
    body: [
      'We tried an hour every evening and it ended in tears, mostly mine.',
      'Another father suggested ten minutes after Maghrib and nothing more. It has been six weeks. My sons now remind me.',
    ],
    example: true,
  },
];
