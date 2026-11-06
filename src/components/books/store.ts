/**
 * The reader's own shelf, kept in this browser: saved books and where they stopped reading.
 * A snapshot of each book is stored with it so the shelf works before the catalogue loads.
 */
import type { Book } from '@/lib/books/catalog';

const SAVED = 'library-saved';
const PROGRESS = 'library-progress';
const MAX = 80;

export interface Progress { page: number; pages: number; at: number; book: Book }
export const key = (b: Pick<Book, 'id' | 'lang'>) => `${b.lang}:${b.id}`;

function read<T>(k: string): Record<string, T> {
  try { return JSON.parse(localStorage.getItem(k) ?? '{}') ?? {}; } catch { return {}; }
}
function write<T>(k: string, v: Record<string, T>) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ }
  window.dispatchEvent(new Event('library-change'));
}
const newest = <T extends { at: number }>(r: Record<string, T>) => Object.values(r).sort((a, z) => z.at - a.at);
function trim<T extends { at: number }>(r: Record<string, T>) {
  const keep = new Set(Object.entries(r).sort(([, a], [, z]) => z.at - a.at).slice(0, MAX).map(([k]) => k));
  return Object.fromEntries(Object.entries(r).filter(([k]) => keep.has(k)));
}

/** slim copy for storage — descriptions can be long */
const slim = (b: Book): Book => ({ ...b, description: b.description.slice(0, 280) });

export const savedBooks = () => newest(read<{ at: number; book: Book }>(SAVED)).map(s => s.book);
export const isSaved = (b: Book) => key(b) in read(SAVED);
export function toggleSaved(b: Book) {
  const all = read<{ at: number; book: Book }>(SAVED);
  if (all[key(b)]) delete all[key(b)]; else all[key(b)] = { at: Date.now(), book: slim(b) };
  write(SAVED, trim(all));
  return !!all[key(b)];
}

export const progressList = () => newest(read<Progress>(PROGRESS));
export const progressOf = (b: Pick<Book, 'id' | 'lang'>) => read<Progress>(PROGRESS)[key(b)] ?? null;
export function saveProgress(b: Book, page: number, pages: number) {
  const all = read<Progress>(PROGRESS);
  all[key(b)] = { page, pages, at: Date.now(), book: slim(b) };
  write(PROGRESS, trim(all));
}
export function forgetProgress(b: Pick<Book, 'id' | 'lang'>) {
  const all = read<Progress>(PROGRESS);
  delete all[key(b)];
  write(PROGRESS, all);
}

const PREFS = 'library-prefs';
export interface Prefs { lang: string; paper: 'light' | 'sepia' | 'dark' }
export function readPrefs(): Prefs {
  try { return { lang: 'en', paper: 'light', ...JSON.parse(localStorage.getItem(PREFS) ?? '{}') }; } catch { return { lang: 'en', paper: 'light' }; }
}
export function savePrefs(p: Partial<Prefs>) {
  try { localStorage.setItem(PREFS, JSON.stringify({ ...readPrefs(), ...p })); } catch { /* ignore */ }
}
