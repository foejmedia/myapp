import { CUSTOM_ID } from './tasbih';
import { buildPalm, buildTree, type Tree } from './tasbih-tree';

/** Every dhikr grows its own kind of tree. */
export interface Species {
  name: string;
  /** three leaf shades */
  leaves: [string, string, string];
  blossom: string;
  centre: string;
  shape: 'tree' | 'palm';
  seed: number;
}

const GREEN: [string, string, string] = ['#4cb86a', '#2f9e55', '#86d494'];

export const SPECIES: Record<string, Species> = {
  subhanallah: { name: 'Cherry tree', leaves: GREEN, blossom: '#f7b8c8', centre: '#e8a23a', shape: 'tree', seed: 3 },
  subhanallahibihamdihi: { name: 'Date palm', leaves: ['#3fae5f', '#25904a', '#6cc580'], blossom: '#d9822b', centre: '#a85a14', shape: 'palm', seed: 5 },
  alhamdulillah: { name: 'Orange tree', leaves: ['#3fb26a', '#21914f', '#7bd394'], blossom: '#ffffff', centre: '#f59e0b', shape: 'tree', seed: 11 },
  allahuakbar: { name: 'Olive tree', leaves: ['#7fb48a', '#5f9a6d', '#a3cdaa'], blossom: '#f4f1d6', centre: '#9bb04a', shape: 'tree', seed: 42 },
  astaghfirullah: { name: 'Jasmine tree', leaves: ['#46b46c', '#2a9a53', '#83d59b'], blossom: '#ffffff', centre: '#f6c945', shape: 'tree', seed: 21 },
  tahleel: { name: 'Lemon tree', leaves: ['#43b25c', '#2a9446', '#80d28c'], blossom: '#ffe066', centre: '#e0a800', shape: 'tree', seed: 8 },
  salawat: { name: 'Rose tree', leaves: ['#41ad60', '#268f49', '#7ccd8f'], blossom: '#f06a8a', centre: '#f8d36b', shape: 'tree', seed: 17 },
  hawqala: { name: 'Lavender tree', leaves: ['#55b77a', '#37995e', '#90d4a6'], blossom: '#b39ce8', centre: '#f1d27a', shape: 'tree', seed: 29 },
  [CUSTOM_ID]: { name: 'Green tree', leaves: GREEN, blossom: '#c8ecb4', centre: '#79b955', shape: 'tree', seed: 13 },
};

export const speciesOf = (id: string): Species => SPECIES[id] ?? SPECIES[CUSTOM_ID];

const cache = new Map<string, Tree>();
/** The tree geometry for a species (built once, then cached). */
export function treeOf(sp: Species): Tree {
  const key = `${sp.shape}:${sp.seed}`;
  let t = cache.get(key);
  if (!t) {
    t = sp.shape === 'palm' ? buildPalm(sp.seed) : buildTree(sp.seed);
    cache.set(key, t);
  }
  return t;
}
