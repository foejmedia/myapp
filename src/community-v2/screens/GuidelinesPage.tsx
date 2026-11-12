import { Check, X } from 'lucide-react';
import { GUIDELINES } from '@/community/data/guidelines';
import { JoinCard, Mark, PageHead } from '../ui';
import s from '../cv.module.css';

export default function GuidelinesPage() {
  return (
    <>
      <PageHead
        kicker="Guidelines"
        title={<>How we treat <Mark>each other.</Mark></>}
        sub="These keep the community gentle, focused and safe to make mistakes in. By joining, you agree to uphold them."
      />

      <section className={s.sectionTight}>
        <div className={`${s.wrap} ${s.doc}`}>
          <nav className={s.toc} aria-label="On this page">
            <p className={s.tocHead}>On this page</p>
            <ol>
              {GUIDELINES.map((g, i) => (
                <li key={g.id}>
                  <a href={`#${g.id}`}>
                    <span>{i + 1}</span>
                    {g.title}
                  </a>
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
                <h2 className={s.docTitle}>
                  <span className={s.docNo}>{i + 1}</span> {g.title}
                </h2>
                {g.intro && <p className={s.docIntro}>{g.intro}</p>}
                {g.groups.map((grp, j) => (
                  <div key={j} className={grp.tone === 'do' ? `${s.group} ${s.groupDo}` : grp.tone === 'dont' ? `${s.group} ${s.groupDont}` : s.group}>
                    {grp.heading && <h3>{grp.heading}</h3>}
                    <ul>
                      {grp.items.map(item => (
                        <li key={item}>
                          <span className={s.bullet} aria-hidden="true">
                            {grp.tone === 'dont' ? <X size={14} strokeWidth={3} /> : <Check size={14} strokeWidth={3} />}
                          </span>
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

      <JoinCard />
    </>
  );
}
