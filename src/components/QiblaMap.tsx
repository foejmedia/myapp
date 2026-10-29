'use client';
import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KAABA, pathToKaaba } from '@/lib/qibla';

/** Great-circle line from the user to the Kaaba. Leaflet touches `window` on import, so it loads in the effect. */
export default function QiblaMap({ lat, lng }: { lat: number; lng: number }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: LeafletMap | null = null;
    let cancelled = false;
    import('leaflet').then(L => {
      if (cancelled || !el.current) return;
      map = L.map(el.current, { worldCopyJump: true, scrollWheelZoom: false, attributionControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const path = pathToKaaba(lat, lng);
      const line = L.polyline(path, { color: '#0b5d43', weight: 3, dashArray: '8 6' }).addTo(map);
      // the path's longitudes are unwrapped, so the Kaaba sits at its far end, not at KAABA.lng
      const end = path[path.length - 1] ?? [KAABA.lat, KAABA.lng];
      L.circleMarker([lat, lng], { radius: 7, color: '#ffffff', weight: 3, fillColor: '#0b5d43', fillOpacity: 1 })
        .bindTooltip('You').addTo(map);
      L.marker(end, {
        icon: L.divIcon({ className: 'qb-map-kaaba', html: '<span></span>', iconSize: [22, 22] }),
      }).bindTooltip('Kaaba, Makkah').addTo(map);

      if (path.length > 1) map.fitBounds(line.getBounds(), { padding: [28, 28] });
      else map.setView([lat, lng], 14);
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng]);

  return <div ref={el} className="qb-map" role="img" aria-label="Map showing the direction from your location to the Kaaba" />;
}
