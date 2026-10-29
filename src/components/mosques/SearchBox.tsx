'use client';
import { forwardRef, useEffect, useId, useState } from 'react';
import { displayName, type Mosque } from '@/lib/mosques';
import { suggestPlaces, type LatLng, type Place } from './client';
import { Icon } from './MosqueCard';

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** mosques already loaded whose name matches — searched locally, no request */
  mosqueMatches?: Mosque[];
  onPickMosque?: (m: Mosque) => void;
  onPickPlace: (p: Place) => void;
  bias?: LatLng | null;
  placeholder: string;
}

type Option = { kind: 'mosque'; m: Mosque } | { kind: 'place'; p: Place };

const SearchBox = forwardRef<HTMLInputElement, Props>(function SearchBox(
  { value, onChange, mosqueMatches = [], onPickMosque, onPickPlace, bias, placeholder }, ref,
) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);

  const q = value.trim();
  useEffect(() => {
    if (q.length < 2) { setPlaces([]); setFailed(false); return; }
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      setBusy(true);
      suggestPlaces(q, bias, ctrl.signal)
        .then(p => { setPlaces(p); setFailed(false); })
        .catch(() => { if (!ctrl.signal.aborted) { setPlaces([]); setFailed(true); } })
        .finally(() => { if (!ctrl.signal.aborted) setBusy(false); });
    }, 350);
    return () => { window.clearTimeout(t); ctrl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const options: Option[] = [
    ...mosqueMatches.slice(0, 4).map(m => ({ kind: 'mosque' as const, m })),
    ...places.map(p => ({ kind: 'place' as const, p })),
  ];
  const show = open && q.length >= 2;

  const pick = (o: Option) => {
    setOpen(false);
    setActive(-1);
    if (o.kind === 'mosque') onPickMosque?.(o.m);
    else onPickPlace(o.p);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(options.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(-1, a - 1)); }
    else if (e.key === 'Escape') { setOpen(false); setActive(-1); }
    else if (e.key === 'Enter') {
      const o = options[active] ?? options.find(x => x.kind === 'place');
      if (o) { e.preventDefault(); pick(o); }
    }
  };

  return (
    <div className="mq-search">
      <Icon name="search" className="mq-search-icon" />
      <input
        ref={ref}
        type="search"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKey}
        autoComplete="off"
      />
      {show && (
        <ul className="mq-suggest" id={listId} role="listbox">
          {options.map((o, i) => (
            <li
              key={o.kind === 'mosque' ? o.m.id : `${o.p.label}${o.p.detail}${i}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'is-active' : ''}
              onMouseDown={e => { e.preventDefault(); pick(o); }}
            >
              <Icon name={o.kind === 'mosque' ? 'mosque' : 'location_on'} />
              <span>
                <b>{o.kind === 'mosque' ? displayName(o.m) : o.p.label}</b>
                <small>{o.kind === 'mosque' ? 'Mosque in these results' : o.p.detail || 'Place'}</small>
              </span>
            </li>
          ))}
          {!options.length && (
            <li className="mq-suggest-empty" role="presentation">
              {busy ? 'Searching…' : failed ? 'Place search is unavailable right now.' : 'No matching places'}
            </li>
          )}
        </ul>
      )}
    </div>
  );
});

export default SearchBox;
