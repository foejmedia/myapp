'use client';
/** Homepage colour palette: five themes that recolour the whole app (saved on this device). */
import { useTheme } from '@/components/ThemeProvider';
import { PALETTES } from '@/lib/palette';
import s from './PalettePicker.module.css';

export default function PalettePicker() {
  const { palette, setPalette } = useTheme();

  return (
    <section className={s.wrap} aria-labelledby="palette-title">
      <div className={s.text}>
        <h2 id="palette-title" className={s.title}>Colour theme</h2>
        <p className={s.sub}>Pick a colour for the whole app. It stays on this device.</p>
      </div>
      <div className={s.swatches} role="radiogroup" aria-labelledby="palette-title">
        {PALETTES.map(p => {
          const on = palette === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`${s.swatch} ${on ? s.on : ''}`}
              onClick={() => setPalette(p.id)}
              title={`${p.name} (${p.mode})`}
            >
              <span className={s.chip} style={{ ['--b' as string]: p.bg, ['--a' as string]: p.accent }} aria-hidden="true">
                <i />
                {on && (
                  <svg viewBox="0 0 24 24" className={s.tick}>
                    <path d="M5 12.5l4.2 4.2L19 7" />
                  </svg>
                )}
              </span>
              <span className={s.name}>{p.name}</span>
            </button>
          );
        })}
        {palette && (
          <button type="button" className={s.reset} onClick={() => setPalette(null)}>
            Reset
          </button>
        )}
      </div>
    </section>
  );
}
