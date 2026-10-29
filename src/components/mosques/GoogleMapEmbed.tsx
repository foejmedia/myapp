'use client';
import type { LatLng } from './client';

/**
 * Google's own mosque search, embedded. Free: the Maps Embed API has no usage charge.
 * Set NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY (a key restricted to this site, with only the
 * "Maps Embed API" enabled). Without a key it falls back to Google's keyless embed link,
 * which works but isn't an officially supported API.
 *
 * It's an iframe, so Google's results stay inside it — our list and filters still use
 * OpenStreetMap. Reading Google's results into the page needs the paid Places API.
 */
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

const ZOOM: Record<number, number> = { 1: 15, 5: 13, 10: 12, 25: 11, 50: 10 };

export function googleEmbedUrl(center: LatLng, radiusKm: number) {
  const zoom = ZOOM[radiusKm] ?? 13;
  const at = `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`;
  return KEY
    ? `https://www.google.com/maps/embed/v1/search?key=${KEY}&q=${encodeURIComponent('mosque')}&center=${at}&zoom=${zoom}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(`mosque near ${at}`)}&ll=${at}&z=${zoom}&output=embed`;
}

/** One spot (a mosque's details page) */
export function googlePlaceUrl(at: LatLng) {
  const q = `${at.lat.toFixed(6)},${at.lng.toFixed(6)}`;
  return KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${KEY}&q=${q}&zoom=17`
    : `https://maps.google.com/maps?q=${q}&z=17&output=embed`;
}

interface Props {
  /** area search around a centre, or a single place */
  center: LatLng;
  radiusKm?: number;
  place?: boolean;
  title: string;
  className?: string;
}

export default function GoogleMapEmbed({ center, radiusKm = 5, place, title, className }: Props) {
  return (
    <iframe
      className={`mq-map mq-gmap ${className ?? ''}`}
      title={title}
      src={place ? googlePlaceUrl(center) : googleEmbedUrl(center, radiusKm)}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}
