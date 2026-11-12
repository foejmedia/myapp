import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PREVIEW } from '@/community/config';
import { CIRCLES } from '@/community/data/circles';
import { FORMATS } from '@/community/data/gatherings';
import { MEMBERS, STORIES } from '@/community/data/people';
import { Icon, type IconName } from '@/home-v2/icons';
import { Glyph, Member, type GlyphName } from '../icons';
import { ArrowLink, ExampleTag, JoinCard, Mark, SectionHead, to } from '../ui';
import s from '../cv.module.css';

const PILLARS: { glyph: GlyphName; tone: string; title: string; text: string }[] = [
  {
    glyph: 'users',
    tone: s.tileYellow,
    title: 'Company',
    text: 'A small circle at your level. People who know your name, your surah and where you got stuck last week.',
  },
  {
    glyph: 'repeat',
    tone: s.tileBlush,
    title: 'Consistency',
    text: 'A weekly session and a revision partner. Missing a day is easy alone, and harder when someone is waiting.',
  },
  {
    glyph: 'ear',
    tone: s.tileCeleste,
    title: 'Correction',
    text: 'You cannot hear your own mistakes. Recite to a listener and the same slip stops following you for years.',
  },
];

const STEPS = [
  { title: 'Apply', text: 'Tell us where you are with the Quran and what you want to work on. It takes about three minutes.' },
  { title: 'Get placed', text: 'We read your application and reply on WhatsApp with the circles that fit you.' },
  { title: 'Show up', text: 'Join the weekly session, meet your partner, and recite your first lesson.' },
];

const TOOLS: { icon: IconName; label: string }[] = [
  { icon: 'read', label: 'Reader' },
  { icon: 'hifz', label: 'Hifz' },
  { icon: 'tajweed', label: 'Tajweed' },
  { icon: 'player', label: 'Recitations' },
  { icon: 'wbw', label: 'Word by Word' },
  { icon: 'tafseer', label: 'Tafseer' },
];

/** where the eight figures sit around the open book in the hero, as % of the art box */
const RING = [
  { x: 50, y: 8 },
  { x: 80, y: 20 },
  { x: 92, y: 50 },
  { x: 80, y: 80 },
  { x: 50, y: 92 },
  { x: 20, y: 80 },
  { x: 8, y: 50 },
  { x: 20, y: 20 },
];

export default function HomePage() {
  const members = PREVIEW ? MEMBERS : MEMBERS.filter(m => !m.example);
  const story = (PREVIEW ? STORIES : STORIES.filter(x => !x.example))[0];
  const ring = MEMBERS.slice(0, RING.length);

  return (
    <>
      <section className={s.hero}>
        <div className={`${s.wrap} ${s.heroGrid}`}>
          <div className={s.heroText}>
            <p className={s.live}>
              <span aria-hidden="true" /> Applications are open
            </p>
            <h1 className={s.display}>
              Learn the Quran in <Mark>good company.</Mark>
            </h1>
            <p className={s.lede}>
              A small, moderated community for people learning to read, memorise and understand the Quran. Find a circle at
              your level, a partner to revise with, and people who will ask how your lesson went.
            </p>
            <div className={s.actions}>
              <Link href={to('/join')} className={`${s.btn} ${s.btnBlue}`}>
                Apply to join <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </Link>
              <Link href={to('/circles')} className={`${s.btn} ${s.btnGhost}`}>
                See the circles
              </Link>
            </div>
            <p className={s.heroNote}>Free to join. Every level is welcome.</p>
          </div>

          {/* a circle of learners around an open book: drawn shapes, no faces */}
          <div className={s.gather} aria-hidden="true">
            <span className={`${s.disc} ${s.discA}`} />
            <span className={`${s.disc} ${s.discB}`} />
            <div className={s.ring}>
              <span className={s.ringLine} />
              <span className={s.book}>
                <svg viewBox="0 0 48 48" width="100%" height="100%">
                  <path fill="#fff" d="M22.8 15.2c-3.4-2.3-7.7-3-11.7-1.8a1.1 1.1 0 0 0-.8 1.1v17.3a1.1 1.1 0 0 0 1.5 1.1c3.6-1 7.5-.5 11 1.6z" />
                  <path fill="#ffce00" d="M25.2 15.2c3.4-2.3 7.7-3 11.7-1.8a1.1 1.1 0 0 1 .8 1.1v17.3a1.1 1.1 0 0 1-1.5 1.1c-3.6-1-7.5-.5-11 1.6z" />
                </svg>
              </span>
              {ring.map((m, i) => (
                <span key={m.id} className={s.seat} style={{ left: `${RING[i].x}%`, top: `${RING[i].y}%`, animationDelay: `${i * -0.7}s` }}>
                  <Member name={m.name} look={m.look} size={64} />
                </span>
              ))}
            </div>
            <span className={`${s.float} ${s.floatA}`}>
              <Glyph name="mic" size={26} /> Tajweed
            </span>
            <span className={`${s.float} ${s.floatB}`}>
              <Glyph name="bookmark" size={26} /> Hifz
            </span>
            <span className={`${s.float} ${s.floatC}`}>
              <Glyph name="sprout" size={26} /> First Steps
            </span>
          </div>
        </div>
      </section>

      <section className={s.section} aria-labelledby="cv-band">
        <div className={s.wrap}>
          <div className={s.band}>
            <span className={`${s.disc} ${s.discC}`} aria-hidden="true" />
            <div className={s.bandHead}>
              <div>
                <h2 id="cv-band" className={s.bandTitle}>
                  {CIRCLES.length} focused circles, from the first letter to the last juz.
                </h2>
                <p className={s.bandSub}>Every circle has one subject and a moderator, so a question about a single letter is never buried.</p>
              </div>
              <Link href={to('/circles')} className={`${s.btn} ${s.btnLight}`}>
                How circles work <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>
            <ul className={s.circlePills}>
              {CIRCLES.map(c => (
                <li key={c.id}>
                  <Link href={`${to('/circles')}#${c.id}`} className={s.circlePill}>
                    <Glyph name={c.icon} size={32} />
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <SectionHead
            kicker="Why a community"
            title="Learning alone is where most plans stall."
            sub="The app gives you the text, the audio and the tools. What it cannot give you is someone on the other side. That is what this is for."
          />
          <ul className={s.trio}>
            {PILLARS.map(p => (
              <li key={p.title} className={`${s.tile} ${p.tone}`}>
                <Glyph name={p.glyph} size={56} base={p.glyph === 'users' ? '#3b197f' : undefined} />
                <div className={s.tileText}>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <SectionHead
            center
            kicker="What is inside"
            title="Built for people who keep coming back."
            sub="Open to every level. We grow slowly, through applications and referrals, so that circles stay small."
          />
          <div className={s.bento}>
            <article className={`${s.card} ${s.bentoTall}`}>
              <p className={s.stat}>Every level</p>
              <p className={s.statLabel}>Who is here</p>
              <p className={s.cardText}>Beginners, returning readers, memorisers, parents and teachers, each in a circle that suits them.</p>
              {members.length > 0 && (
                <div className={s.faces}>
                  {members.map(m => (
                    <Member key={m.id} name={m.name} look={m.look} size={52} />
                  ))}
                </div>
              )}
              {PREVIEW && <p className={s.cardNote}>Example profiles, shown while the community opens.</p>}
              <ArrowLink href={to('/members')}>Meet the members</ArrowLink>
            </article>

            <article className={`${s.card} ${s.cardIndigo} ${s.bentoWide}`}>
              <p className={s.stat}>{CIRCLES.length}</p>
              <p className={s.statLabel}>Focused circles</p>
              <ul className={s.tagList}>
                {CIRCLES.map(c => (
                  <li key={c.id}>{c.name}</li>
                ))}
              </ul>
              <Link href={to('/circles')} className={`${s.btn} ${s.btnLight} ${s.btnSm}`}>
                View all circles <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </article>

            <article className={`${s.card} ${s.cardBlush}`}>
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
                    <Member name={story.name} look={story.look} size={40} />
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
          <div className={s.tools}>
            <div className={s.toolsText}>
              <p className={s.chipDark}>Practise with the app</p>
              <h2 className={s.toolsTitle}>Every tool, one tap away.</h2>
              <p className={s.toolsBody}>
                Circles work from the Learn Quran app: the reader, recitations, the Hifz program, tajweed lessons and more.
              </p>
              <Link href={to('/resources')} className={`${s.btn} ${s.btnOnColor}`}>
                See all resources <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>
            <ul className={s.toolGrid} aria-label="Some of the tools">
              {TOOLS.map(t => (
                <li key={t.label}>
                  <Icon name={t.icon} size={52} />
                  <span>{t.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <SectionHead kicker="Joining" title="Three steps, no forms after that." />
          <ol className={s.steps}>
            {STEPS.map((st, i) => (
              <li key={st.title} className={s.step}>
                <span className={s.stepNum}>{i + 1}</span>
                <h3>{st.title}</h3>
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
            <figcaption>The Prophet Muhammad ﷺ, narrated by Uthman ibn Affan (RA) · Sahih al-Bukhari 5027</figcaption>
          </figure>
        </div>
      </section>

      <JoinCard />
    </>
  );
}
