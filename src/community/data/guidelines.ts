export interface GuidelineSection {
  id: string;
  title: string;
  intro?: string;
  groups: { heading?: string; tone?: 'do' | 'dont'; items: string[] }[];
}

export const GUIDELINES: GuidelineSection[] = [
  {
    id: 'purpose',
    title: 'Why we are here',
    intro:
      'This community exists for one thing: to help each other read, memorise and understand the Quran, and to keep going when it gets hard. Everything below protects that.',
    groups: [],
  },
  {
    id: 'standards',
    title: 'Our standards',
    groups: [
      {
        heading: 'What we encourage',
        tone: 'do',
        items: [
          'Turning up. A short lesson recited every week is worth more than a long one planned.',
          'Correcting gently: one or two points at a time, and in private when it might embarrass.',
          'Asking the basic question. Someone else is waiting for the answer too.',
          'Making dua for each other, and saying so.',
          'Sharing what worked for you, as your own experience and not as a rule.',
        ],
      },
      {
        heading: 'What we do not accept',
        tone: 'dont',
        items: [
          'Mocking or belittling anyone’s recitation, accent, pace or level.',
          'Arguments between schools of thought, sects or groups. This is not the place.',
          'Promotion of courses, products, channels or fundraising, unless a moderator has agreed to it.',
          'Forwarded messages, chain posts and unverified quotations.',
          'Contacting a member privately when they have not invited it.',
        ],
      },
    ],
  },
  {
    id: 'knowledge',
    title: 'Speaking about the Quran',
    intro: 'We are learners, and we speak like learners.',
    groups: [
      {
        items: [
          'When you quote an ayah or a hadith, give the reference. If you are not sure it is authentic, do not post it.',
          'Explain meanings from recognised works of tafseer and name the source. Personal reflection is welcome when it is offered as reflection.',
          'Do not give religious rulings. Point the question to a qualified scholar.',
          'Differences in recitation and in scholarly opinion are old and respected. Mention them without arguing them.',
        ],
      },
    ],
  },
  {
    id: 'circles',
    title: 'Inside a circle',
    groups: [
      {
        heading: 'Asking',
        items: [
          'Say which surah and ayah you mean and what you have tried. “I keep stopping at 2:255, the third line” gets a better answer than “help with Ayat al-Kursi”.',
        ],
      },
      {
        heading: 'Voice notes',
        items: [
          'Keep a recitation to one page or less, so that a listener can answer it the same day.',
          'A voice note sent to you for correction stays in the circle. Never forward someone’s recitation.',
        ],
      },
      {
        heading: 'Staying on topic',
        items: [
          'Each circle has one subject. Greetings, news and everything else belong in The Courtyard.',
          'Long conversations between two people move to a private chat, if both agree.',
        ],
      },
      {
        heading: 'Inviting others',
        items: ['Share the application page. Please do not ask a moderator to add someone directly.'],
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy and respect',
    groups: [
      {
        items: [
          'The Sisters’ Circle is for women only and is moderated by sisters.',
          'Do not share another member’s name, number, photo or recording outside the community.',
          'Children take part only alongside a parent or guardian who is a member.',
        ],
      },
    ],
  },
  {
    id: 'moderation',
    title: 'Moderation',
    intro:
      'Moderators may remove a message, pause a conversation, or remove a member who harms the circle. They apply these guidelines the same way to everyone. If something troubles you, write to a moderator directly instead of raising it in the group.',
    groups: [],
  },
];
