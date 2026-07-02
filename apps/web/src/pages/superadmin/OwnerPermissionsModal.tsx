import { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSetOwnerPermissions } from '@/lib/superAdminApi';

interface OwnerPermissions {
  canManageERP: boolean;
  canViewReports: boolean;
  canManageMarketplace: boolean;
  canManageRooms: boolean;
  canManageMess: boolean;
  canManageExpenses: boolean;
  canManageComplaints: boolean;
  canManageStaff: boolean;
}

const DEFAULT_PERMS: OwnerPermissions = {
  canManageERP: true, canViewReports: true, canManageMarketplace: true,
  canManageRooms: true, canManageMess: true, canManageExpenses: true,
  canManageComplaints: true, canManageStaff: true,
};

const MODULE_CONFIG: Array<{ key: keyof OwnerPermissions; label: string; desc: string; icon: string }> = [
  { key: 'canManageERP',         label: 'Student ERP',       desc: 'Check-in, check-out, tenant management',   icon: '■' },
  { key: 'canViewReports',       label: 'Reports',           desc: 'Analytics, revenue & occupancy reports',   icon: '◈' },
  { key: 'canManageMarketplace', label: 'Marketplace',       desc: 'Property listings on public portal',       icon: '□' },
  { key: 'canManageRooms',       label: 'Rooms & Beds',      desc: 'Floor, room and bed management',           icon: '◊' },
  { key: 'canManageMess',        label: 'Mess / Cafeteria',  desc: 'Mess menu, timings and food management',   icon: '◆' },
  { key: 'canManageExpenses',    label: 'Expenses',          desc: 'Expense tracking and management',          icon: '₹' },
  { key: 'canManageComplaints',  label: 'Complaints',        desc: 'Student complaint management',             icon: '●' },
  { key: 'canManageStaff',       label: 'Staff Management',  desc: 'Add/manage warden and staff accounts',     icon: '◇' },
];

interface Props {
  owner: { _id: string; name: string; email: string; ownerPermissions?: OwnerPermissions | null };
  onClose: () => void;
}

export default function OwnerPermissionsModal({ owner, onClose }: Props) {
  const setPerms = useSetOwnerPermissions();
  const [perms, setPerms2] = useState<OwnerPermissions>(
    owner.ownerPermissions ? { ...DEFAULT_PERMS, ...owner.ownerPermissions } : { ...DEFAULT_PERMS }
  );

  const toggle = (key: keyof OwnerPermissions) => {
    setPerms2(p => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    try {
      await setPerms.mutateAsync({ ownerId: owner._id, permissions: perms as unknown as Record<string, boolean> });
      toast.success(`Permissions updated for ${owner.name}`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update permissions');
    }
  };

  const enabledCount = Object.values(perms).filter(Boolean).length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Owner Access Control</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{owner.name} · {owner.email}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
        </div>

        {/* Summary badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', background: '#f5f3ff', borderRadius: 10, border: '1px solid #ddd6fe' }}>
          <span style={{ fontSize: 13, color: '#6d28d9' }}>
            <strong>{enabledCount}</strong> of <strong>{MODULE_CONFIG.length}</strong> modules enabled for this owner
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setPerms2({ ...DEFAULT_PERMS })}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd6fe', background: 'white', color: '#7c3aed', cursor: 'pointer', fontWeight: 600 }}>
              Enable All
            </button>
            <button onClick={() => setPerms2(Object.fromEntries(MODULE_CONFIG.map(m => [m.key, false])) as unknown as OwnerPermissions)}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #fecdd3', background: 'white', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>
              Disable All
            </button>
          </div>
        </div>

        {/* Permission toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {MODULE_CONFIG.map(mod => {
            const enabled = perms[mod.key];
            return (
              <div key={mod.key}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: `2px solid ${enabled ? '#e0f2fe' : '#f1f5f9'}`, background: enabled ? '#f0f9ff' : '#fafafa', cursor: 'pointer', transition: 'all 0.15s' }}
                onClick={() => toggle(mod.key)}>
                <span style={{ fontSize: 22 }}>{mod.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: enabled ? '#0f172a' : '#94a3b8' }}>{mod.label}</div>
                  <div style={{ fontSize: 12, color: enabled ? '#64748b' : '#cbd5e1' }}>{mod.desc}</div>
                </div>
                {/* Toggle switch */}
                <div style={{ position: 'relative', width: 44, height: 24, flexShrink: 0 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: enabled ? '#0ea5e9' : '#e2e8f0', transition: 'background 0.2s' }} />
                  <div style={{ position: 'absolute', top: 2, left: enabled ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} disabled={setPerms.isPending}
            style={{ flex: 1, padding: '12px 0', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {setPerms.isPending ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />Saving…</> : <><Save size={16} />Save Permissions</>}
          </button>
          <button onClick={onClose}
            style={{ padding: '12px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
