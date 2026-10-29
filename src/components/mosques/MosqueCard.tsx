'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FACILITIES, displayName, formatDistance, links, type Mosque } from '@/lib/mosques';

interface Props {
  mosque: Mosque;
  distanceKm: number | null;
  /** "from you" / "from Lahore" */
  distanceFrom: string;
  selected?: boolean;
  onSelect?: () => void;
  onClose?: () => void;
  variant?: 'list' | 'preview';
}

export function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ''}`} aria-hidden="true">{name}</span>;
}

export function CommunityBadge() {
  return (
    <span className="mq-badge" title="From OpenStreetMap, mapped by volunteers. Not verified by the mosque.">
      <Icon name="groups" /> Community-mapped
    </span>
  );
}

export default function MosqueCard({ mosque: m, distanceKm, distanceFrom, selected, onSelect, onClose, variant = 'list' }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const has = FACILITIES.filter(f => m.facilities[f.key] === true);
  const name = displayName(m);

  return (
    <article
      className={`mq-card mq-card-${variant}${selected ? ' is-selected' : ''}`}
      aria-label={name}
      onClick={onSelect}
    >
      {m.image && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="mq-card-img" src={m.image} alt={`Photo of ${name}`} loading="lazy" onError={() => setImgFailed(true)} />
      ) : (
        <div className="mq-card-img is-empty" aria-hidden="true"><Icon name="mosque" /></div>
      )}

      <div className="mq-card-body">
        <div className="mq-card-top">
          <h3 className={m.name ? '' : 'is-unnamed'}>{name}</h3>
          {onClose && (
            <button type="button" className="mq-icon-btn" aria-label="Close preview" onClick={e => { e.stopPropagation(); onClose(); }}>
              <Icon name="close" />
            </button>
          )}
        </div>
        {m.nameAr && <p className="mq-card-ar" lang="ar" dir="rtl">{m.nameAr}</p>}

        <p className="mq-card-meta">
          {distanceKm != null && <b>{formatDistance(distanceKm)}</b>}
          {distanceKm != null && <span> {distanceFrom}</span>}
        </p>
        <p className={`mq-card-addr${m.address ? '' : ' is-missing'}`}>
          {m.address ?? 'Street address not recorded — see the map for its location'}
        </p>

        {has.length > 0 && (
          <ul className="mq-facs" aria-label="Facilities">
            {has.slice(0, 4).map(f => (
              <li key={f.key}><Icon name={f.icon} />{f.key === 'wheelchair' && m.wheelchair === 'limited' ? 'Limited wheelchair access' : f.label}</li>
            ))}
            {has.length > 4 && <li>+{has.length - 4} more</li>}
          </ul>
        )}

        <div className="mq-card-actions">
          <a
            className="mq-btn primary"
            href={links.google(m)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            <Icon name="directions" /> Directions
          </a>
          <Link className="mq-btn" href={`/mosques/${m.id}`} onClick={e => e.stopPropagation()}>
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
