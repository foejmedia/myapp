import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { FAQ, FORMATS, SESSION } from '@/community/data/gatherings';
import { Glyph } from '../icons';
import { JoinCard, Mark, PageHead, SectionHead, to } from '../ui';
import s from '../cv.module.css';

export default function GatheringsPage() {
  return (
    <>
      <PageHead
        tone="mauve"
        kicker="Gatherings"
        title={<>A community that <Mark>hears you recite.</Mark></>}
        sub="Messages keep a circle going between sessions. The session is where the learning happens: you recite, someone listens, and you leave knowing what to fix."
      >
        <div className={s.pageActions}>
          <Link href={to('/join')} className={`${s.btn} ${s.btnBlue}`}>
            Apply to join <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
          </Link>
          <a href="#formats" className={`${s.btn} ${s.btnLight}`}>
            See what we do
          </a>
        </div>
      </PageHead>

      <section className={s.sectionTight} id="formats">
        <div className={s.wrap}>
          <SectionHead kicker="Formats" title="Everything we do together." />
          <ul className={s.formatGrid}>
            {FORMATS.map(f => (
              <li key={f.id} className={s.formatCard}>
                <Glyph name={f.icon} size={56} />
                <h3 className={s.cardTitle}>{f.name}</h3>
                <p className={s.cardText}>{f.blurb}</p>
                <p className={s.formatMeta}>
                  <span className={f.where === 'Online' ? s.tag : s.tagYellow}>{f.where}</span>
                  <span>{f.length}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <SectionHead
            kicker="A weekly session"
            title="Forty minutes, start to finish."
            sub="Every circle follows the same simple order, so you always know what is coming and when your turn is."
          />
          <ol className={s.timeline}>
            {SESSION.map(x => (
              <li key={x.title}>
                <span className={s.minutes}>{x.minutes}</span>
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <div className={s.city}>
            <span className={`${s.disc} ${s.discC}`} aria-hidden="true" />
            <div>
              <p className={s.chipLight}>In your city</p>
              <h2 className={s.cityTitle}>Meetups start where members are.</h2>
              <p className={s.cityBody}>
                We do not announce a city until there are enough members in it to fill a circle. Tell us your city when you
                apply. When yours is ready, you will hear about it inside the community first.
              </p>
            </div>
            <Link href={to('/join')} className={`${s.btn} ${s.btnLight}`}>
              Add your city <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={`${s.wrap} ${s.narrow}`}>
          <SectionHead center kicker="Questions" title="Before your first gathering" />
          <div className={s.faq}>
            {FAQ.map(f => (
              <details key={f.q}>
                <summary>
                  {f.q}
                  <span className={s.faqIcon} aria-hidden="true">
                    <Plus size={18} strokeWidth={2.4} />
                  </span>
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <JoinCard />
    </>
  );
}
