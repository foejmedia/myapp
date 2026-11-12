import { Check, X } from 'lucide-react';
import { GUIDELINES } from '../data/guidelines';
import { JoinBand, Mark, PageHead } from './ui';
import s from '../community.module.css';

export default function GuidelinesPage() {
  return (
    <>
      <PageHead
        eyebrow="Guidelines"
        title={<>How we treat <Mark>each other</Mark></>}
        sub="These keep the community gentle, focused and safe to make mistakes in. By joining, you agree to uphold them."
      />

      <section className={s.sectionTight}>
        <div className={`${s.wrap} ${s.doc}`}>
          <nav className={s.toc} aria-label="On this page">
            <p>On this page</p>
            <ol>
              {GUIDELINES.map(g => (
                <li key={g.id}>
                  <a href={`#${g.id}`}>{g.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className={s.docBody}>
            <figure className={s.epigraph}>
              <blockquote>“…And cooperate in righteousness and piety, but do not cooperate in sin and aggression…”</blockquote>
              <figcaption>Quran 5:2 · Saheeh International</figcaption>
            </figure>

            {GUIDELINES.map((g, i) => (
              <section key={g.id} id={g.id} className={s.docSection}>
                <h2 className={s.h2}>
                  <span className={s.docNo}>{i + 1}</span> {g.title}
                </h2>
                {g.intro && <p className={s.docIntro}>{g.intro}</p>}
                {g.groups.map((grp, j) => (
                  <div key={j} className={grp.tone === 'do' ? s.groupDo : grp.tone === 'dont' ? s.groupDont : s.group}>
                    {grp.heading && <h3 className={s.h3}>{grp.heading}</h3>}
                    <ul>
                      {grp.items.map(item => (
                        <li key={item}>
                          {grp.tone === 'dont' ? <X size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      </section>

      <JoinBand />
    </>
  );
}
