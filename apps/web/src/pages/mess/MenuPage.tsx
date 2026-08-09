import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, X, UtensilsCrossed, ImageIcon, Camera } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import CloudinaryUpload from '@/components/ui/CloudinaryUpload';

const MEALS = ['breakfast', 'lunch', 'dinner'] as const;
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

export interface IMenuItem { name: string; photoUrl: string | null; }
export interface IMeal {
  items: IMenuItem[];
  photoType: 'NONE' | 'THALI' | 'ITEMS';
  thaliPhotoUrl: string | null;
  photosUploadedAt: Date | null;
}

const defaultMeal = (): IMeal => ({ items: [], photoType: 'NONE', thaliPhotoUrl: null, photosUploadedAt: null });

export default function MessMenuPage() {
  const today = new Date().toISOString().split('T')[0];
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['mess-menu-today'],
    queryFn: () => api.get('/mess/menu').then(r => r.data.data),
  });

  const [form, setForm] = useState({ date: today, breakfast: defaultMeal(), lunch: defaultMeal(), dinner: defaultMeal(), specialNote: '' });
  const [newItems, setNewItems] = useState<Record<string, string>>({ breakfast: '', lunch: '', dinner: '' });
  const [initialized, setInitialized] = useState(false);
  const [uploadingItem, setUploadingItem] = useState<{ meal: string, idx: number } | null>(null);

  if (existing && !initialized) {
    const parseMeal = (m: any): IMeal => {
      if (!m) return defaultMeal();
      const items = (m.items || []).map((it: any) => typeof it === 'string' ? { name: it, photoUrl: null } : it);
      return {
        items,
        photoType: m.photoType || 'NONE',
        thaliPhotoUrl: m.thaliPhotoUrl || null,
        photosUploadedAt: m.photosUploadedAt ? new Date(m.photosUploadedAt) : null
      };
    };

    setForm({
      date: existing.date || today,
      breakfast: parseMeal(existing.breakfast),
      lunch: parseMeal(existing.lunch),
      dinner: parseMeal(existing.dinner),
      specialNote: existing.specialNote || '',
    });
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload = JSON.parse(JSON.stringify(form));
      ['breakfast', 'lunch', 'dinner'].forEach((m) => {
        const val = newItems[m]?.trim();
        if (val) {
          payload[m].items.push({ name: val, photoUrl: null });
          setNewItems(p => ({ ...p, [m]: '' }));
        }

        const meal = payload[m as keyof typeof payload] as IMeal;
        let hasPhoto = !!(meal.photoType === 'THALI' && meal.thaliPhotoUrl);
        if (meal.photoType === 'ITEMS' && meal.items.some((i: any) => i.photoUrl)) hasPhoto = true;
        if (hasPhoto && !meal.photosUploadedAt) {
          meal.photosUploadedAt = new Date();
        }
      });
      return api.post('/mess/menu', payload);
    },
    onSuccess: () => { toast.success('Menu saved! Tenants notified.'); qc.invalidateQueries({ queryKey: ['mess-menu-today'] }); setInitialized(false); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Save failed'),
  });

  const addItem = (meal: string) => {
    const val = newItems[meal]?.trim();
    if (!val) return;
    setForm(p => ({
      ...p,
      [meal]: { ...p[meal as keyof typeof p] as any, items: [...(p[meal as keyof typeof p] as any).items, { name: val, photoUrl: null }] }
    }));
    setNewItems(p => ({ ...p, [meal]: '' }));
  };

  const removeItem = (meal: string, idx: number) => {
    setForm(p => ({
      ...p,
      [meal]: { ...(p[meal as keyof typeof p] as any), items: (p[meal as keyof typeof p] as any).items.filter((_: any, i: number) => i !== idx) }
    }));
  };

  const setPhotoType = (meal: string, type: 'NONE' | 'THALI' | 'ITEMS') => {
    setForm(p => ({ ...p, [meal]: { ...(p[meal as keyof typeof p] as any), photoType: type } }));
  };

  const setThaliPhoto = (meal: string, urls: string[]) => {
    setForm(p => ({ ...p, [meal]: { ...(p[meal as keyof typeof p] as any), thaliPhotoUrl: urls[0] || null } }));
  };

  const setItemPhoto = (meal: string, idx: number, urls: string[]) => {
    setForm(p => {
      const newMeal = { ...(p[meal as keyof typeof p] as any) };
      const newItems = [...newMeal.items];
      newItems[idx] = { ...newItems[idx], photoUrl: urls[0] || null };
      newMeal.items = newItems;
      return { ...p, [meal]: newMeal };
    });
    setUploadingItem(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Upload Today's Menu</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#b45309', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
          <Save size={15} /> {mutation.isPending ? 'Saving…' : 'Save & Notify'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {MEALS.map(meal => {
          const mealData = form[meal as keyof typeof form] as IMeal;
          return (
            <div key={meal} style={{ background: 'white', borderRadius: 14, padding: '18px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{MEAL_LABELS[meal]}</h3>
                <div style={{ display: 'flex', gap: 8, background: '#f8fafc', padding: 4, borderRadius: 8 }}>
                  <button onClick={() => setPhotoType(meal, 'NONE')} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: mealData.photoType === 'NONE' ? 'white' : 'transparent', color: mealData.photoType === 'NONE' ? '#0f172a' : '#64748b', boxShadow: mealData.photoType === 'NONE' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>Text Only</button>
                  <button onClick={() => setPhotoType(meal, 'THALI')} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: mealData.photoType === 'THALI' ? 'white' : 'transparent', color: mealData.photoType === 'THALI' ? '#0f172a' : '#64748b', boxShadow: mealData.photoType === 'THALI' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>Full Thali Photo</button>
                  <button onClick={() => setPhotoType(meal, 'ITEMS')} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: mealData.photoType === 'ITEMS' ? 'white' : 'transparent', color: mealData.photoType === 'ITEMS' ? '#0f172a' : '#64748b', boxShadow: mealData.photoType === 'ITEMS' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>Item Photos</button>
                </div>
              </div>

              {mealData.photoType === 'THALI' && (
                <div style={{ marginBottom: 16 }}>
                  <CloudinaryUpload
                    value={mealData.thaliPhotoUrl ? [mealData.thaliPhotoUrl] : []}
                    onChange={(urls) => setThaliPhoto(meal, urls)}
                    maxImages={1}
                  />
                </div>
              )}

              {/* Items list */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {mealData.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                      {item.name}
                      <button onClick={() => removeItem(meal, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', padding: 0, display: 'flex', marginLeft: 4 }}><X size={14} /></button>
                      
                      {mealData.photoType === 'ITEMS' && (
                        <button onClick={() => setUploadingItem({ meal, idx: i })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', padding: 0, display: 'flex', marginLeft: 4, borderLeft: '1px solid #fcd34d', paddingLeft: 8 }}>
                          <Camera size={14} />
                        </button>
                      )}
                    </span>
                    
                    {mealData.photoType === 'ITEMS' && item.photoUrl && (
                      <div style={{ position: 'relative', width: 60, height: 40, borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <img src={item.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} />
                      </div>
                    )}

                    {uploadingItem?.meal === meal && uploadingItem?.idx === i && (
                      <div style={{ position: 'absolute', zIndex: 10, background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', width: 250 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>Upload photo for {item.name}</span>
                          <button onClick={() => setUploadingItem(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={14} /></button>
                        </div>
                        <CloudinaryUpload value={item.photoUrl ? [item.photoUrl] : []} onChange={(urls) => setItemPhoto(meal, i, urls)} maxImages={1} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add item */}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={newItems[meal]}
                  onChange={e => setNewItems(p => ({ ...p, [meal]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(meal); } }}
                  placeholder={`Add ${meal} item... (press Enter)`}
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={() => addItem(meal)} style={{ padding: '0 16px', background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Plus size={18} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Special note */}
        <div style={{ background: 'white', borderRadius: 14, padding: '18px', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700 }}>Special Note (optional)</h3>
          <input value={form.specialNote} onChange={e => setForm(p => ({ ...p, specialNote: e.target.value }))} placeholder="e.g. Sunday Special: Gulab Jamun in dinner!" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
        </div>
      </div>
    </div>
  );
}
