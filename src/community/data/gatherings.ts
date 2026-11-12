export interface GatheringFormat {
  id: string;
  name: string;
  blurb: string;
  where: 'Online' | 'In person';
  length: string;
  icon: 'users' | 'ear' | 'repeat' | 'sparkles' | 'pin';
}

export const FORMATS: GatheringFormat[] = [
  {
    id: 'weekly',
    name: 'Weekly circle session',
    blurb: 'Each circle meets once a week. Everyone who wishes to recites, is corrected, and leaves with a target for the week.',
    where: 'Online',
    length: 'About 40 minutes',
    icon: 'users',
  },
  {
    id: 'clinic',
    name: 'Recitation clinic',
    blurb: 'Open slots where you recite a page and a listener marks what to fix. Bring one page, not ten.',
    where: 'Online',
    length: '10 minutes each',
    icon: 'ear',
  },
  {
    id: 'partners',
    name: 'Partner check-ins',
    blurb: 'Short calls between revision partners on days you choose together. One recites, one follows in the mushaf, then you swap.',
    where: 'Online',
    length: '15 minutes',
    icon: 'repeat',
  },
  {
    id: 'milestones',
    name: 'Milestone evenings',
    blurb: 'When a member finishes a juz, a first reading or the whole Quran, the community gathers to hear the last lines and make dua.',
    where: 'Online',
    length: 'When it happens',
    icon: 'sparkles',
  },
  {
    id: 'city',
    name: 'City meetups',
    blurb: 'Members in the same city meet face to face. A city starts as soon as it has enough members to fill a circle.',
    where: 'In person',
    length: 'Announced to members',
    icon: 'pin',
  },
];

/** How one weekly session runs, start to finish */
export const SESSION: { minutes: string; title: string; text: string }[] = [
  { minutes: '5 min', title: 'Open', text: 'Salaam, a short recitation, and who is here this week.' },
  { minutes: '20 min', title: 'Recite', text: 'Members recite in turn. The listener corrects one or two things, never everything at once.' },
  { minutes: '10 min', title: 'One point', text: 'A single rule of tajweed or a single meaning, explained with the ayahs just recited.' },
  { minutes: '5 min', title: 'Set the week', text: 'Each member says their target aloud. That is what the circle will ask about next time.' },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Do I have to recite in front of everyone?',
    a: 'No. You can listen for as long as you need, and recite when you are ready. You can also send a voice note to one listener instead.',
  },
  {
    q: 'What if I miss a week?',
    a: 'Tell your circle and come to the next one. Someone will check in on you so that you are not left catching up alone.',
  },
  {
    q: 'Which recitation do you follow?',
    a: 'Hafs from Asim, the same reading the Learn Quran reader uses.',
  },
  {
    q: 'When are sessions held?',
    a: 'Each circle agrees its own time, to suit the time zones of the people in it. Times are shared with members inside the circle.',
  },
  {
    q: 'Can I ask for a religious ruling?',
    a: 'Circles are for learning to read, memorise and understand the Quran. For a ruling on a personal matter, please ask a qualified scholar you trust.',
  },
];
