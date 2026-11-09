'use client';
/** Sign in: pick a profile on this device or create one. */
import { useState } from 'react';
import { useLearn } from '../store/LearnProvider';
import { IconArrow, IconUser } from './Icons';
import s from '../learn.module.css';

export default function Welcome() {
  const { profiles, signIn, signUp, authKind } = useLearn();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <section className={s.welcome} aria-labelledby="l1m-welcome">
      <p className={s.eyebrow}>Learn in 1 Minute</p>
      <h1 id="l1m-welcome" className={s.welcomeTitle}>
        One minute a day with the words of the Qur’an
      </h1>
      <p className={s.lead}>
        Learn Qur’anic vocabulary, daily duas and surahs in short daily lessons, with revision that brings words back just
        before you forget them.
      </p>

      {profiles.length > 0 && (
        <div className={s.profileList}>
          <p className={s.label}>Continue as</p>
          {profiles.map(p => (
            <button key={p.id} type="button" className={s.profileBtn} onClick={() => signIn(p.id)}>
              <span className={s.avatar}>{p.name.slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{p.name}</strong>
                <small>Since {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</small>
              </span>
              <IconArrow className={s.i18} />
            </button>
          ))}
        </div>
      )}

      <form
        className={s.welcomeForm}
        onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await signUp(name);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create the profile.');
            setBusy(false);
          }
        }}
      >
        <label htmlFor="l1m-name" className={s.label}>
          {profiles.length ? 'Or create a new profile' : 'What should we call you?'}
        </label>
        <div className={s.inputRow}>
          <IconUser className={s.i18} />
          <input id="l1m-name" value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder="Your name" autoComplete="given-name" required />
          <button type="submit" className={s.btnPrimary} disabled={busy || !name.trim()}>
            Start learning
          </button>
        </div>
        {error && (
          <p className={s.formError} role="alert">
            {error}
          </p>
        )}
      </form>
      <p className={s.fine}>
        {authKind}: profiles and progress stay in this browser. There is no password, so anyone using this browser can open
        them. You can export your progress from Account at any time.
      </p>
    </section>
  );
}
