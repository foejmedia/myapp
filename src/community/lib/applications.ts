import { WHATSAPP_NUMBER } from '../config';
import { CIRCLES } from '../data/circles';

/**
 * Applications to join.
 *
 * There is no backend yet. An application is kept in this browser (so the applicant sees its
 * status when they come back) and is delivered as a pre-filled WhatsApp message.
 *
 * To connect a backend: implement `ApplicationRepository` against your API and export it as
 * `applications` below. The join form and the members page only use this interface.
 */

export const LEVELS = [
  'I am learning to read Arabic',
  'I can read, slowly',
  'I read fluently and want to improve my tajweed',
  'I am memorising',
  'I have memorised the Quran, or I teach it',
] as const;

export interface Application {
  name: string;
  whatsapp: string;
  city: string;
  /** decides whether the Sisters’ Circle can be offered */
  iAm: 'brother' | 'sister' | '';
  level: string;
  /** circle ids, up to three */
  circles: string[];
  reason: string;
  referredBy: string;
  /** ISO time the applicant pressed send */
  sentAt?: string;
}

export const EMPTY: Application = { name: '', whatsapp: '', city: '', iAm: '', level: '', circles: [], reason: '', referredBy: '' };

export interface ApplicationRepository {
  load(): Application | null;
  save(application: Application): void;
  clear(): void;
}

const KEY = 'lq-community:application:v1';

const local: ApplicationRepository = {
  load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const a = JSON.parse(raw);
      return a && typeof a === 'object' && typeof a.name === 'string' ? { ...EMPTY, ...a } : null;
    } catch {
      return null;
    }
  },
  save(application) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(application));
    } catch {
      /* private window or storage full: the WhatsApp message still carries the application */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

export const applications: ApplicationRepository = local;

export type Errors = Partial<Record<keyof Application | 'agree', string>>;

export function validate(a: Application, agreed: boolean): Errors {
  const e: Errors = {};
  if (a.name.trim().length < 2) e.name = 'Please enter your full name.';
  const digits = a.whatsapp.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) e.whatsapp = 'Enter your number with its country code, for example +91 98765 43210.';
  if (a.city.trim().length < 2) e.city = 'Please tell us your city and country.';
  if (!a.iAm) e.iAm = 'Please choose one.';
  if (!a.level) e.level = 'Please choose the one closest to you.';
  if (a.circles.length === 0) e.circles = 'Choose at least one circle.';
  if (a.reason.trim().length < 20) e.reason = 'A sentence or two is enough, but please tell us a little more.';
  if (!agreed) e.agree = 'Please read and accept the guidelines.';
  return e;
}

/** The application as the WhatsApp message the team receives */
export function asMessage(a: Application): string {
  const names = a.circles.map(id => CIRCLES.find(c => c.id === id)?.name ?? id).join(', ');
  return [
    'Assalamu alaikum. I would like to join the Learn Quran community.',
    '',
    `Name: ${a.name.trim()}`,
    `WhatsApp: ${a.whatsapp.trim()}`,
    `City: ${a.city.trim()}`,
    `I am a: ${a.iAm}`,
    `Where I am with the Quran: ${a.level}`,
    `Circles: ${names}`,
    `Why I want to join: ${a.reason.trim()}`,
    a.referredBy.trim() ? `Referred by: ${a.referredBy.trim()}` : '',
  ]
    .filter((line, i) => line !== '' || i === 1)
    .join('\n');
}

export const whatsappUrl = (a: Application) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(asMessage(a))}`;
