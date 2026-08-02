import { useQuery } from '@tanstack/react-query';
import { UtensilsCrossed, Calendar, ImageIcon } from 'lucide-react';
import api from '@/lib/api';

const MEALS = ['breakfast', 'lunch', 'dinner'] as const;
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

export default function StudentMessPage() {
  const { data: today } = useQuery({ queryKey: ['student-menu-today'], queryFn: () => api.get('/student/mess/menu').then(r => r.data.data) });
  const { data: week } = useQuery({ queryKey: ['student-menu-week'], queryFn: () => api.get('/student/mess/menu/week').then(r => r.data.data) });

  const todayStr = new Date().toISOString().split('T')[0];
  const weekMenus: any[] = week || [];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>Mess Menu</h1>

      {/* Today's menu */}
      <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1px solid #f1f5f9', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: '#fef3c7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UtensilsCrossed size={18} color="#b45309" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Today's Menu</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {today ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MEALS.map(meal => {
              const mealData = today[meal];
              const items = mealData?.items || [];
              const hasItems = items.length > 0;
              
              return (
                <div key={meal} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <p style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, margin: 0 }}>{MEAL_LABELS[meal]}</p>
                    {mealData?.photoType !== 'NONE' && mealData?.photoType && (
                      <span style={{ fontSize: 10, background: '#e0e7ff', color: '#4f46e5', padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ImageIcon size={10} /> Photos Available
                      </span>
                    )}
                  </div>
                  
                  {mealData?.photoType === 'THALI' && mealData.thaliPhotoUrl && (
                    <div style={{ width: '100%', height: 180, borderRadius: 10, overflow: 'hidden', marginBottom: 10, border: '1px solid #e2e8f0' }}>
                      <img src={mealData.thaliPhotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`${meal} thali`} />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {hasItems ? items.map((item: any, i: number) => {
                      const name = typeof item === 'string' ? item : item.name;
                      const photoUrl = typeof item === 'object' ? item.photoUrl : null;
                      
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px', overflow: 'hidden' }}>
                          {mealData?.photoType === 'ITEMS' && photoUrl && (
                            <div style={{ width: 100, height: 70, borderRadius: 4, overflow: 'hidden', background: '#f1f5f9' }}>
                              <img src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                            </div>
                          )}
                          <span style={{ fontSize: 13, color: '#374151', padding: mealData?.photoType === 'ITEMS' && photoUrl ? '2px 4px' : '4px 8px', textAlign: 'center', fontWeight: 500 }}>{name}</span>
                        </div>
                      );
                    }) : <span style={{ color: '#94a3b8', fontSize: 13, padding: '4px 0' }}>Not updated</span>}
                  </div>
                </div>
              );
            })}
            {today.specialNote && (
              <div style={{ background: '#f3f0ff', border: '1px solid #c4b5fd', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ color: '#7c3aed', fontSize: 13, margin: 0 }}>★ {today.specialNote}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <UtensilsCrossed size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Menu for today hasn't been uploaded yet.</p>
            <p style={{ color: '#cbd5e1', fontSize: 12 }}>Check back later or contact the mess manager.</p>
          </div>
        )}
      </div>

      {/* Week view */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Calendar size={16} /> This Week's Menu
      </h2>
      {weekMenus.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>No menus uploaded this week</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {weekMenus.map((menu: any) => (
            <div key={menu._id} style={{ background: menu.date === todayStr ? '#eff6ff' : 'white', borderRadius: 12, padding: '14px 16px', border: `1px solid ${menu.date === todayStr ? '#93c5fd' : '#f1f5f9'}` }}>
              <p style={{ color: menu.date === todayStr ? '#1d4ed8' : '#64748b', fontSize: 12, fontWeight: menu.date === todayStr ? 700 : 500, margin: '0 0 8px' }}>
                {menu.date === todayStr ? '◎ Today — ' : ''}{new Date(menu.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {MEALS.map(meal => {
                  const items = menu[meal]?.items || [];
                  const itemNames = items.map((it: any) => typeof it === 'string' ? it : it.name);
                  return itemNames.length > 0 && (
                    <div key={meal}>
                      <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 0.8 }}>{meal}: </span>
                      <span style={{ fontSize: 12, color: '#374151' }}>{itemNames.slice(0, 2).join(', ')}{itemNames.length > 2 ? '…' : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
