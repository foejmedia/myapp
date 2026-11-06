'use client';

/**
 * Mosque search on Google Maps, embedded. Free: the Maps Embed API has no usage charge.
 * Set NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY (a key restricted to this site, with only the
 * "Maps Embed API" enabled). Without a key it falls back to Google's keyless embed link,
 * which works but isn't an officially supported API.
 *
 * Google's embed only finds mosques from a place name ("mosques in Anjanapura, Bengaluru");
 * given bare coordinates it shows the map with no results. GPS positions are therefore turned
 * into an area name first (see /api/geocode).
 */
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

export const embedUrl = (place: string) => {
  const q = encodeURIComponent(`mosques in ${place}`);
  return KEY ? `https://www.google.com/maps/embed/v1/search?key=${KEY}&q=${q}` : `https://maps.google.com/maps?q=${q}&output=embed`;
};

/**
 * The same search in the Google Maps app or site (Maps URLs: free, no key). Without a place,
 * "near me" lets Google Maps use the device's own precise location.
 */
export const openUrl = (place?: string | null) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place ? `mosques in ${place}` : 'mosques near me')}`;

export default function GoogleMapEmbed({ place }: { place: string }) {
  return (
    <iframe
      className="mq-map"
      title={`Google Maps: mosques in ${place}`}
      src={embedUrl(place)}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}
