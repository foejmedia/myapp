'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PREVIEW } from '@/community/config';
import { FOCUSES, MEMBERS, type Focus } from '@/community/data/people';
import { applications, type Application } from '@/community/lib/applications';
import { Member } from '../icons';
import { ExampleTag, JoinCard, Mark, PageHead, Pills, PreviewNote, to } from '../ui';
import s from '../cv.module.css';

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
        tone="blush"
        kicker="Members"
        title={<>Not usernames, <Mark>real people.</Mark></>}
        sub="Readers, memorisers, parents and teachers, each known in their circle by name and by what they are working on."
      />

      <section className={s.sectionTight}>
        <div className={s.wrap}>
          <PreviewNote>The profiles below are examples that show how the directory will look. Real members appear here as they are accepted.</PreviewNote>

          {mine?.sentAt && (
            <div className={s.mine}>
              <Member
                name={mine.name}
                size={64}
                look={mine.iAm === 'sister' ? { kind: 'hijab', skin: 1, wear: 1 } : mine.iAm === 'brother' ? { kind: 'hair', skin: 1, wear: 1, hair: 'short' } : undefined}
              />
              <div>
                <p className={s.mineName}>
                  {mine.name} <span className={s.pending}>Application sent</span>
                </p>
                <p className={s.mineLine}>{mine.city} · Only you can see this card. It joins the directory once you are accepted.</p>
              </div>
              <Link href={to('/join')} className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}>
                View application
              </Link>
            </div>
          )}

          {all.length > 0 ? (
            <>
              <Pills label="Filter members by focus" options={FOCUSES} value={focus} onChange={setFocus} />
              <ul className={s.memberGrid}>
                {shown.map(m => (
                  <li key={m.id} className={s.memberCard}>
                    <Member name={m.name} look={m.look} size={72} />
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

      <JoinCard />
    </>
  );
}
