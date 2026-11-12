'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { site } from '@/community/config';
import { RESOURCES, RESOURCE_KINDS, type ResourceKind } from '@/community/data/resources';
import { Icon, type IconName } from '@/home-v2/icons';
import { JoinCard, Mark, PageHead, Pills } from '../ui';
import s from '../cv.module.css';

/** the icon for each tool, by its path on the main site */
const ICON_BY_PATH: Record<string, IconName> = {
  '/read-quran/1': 'read',
  '/quran-pages': 'mushaf',
  '/tafseer': 'tafseer',
  '/audio-quran': 'headphones',
  '/quran-player': 'player',
  '/translation-audio': 'headphones',
  '/radio': 'radio',
  '/memorize-quran': 'hifz',
  '/learn-1-min': 'quiz',
  '/learn-quran': 'learn',
  '/tajweed': 'tajweed',
  '/quiz': 'quiz',
  '/dua': 'dua',
  '/hadees': 'hadith',
  '/namaz-tracker': 'namaz',
  '/my-schedule': 'schedule',
  '/tasbih': 'tasbih',
  '/qibla': 'qibla',
};

const iconFor = (href: string): IconName => (href.includes('word-by-word') ? 'wbw' : ICON_BY_PATH[href.split('?')[0]] ?? 'read');

export default function ResourcesPage() {
  const [kind, setKind] = useState<ResourceKind | 'All'>('All');
  const shown = kind === 'All' ? RESOURCES : RESOURCES.filter(r => r.kind === kind);

  return (
    <>
      <PageHead
        tone="celeste"
        kicker="Resources"
        title={<>The tools our circles <Mark>practise with.</Mark></>}
        sub="Everything here is part of Learn Quran and free to use, whether or not you are a member. Circles set their weekly work from these."
      />

      <section className={s.sectionTight}>
        <div className={s.wrap}>
          <Pills label="Filter resources by kind" options={RESOURCE_KINDS} value={kind} onChange={setKind} />
          <ul className={s.resourceGrid}>
            {shown.map(r => (
              <li key={r.href}>
                <Link href={site(r.href)} className={s.resource}>
                  <Icon name={iconFor(r.href)} size={52} />
                  <span className={s.resourceBody}>
                    <span className={s.resourceName}>{r.name}</span>
                    <span className={s.resourceText}>{r.text}</span>
                    <span className={s.tag}>{r.kind}</span>
                  </span>
                  <span className={s.resourceGo} aria-hidden="true">
                    <ArrowUpRight size={18} strokeWidth={2.4} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <JoinCard />
    </>
  );
}
