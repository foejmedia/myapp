import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { to } from '../config';
import { FAQ, FORMATS, SESSION } from '../data/gatherings';
import { Icon, JoinBand, Mark, PageHead, SectionHead } from './ui';
import s from '../community.module.css';

export default function GatheringsPage() {
  return (
    <>
      <PageHead
        eyebrow="Gatherings"
        title={<>A community that <Mark>hears you recite</Mark></>}
        sub="Messages keep a circle going between sessions. The session is where the learning happens: you recite, someone listens, and you leave knowing what to fix."
      >
        <div className={s.actions}>
          <Link href={to('/join')} className={s.btn}>
            Apply to join <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <a href="#formats" className={s.btnGhost}>See what we do</a>
        </div>
      </PageHead>

      <section className={s.formatsSection} id="formats">
        <div className={s.wrap}>
          <SectionHead eyebrow="Formats" title={<>Everything we do <Mark>together</Mark></>} />
          <ul className={s.formatGrid}>
            {FORMATS.map(f => (
              <li key={f.id} className={s.format}>
                <span className={s.iconTile}><Icon name={f.icon} /></span>
                <h3 className={s.h3}>{f.name}</h3>
                <p>{f.blurb}</p>
                <p className={s.formatMeta}>
                  <span className={f.where === 'Online' ? s.tag : s.tagAmber}>{f.where}</span>
                  <span>{f.length}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.section}>
        <div className={`${s.wrap} ${s.split}`}>
          <SectionHead
            eyebrow="A weekly session"
            title={<>Forty minutes, <Mark>start to finish</Mark></>}
            sub="Every circle follows the same simple order, so you always know what is coming and when your turn is."
          />
          <ol className={s.timeline}>
            {SESSION.map(x => (
              <li key={x.title}>
                <span className={s.minutes}>{x.minutes}</span>
                <h3 className={s.h3}>{x.title}</h3>
                <p>{x.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <div className={s.cityCard}>
            <div>
              <p className={s.eyebrow}>In your city</p>
              <h2 className={s.h2}>Meetups start where members are</h2>
              <p className={s.sub}>
                We do not announce a city until there are enough members in it to fill a circle. Tell us your city when you
                apply. When yours is ready, you will hear about it inside the community first.
              </p>
            </div>
            <Link href={to('/join')} className={s.btn}>
              Add your city <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={`${s.wrap} ${s.narrow}`}>
          <SectionHead center eyebrow="Questions" title="Before your first gathering" />
          <div className={s.faq}>
            {FAQ.map(f => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <JoinBand />
    </>
  );
}
