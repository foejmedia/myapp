import { describe, expect, it } from 'vitest';
import { classifyMp3Quran, cleanName, fromMp3Quran, fromRadioBrowser, isQuranStation, mergeStations, type RbStation } from '../live';

const rb = (over: Partial<RbStation>): RbStation => ({
  stationuuid: Math.random().toString(36).slice(2), name: 'Quran Radio', url_resolved: 'https://example.org/stream',
  homepage: '', favicon: '', tags: 'quran', country: 'Kuwait', countrycode: 'KW', codec: 'MP3', bitrate: 64,
  votes: 0, clickcount: 0, lastcheckok: 1, ...over,
});

describe('MP3Quran channels', () => {
  it.each([
    ['Radio Ibrahim Al-Akdar', 'recitation'],
    ['-Beautiful Recitations-', 'recitation'],
    ['Sharia ruqyah', 'recitation'],
    ['Quran translation into Turkish', 'translation'],
    ['Quran in Urdu - Qari Muhammad Manshawi', 'translation'],
    ['--Quran Tafseer--', 'tafsir'],
    ['A summary of the interpretation of the Holy Quran', 'tafsir'],
  ])('%s → %s', (name, cat) => expect(classifyMp3Quran(name)).toBe(cat));

  it.each([
    'General Fatwa Radio', 'Eid Takbeer', 'Words of remembrance for morning', 'The Abridged Biography of the Prophet',
    "Stories from the lives of the SAHABAH and TABE'EEN, may ALLAH be pleased with them",
    'The book of jurisprudential choices in matters of worship and transactions',
  ])('leaves out non-Quran channel: %s', name => expect(classifyMp3Quran(name)).toBeNull());

  it('cleans names and pairs the Arabic name', () => {
    expect(cleanName('Radio Shaik Abu Bakr Al Shatri')).toBe('Shaik Abu Bakr Al Shatri');
    expect(cleanName('---Amazing short Recitations---')).toBe('Amazing short Recitations');
    expect(cleanName('Abdullah Al-Mousa - Radio')).toBe('Abdullah Al-Mousa');
    const [s] = fromMp3Quran(
      [{ id: 2, name: 'Radio Shaik Abu Bakr Al Shatri', url: 'https://backup.qurango.net/radio/shaik_abu_bakr_al_shatri' }],
      [{ id: 2, name: 'شيخ أبو بكر الشاطري', url: '' }],
    );
    expect(s).toMatchObject({ id: 'mq-2', name: 'Shaik Abu Bakr Al Shatri', nameAr: 'شيخ أبو بكر الشاطري', category: 'recitation' });
  });

  it('drops http streams, which an https page cannot play', () => {
    expect(fromMp3Quran([{ id: 1, name: 'Radio X', url: 'http://example.org/x' }], [])).toEqual([]);
  });
});

describe('Radio Browser stations', () => {
  it('keeps stations named for the Quran or a reciter', () => {
    expect(isQuranStation({ name: 'إذاعة القرآن الكريم (مكة المكرمة)', tags: '' })).toBe(true);
    expect(isQuranStation({ name: 'Mp3Quran Main', tags: 'quran' })).toBe(true);
    expect(isQuranStation({ name: 'OmniRadio - Sheikh Abdulbasit Abdulsamad', tags: 'arabic,islam,quran,reciter' })).toBe(true);
  });

  it('leaves out general stations that merely carry a quran tag', () => {
    expect(isQuranStation({ name: 'Hayat FM', tags: 'jordan,national,news,quran,talk' })).toBe(false);
    expect(isQuranStation({ name: 'Iran Radio English', tags: 'iranian music,islam,islamic music,quran' })).toBe(false);
    expect(isQuranStation({ name: 'Al-Adab Al-Mufrad', tags: 'arabic,hadith,islam,quran' })).toBe(false);
  });

  it('only keeps working https streams and https artwork', () => {
    const out = fromRadioBrowser([
      rb({ name: 'Quran A', favicon: 'http://x/icon.png' }),
      rb({ name: 'Quran B', url_resolved: 'http://example.org/b' }),
      rb({ name: 'Quran C', lastcheckok: 0 }),
    ]);
    expect(out.map(s => s.name)).toEqual(['Quran A']);
    expect(out[0].image).toBeNull();
  });
});

describe('merging', () => {
  it('prefers MP3Quran over directory copies of the same stream', () => {
    const mq = fromMp3Quran([{ id: 108, name: '-Main Radio-', url: 'https://backup.qurango.net/radio/mix' }], []);
    const dir = fromRadioBrowser([rb({ name: 'Mp3Quran Main', url_resolved: 'https://qurango.net/radio/mix' })]);
    const merged = mergeStations(mq, dir);
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe('MP3Quran');
  });

  it('keeps the most popular of several same-named directory entries', () => {
    const dir = fromRadioBrowser([
      rb({ name: 'OmniRadio - Sheikh Ammar Al-Mulla', tags: 'reciter', url_resolved: 'https://a.example/1', clickcount: 2 }),
      rb({ name: 'OmniRadio - Sheikh Ammar Al-Mulla', tags: 'reciter', url_resolved: 'https://a.example/2', clickcount: 9 }),
    ]);
    const merged = mergeStations([], dir);
    expect(merged).toHaveLength(1);
    expect(merged[0].streamUrl).toBe('https://a.example/2');
  });
});
