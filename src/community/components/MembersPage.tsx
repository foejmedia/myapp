'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PREVIEW, to } from '../config';
import { FOCUSES, MEMBERS, type Focus } from '../data/people';
import { applications, type Application } from '../lib/applications';
import { Avatar, Chips, ExampleTag, JoinBand, Mark, PageHead, PreviewNote } from './ui';
import s from '../community.module.css';

export default function MembersPage() {
  const [focus, setFocus] = useState<Focus | 'All'>('All');
  const [mine, setMine] = useState<Application | null>(null);

  // the visitor's own application, if they have sent one from this browser
  useEffect(() => setMine(applications.load()), []);

  const all = PREVIEW ? MEMBERS : MEMBERS.filter(m => !m.example);
  const shown = focus === 'All' ? all : all.filter(m => m.focus === focus);

  return (
    <>
      <PageHead
        eyebrow="Members"
        title={<>Not usernames, <Mark>real people</Mark></>}
        sub="Readers, memorisers, parents and teachers, each known in their circle by name and by what they are working on."
      />

      <section className={s.sectionTight}>
        <div className={s.wrap}>
          <PreviewNote>The profiles below are examples that show how the directory will look. Real members appear here as they are accepted.</PreviewNote>

          {mine?.sentAt && (
            <div className={s.mine}>
              <Avatar name={mine.name} size="lg" />
              <div>
                <p className={s.mineName}>
                  {mine.name} <span className={s.pendingTag}>Application sent</span>
                </p>
                <p className={s.mineLine}>{mine.city} · Only you can see this card. It joins the directory once you are accepted.</p>
              </div>
              <Link href={to('/join')} className={s.btnGhost}>View application</Link>
            </div>
          )}

          {all.length > 0 ? (
            <>
              <Chips label="Filter members by focus" options={FOCUSES} value={focus} onChange={setFocus} />
              <ul className={s.memberGrid}>
                {shown.map(m => (
                  <li key={m.id} className={s.member}>
                    <Avatar name={m.name} size="lg" />
                    <h2 className={s.memberName}>{m.name}</h2>
                    <p className={s.memberLine}>{m.line}</p>
                    <p className={s.memberMeta}>
                      <span className={s.tag}>{m.focus}</span>
                      <span>{m.city}</span>
                      {m.example && <ExampleTag />}
                    </p>
                  </li>
                ))}
              </ul>
              {shown.length === 0 && <p className={s.empty}>No members with this focus yet.</p>}
            </>
          ) : (
            <p className={s.empty}>The first members are being welcomed now. Their profiles will appear here.</p>
          )}
        </div>
      </section>

      <JoinBand />
    </>
  );
}
