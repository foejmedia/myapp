'use client';

import { useState } from 'react';
import { PREVIEW } from '../config';
import { FOCUSES, STORIES, type Focus } from '../data/people';
import { Avatar, Chips, ExampleTag, JoinBand, Mark, PageHead, PreviewNote } from './ui';
import s from '../community.module.css';

export default function StoriesPage() {
  const [focus, setFocus] = useState<Focus | 'All'>('All');
  const all = PREVIEW ? STORIES : STORIES.filter(x => !x.example);
  const shown = focus === 'All' ? all : all.filter(x => x.focus === focus);

  return (
    <>
      <PageHead
        eyebrow="Stories"
        title={<>Small steps, <Mark>said out loud</Mark></>}
        sub="A first surah read without help. A juz finished. A routine that finally stuck. Milestones shared by members, in their own words."
      />

      <section className={s.sectionTight}>
        <div className={s.wrap}>
          <PreviewNote>The stories below are examples of what members will share. They are not written by real members.</PreviewNote>

          {all.length > 0 ? (
            <>
              <Chips label="Filter stories by focus" options={FOCUSES} value={focus} onChange={setFocus} />
              <ul className={s.storyGrid}>
                {shown.map(x => (
                  <li key={x.id} className={s.story}>
                    <p className={s.storyTop}>
                      <span className={s.milestone}>{x.milestone}</span>
                      {x.example && <ExampleTag />}
                    </p>
                    <div className={s.storyBody}>
                      {x.body.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                    <p className={s.byline}>
                      <Avatar name={x.name} size="sm" />
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

      <JoinBand />
    </>
  );
}
