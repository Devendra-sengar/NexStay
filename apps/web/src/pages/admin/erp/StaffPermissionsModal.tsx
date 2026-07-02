import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUpdateStaffPermissions } from '@/lib/superAdminApi';

interface StaffPermissions {
  canViewStudents:     boolean;
  canManageComplaints: boolean;
  canViewRentRecords:  boolean;
  canUploadMenu:       boolean;
  canViewSalary:       boolean;
  canManageRooms:      boolean;
  canViewAttendance:   boolean;
}

const PERM_CONFIG: Array<{ key: keyof StaffPermissions; label: string; desc: string; icon: string; roles: string[] }> = [
  { key: 'canViewStudents',     label: 'View Students',       desc: 'See student/tenant list',         icon: '■', roles: ['WARDEN', 'MESS_MANAGER'] },
  { key: 'canManageComplaints', label: 'Manage Complaints',   desc: 'View and resolve complaints',     icon: '●', roles: ['WARDEN'] },
  { key: 'canViewRentRecords',  label: 'View Rent Records',   desc: 'See rent payment records',        icon: '◆', roles: ['WARDEN'] },
  { key: 'canUploadMenu',       label: 'Upload Mess Menu',    desc: 'Post daily mess menu',            icon: '◈', roles: ['MESS_MANAGER'] },
  { key: 'canViewSalary',       label: 'View Salary',         desc: 'See own salary records',         icon: '◊', roles: ['WARDEN', 'MESS_MANAGER'] },
  { key: 'canManageRooms',      label: 'Manage Rooms',        desc: 'View and update room status',     icon: '□', roles: ['WARDEN'] },
  { key: 'canViewAttendance',   label: 'View Attendance',     desc: 'Access attendance records',      icon: '✓', roles: ['WARDEN', 'MESS_MANAGER'] },
];

const DEFAULT_PERMS: StaffPermissions = {
  canViewStudents: false, canManageComplaints: false, canViewRentRecords: false,
  canUploadMenu: false, canViewSalary: false, canManageRooms: false, canViewAttendance: false,
};

interface Props {
  staff: { _id: string; name: string; role: string; staffPermissions?: StaffPermissions | null };
  onClose: () => void;
}

export default function StaffPermissionsModal({ staff, onClose }: Props) {
  const update = useUpdateStaffPermissions();
  const [perms, setPerms] = useState<StaffPermissions>(
    staff.staffPermissions ? { ...DEFAULT_PERMS, ...staff.staffPermissions } : { ...DEFAULT_PERMS }
  );

  const toggle = (key: keyof StaffPermissions) => setPerms(p => ({ ...p, [key]: !p[key] }));

  const relevantPerms = PERM_CONFIG.filter(p => p.roles.includes(staff.role));

  const handleSave = async () => {
    try {
      await update.mutateAsync({ staffId: staff._id, permissions: perms as unknown as Record<string, boolean> });
      toast.success(`Permissions updated for ${staff.name}`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update permissions');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 20, padding: 26, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {staff.role === 'WARDEN' ? '■' : '◆'}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Staff Access Control</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{staff.name} · {staff.role}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
        </div>

        {/* Toggle rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {relevantPerms.map(p => {
            const on = perms[p.key];
            return (
              <div key={p.key}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, border: `2px solid ${on ? '#bae6fd' : '#f1f5f9'}`, background: on ? '#f0f9ff' : '#fafafa', cursor: 'pointer' }}
                onClick={() => toggle(p.key)}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: on ? '#0f172a' : '#94a3b8' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: on ? '#64748b' : '#cbd5e1' }}>{p.desc}</div>
                </div>
                <div style={{ position: 'relative', width: 40, height: 22 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 11, background: on ? '#0ea5e9' : '#e2e8f0', transition: 'background 0.2s' }} />
                  <div style={{ position: 'absolute', top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} disabled={update.isPending}
            style={{ flex: 1, padding: '11px 0', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            {update.isPending ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />Saving…</> : <><Save size={14} />Save Permissions</>}
          </button>
          <button onClick={onClose}
            style={{ padding: '11px 18px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
