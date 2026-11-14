import { describe, expect, it } from 'vitest';
import { emptyProgress, lessonPct, markHeard, migrate, resetLesson, setDone, summary } from '../progress';

const lessons = [
  { id: 1, title: 'Alphabet', total: 3 },
  { id: 2, title: 'Joint letters', total: 2 },
];

describe('qaida progress', () => {
  it('counts heard items once and auto-completes a lesson', () => {
    let p = emptyProgress();
    p = markHeard(p, 1, 'a', 3, '2026-11-14');
    const same = markHeard(p, 1, 'a', 3, '2026-11-14');
    expect(same).toBe(p);
    p = markHeard(p, 1, 'b', 3, '2026-11-15');
    expect(p.done['1']).toBeUndefined();
    p = markHeard(p, 1, 'c', 3, '2026-11-15');
    expect(p.done['1']).toBe('2026-11-15');
    expect(lessonPct(p, lessons[0])).toBe(1);
  });

  it('summarises progress, streak and next lesson', () => {
    let p = emptyProgress();
    p = markHeard(p, 1, 'a', 3, '2026-11-14');
    p = setDone(p, 1, true, '2026-11-15');
    const s = summary(p, lessons, '2026-11-15');
    expect(s.completed).toBe(1);
    expect(s.practised).toBe(3);
    expect(s.streak).toBe(2);
    expect(s.next?.id).toBe(2);
    expect(s.week).toHaveLength(7);
  });

  it('resets a lesson and survives bad stored data', () => {
    let p = setDone(emptyProgress(), 2, true, '2026-11-15');
    p = resetLesson(p, 2);
    expect(p.done['2']).toBeUndefined();
    expect(migrate({ v: 9 }).heard).toEqual({});
    const m = migrate({ v: 1, heard: { '1': ['a', 'a', 3] }, done: { x: '2026-01-01' }, activity: { bad: 2 } });
    expect(m.heard['1']).toEqual(['a']);
    expect(m.done).toEqual({});
    expect(m.activity).toEqual({});
  });
});
