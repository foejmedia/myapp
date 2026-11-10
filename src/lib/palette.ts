/**
 * Colour themes for the whole app. Each palette fixes the light/dark mode and supplies a set of
 * --pal-* variables (see src/styles/palettes.css) that the shared design system and the main pages read.
 */
export type PaletteId = 'white' | 'black' | 'green' | 'ocean' | 'sand' | 'indigo' | 'kailani' | 'teal';

export type Palette = {
  id: PaletteId;
  name: string;
  mode: 'light' | 'dark';
  /** swatch preview: page background and accent */
  bg: string;
  accent: string;
  /** browser toolbar colour on phones */
  meta: string;
};

export const PALETTES: Palette[] = [
  { id: 'white', name: 'White', mode: 'light', bg: '#ffffff', accent: '#16a34a', meta: '#ffffff' },
  { id: 'black', name: 'Black', mode: 'dark', bg: '#0a0a0a', accent: '#22c55e', meta: '#0a0a0a' },
  { id: 'green', name: 'Green', mode: 'light', bg: '#eaf6ef', accent: '#0f7a52', meta: '#eaf6ef' },
  { id: 'ocean', name: 'Ocean', mode: 'dark', bg: '#0b1424', accent: '#38bdf8', meta: '#0b1424' },
  { id: 'sand', name: 'Sand', mode: 'light', bg: '#f5ecdc', accent: '#a85a18', meta: '#f5ecdc' },
  // Japanese Indigo #293E40 (Pantone 7546 C) with Kailani #81B5A1 (557 C) as its accent
  { id: 'indigo', name: 'Indigo', mode: 'dark', bg: '#293E40', accent: '#81B5A1', meta: '#293E40' },
  // Kailani #81B5A1 (Pantone 557 C), light, with Japanese Indigo for buttons and text
  { id: 'kailani', name: 'Kailani', mode: 'light', bg: '#81B5A1', accent: '#293E40', meta: '#e3efea' },
  // deep teal with an amber/gold accent (tasbih-app style)
  { id: 'teal', name: 'Teal', mode: 'dark', bg: '#0E3536', accent: '#F5A83B', meta: '#0E3536' },
];

export const PALETTE_KEY = 'quran-learn-palette';

export const paletteById = (id: string | null | undefined) => PALETTES.find(p => p.id === id) ?? null;
