'use client';
import { useRef, useState } from 'react';
import { computeStats } from '../lib/stats';
import { useLearn } from '../store/LearnProvider';
import { IconArrow } from './Icons';
import { PageHeader, Ready } from './ui';
import s from '../learn.module.css';

function Inner() {
  const { profile, profiles, data, clock, authKind, rename, signIn, signOut, signUp, deleteProfile, importData } = useLearn();
  const [name, setName] = useState(profile?.name ?? '');
  const [newName, setNewName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const stats = computeStats(data, clock!.today);
  if (!profile) return null;

  return (
    <>
      <PageHeader eyebrow="Account" title={profile.name} lead={`${authKind}. Learning since ${new Date(data.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.`} />
      <div className={s.accountGrid}>
        <section className={s.card} aria-labelledby="acc-profile">
          <h2 id="acc-profile" className={s.cardTitle}>
            Profile
          </h2>
          <form
            className={s.inlineForm}
            onSubmit={async e => {
              e.preventDefault();
              await rename(name);
              setMsg('Name updated.');
            }}
          >
            <label className={s.field}>
              <span>Display name</span>
              <input value={name} onChange={e => setName(e.target.value)} maxLength={40} required />
            </label>
            <button type="submit" className={s.btnGhost} disabled={!name.trim() || name.trim() === profile.name}>
              Save
            </button>
          </form>
          <dl className={s.facts}>
            <div>
              <dt>Days learned</dt>
              <dd>{stats.totalDays}</dd>
            </div>
            <div>
              <dt>Words in revision</dt>
              <dd>{stats.vocab.learned}</dd>
            </div>
            <div>
              <dt>Saved items</dt>
              <dd>{stats.savedCount}</dd>
            </div>
          </dl>
          <button type="button" className={s.btnGhost} onClick={() => signOut()}>
            Sign out
          </button>
        </section>

        <section className={s.card} aria-labelledby="acc-switch">
          <h2 id="acc-switch" className={s.cardTitle}>
            Profiles on this device
          </h2>
          <p className={s.muted}>Each profile keeps its own progress — useful for family members sharing a device.</p>
          <ul className={s.profileRows}>
            {profiles.map(p => (
              <li key={p.id}>
                <span className={s.avatar}>{p.name.slice(0, 1).toUpperCase()}</span>
                <span className={s.grow}>{p.name}</span>
                {p.id === profile.id ? (
                  <span className={s.muted}>Current</span>
                ) : (
                  <>
                    <button type="button" className={s.btnGhostSm} onClick={() => signIn(p.id)}>
                      Switch <IconArrow className={s.i14} />
                    </button>
                    <button
                      type="button"
                      className={s.btnDangerSm}
                      onClick={() => window.confirm(`Delete ${p.name} and all of their progress on this device? This cannot be undone.`) && deleteProfile(p.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <form
            className={s.inlineForm}
            onSubmit={async e => {
              e.preventDefault();
              await signUp(newName);
            }}
          >
            <label className={s.field}>
              <span>Add a profile</span>
              <input value={newName} onChange={e => setNewName(e.target.value)} maxLength={40} placeholder="Name" />
            </label>
            <button type="submit" className={s.btnGhost} disabled={!newName.trim()}>
              Create
            </button>
          </form>
        </section>

        <section className={s.card} aria-labelledby="acc-data">
          <h2 id="acc-data" className={s.cardTitle}>
            Your data
          </h2>
          <p className={s.muted}>
            Progress is stored only in this browser. Export a backup to keep it safe or to move it to another device.
          </p>
          <div className={s.row}>
            <button
              type="button"
              className={s.btnGhost}
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `learn-1-min-${profile.name.replace(/\W+/g, '-').toLowerCase()}-${clock!.today}.json`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              Export progress
            </button>
            <button type="button" className={s.btnGhost} onClick={() => file.current?.click()}>
              Import progress
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className={s.srOnly}
              tabIndex={-1}
              aria-hidden
              onChange={async e => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                try {
                  const raw = JSON.parse(await f.text());
                  if (!window.confirm(`Replace ${profile.name}’s progress with this backup?`)) return;
                  importData(raw);
                  setMsg('Progress imported.');
                } catch {
                  setMsg('That file is not a Learn in 1 Minute backup.');
                }
              }}
            />
            <button
              type="button"
              className={s.btnDangerSm}
              onClick={() => window.confirm(`Delete ${profile.name} and all of their progress on this device? This cannot be undone.`) && deleteProfile(profile.id)}
            >
              Delete this profile
            </button>
          </div>
          {msg && (
            <p className={s.notice} role="status">
              {msg}
            </p>
          )}
        </section>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <Ready>
      <Inner />
    </Ready>
  );
}
