import { describe, expect, it } from 'vitest';
import demo from '../demo-content.json';
import type { Content } from '../content';
import { buildSession } from '../engine';
import {
  MASTERED_STREAK, dayKey, emptyProgress, parseProgress, recordAnswer, recordSession, revisionQueue, suggestLevel, weakModes,
  type Progress,
} from '../progress';

const qs = buildSession(demo as unknown as Content, { modes: ['complete', 'translation'], level: 'beginner', count: 6, seed: 'p' });

describe('progress tracking', () => {
  it('counts answers overall, per category and per level', () => {
    let p = emptyProgress();
    p = recordAnswer(p, qs[0], true);
    p = recordAnswer(p, qs[1], false);
    expect(p.total).toEqual({ answered: 2, correct: 1 });
    expect(p.byMode[qs[0].mode]).toEqual({ answered: 1, correct: 1 });
    expect(p.byMode[qs[1].mode]).toEqual({ answered: 1, correct: 0 });
    expect(p.byLevel.beginner).toEqual({ answered: 2, correct: 1 });
  });

  it('does not mutate the previous state', () => {
    const p = emptyProgress();
    recordAnswer(p, qs[0], false);
    expect(p.total.answered).toBe(0);
    expect(p.revision).toEqual({});
  });

  it('missed questions go to revision and leave after enough correct answers in a row', () => {
    let p = recordAnswer(emptyProgress(), qs[0], false);
    expect(revisionQueue(p, 10).map(q => q.id)).toEqual([qs[0].id]);
    for (let i = 0; i < MASTERED_STREAK - 1; i++) p = recordAnswer(p, qs[0], true);
    expect(p.revision[qs[0].id]).toBeDefined();
    p = recordAnswer(p, qs[0], true);
    expect(p.revision[qs[0].id]).toBeUndefined();
  });

  it('a miss resets the streak', () => {
    let p = recordAnswer(emptyProgress(), qs[0], false);
    p = recordAnswer(p, qs[0], true);
    p = recordAnswer(p, qs[0], false);
    expect(p.revision[qs[0].id]).toMatchObject({ misses: 2, streak: 0 });
  });

  it('revision lists the most-missed first', () => {
    let p = recordAnswer(emptyProgress(), qs[0], false, 1);
    p = recordAnswer(p, qs[1], false, 2);
    p = recordAnswer(p, qs[1], false, 3);
    expect(revisionQueue(p, 10).map(q => q.id)).toEqual([qs[1].id, qs[0].id]);
    expect(revisionQueue(p, 1)).toHaveLength(1);
  });

  it('keeps the first daily-challenge result of each day', () => {
    const at = new Date(2026, 9, 29, 9).getTime();
    let p = recordSession(emptyProgress(), { at, kind: 'daily', level: 'beginner', total: 5, correct: 3 });
    p = recordSession(p, { at: at + 1000, kind: 'daily', level: 'beginner', total: 5, correct: 5 });
    expect(p.daily[dayKey(new Date(at))]).toEqual({ correct: 3, total: 5 });
    expect(p.sessions).toHaveLength(2);
  });

  it('flags weak categories only once there are enough answers', () => {
    let p = emptyProgress();
    for (let i = 0; i < 4; i++) p = recordAnswer(p, qs[0], false);
    expect(weakModes(p)).toEqual([]);
    p = recordAnswer(p, qs[0], false);
    expect(weakModes(p)).toEqual([qs[0].mode]);
  });

  it('suggests moving up after sustained accuracy and back after struggling', () => {
    const at = (level: 'beginner' | 'intermediate', answered: number, correct: number): Progress =>
      ({ ...emptyProgress(), byLevel: { [level]: { answered, correct } } });
    expect(suggestLevel(emptyProgress()).level).toBe('beginner');
    expect(suggestLevel(at('beginner', 30, 25)).level).toBe('intermediate');
    expect(suggestLevel(at('beginner', 29, 29)).level).toBe('beginner');
    expect(suggestLevel(at('intermediate', 20, 8)).level).toBe('beginner');
  });

  it('survives corrupt or foreign storage', () => {
    expect(parseProgress('{oops')).toEqual(emptyProgress());
    expect(parseProgress(JSON.stringify({ v: 9 }))).toEqual(emptyProgress());
    expect(parseProgress(null)).toEqual(emptyProgress());
    const saved = recordAnswer(emptyProgress(), qs[0], true);
    expect(parseProgress(JSON.stringify(saved))).toEqual(saved);
  });
});
