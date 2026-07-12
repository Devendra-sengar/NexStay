import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Check, Loader2, MapPin, Plus, Trash2,
  Wifi, Utensils, Car, Shield, Shirt, Camera, Wind, Flame, X as XIcon
} from 'lucide-react';
import { useCreateProperty } from '@/lib/adminApi';
import CloudinaryUpload from '@/components/ui/CloudinaryUpload';
import PlacesAutocomplete, { PlaceResult } from '@/components/ui/PlacesAutocomplete';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RoomSetup { roomType: string; count: number; pricePerBed: number }

interface FormState {
  // Step 1
  name: string; description: string; city: string; locality: string;
  address: string; state: string; pincode: string; gender: string; landmark: string;
  // Step 2
  latitude: number | ''; longitude: number | '';
  // Step 3
  amenities: string[]; customFacilities: string[]; nearbyPlaces: { name: string; distance: string }[]; rules: string; foodIncluded: boolean;
  // Step 4
  images: string[]; videoUrl: string;
  // Step 5
  roomSetups: RoomSetup[];
}

const STEPS = ['Basic Info','Location','Amenities','Images','Rooms','Review & Submit'];

const GENDER_OPTIONS = [
  { value:'BOYS', label:'Boys PG', icon:'♂', color:'bg-blue-50 border-blue-300 text-blue-700' },
  { value:'GIRLS', label:'Girls PG', icon:'♀', color:'bg-pink-50 border-pink-300 text-pink-700' },
  { value:'CO_ED', label:'Co-Living', icon:'⚡', color:'bg-violet-50 border-violet-300 text-violet-700' },
];

const AMENITY_OPTIONS = [
  { key:'WIFI', label:'WiFi', icon: Wifi },
  { key:'FOOD', label:'Food Included', icon: Utensils },
  { key:'PARKING', label:'Parking', icon: Car },
  { key:'SECURITY', label:'Security', icon: Shield },
  { key:'LAUNDRY', label:'Laundry', icon: Shirt },
  { key:'CCTV', label:'CCTV', icon: Camera },
  { key:'AC', label:'AC Rooms', icon: Wind },
  { key:'POWER_BACKUP', label:'Power Backup', icon: Flame },
];

const ROOM_TYPE_OPTIONS = ['SINGLE','DOUBLE','TRIPLE','FOUR_SHARING'];
const ROOM_CAPACITY: Record<string, number> = { SINGLE:1, DOUBLE:2, TRIPLE:3, FOUR_SHARING:4 };
const ROOM_LABELS: Record<string, string> = { SINGLE:'Single', DOUBLE:'Double', TRIPLE:'Triple', FOUR_SHARING:'4-Sharing' };

const INITIAL: FormState = {
  name:'', description:'', city:'', locality:'', address:'', state:'', pincode:'', gender:'BOYS', landmark:'',
  latitude:'', longitude:'', amenities:[], customFacilities:[], nearbyPlaces:[], rules:'', foodIncluded:false,
  images:[], videoUrl:'', roomSetups:[{ roomType:'DOUBLE', count:1, pricePerBed:6000 }],
};

// ─── StepBar ──────────────────────────────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center mb-8 overflow-x-auto no-scrollbar">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-shrink-0">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-surface-border text-text-muted'}`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium hidden sm:block ${i === step ? 'text-primary' : i < step ? 'text-green-600' : 'text-text-muted'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-8 sm:w-12 mx-1 mb-4 flex-shrink-0 transition-colors ${i < step ? 'bg-green-400' : 'bg-surface-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddPropertyForm({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const createMutation = useCreateProperty();
  const [customFacilityInput, setCustomFacilityInput] = useState('');

  const set = useCallback((patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch })), []);

  const handlePlaceSelect = useCallback((place: PlaceResult) => {
    set({
      address:  place.formatted,
      city:     place.city     || form.city,
      state:    place.state    || form.state,
      pincode:  place.pincode  || form.pincode,
      locality: place.street   || form.locality,
      ...(place.lat != null ? { latitude:  place.lat } : {}),
      ...(place.lng != null ? { longitude: place.lng } : {}),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.city, form.state, form.pincode, form.locality]);

  // ── Validation per step ────────────────────────────────────────────────────
  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = 'Property name is required';
      if (!form.city.trim()) e.city = 'City is required';
      if (!form.address.trim()) e.address = 'Address is required';
      if (!form.state.trim()) e.state = 'State is required';
      if (!form.gender) e.gender = 'Gender type is required';
    }
    if (s === 1) {
      if (form.latitude === '' || form.longitude === '') e.coords = 'Coordinates are required. Right-click on Google Maps → "What\'s here?" to get them.';
    }
    if (s === 3 && form.images.length < 1) e.images = 'Please upload at least 1 image';
    if (s === 4 && form.roomSetups.length === 0) e.roomSetups = 'Add at least 1 room type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate(step)) return;
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync({
        ...form,
        latitude: form.latitude !== '' ? form.latitude : undefined,
        longitude: form.longitude !== '' ? form.longitude : undefined,
        foodIncluded: form.amenities.includes('FOOD') || form.foodIncluded,
      });
      setSubmitted(true);
    } catch {}
  };

  const addRoomSetup = () => set({ roomSetups: [...form.roomSetups, { roomType:'SINGLE', count:1, pricePerBed:5000 }] });

  const totalRooms = form.roomSetups.reduce((s, r) => s + r.count, 0);
  const totalBeds = form.roomSetups.reduce((s, r) => s + r.count * (ROOM_CAPACITY[r.roomType] ?? 1), 0);

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Property Submitted!</h2>
        <p className="text-text-secondary text-sm mb-6">
          Your property is under review. NexStay will verify it within 24 hours and notify you once it's approved and live.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/admin/properties')} className="btn-primary">View My Properties</button>
          <button onClick={() => { setForm(INITIAL); setStep(0); setSubmitted(false); }} className="btn-secondary">Add Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepBar step={step} />

      {/* ── Step 0: Basic Info ─────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary mb-1">Basic Information</h2>

          {/* Property Name */}
          <div>
            <label className="form-label">Property Name *</label>
            <input className={`input-field ${errors.name ? 'border-red-400' : ''}`} value={form.name}
              onChange={e => set({ name: e.target.value })} placeholder="e.g. Green Valley PG" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description</label>
            <textarea className="input-field" rows={3} value={form.description}
              onChange={e => set({ description: e.target.value })} placeholder="Describe your PG — facilities, neighbourhood, highlights..." />
          </div>

          {/* Gender Type */}
          <div>
            <label className="form-label">Gender Type *</label>
            <div className="grid grid-cols-3 gap-3 mt-1">
              {GENDER_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => set({ gender: opt.value })}
                  className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.gender === opt.value ? opt.color + ' scale-[1.02]' : 'border-surface-border text-text-muted hover:border-primary/30'}`}>
                  <div className="text-lg mb-0.5">{opt.icon}</div>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Address Fields in logical order ─────────────────────────── */}
          <div className="rounded-2xl border border-surface-border bg-surface p-4 space-y-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Property Location</p>

            {/* Row 1 — State + Pincode */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">State *</label>
                <input className={`input-field ${errors.state ? 'border-red-400' : ''}`} value={form.state}
                  onChange={e => set({ state: e.target.value })} placeholder="e.g. Madhya Pradesh" />
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>
              <div>
                <label className="form-label">
                  Pincode{' '}
                  {form.pincode && <span className="text-emerald-600 font-normal text-[11px]">(auto-filled)</span>}
                </label>
                <input className="input-field" value={form.pincode}
                  onChange={e => set({ pincode: e.target.value })}
                  placeholder="e.g. 452010" maxLength={6} inputMode="numeric" />
              </div>
            </div>

            {/* Row 2 — City */}
            <div>
              <label className="form-label">City *</label>
              <input className={`input-field ${errors.city ? 'border-red-400' : ''}`} value={form.city}
                onChange={e => set({ city: e.target.value })} placeholder="e.g. Indore" />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            {/* Row 3 — Full Address (autocomplete) */}
            <div>
              <label className="form-label">
                Full Address *{' '}
                <span className="text-text-muted font-normal text-[11px]">— start typing for Google suggestions</span>
              </label>
              <PlacesAutocomplete
                value={form.address}
                onChange={(v) => set({ address: v })}
                onSelect={handlePlaceSelect}
                placeholder="e.g. 46, Vijay Nagar, Indore…"
                inputClass={`input-field ${errors.address ? 'border-red-400' : ''}`}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            {/* Row 4 — Locality / Area */}
            <div>
              <label className="form-label">Locality / Area</label>
              <input className="input-field" value={form.locality}
                onChange={e => set({ locality: e.target.value })}
                placeholder="e.g. Vijay Nagar, Kothrud, Sector 21" />
              <p className="text-[11px] text-text-muted mt-1">Neighbourhood or colony name (auto-filled from address)</p>
            </div>

            {/* Row 5 — Landmark */}
            <div>
              <label className="form-label">Landmark / Nearby Place</label>
              <input className="input-field" value={form.landmark}
                onChange={e => set({ landmark: e.target.value })}
                placeholder="e.g. Near SGSITS College, Opposite City Mall" />
              <p className="text-[11px] text-text-muted mt-1">Helps guests find you easily</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Location ───────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary mb-1">Location Pin <span className="text-red-500">*</span></h2>
          <p className="text-text-muted text-sm">Coordinates are <strong>required</strong>. Guests will see the map and can get directions.</p>
          <div className="bg-surface rounded-2xl border-2 border-dashed border-primary/30 p-6 text-center">
            <MapPin className="w-10 h-10 text-primary/40 mx-auto mb-3" />
            <p className="text-sm text-text-secondary font-medium mb-1">Enter coordinates manually</p>
            <p className="text-xs text-text-muted mb-4">Right-click on Google Maps → "What's here?" to get coordinates.</p>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <label className="form-label">Latitude *</label>
                <input type="number" step="0.000001" className={`input-field ${errors.coords ? 'border-red-400' : ''}`} value={form.latitude}
                  onChange={e => set({ latitude: e.target.value ? parseFloat(e.target.value) : '' })} placeholder="18.5204" />
              </div>
              <div>
                <label className="form-label">Longitude *</label>
                <input type="number" step="0.000001" className={`input-field ${errors.coords ? 'border-red-400' : ''}`} value={form.longitude}
                  onChange={e => set({ longitude: e.target.value ? parseFloat(e.target.value) : '' })} placeholder="73.8567" />
              </div>
            </div>
          </div>
          {errors.coords && <p className="text-red-500 text-xs flex items-center gap-1">⚠ {errors.coords}</p>}
          {form.latitude !== '' && form.longitude !== '' && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <Check className="w-4 h-4" /> Pin set at ({String(form.latitude)}, {String(form.longitude)})
              <a href={`https://maps.google.com/?q=${form.latitude},${form.longitude}`} target="_blank" rel="noopener noreferrer"
                className="ml-auto text-primary text-xs hover:underline">Preview on map ↗</a>
            </div>
          )}
          <p className="text-xs text-text-muted">Tip: You can find your coordinates by right-clicking on Google Maps and selecting "What's here?"</p>
        </div>
      )}

      {/* ── Step 2: Amenities ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-text-primary mb-1">Amenities & Rules</h2>
          <div>
            <label className="form-label mb-2">Available Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AMENITY_OPTIONS.map(({ key, label, icon: Icon }) => {
                const active = form.amenities.includes(key);
                return (
                  <button key={key} type="button"
                    onClick={() => set({ amenities: active ? form.amenities.filter(a => a !== key) : [...form.amenities, key] })}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${active ? 'border-primary bg-primary/5 text-primary' : 'border-surface-border text-text-muted hover:border-primary/30'}`}>
                    <Icon className="w-5 h-5" />
                    {label}
                    {active && <Check className="w-3 h-3 text-green-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Facilities — tag input */}
          <div>
            <label className="form-label">Additional Facilities <span className="text-text-muted font-normal">(e.g. Gym, Library, Hot Water)</span></label>
            <div className="flex gap-2 mt-1">
              <input
                className="input-field flex-1"
                value={customFacilityInput}
                onChange={e => setCustomFacilityInput(e.target.value)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',') && customFacilityInput.trim()) {
                    e.preventDefault();
                    const tag = customFacilityInput.trim();
                    if (!form.customFacilities.includes(tag)) set({ customFacilities: [...form.customFacilities, tag] });
                    setCustomFacilityInput('');
                  }
                }}
                placeholder="Type a facility and press Enter…"
              />
              <button type="button"
                onClick={() => {
                  const tag = customFacilityInput.trim();
                  if (tag && !form.customFacilities.includes(tag)) {
                    set({ customFacilities: [...form.customFacilities, tag] });
                    setCustomFacilityInput('');
                  }
                }}
                className="btn-secondary flex items-center gap-1 px-3 whitespace-nowrap text-sm">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            {form.customFacilities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.customFacilities.map(f => (
                  <span key={f} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                    {f}
                    <button type="button" onClick={() => set({ customFacilities: form.customFacilities.filter(x => x !== f) })}>
                      <XIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Nearby Places */}
          <div>
            <label className="form-label">Nearby Places <span className="text-text-muted font-normal">(e.g. 500 meters from SGSITS)</span></label>
            <div className="flex gap-2 mt-1">
              <input
                className="input-field flex-1"
                placeholder="Place name (e.g. SGSITS College)"
                id="nearbyName"
              />
              <input
                className="input-field w-32"
                placeholder="Distance (e.g. 500m)"
                id="nearbyDistance"
              />
              <button type="button"
                onClick={() => {
                  const nameEl = document.getElementById('nearbyName') as HTMLInputElement;
                  const distEl = document.getElementById('nearbyDistance') as HTMLInputElement;
                  if (nameEl.value.trim() && distEl.value.trim()) {
                    set({ nearbyPlaces: [...form.nearbyPlaces, { name: nameEl.value.trim(), distance: distEl.value.trim() }] });
                    nameEl.value = '';
                    distEl.value = '';
                  }
                }}
                className="btn-secondary flex items-center gap-1 px-3 whitespace-nowrap text-sm">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            {form.nearbyPlaces.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {form.nearbyPlaces.map((np, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-surface-input px-3 py-2 rounded-lg text-sm">
                    <span><span className="font-medium text-text-primary">{np.name}</span> <span className="text-text-muted">({np.distance})</span></span>
                    <button type="button" onClick={() => set({ nearbyPlaces: form.nearbyPlaces.filter((_, i) => i !== idx) })} className="text-danger hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="form-label">House Rules</label>
            <textarea className="input-field" rows={4} value={form.rules}
              onChange={e => set({ rules: e.target.value })}
              placeholder={`Visitors allowed till 9 PM\nNo smoking on premises\nQuiet hours after 10 PM`} />
          </div>
        </div>
      )}

      {/* ── Step 3: Images — Cloudinary Drag & Drop ────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary mb-1">Images & Media</h2>
            <p className="text-text-muted text-sm">Upload property photos. Minimum 3 images recommended. The first image will be the cover.</p>
          </div>

          <CloudinaryUpload
            value={form.images}
            onChange={(urls) => set({ images: urls })}
            maxImages={10}
          />

          {errors.images && (
            <p className="text-red-500 text-xs flex items-center gap-1">
              ⚠ {errors.images}
            </p>
          )}

          <div>
            <label className="form-label">Video URL (optional)</label>
            <input className="input-field" value={form.videoUrl} onChange={e => set({ videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..." />
          </div>
        </div>
      )}

      {/* ── Step 4: Rooms ──────────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary mb-1">Rooms & Pricing</h2>
          <p className="text-text-muted text-sm">Configure how many rooms of each type your property has, and the price per bed per month.</p>
          {errors.roomSetups && <p className="text-red-500 text-xs">{errors.roomSetups}</p>}
          <div className="space-y-3">
            {form.roomSetups.map((rs, i) => (
              <div key={i} className="card p-4 border-2 border-surface-border">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="form-label text-[10px]">Room Type</label>
                        <select className="input-field text-sm py-2" value={rs.roomType}
                          onChange={e => {
                            const up = [...form.roomSetups];
                            up[i] = { ...up[i], roomType: e.target.value };
                            set({ roomSetups: up });
                          }}>
                          {ROOM_TYPE_OPTIONS.map(rt => (
                            <option key={rt} value={rt}>{ROOM_LABELS[rt]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label text-[10px]">No. of Rooms</label>
                        <input type="number" min={1} max={50} className="input-field text-sm py-2" value={rs.count}
                          onChange={e => {
                            const up = [...form.roomSetups];
                            up[i] = { ...up[i], count: Math.max(1, parseInt(e.target.value) || 1) };
                            set({ roomSetups: up });
                          }} />
                      </div>
                      <div>
                        <label className="form-label text-[10px]">Price/Bed (₹/mo)</label>
                        <input type="number" min={500} className="input-field text-sm py-2" value={rs.pricePerBed}
                          onChange={e => {
                            const up = [...form.roomSetups];
                            up[i] = { ...up[i], pricePerBed: parseInt(e.target.value) || 0 };
                            set({ roomSetups: up });
                          }} />
                      </div>
                    </div>
                    <p className="text-xs text-text-muted">
                      → Creates <strong>{rs.count}</strong> {ROOM_LABELS[rs.roomType]} room{rs.count > 1 ? 's' : ''} with <strong>{rs.count * (ROOM_CAPACITY[rs.roomType] ?? 1)}</strong> beds
                    </p>
                  </div>
                  {form.roomSetups.length > 1 && (
                    <button onClick={() => set({ roomSetups: form.roomSetups.filter((_, j) => j !== i) })}
                      className="text-danger hover:text-red-700 mt-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={addRoomSetup} className="btn-secondary flex items-center gap-2 w-full justify-center">
            <Plus className="w-4 h-4" /> Add Room Type
          </button>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
            <p className="font-semibold text-text-primary">Preview: This will create</p>
            <p className="text-text-secondary mt-1">{totalRooms} room{totalRooms !== 1 ? 's' : ''} and <strong>{totalBeds} beds</strong> total</p>
          </div>
        </div>
      )}

      {/* ── Step 5: Review ─────────────────────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-text-primary">Review & Submit</h2>
          {[
            { label: 'Basic Info', items: [
              ['Name', form.name], ['City', form.city], ['State', form.state],
              ['Gender', form.gender], ['Address', form.address],
            ], step: 0 },
            { label: 'Location', items: [
              ['Latitude', form.latitude !== '' ? String(form.latitude) : 'Not set'],
              ['Longitude', form.longitude !== '' ? String(form.longitude) : 'Not set'],
            ], step: 1 },
            { label: 'Amenities', items: [['Selected', form.amenities.join(', ') || 'None']], step: 2 },
            { label: 'Images', items: [['Uploaded', `${form.images.length} photo${form.images.length !== 1 ? 's' : ''}`]], step: 3 },
            { label: 'Rooms', items: [
              ['Configuration', form.roomSetups.map(r => `${r.count}× ${ROOM_LABELS[r.roomType]} @₹${r.pricePerBed}`).join(', ')],
              ['Total Beds', String(totalBeds)],
            ], step: 4 },
          ].map(({ label, items, step: s }) => (
            <div key={label} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
                <button onClick={() => setStep(s)} className="text-xs text-primary hover:underline font-medium">Edit</button>
              </div>
              <div className="space-y-1.5">
                {items.map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span className="text-text-muted w-24 flex-shrink-0">{k}</span>
                    <span className="text-text-primary font-medium">{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Image preview on review */}
          {form.images.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Image Preview</h3>
              <div className="grid grid-cols-4 gap-2">
                {form.images.slice(0, 4).map((url, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-surface-border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded">Cover</span>
                    )}
                  </div>
                ))}
              </div>
              {form.images.length > 4 && (
                <p className="text-xs text-text-muted mt-2">+{form.images.length - 4} more images</p>
              )}
            </div>
          )}

          {createMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {(createMutation.error as any)?.response?.data?.message ?? 'Submission failed. Please try again.'}
            </div>
          )}
        </div>
      )}

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <div className="mt-8 flex gap-3">
        <button onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}
          className="btn-secondary flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={createMutation.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
            {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit for Review →'}
          </button>
        )}
      </div>
    </div>
  );
}
