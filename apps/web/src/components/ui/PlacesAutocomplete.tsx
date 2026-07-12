/**
 * PlacesAutocomplete
 * ─────────────────────────────────────────────────────────────
 * A self-contained Google Maps Places Autocomplete input.
 * • Lazy-loads the Maps JS SDK (only once per page).
 * • Shows an inline dropdown when the SDK is unavailable
 *   (falls back gracefully — the plain <input> still works).
 * • Calls onSelect with a structured address object so the
 *   parent never needs to talk to the Maps API directly.
 *
 * Props
 *   value        – controlled string value for the input
 *   onChange     – fires on every keystroke (string)
 *   onSelect     – fires when the user picks a suggestion
 *   placeholder  – input placeholder text
 *   inputStyle   – optional inline style override for the <input>
 *   inputClass   – optional className override for the <input>
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

const GMAP_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_KEY ?? '';

export interface PlaceResult {
  formatted: string;   // full formatted address
  street: string;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  inputStyle?: React.CSSProperties;
  inputClass?: string;
  required?: boolean;
}

// ── Singleton loader ──────────────────────────────────────────────────────────
let _mapsLoaded = false;
let _mapsLoading = false;
const _mapsCallbacks: Array<() => void> = [];

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if (_mapsLoaded || (window as any).google?.maps?.places) {
      _mapsLoaded = true;
      resolve();
      return;
    }
    _mapsCallbacks.push(resolve);
    if (_mapsLoading) return;          // already in flight — just queue
    if (!GMAP_KEY) { resolve(); return; } // no key — resolve immediately (graceful)

    _mapsLoading = true;
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_KEY}&libraries=places&loading=async`;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      _mapsLoaded = true;
      _mapsLoading = false;
      _mapsCallbacks.splice(0).forEach((cb) => cb());
    };
    s.onerror = () => {
      _mapsLoading = false;
      _mapsCallbacks.splice(0).forEach((cb) => cb()); // resolve anyway — fallback
    };
    document.head.appendChild(s);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PlacesAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing an address…',
  inputStyle,
  inputClass,
  required,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<any>(null);
  const [ready, setReady] = useState(_mapsLoaded);
  const [loading, setLoading] = useState(false);
  const [noKey, setNoKey] = useState(!GMAP_KEY);

  // ── Wire up Autocomplete once the SDK is ready ────────────────────────────
  const wireAutocomplete = useCallback(() => {
    const g = (window as any).google;
    if (!g?.maps?.places || !inputRef.current || acRef.current) return;

    const ac = new g.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'in' },
      fields: ['formatted_address', 'address_components', 'geometry'],
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place) return;

      let street = '', city = '', state = '', pincode = '';

      for (const c of place.address_components ?? []) {
        const t = c.types as string[];
        if (t.includes('street_number') || t.includes('route'))
          street = street ? `${street} ${c.long_name}` : c.long_name;
        if (t.includes('sublocality_level_1') || t.includes('sublocality'))
          street = street ? `${street}, ${c.long_name}` : c.long_name;
        if (t.includes('locality'))          city    = c.long_name;
        if (t.includes('administrative_area_level_1')) state   = c.long_name;
        if (t.includes('postal_code'))       pincode = c.long_name;
      }

      const lat = place.geometry?.location?.lat() ?? null;
      const lng = place.geometry?.location?.lng() ?? null;

      const formatted = place.formatted_address ?? value;
      onChange(formatted);
      onSelect({ formatted, street, city, state, pincode, lat, lng });
    });

    acRef.current = ac;
  }, [onChange, onSelect, value]);

  useEffect(() => {
    if (!GMAP_KEY) { setNoKey(true); return; }
    if (_mapsLoaded) { setReady(true); return; }

    setLoading(true);
    loadGoogleMaps().then(() => {
      setReady(true);
      setLoading(false);
    });
  }, []);

  // Wire up autocomplete when both the DOM ref and SDK are available
  useEffect(() => {
    if (ready && inputRef.current) wireAutocomplete();
  }, [ready, wireAutocomplete]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <MapPin
          size={15}
          style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)',
            color: ready ? '#3b82f6' : '#9ca3af',
            pointerEvents: 'none', flexShrink: 0,
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            loading ? 'Loading Maps…' :
            noKey   ? placeholder :
                      placeholder
          }
          autoComplete="off"
          className={inputClass}
          style={{
            paddingLeft: 32,
            paddingRight: loading ? 32 : undefined,
            ...inputStyle,
          }}
        />
        {loading && (
          <Loader2
            size={14}
            style={{
              position: 'absolute', right: 10, top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af', animation: 'spin 0.8s linear infinite',
            }}
          />
        )}
      </div>

      {/* No-key notice — only shown in dev so owner knows to configure it */}
      {noKey && import.meta.env.DEV && (
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#f59e0b' }}>
          ⚠ Set <code>VITE_GOOGLE_MAPS_KEY</code> in <code>.env</code> to enable autocomplete
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
