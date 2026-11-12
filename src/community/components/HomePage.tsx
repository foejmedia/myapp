import Link from 'next/link';
import { ArrowRight, Ear, HeartHandshake, Target } from 'lucide-react';
import { PREVIEW, to } from '../config';
import { CIRCLES } from '../data/circles';
import { FORMATS } from '../data/gatherings';
import { MEMBERS, STORIES } from '../data/people';
import { CirclePreview, HeroPeople, ToolsOrbit, Waves } from './Art';
import { ArrowLink, Avatar, ExampleTag, Icon, JoinBand, Mark, SectionHead } from './ui';
import s from '../community.module.css';

const PILLARS = [
  {
    icon: HeartHandshake,
    title: 'Company',
    text: 'A small circle at your level. People who know your name, your surah and where you got stuck last week.',
  },
  {
    icon: Target,
    title: 'Consistency',
    text: 'A weekly session and a revision partner. Missing a day is easy alone, and harder when someone is waiting.',
  },
  {
    icon: Ear,
    title: 'Correction',
    text: 'You cannot hear your own mistakes. Recite to a listener and the same slip stops following you for years.',
  },
];

const STEPS = [
  { title: 'Apply', text: 'Tell us where you are with the Quran and what you want to work on. It takes about three minutes.' },
  { title: 'Get placed', text: 'We read your application and reply on WhatsApp with the circles that fit you.' },
  { title: 'Show up', text: 'Join the weekly session, meet your partner, and recite your first lesson.' },
];

export default function HomePage() {
  const members = PREVIEW ? MEMBERS : MEMBERS.filter(m => !m.example);
  const story = (PREVIEW ? STORIES : STORIES.filter(x => !x.example))[0];

  return (
    <>
      <section className={s.heroBg}>
        <div className={s.wrap}>
          <div className={s.heroStage}>
            <HeroPeople />
            <div className={s.heroCenter}>
              <p className={s.badge}>
                <span className={s.badgeDot} aria-hidden="true" /> Applications are open
              </p>
              <h1 className={s.display}>
                Learn the Quran <Mark>in good company</Mark>
                <Waves />
              </h1>
              <p className={s.lead}>
                A small, moderated community for people learning to read, memorise and understand the Quran. Find a circle
                at your level, a partner to revise with, and people who will ask how your lesson went.
              </p>
              <div className={s.actionsCenter}>
                <Link href={to('/join')} className={s.btn}>
                  Apply to join <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link href={to('/circles')} className={s.btnGhost}>
                  See the circles
                </Link>
              </div>
              <p className={s.heroNote}>Free to join. Every level is welcome.</p>
            </div>
          </div>
          <CirclePreview />
        </div>
      </section>

      <section className={s.navyBand} aria-labelledby="cm-circles-band">
        <div className={`${s.wrap} ${s.navyIn}`}>
          <div className={s.navyHead}>
            <div>
              <h2 id="cm-circles-band" className={s.navyTitle}>
                <b>{CIRCLES.length} focused circles</b>, from the first letter to the last juz.
              </h2>
              <p className={s.navySub}>Every circle has one subject and a moderator, so a question about a single letter is never buried.</p>
            </div>
            <Link href={to('/circles')} className={s.navyLink}>
              How circles work <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <ul className={s.circleTiles}>
            {CIRCLES.map(c => (
              <li key={c.id}>
                <Link href={`${to('/circles')}#${c.id}`} className={s.circleTile}>
                  <Icon name={c.icon} size={18} />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <SectionHead
            eyebrow="Why a community"
            title={<>Learning alone is where <Mark>most plans stall</Mark></>}
            sub="The app gives you the text, the audio and the tools. What it cannot give you is someone on the other side. That is what this is for."
          />
          <ul className={s.pillars}>
            {PILLARS.map(({ icon: I, title, text }) => (
              <li key={title} className={s.pillar}>
                <span className={s.iconTile}><I size={20} strokeWidth={1.8} aria-hidden="true" /></span>
                <h3 className={s.h3}>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <SectionHead
            center
            eyebrow="What is inside"
            title={<>Built for people who <Mark>keep coming back</Mark></>}
            sub="Open to every level, from the first letter to the last juz. We grow slowly, through applications and referrals, so that circles stay small."
          />
          <div className={s.bento}>
            <article className={`${s.card} ${s.bentoTall}`}>
              <p className={s.stat}>Every level</p>
              <p className={s.statLabel}>Who is here</p>
              <p className={s.cardText}>Beginners, returning readers, memorisers, parents and teachers, each in a circle that suits them.</p>
              {members.length > 0 && (
                <div className={s.avatarGrid}>
                  {members.map(m => (
                    <Avatar key={m.id} name={m.name} />
                  ))}
                </div>
              )}
              {PREVIEW && <p className={s.cardNote}>Example profiles, shown while the community opens.</p>}
              <ArrowLink href={to('/members')}>Meet the members</ArrowLink>
            </article>

            <article className={`${s.card} ${s.bentoWide}`}>
              <p className={s.stat}>{CIRCLES.length}</p>
              <p className={s.statLabel}>Focused circles</p>
              <ul className={s.tagList}>
                {CIRCLES.map(c => (
                  <li key={c.id}>{c.name}</li>
                ))}
              </ul>
              <ArrowLink href={to('/circles')}>View all circles</ArrowLink>
            </article>

            <article className={s.card}>
              <p className={s.stat}>{FORMATS.length}</p>
              <p className={s.statLabel}>Ways we gather</p>
              <p className={s.cardText}>Weekly sessions, recitation clinics, partner check-ins, milestone evenings and city meetups.</p>
              <ArrowLink href={to('/gatherings')}>How gatherings work</ArrowLink>
            </article>

            <article className={s.card}>
              {story ? (
                <>
                  <p className={s.statLabel}>
                    {story.milestone} {story.example && <ExampleTag />}
                  </p>
                  <blockquote className={s.quote}>“{story.body[1] ?? story.body[0]}”</blockquote>
                  <p className={s.byline}>
                    <Avatar name={story.name} size="sm" />
                    <span>
                      <b>{story.name}</b>
                      <small>{story.role}</small>
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className={s.stat}>Soon</p>
                  <p className={s.statLabel}>Member stories</p>
                  <p className={s.cardText}>Milestones will be shared here by members, in their own words.</p>
                </>
              )}
              <ArrowLink href={to('/stories')}>Read member stories</ArrowLink>
            </article>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <ToolsOrbit>
            <p className={s.eyebrow}>Practise with the app</p>
            <h2 className={s.h2}>
              Every tool, <Mark>one tap away</Mark>
            </h2>
            <p className={s.sub}>Circles work from the Learn Quran app: the reader, recitations, the Hifz program, tajweed lessons and more.</p>
            <Link href={to('/resources')} className={`${s.btn} ${s.btnSm}`}>
              See all resources <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </ToolsOrbit>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <SectionHead eyebrow="Joining" title={<>Three steps, <Mark>no forms after that</Mark></>} />
          <ol className={s.steps}>
            {STEPS.map((st, i) => (
              <li key={st.title} className={s.step}>
                <span className={s.stepNo}>{i + 1}</span>
                <h3 className={s.h3}>{st.title}</h3>
                <p>{st.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <figure className={s.hadith}>
            <blockquote>“The best of you are those who learn the Quran and teach it.”</blockquote>
            <figcaption>
              The Prophet Muhammad ﷺ, narrated by Uthman ibn Affan (RA) · Sahih al-Bukhari 5027
            </figcaption>
          </figure>
        </div>
      </section>

      <JoinBand />
    </>
  );
}
