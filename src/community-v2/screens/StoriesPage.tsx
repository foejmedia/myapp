'use client';

import { useState } from 'react';
import { PREVIEW } from '@/community/config';
import { FOCUSES, STORIES, type Focus } from '@/community/data/people';
import { Member } from '../icons';
import { ExampleTag, JoinCard, Mark, PageHead, Pills, PreviewNote } from '../ui';
import s from '../cv.module.css';

/** each story card takes the next colour block in turn */
const TONES = [s.storyYellow, s.storyCeleste, s.storyBlush, s.storyPlum];

export default function StoriesPage() {
  const [focus, setFocus] = useState<Focus | 'All'>('All');
  const all = PREVIEW ? STORIES : STORIES.filter(x => !x.example);
  const shown = focus === 'All' ? all : all.filter(x => x.focus === focus);

  return (
    <>
      <PageHead
        tone="celeste"
        kicker="Stories"
        title={<>Small steps, <Mark>said out loud.</Mark></>}
        sub="A first surah read without help. A juz finished. A routine that finally stuck. Milestones shared by members, in their own words."
      />

      <section className={s.sectionTight}>
        <div className={s.wrap}>
          <PreviewNote>The stories below are examples of what members will share. They are not written by real members.</PreviewNote>

          {all.length > 0 ? (
            <>
              <Pills label="Filter stories by focus" options={FOCUSES} value={focus} onChange={setFocus} />
              <ul className={s.storyGrid}>
                {shown.map((x, i) => (
                  <li key={x.id} className={`${s.story} ${TONES[i % TONES.length]}`}>
                    <p className={s.storyTop}>
                      <span className={s.milestone}>{x.milestone}</span>
                      {x.example && <ExampleTag />}
                    </p>
                    <div className={s.storyBody}>
                      {x.body.map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                    </div>
                    <p className={s.byline}>
                      <Member name={x.name} look={x.look} size={44} />
                      <span>
                        <b>{x.name}</b>
                        <small>{x.role}</small>
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
              {shown.length === 0 && <p className={s.empty}>No stories with this focus yet.</p>}
            </>
          ) : (
            <p className={s.empty}>The first stories will be shared here by members.</p>
          )}
        </div>
      </section>

      <JoinCard />
    </>
  );
}
