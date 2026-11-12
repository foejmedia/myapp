'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, MessageCircle, Pencil } from 'lucide-react';
import { to } from '../config';
import { CIRCLES } from '../data/circles';
import { EMPTY, LEVELS, applications, validate, whatsappUrl, type Application, type Errors } from '../lib/applications';
import { Mark, PageHead } from './ui';
import s from '../community.module.css';

const MAX_CIRCLES = 3;

const NEXT = [
  { title: 'You send it on WhatsApp', text: 'The form writes your application as a WhatsApp message. You press send.' },
  { title: 'A person reads it', text: 'We reply on the same chat, with the circles that fit your level.' },
  { title: 'You join your first session', text: 'You are introduced to your circle and given the time of its weekly session.' },
];

export default function JoinPage() {
  const [form, setForm] = useState<Application>(EMPTY);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [ready, setReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // an application already sent from this browser shows its status instead of an empty form
  useEffect(() => {
    const saved = applications.load();
    if (saved) {
      setForm(saved);
      setSent(Boolean(saved.sentAt));
    }
    setReady(true);
  }, []);

  const set = <K extends keyof Application>(key: K, value: Application[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const setIAm = (value: Application['iAm']) => {
    setForm(f => ({ ...f, iAm: value, circles: value === 'sister' ? f.circles : f.circles.filter(id => id !== 'sisters') }));
    setErrors(e => ({ ...e, iAm: undefined }));
  };

  const toggleCircle = (id: string) => {
    setForm(f => {
      if (f.circles.includes(id)) return { ...f, circles: f.circles.filter(c => c !== id) };
      if (f.circles.length >= MAX_CIRCLES) return f;
      return { ...f, circles: [...f.circles, id] };
    });
    setErrors(e => ({ ...e, circles: undefined }));
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const found = validate(form, agreed);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const application = { ...form, sentAt: new Date().toISOString() };
    applications.save(application);
    setForm(application);
    setSent(true);
    window.open(whatsappUrl(application), '_blank', 'noopener');
    window.scrollTo({ top: 0 });
  };

  const edit = () => {
    const draft = { ...form, sentAt: undefined };
    applications.save(draft);
    setForm(draft);
    setSent(false);
  };

  const startOver = () => {
    applications.clear();
    setForm(EMPTY);
    setAgreed(false);
    setErrors({});
    setSent(false);
  };

  if (sent) {
    const names = form.circles.map(id => CIRCLES.find(c => c.id === id)?.name ?? id);
    return (
      <>
        <PageHead
          eyebrow="Application"
          title={<>One step left: <Mark>press send</Mark></>}
          sub="Your application is written out as a WhatsApp message. It reaches us when you send it from WhatsApp. We reply on the same chat."
        >
          <div className={s.actions}>
            <a href={whatsappUrl(form)} target="_blank" rel="noopener noreferrer" className={s.btn}>
              <MessageCircle size={18} aria-hidden="true" /> Open WhatsApp
            </a>
            <button type="button" className={s.btnGhost} onClick={edit}>
              <Pencil size={16} aria-hidden="true" /> Edit application
            </button>
          </div>
        </PageHead>

        <section className={s.sectionTight}>
          <div className={`${s.wrap} ${s.narrow}`}>
            <div className={s.receipt}>
              <h2 className={s.h3}>What you sent</h2>
              <dl>
                <div><dt>Name</dt><dd>{form.name}</dd></div>
                <div><dt>WhatsApp</dt><dd>{form.whatsapp}</dd></div>
                <div><dt>City</dt><dd>{form.city}</dd></div>
                <div><dt>Level</dt><dd>{form.level}</dd></div>
                <div><dt>Circles</dt><dd>{names.join(', ')}</dd></div>
                <div><dt>Why you are joining</dt><dd>{form.reason}</dd></div>
                {form.referredBy && <div><dt>Referred by</dt><dd>{form.referredBy}</dd></div>}
              </dl>
              <p className={s.receiptNote}>
                A copy is kept on this device only, so you can see it when you come back.{' '}
                <button type="button" className={s.linkBtn} onClick={startOver}>Remove it and start again</button>
              </p>
            </div>
            <p className={s.centerRow}>
              <Link href={to('/guidelines')} className={s.arrowLink}>
                Read the guidelines while you wait <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </p>
          </div>
        </section>
      </>
    );
  }

  const err = (key: keyof Errors) => errors[key] && <p className={s.error} id={`cm-err-${key}`}>{errors[key]}</p>;
  const invalid = (key: keyof Errors) => ({ 'aria-invalid': errors[key] ? true : undefined, 'aria-describedby': errors[key] ? `cm-err-${key}` : undefined });

  return (
    <>
      <PageHead
        eyebrow="Apply to join"
        title={<>Tell us <Mark>where you are</Mark></>}
        sub="It takes about three minutes. Your answers decide which circle you are placed in, so there are no wrong ones."
      />

      <section className={s.sectionTight}>
        <div className={`${s.wrap} ${s.joinGrid}`}>
          <form ref={formRef} className={s.form} onSubmit={submit} noValidate aria-busy={!ready}>
            <div className={s.field} data-field="name">
              <label htmlFor="cm-name">Full name</label>
              <input id="cm-name" type="text" autoComplete="name" value={form.name} onChange={e => set('name', e.target.value)} {...invalid('name')} />
              {err('name')}
            </div>

            <div className={s.fieldRow}>
              <div className={s.field} data-field="whatsapp">
                <label htmlFor="cm-wa">WhatsApp number</label>
                <input id="cm-wa" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} {...invalid('whatsapp')} />
                {err('whatsapp')}
              </div>
              <div className={s.field} data-field="city">
                <label htmlFor="cm-city">City and country</label>
                <input id="cm-city" type="text" autoComplete="address-level2" placeholder="Hyderabad, India" value={form.city} onChange={e => set('city', e.target.value)} {...invalid('city')} />
                {err('city')}
              </div>
            </div>

            <fieldset className={s.field} data-field="iAm" {...invalid('iAm')}>
              <legend>I am a</legend>
              <div className={s.options}>
                {(['brother', 'sister'] as const).map(v => (
                  <label key={v} className={form.iAm === v ? s.optionOn : s.option}>
                    <input type="radio" name="cm-iam" checked={form.iAm === v} onChange={() => setIAm(v)} />
                    {v === 'brother' ? 'Brother' : 'Sister'}
                  </label>
                ))}
              </div>
              <p className={s.hint}>Asked only so that the Sisters’ Circle stays women-only.</p>
              {err('iAm')}
            </fieldset>

            <fieldset className={s.field} data-field="level" {...invalid('level')}>
              <legend>Where are you with the Quran?</legend>
              <div className={s.optionsCol}>
                {LEVELS.map(l => (
                  <label key={l} className={form.level === l ? s.optionOn : s.option}>
                    <input type="radio" name="cm-level" checked={form.level === l} onChange={() => set('level', l)} />
                    {l}
                  </label>
                ))}
              </div>
              {err('level')}
            </fieldset>

            <fieldset className={s.field} data-field="circles" {...invalid('circles')}>
              <legend>
                Circles you want <span className={s.count}>{form.circles.length} of {MAX_CIRCLES}</span>
              </legend>
              <div className={s.options}>
                {CIRCLES.map(c => {
                  const on = form.circles.includes(c.id);
                  const locked = (c.id === 'sisters' && form.iAm !== 'sister') || (!on && form.circles.length >= MAX_CIRCLES);
                  return (
                    <label key={c.id} className={on ? s.optionOn : locked ? s.optionOff : s.option}>
                      <input type="checkbox" checked={on} disabled={locked} onChange={() => toggleCircle(c.id)} />
                      {c.name}
                    </label>
                  );
                })}
              </div>
              <p className={s.hint}>
                Choose up to three. <Link href={to('/circles')}>What each circle does</Link>
              </p>
              {err('circles')}
            </fieldset>

            <div className={s.field} data-field="reason">
              <label htmlFor="cm-reason">Why do you want to join?</label>
              <textarea id="cm-reason" rows={4} placeholder="What you are working on, and what has been hard about doing it alone." value={form.reason} onChange={e => set('reason', e.target.value)} {...invalid('reason')} />
              {err('reason')}
            </div>

            <div className={s.field} data-field="referredBy">
              <label htmlFor="cm-ref">
                Referred by <span className={s.optional}>optional</span>
              </label>
              <input id="cm-ref" type="text" placeholder="The name of a member who invited you" value={form.referredBy} onChange={e => set('referredBy', e.target.value)} />
            </div>

            <div className={s.field} data-field="agree">
              <label className={s.agree}>
                <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); setErrors(x => ({ ...x, agree: undefined })); }} {...invalid('agree')} />
                <span>
                  I have read the <Link href={to('/guidelines')}>community guidelines</Link> and agree to uphold them.
                </span>
              </label>
              {err('agree')}
            </div>

            <button type="submit" className={`${s.btn} ${s.submit}`}>
              <MessageCircle size={18} aria-hidden="true" /> Continue on WhatsApp
            </button>
            <p className={s.hint}>
              Your application opens in WhatsApp as a message for you to send. Until you send it, nothing leaves this device.
            </p>
          </form>

          <aside className={s.aside}>
            <h2 className={s.h3}>What happens next</h2>
            <ol className={s.asideSteps}>
              {NEXT.map((n, i) => (
                <li key={n.title}>
                  <span className={s.stepNo}>{i + 1}</span>
                  <div>
                    <b>{n.title}</b>
                    <p>{n.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <ul className={s.assurances}>
              <li><Check size={16} aria-hidden="true" /> Free to join</li>
              <li><Check size={16} aria-hidden="true" /> Every level is welcome</li>
              <li><Check size={16} aria-hidden="true" /> Your number is used only to reach you about your application and your circles</li>
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
