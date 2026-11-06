/**
 * LearnQuran Library — the book catalogue.
 *
 * Books come from IslamHouse.com (api3.islamhouse.com), a free Islamic library whose
 * materials may be read, downloaded and shared free of charge. Titles, authors, descriptions
 * and files are IslamHouse's own; this module only normalises them and sorts them into topics.
 */

export interface Lang { code: string; name: string; native: string; rtl?: boolean }

export const LANGS: Lang[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ur', name: 'Urdu', native: 'اردو', rtl: true },
  { code: 'ar', name: 'Arabic', native: 'العربية', rtl: true },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'id', name: 'Indonesian', native: 'Indonesia' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
];
export const langOf = (code: string) => LANGS.find(l => l.code === code) ?? LANGS[0];
export const isLang = (code: string | null | undefined): code is string => !!code && LANGS.some(l => l.code === code);

export type TopicId = 'quran' | 'prophet' | 'aqeedah' | 'salah' | 'fasting' | 'hajj' | 'dua' | 'hadith' | 'family' | 'newmuslim' | 'manners';

/**
 * Topic shelves. A book joins every topic whose words appear in its title (or, failing that,
 * its description). Words cover the catalogue's main languages; a book can be in no topic.
 */
export const TOPICS: { id: TopicId; title: string; icon: string; hue: number; words: string[] }[] = [
  { id: 'quran', title: 'The Quran', icon: 'menu_book', hue: 158,
    words: ['quran', 'qur’an', "qur'an", 'koran', 'tafsir', 'tafseer', 'surah', 'surat', 'tajweed', 'tajwid', 'القرآن', 'تفسير', 'سورة', 'تجويد', 'قرآن', 'سورہ', 'سورت', 'कुरआन', 'क़ुरआन', 'কুরআন', 'tafsir', 'kuran', 'coran'] },
  { id: 'prophet', title: 'The Prophet ﷺ', icon: 'auto_awesome', hue: 38,
    words: ['prophet', 'muhammad', 'seerah', 'sirah', 'messenger', 'النبي', 'الرسول', 'محمد', 'السيرة', 'نبی', 'رسول', 'سیرت', 'محمد', 'पैगंबर', 'मुहम्मद', 'নবী', 'মুহাম্মাদ', 'nabi', 'rasul', 'prophète', 'peygamber', 'siyer'] },
  { id: 'aqeedah', title: 'Belief & Tawhid', icon: 'brightness_7', hue: 205,
    words: ['tawhid', 'tawheed', 'aqeedah', 'aqidah', 'creed', 'belief', 'faith', 'iman', 'oneness', 'shirk', 'pillars', 'التوحيد', 'العقيدة', 'الإيمان', 'توحید', 'عقیدہ', 'ایمان', 'शिर्क', 'तौहीद', 'তাওহীদ', 'আকীদা', 'ঈমান', 'tauhid', 'akidah', 'akide', 'croyance', 'tevhid'] },
  { id: 'salah', title: 'Prayer & Purity', icon: 'mosque', hue: 175,
    words: ['prayer', 'salah', 'salat', 'wudu', 'ablution', 'purification', 'friday', 'jumu', 'khutba', 'الصلاة', 'الطهارة', 'الوضوء', 'الجمعة', 'نماز', 'وضو', 'طہارت', 'جمعہ', 'خطب', 'नमाज़', 'नमाज', 'সালাত', 'নামায', 'খুতবা', 'shalat', 'wudhu', 'prière', 'namaz', 'abdest'] },
  { id: 'fasting', title: 'Ramadan & Fasting', icon: 'nightlight', hue: 265,
    words: ['ramadan', 'ramadhan', 'fasting', 'fast ', 'siyam', 'taraweeh', 'tarawih', 'zakat', 'رمضان', 'الصيام', 'الصوم', 'الزكاة', 'روزہ', 'روزے', 'زکوٰۃ', 'रमज़ान', 'रोज़ा', 'রমযান', 'সিয়াম', 'যাকাত', 'puasa', 'jeûne', 'oruç'] },
  { id: 'hajj', title: 'Hajj & Umrah', icon: 'travel_explore', hue: 20,
    words: ['hajj', 'umrah', "`umrah", 'pilgrim', 'udhiyah', 'sacrific', 'dhul-hijjah', 'الحج', 'العمرة', 'الأضحية', 'حج', 'عمرہ', 'قربانی', 'हज', 'উমরা', 'হজ্জ', 'haji', 'umroh', 'pèlerinage', 'hac', 'umre', 'kurban'] },
  { id: 'dua', title: 'Dua & Dhikr', icon: 'volunteer_activism', hue: 140,
    words: ['dua', "du'a", 'du`a', 'supplication', 'dhikr', 'adhkar', 'remembrance', 'ruqyah', 'hisn', 'fortress of the muslim', 'الدعاء', 'الأذكار', 'حصن المسلم', 'دعا', 'اذکار', 'ذکر', 'حصن', 'दुआ', 'ज़िक्र', 'দোআ', 'যিকির', 'doa', 'zikir', 'dzikir', 'invocation', 'dua'] },
  { id: 'hadith', title: 'Hadith', icon: 'history_edu', hue: 52,
    words: ['hadith', 'hadeeth', 'sunnah', 'bukhari', 'muslim’s', 'nawawi', 'forty', '40 ', 'الحديث', 'الأربعين', 'السنة', 'حدیث', 'احادیث', 'سنت', 'हदीस', 'হাদীস', 'সুন্নাহ', 'hadis', 'sünnet'] },
  { id: 'family', title: 'Family & Women', icon: 'family_restroom', hue: 330,
    words: ['women', 'woman', 'wife', 'husband', 'marriage', 'family', 'children', 'parents', 'hijab', 'bleeding', 'المرأة', 'الزواج', 'الأسرة', 'الأولاد', 'عورت', 'خواتین', 'نکاح', 'شادی', 'والدین', 'औरत', 'महिला', 'विवाह', 'নারী', 'বিবাহ', 'wanita', 'pernikahan', 'femme', 'mariage', 'kadın', 'evlilik'] },
  { id: 'newmuslim', title: 'Discover Islam', icon: 'explore', hue: 190,
    words: ['what is islam', 'introduction to islam', 'new muslim', 'convert', 'religion of', 'who created', 'message of islam', 'islam is', 'guide to islam', 'pocket guide', 'tweets', 'ما هو الإسلام', 'المسلم الجديد', 'نو مسلم', 'اسلام کیا', 'इस्लाम क्या', 'ইসলাম কী', 'mengenal islam', "qu'est-ce que l'islam", 'islam nedir'] },
  { id: 'manners', title: 'Character & Heart', icon: 'favorite', hue: 350,
    words: ['manners', 'morals', 'morality', 'character', 'etiquette', 'heart', 'patience', 'repentance', 'sins', 'good deeds', 'الأخلاق', 'الآداب', 'القلب', 'التوبة', 'اخلاق', 'آداب', 'توبہ', 'دل', 'अख़लाक़', 'চরিত্র', 'আদব', 'tawbah', 'akhlak', 'adab', 'ahlak'] },
];
export const topicOf = (id: string) => TOPICS.find(t => t.id === id);

export interface BookFile {
  url: string;
  /** PDF, DOCX, EPUB … */
  type: string;
  size: string;
  bytes: number;
  label: string;
}

export interface Book {
  id: number;
  title: string;
  authors: string[];
  translators: string[];
  publisher: string | null;
  lang: string;
  cover: string | null;
  description: string;
  files: BookFile[];
  importance: 'critical' | 'high' | 'normal' | 'low';
  /** ms since epoch */
  added: number;
  topics: TopicId[];
}

export interface BookDetail extends Book {
  fullDescription: string;
  hits: number | null;
  /** other languages this book exists in */
  locales: string[];
}

export interface BooksResponse { lang: string; books: Book[]; fetchedAt: string; stale?: boolean }

// ---------- normalising IslamHouse items ----------

interface RawPerson { title?: string; kind?: string }
interface RawFile { url?: string; extension_type?: string; size?: string; description?: string }
export interface RawItem {
  id?: number; title?: string; description?: string | null; full_description?: string | null;
  image?: string | null; importance_level?: string; add_date?: number; hits?: number;
  prepared_by?: RawPerson[]; attachments?: RawFile[]; locales?: string[];
}

const clean = (s: string | null | undefined) =>
  (s ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').replace(/\s*\r?\n\s*/g, '\n').trim();

export function sizeToBytes(size: string) {
  const m = size.match(/([\d.]+)\s*(B|KB|MB|GB)/i);
  if (!m) return 0;
  return Math.round(Number(m[1]) * { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 }[m[2].toLowerCase() as 'b']);
}

const HTTPS_FILE = /^https:\/\/[\w.-]*islamhouse\.com\//i;

export function topicsFor(title: string, description = ''): TopicId[] {
  const t = ` ${title.toLowerCase()} `;
  const hits = TOPICS.filter(tp => tp.words.some(w => t.includes(w))).map(tp => tp.id);
  if (hits.length) return hits;
  const d = ` ${description.toLowerCase().slice(0, 400)} `;
  return TOPICS.filter(tp => tp.words.some(w => w.length > 3 && d.includes(w))).map(tp => tp.id).slice(0, 2);
}

export function normalize(raw: RawItem, lang: string): Book | null {
  const title = clean(raw.title).replace(/\n/g, ' ');
  if (typeof raw.id !== 'number' || !title) return null;
  const files = (raw.attachments ?? []).flatMap(a => {
    const type = (a.extension_type ?? '').toUpperCase();
    if (!a.url || !HTTPS_FILE.test(a.url) || type === 'LINK') return [];
    const size = a.size ?? '';
    return [{ url: a.url, type, size, bytes: sizeToBytes(size), label: clean(a.description).replace(/\n/g, ' ') || title }];
  });
  if (!files.length) return null;
  const people = raw.prepared_by ?? [];
  const names = (kind: string) => people.filter(p => p.kind === kind && p.title).map(p => clean(p.title).replace(/\n/g, ' '));
  const description = clean(raw.description);
  const importance = (['critical', 'high', 'normal', 'low'] as const).find(i => i === raw.importance_level) ?? 'normal';
  return {
    id: raw.id,
    title,
    authors: names('author'),
    translators: names('translator'),
    publisher: names('publisher')[0] ?? null,
    lang,
    cover: raw.image && /^https:\/\//.test(raw.image) ? raw.image : null,
    description,
    files,
    importance,
    added: (raw.add_date ?? 0) * 1000,
    topics: topicsFor(title, description),
  };
}

export function normalizeDetail(raw: RawItem, lang: string): BookDetail | null {
  const book = normalize(raw, lang);
  if (!book) return null;
  return {
    ...book,
    fullDescription: clean(raw.full_description),
    hits: typeof raw.hits === 'number' ? raw.hits : null,
    locales: (raw.locales ?? []).filter(isLang),
  };
}

// ---------- helpers ----------

/** the file to open in the reader: the first PDF */
export const readable = (b: Book) => b.files.find(f => f.type === 'PDF') ?? null;

/** the file URL served through LearnQuran (same origin, so the reader can load it in ranges) */
export const fileUrl = (f: BookFile, download = false, name = '') =>
  `/api/books/file?u=${encodeURIComponent(f.url)}${download ? `&dl=1&name=${encodeURIComponent(name)}` : ''}`;

export const byline = (b: Book) => b.authors.join(', ') || b.publisher || 'IslamHouse';

export const RANK = { critical: 0, high: 1, normal: 2, low: 3 } as const;

export function searchBooks(books: Book[], query: string): Book[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return books
    .map(b => {
      const title = b.title.toLowerCase();
      const rest = `${b.authors.join(' ')} ${b.translators.join(' ')} ${b.description}`.toLowerCase();
      if (!words.every(w => title.includes(w) || rest.includes(w))) return null;
      return { b, score: words.filter(w => title.includes(w)).length * 2 + (title.startsWith(words[0]) ? 1 : 0) };
    })
    .filter((x): x is { b: Book; score: number } => !!x)
    .sort((a, z) => z.score - a.score || RANK[a.b.importance] - RANK[z.b.importance])
    .map(x => x.b);
}
