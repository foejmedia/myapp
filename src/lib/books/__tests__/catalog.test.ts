import { describe, expect, it } from 'vitest';
import { fileUrl, normalize, normalizeDetail, readable, searchBooks, sizeToBytes, topicsFor, type Book, type RawItem } from '../catalog';

const raw: RawItem = {
  id: 2846907,
  title: 'Hisn Al-Muslim  (Fortress of the Muslim) Supplications from the Qur’an and Sunnah',
  description: 'Supplications\r\nfrom the <b>Quran</b> &nbsp;and Sunnah',
  image: 'https://d1.islamhouse.com/data/en/ih_books/single/covers/risala.png',
  importance_level: 'critical',
  add_date: 1792419398,
  prepared_by: [
    { title: 'Saeed Bin Ali Bin Wahf Al-Qahtani', kind: 'author' },
    { title: 'Message of The Two Holy Mosques', kind: 'publisher' },
  ],
  attachments: [
    { url: 'https://d1.islamhouse.com/data/en/ih_books/single/risala_en_hisnulmuslim.pdf', extension_type: 'PDF', size: '2.21 MB', description: 'Hisn Al-Muslim' },
    { url: 'https://example.com/elsewhere.pdf', extension_type: 'PDF', size: '1 MB' },
    { url: 'https://islamhouse.com/x', extension_type: 'LINK', size: '' },
  ],
};

describe('normalising IslamHouse items', () => {
  const b = normalize(raw, 'en')!;

  it('keeps the bibliographic fields', () => {
    expect(b).toMatchObject({
      id: 2846907, lang: 'en', importance: 'critical', publisher: 'Message of The Two Holy Mosques',
      authors: ['Saeed Bin Ali Bin Wahf Al-Qahtani'], added: 1792419398000,
    });
    expect(b.title).toBe('Hisn Al-Muslim (Fortress of the Muslim) Supplications from the Qur’an and Sunnah');
    expect(b.description).toBe('Supplications\nfrom the Quran and Sunnah');
  });

  it('only keeps files hosted by IslamHouse, and never bare links', () => {
    expect(b.files).toHaveLength(1);
    expect(b.files[0]).toMatchObject({ type: 'PDF', size: '2.21 MB', bytes: Math.round(2.21 * 1024 ** 2) });
    expect(readable(b)?.url).toContain('hisnulmuslim.pdf');
  });

  it('drops items without an id, title or file', () => {
    expect(normalize({ ...raw, id: undefined }, 'en')).toBeNull();
    expect(normalize({ ...raw, title: '  ' }, 'en')).toBeNull();
    expect(normalize({ ...raw, attachments: [] }, 'en')).toBeNull();
  });

  it('reads detail fields and keeps only known languages', () => {
    const d = normalizeDetail({ ...raw, full_description: 'Long text', hits: 828, locales: ['en', 'ar', 'xx'] }, 'en')!;
    expect(d).toMatchObject({ fullDescription: 'Long text', hits: 828, locales: ['en', 'ar'] });
  });
});

describe('topics', () => {
  it('sorts books by their titles, in several languages', () => {
    expect(topicsFor('Hisn Al-Muslim (Fortress of the Muslim) Supplications')).toContain('dua');
    expect(topicsFor('How to do`Umrah')).toEqual(['hajj']);
    expect(topicsFor('The Life of Prophet Muhammad PBUH')).toContain('prophet');
    expect(topicsFor('نماز کا طریقہ')).toContain('salah');
    expect(topicsFor('رمضان المبارک کے احکام')).toContain('fasting');
  });

  it('falls back to the description, and can be empty', () => {
    expect(topicsFor('A short treatise', 'Rulings on the fasting of Ramadan')).toContain('fasting');
    expect(topicsFor('War on the Truth', '')).toEqual([]);
  });
});

describe('helpers', () => {
  it('parses sizes', () => {
    expect(sizeToBytes('512 KB')).toBe(524288);
    expect(sizeToBytes('1.5 GB')).toBe(Math.round(1.5 * 1024 ** 3));
    expect(sizeToBytes('')).toBe(0);
  });

  it('serves files through the same-origin route', () => {
    const f = { url: 'https://d1.islamhouse.com/a b.pdf', type: 'PDF', size: '', bytes: 0, label: '' };
    expect(fileUrl(f)).toBe('/api/books/file?u=https%3A%2F%2Fd1.islamhouse.com%2Fa%20b.pdf');
    expect(fileUrl(f, true, 'Hisn')).toContain('&dl=1&name=Hisn');
  });

  it('searches titles first, then authors and descriptions', () => {
    const mk = (id: number, title: string, authors: string[] = [], description = ''): Book =>
      ({ ...normalize(raw, 'en')!, id, title, authors, description, importance: 'normal' });
    const books = [mk(1, 'Rulings of Prayer', [], 'about salah'), mk(2, 'Fortress', ['Al-Qahtani'], 'prayer and dhikr'), mk(3, 'Hajj guide')];
    expect(searchBooks(books, 'prayer').map(b => b.id)).toEqual([1, 2]);
    expect(searchBooks(books, 'qahtani').map(b => b.id)).toEqual([2]);
    expect(searchBooks(books, '  ')).toEqual([]);
  });
});
