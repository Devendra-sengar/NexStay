import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Check, AlertCircle, Plus, Trash2, Camera, Wifi, Utensils, Car, Shield, Shirt, Wind, Flame } from 'lucide-react';
import { useAdminPropertyById, useUpdateProperty } from '@/lib/adminApi';

// ─── Reuse same amenity config ─────────────────────────────────────────────
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

const GENDER_OPTIONS = [
  { value:'BOYS', label:'Boys PG' },
  { value:'GIRLS', label:'Girls PG' },
  { value:'CO_ED', label:'Co-Living' },
];

interface EditPropertyModalProps {
  propertyId: string;
  onClose: () => void;
}

export default function EditPropertyModal({ propertyId, onClose }: EditPropertyModalProps) {
  const { data: property, isLoading } = useAdminPropertyById(propertyId);
  const updateMutation = useUpdateProperty(propertyId);

  const [form, setForm] = useState<any>(null);
  const [imgInput, setImgInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Populate form once data loads
  useEffect(() => {
    if (property && !form) {
      setForm({
        name: property.name ?? '',
        description: property.description ?? '',
        city: property.city ?? '',
        locality: property.locality ?? '',
        address: property.address ?? '',
        state: property.state ?? '',
        pincode: property.pincode ?? '',
        gender: property.gender ?? 'BOYS',
        latitude: property.latitude ?? '',
        longitude: property.longitude ?? '',
        amenities: property.amenities ?? [],
        rules: property.rules ?? '',
        foodIncluded: property.foodIncluded ?? false,
        images: property.images ?? [],
        videoUrl: property.videoUrl ?? '',
      });
    }
  }, [property]);

  const set = useCallback((patch: any) => setForm((f: any) => ({ ...f, ...patch })), []);

  const handleSave = async () => {
    setError('');
    if (!form.name.trim() || !form.city.trim()) {
      setError('Name and city are required.'); return;
    }
    try {
      const result = await updateMutation.mutateAsync(form);
      setSaveSuccess(true);
      if (result.pendingReview) {
        // Minor delay to show success then notify about re-review
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Update failed. Please try again.');
    }
  };

  const addImage = () => {
    const url = imgInput.trim();
    if (url && !form.images.includes(url)) set({ images: [...form.images, url] });
    setImgInput('');
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div>
            <h2 className="font-bold text-text-primary text-lg">Edit Property</h2>
            {updateMutation.data?.pendingReview && (
              <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Changes to name/description/images require re-verification
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {isLoading || !form ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Basic */}
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="form-label">Property Name *</label>
                    <input className="input-field" value={form.name} onChange={e => set({ name: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Description</label>
                    <textarea className="input-field" rows={3} value={form.description} onChange={e => set({ description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">City *</label>
                      <input className="input-field" value={form.city} onChange={e => set({ city: e.target.value })} />
                    </div>
                    <div>
                      <label className="form-label">Locality</label>
                      <input className="input-field" value={form.locality} onChange={e => set({ locality: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Address</label>
                    <input className="input-field" value={form.address} onChange={e => set({ address: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="form-label">State</label>
                      <input className="input-field" value={form.state} onChange={e => set({ state: e.target.value })} />
                    </div>
                    <div>
                      <label className="form-label">Pincode</label>
                      <input className="input-field" value={form.pincode} onChange={e => set({ pincode: e.target.value })} maxLength={6} />
                    </div>
                    <div>
                      <label className="form-label">Gender</label>
                      <select className="input-field" value={form.gender} onChange={e => set({ gender: e.target.value })}>
                        {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Location */}
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Location Coordinates</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Latitude</label>
                    <input type="number" step="0.000001" className="input-field" value={form.latitude}
                      onChange={e => set({ latitude: e.target.value ? parseFloat(e.target.value) : '' })} placeholder="18.5204" />
                  </div>
                  <div>
                    <label className="form-label">Longitude</label>
                    <input type="number" step="0.000001" className="input-field" value={form.longitude}
                      onChange={e => set({ longitude: e.target.value ? parseFloat(e.target.value) : '' })} placeholder="73.8567" />
                  </div>
                </div>
              </section>

              {/* Amenities */}
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Amenities</h3>
                <div className="grid grid-cols-4 gap-2">
                  {AMENITY_OPTIONS.map(({ key, label, icon: Icon }) => {
                    const active = form.amenities.includes(key);
                    return (
                      <button key={key} type="button"
                        onClick={() => set({ amenities: active ? form.amenities.filter((a: string) => a !== key) : [...form.amenities, key] })}
                        className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${active ? 'border-primary bg-primary/5 text-primary' : 'border-surface-border text-text-muted hover:border-primary/30'}`}>
                        <Icon className="w-4 h-4" />
                        {label}
                        {active && <Check className="w-3 h-3 text-green-500" />}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Rules */}
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">House Rules</h3>
                <textarea className="input-field" rows={3} value={form.rules} onChange={e => set({ rules: e.target.value })}
                  placeholder="Enter house rules, one per line..." />
              </section>

              {/* Images */}
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Images</h3>
                <div className="flex gap-2 mb-3">
                  <input className="input-field flex-1 text-sm" value={imgInput} onChange={e => setImgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addImage()}
                    placeholder="https://image-url.com/photo.jpg" />
                  <button type="button" onClick={addImage} className="btn-secondary flex items-center gap-1 flex-shrink-0 text-sm py-2 px-3">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {form.images.map((url: string, i: number) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full h-20 object-cover rounded-xl"
                        onError={e => { (e.target as any).style.display = 'none'; }} />
                      <button onClick={() => set({ images: form.images.filter((_: any, j: number) => j !== i) })}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {form.images.length === 0 && (
                    <div className="col-span-3 h-20 bg-surface border border-dashed border-surface-border rounded-xl flex items-center justify-center text-text-muted text-sm">
                      No images added
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <label className="form-label">Video URL (optional)</label>
                  <input className="input-field" value={form.videoUrl} onChange={e => set({ videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..." />
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-border flex items-center gap-3">
          {error && (
            <p className="flex-1 text-sm text-danger flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}
          {saveSuccess && (
            <p className="flex-1 text-sm text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Saved successfully!
              {updateMutation.data?.pendingReview && ' (Pending re-verification)'}
            </p>
          )}
          {!error && !saveSuccess && <div className="flex-1" />}
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={updateMutation.isPending || !form}
            className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {updateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
