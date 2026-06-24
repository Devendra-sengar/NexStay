import { useEffect, useRef } from 'react';
import type { PublicProperty } from '@/lib/publicApi';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const HIGHLIGHTED_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const DEFAULT_INDIA = { lat: 20.5937, lng: 78.9629, zoom: 5 };

interface MapViewProps {
  properties: PublicProperty[];
  highlightedId?: string;
  onPinClick?: (id: string) => void;
}

export default function MapView({ properties, highlightedId, onPinClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current).setView(
      [DEFAULT_INDIA.lat, DEFAULT_INDIA.lng],
      DEFAULT_INDIA.zoom
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Add/update markers when properties change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      if (!properties.find(p => p._id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    const geoProps = properties.filter(p => p.latitude && p.longitude);

    geoProps.forEach(p => {
      const isHighlighted = p._id === highlightedId;
      const icon = isHighlighted ? HIGHLIGHTED_ICON : new L.Icon.Default();

      if (markersRef.current[p._id]) {
        markersRef.current[p._id].setIcon(icon);
        return;
      }

      const price = (p.startingPrice || (p as any).rentStartingFrom || 0).toLocaleString('en-IN');
      const popup = L.popup({ closeButton: false, maxWidth: 200 }).setContent(`
        <div style="font-family:Inter,sans-serif;min-width:160px">
          <p style="font-weight:700;font-size:13px;margin:0 0 2px;color:#0f172a">${p.name}</p>
          <p style="font-size:11px;color:#64748b;margin:0 0 6px">${p.locality ?? ''}${p.locality ? ', ' : ''}${p.city}</p>
          <p style="font-weight:700;color:#16a34a;font-size:13px;margin:0 0 8px">From ₹${price}/mo</p>
          <a href="/property/${p._id}"
            style="display:block;text-align:center;background:#2563eb;color:#fff;padding:5px 10px;border-radius:8px;font-size:11px;font-weight:600;text-decoration:none">
            View Details
          </a>
        </div>
      `);

      const marker = L.marker([p.latitude!, p.longitude!], { icon })
        .addTo(map)
        .bindPopup(popup);

      marker.on('click', () => {
        onPinClick?.(p._id);
        marker.openPopup();
      });

      markersRef.current[p._id] = marker;
    });

    // Auto-pan to fit all pins
    if (geoProps.length > 0) {
      const bounds = L.latLngBounds(geoProps.map(p => [p.latitude!, p.longitude!]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [properties, highlightedId, onPinClick]);

  // Highlight marker when highlightedId changes
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      marker.setIcon(id === highlightedId ? HIGHLIGHTED_ICON : new L.Icon.Default());
      if (id === highlightedId) marker.openPopup();
    });
  }, [highlightedId]);

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: 400 }} />
  );
}
