'use client';
import { useRef, useState } from 'react';
import { exportBackup, readBackupFile } from '../lib/storage';
import { useGarden } from '../state/GardenProvider';
import s from '../game.module.css';

export default function BackupPanel() {
  const { state, dispatch, eraseEverything } = useGarden();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section className={s.card} id="backup" aria-labelledby="gd-backup">
      <h2 id="gd-backup" className={s.cardTitle}>
        Backup
      </h2>
      <p>
        Your garden lives only in this browser. Clearing site data removes it, and some browsers delete it after a few weeks
        without a visit. Keep a backup file somewhere safe.
      </p>
      <p className={s.refLine}>
        Last backup: {state.lastBackupAt ? new Date(state.lastBackupAt).toLocaleDateString() : 'never'}
      </p>
      <div className={s.rowBtns}>
        <button
          type="button"
          className={s.primaryBtn}
          onClick={() => {
            if (!window.confirm('Download a backup file of your garden?')) return;
            const at = new Date();
            exportBackup({ ...state, lastBackupAt: at.toISOString() }, at);
            dispatch({ type: 'backedUp', at: at.toISOString() });
            setMsg('Backup downloaded.');
          }}
        >
          Export
        </button>
        <button type="button" className={s.ghostBtn} onClick={() => fileRef.current?.click()}>
          Import
        </button>
        <button
          type="button"
          className={s.dangerBtn}
          onClick={() => {
            if (!window.confirm('Erase all garden data on this device? This cannot be undone. Export a backup first if you want to keep it.')) return;
            eraseEverything();
            setMsg('All garden data on this device was erased.');
          }}
        >
          Erase all data
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className={s.srOnly}
        tabIndex={-1}
        aria-hidden
        onChange={async e => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          try {
            const next = await readBackupFile(file);
            if (!window.confirm('Replace your current garden with this backup?')) return;
            dispatch({ type: 'importState', state: next });
            setMsg('Backup restored.');
          } catch (err) {
            setMsg(err instanceof Error ? err.message : 'That file could not be read.');
          }
        }}
      />
      {msg && (
        <p role="status" className={s.note}>
          {msg}
        </p>
      )}
    </section>
  );
}
