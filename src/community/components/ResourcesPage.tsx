'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { site } from '../config';
import { RESOURCES, RESOURCE_KINDS, type ResourceKind } from '../data/resources';
import { Chips, JoinBand, Mark, PageHead } from './ui';
import s from '../community.module.css';

export default function ResourcesPage() {
  const [kind, setKind] = useState<ResourceKind | 'All'>('All');
  const shown = kind === 'All' ? RESOURCES : RESOURCES.filter(r => r.kind === kind);

  return (
    <>
      <PageHead
        eyebrow="Resources"
        title={<>The tools our circles <Mark>practise with</Mark></>}
        sub="Everything here is part of Learn Quran and free to use, whether or not you are a member. Circles set their weekly work from these."
      />

      <section className={s.sectionTight}>
        <div className={s.wrap}>
          <Chips label="Filter resources by kind" options={RESOURCE_KINDS} value={kind} onChange={setKind} />
          <ul className={s.resourceGrid}>
            {shown.map(r => (
              <li key={r.href}>
                <Link href={site(r.href)} className={s.resource}>
                  <span className={s.letterTile} aria-hidden="true">{r.name[0]}</span>
                  <span className={s.resourceBody}>
                    <span className={s.resourceName}>
                      {r.name} <ArrowUpRight size={15} aria-hidden="true" />
                    </span>
                    <span className={s.resourcePath}>learnquran.app{r.href.split('?')[0]}</span>
                    <span className={s.resourceText}>{r.text}</span>
                    <span className={s.tag}>{r.kind}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <JoinBand />
    </>
  );
}
