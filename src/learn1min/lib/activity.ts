/** "Recent activity" for the dashboard, built only from what the learner actually did. */
import type { UserData } from '../store/model';
import { keyToDate } from './dates';
import { describe, kindOf, KIND_LABEL } from './items';

export type ActivityKind = 'lesson' | 'quiz' | 'saved' | 'note' | 'learned';

export type Activity = {
  kind: ActivityKind;
  title: string;
  detail: string;
  /** ISO time when known exactly; otherwise local noon of the day */
  at: string;
  /** true when only the day is known (lessons, "learned" marks) */
  dayOnly: boolean;
  href?: string;
};

const QUIZ_LABEL: Record<string, string> = {
  daily: 'Daily challenge', quick: 'Quick review', meaning: 'Multiple choice', reverse: 'English → Arabic',
  gap: 'Fill the missing word', match: 'Match pairs', mixed: 'Mixed practice',
};

export function recentActivity(d: UserData, limit = 6): Activity[] {
  const out: Activity[] = [];
  const noon = (day: string) => keyToDate(day).toISOString();

  for (const [day, id] of Object.entries(d.learned)) {
    const info = describe(id);
    out.push({
      kind: 'lesson',
      title: info ? `Daily lesson: ${info.title}` : 'Daily lesson completed',
      detail: info ? `${KIND_LABEL[kindOf(id)]} · ${info.subtitle}` : 'From an earlier version of the app',
      at: noon(day), dayOnly: true, href: info?.href,
    });
  }
  for (const [id, day] of Object.entries(d.known)) {
    if (Object.values(d.learned).includes(id)) continue; // already listed as a lesson
    const info = describe(id);
    if (info) out.push({ kind: 'learned', title: `Learned ${info.title}`, detail: KIND_LABEL[kindOf(id)], at: noon(day), dayOnly: true, href: info.href });
  }
  for (const r of d.quiz.history) {
    out.push({ kind: 'quiz', title: QUIZ_LABEL[r.mode] ?? 'Quiz', detail: `Scored ${r.score} of ${r.total}`, at: r.at, dayOnly: false, href: '/learn-1-min/quiz' });
  }
  for (const [id, at] of Object.entries(d.saved)) {
    const info = describe(id);
    if (info) out.push({ kind: 'saved', title: `Saved ${info.title}`, detail: `${KIND_LABEL[kindOf(id)]} · notebook`, at, dayOnly: false, href: info.href });
  }
  for (const [id, n] of Object.entries(d.notes)) {
    const info = describe(id);
    if (info) out.push({ kind: 'note', title: `Note on ${info.title}`, detail: n.text, at: n.updatedAt, dayOnly: false, href: info.href });
  }
  return out
    .filter(a => !Number.isNaN(Date.parse(a.at)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit);
}

/** "5 minutes ago", "3 hours ago", "Today", "Yesterday", "8 Nov". */
export function relativeTime(a: Pick<Activity, 'at' | 'dayOnly'>, now: Date): string {
  const t = new Date(a.at);
  const sameDay = (x: Date, y: Date) => x.toDateString() === y.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (!a.dayOnly && sameDay(t, now)) {
    const mins = Math.max(0, Math.round((now.getTime() - t.getTime()) / 60000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
    const h = Math.round(mins / 60);
    return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  }
  if (sameDay(t, now)) return 'Today';
  if (sameDay(t, yesterday)) return 'Yesterday';
  return t.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
