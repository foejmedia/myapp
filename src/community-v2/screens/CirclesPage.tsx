import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { site } from '@/community/config';
import { CIRCLES } from '@/community/data/circles';
import { Glyph } from '../icons';
import { JoinCard, Mark, PageHead, SectionHead } from '../ui';
import s from '../cv.module.css';

const HOW = [
  { title: 'Small on purpose', text: 'A circle is kept small enough that everyone can recite in one session. When it fills, a second one opens.' },
  { title: 'One subject each', text: 'Tajweed questions stay in Tajweed. Greetings and news go to The Courtyard. Nothing gets buried.' },
  { title: 'A moderator in every circle', text: 'Someone keeps the circle on its subject, welcomes new members, and steps in when a guideline is crossed.' },
  { title: 'Up to three at a time', text: 'Choose the circles that match what you are working on now. You can change them as you progress.' },
];

export default function CirclesPage() {
  return (
    <>
      <PageHead
        kicker="Circles"
        title={<>{CIRCLES.length} circles, <Mark>one subject each.</Mark></>}
        sub="A circle is a small moderated group that works on one thing: a chat for the week, and a session where you recite. Pick the ones that match where you are today."
      />

      <section className={s.sectionTight}>
        <div className={s.wrap}>
          <ul className={s.circleGrid}>
            {CIRCLES.map(c => (
              <li key={c.id} id={c.id} className={s.circleCard}>
                <div className={s.circleTop}>
                  <Glyph name={c.icon} size={56} />
                  <span className={s.level}>{c.level}</span>
                </div>
                <h2 className={s.cardTitle}>{c.name}</h2>
                <p className={s.cardLead}>{c.blurb}</p>
                <dl className={s.facts}>
                  <div>
                    <dt>Suits</dt>
                    <dd>{c.suits}</dd>
                  </div>
                  <div>
                    <dt>A normal week</dt>
                    <dd>{c.week}</dd>
                  </div>
                </dl>
                {c.tool && (
                  <Link href={site(c.tool.href)} className={s.toolLink}>
                    Practise with {c.tool.label} <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <SectionHead kicker="How circles work" title="Kept small, kept on topic." />
          <ol className={s.how}>
            {HOW.map((h, i) => (
              <li key={h.title}>
                <span className={s.stepNum}>{i + 1}</span>
                <h3>{h.title}</h3>
                <p>{h.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <JoinCard />
    </>
  );
}
