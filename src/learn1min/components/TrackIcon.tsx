import type { Track } from '../lib/lessons';
import { IconDua, IconSurah, IconWord } from './Icons';

export function TrackIcon({ track, className }: { track: Track; className?: string }) {
  return track === 'word' ? <IconWord className={className} /> : track === 'dua' ? <IconDua className={className} /> : <IconSurah className={className} />;
}
