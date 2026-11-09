import type { Kind } from '../lib/items';
import { IconDua, IconSurah, IconWord } from './Icons';

export function KindIcon({ kind, className }: { kind: Kind; className?: string }) {
  return kind === 'v' ? <IconWord className={className} /> : kind === 'd' ? <IconDua className={className} /> : <IconSurah className={className} />;
}
