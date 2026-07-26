import { useState } from 'react';
import { ShieldCheck, ChefHat, Plus, Eye, EyeOff, Copy, CheckCheck, KeyRound, X, Loader2, Users, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMyHostels, useCreateLoginStaff, useLoginStaff } from '@/lib/adminApi';
import StaffPermissionsModal from './StaffPermissionsModal';

// ── helpers ───────────────────────────────────────────────────────────────────
function genPw() {
  const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#!';
  return Array.from({ length: 10 }, () => c[Math.floor(Math.random() * c.length)]).join('');
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 };
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

const ROLE_META: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  WARDEN:       { icon: <ShieldCheck size={14} />, label: 'Warden',       color: '#1d4ed8', bg: '#dbeafe' },
  MESS_MANAGER: { icon: <ChefHat size={14} />,    label: 'Mess Manager', color: '#7c3aed', bg: '#ede9fe' },
};

// ── Credentials Card ──────────────────────────────────────────────────────────
function CredCard({ creds, onClose }: {
  creds: { name: string; role: string; phone: string; email?: string; hostelCode: string; hostelName: string; password: string };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const loginId = creds.email || creds.phone;
  const text = `NexStay — Staff Login Credentials\n\nName: ${creds.name}\nRole: ${creds.role}\nHostel: ${creds.hostelName} (${creds.hostelCode})\n\nLogin ID: ${loginId}\nPassword: ${creds.password}\nHostel Code: ${creds.hostelCode}\n\nPortal: ${window.location.origin}/login\n\n[!] Please change password after first login.`;

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  const m = ROLE_META[creds.role] || ROLE_META.WARDEN;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={20} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>✓ Staff Account Created!</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Share these credentials with {creds.name}</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
        </div>

        <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: m.bg, color: m.color, display: 'flex', alignItems: 'center', gap: 4 }}>
              {m.icon} {m.label}
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{creds.name}</span>
          </div>
          {[
            { label: 'Hostel', value: `${creds.hostelName}` },
            { label: 'Hostel Code', value: creds.hostelCode, badge: true },
            { label: 'Login ID', value: loginId },
            { label: 'Password', value: creds.password, secret: true },
            { label: 'Portal', value: `${window.location.origin}/login` },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{row.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {row.badge
                  ? <span style={{ fontSize: 12, fontWeight: 800, padding: '2px 10px', borderRadius: 100, background: '#dbeafe', color: '#1d4ed8', fontFamily: 'monospace' }}>{row.value}</span>
                  : <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                      {row.secret && !showPw ? '••••••••••' : row.value}
                    </span>
                }
                {row.secret && (
                  <button onClick={() => setShowPw(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e', marginBottom: 14 }}>
          [!] Password is shown only once. Ask staff to change it after first login.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copy} style={{ flex: 1, padding: '11px 0', background: copied ? '#10b981' : '#1d4ed8', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {copied ? <><CheckCheck size={15} /> Copied!</> : <><Copy size={15} /> Copy All Credentials</>}
          </button>
          <button onClick={onClose} style={{ padding: '11px 18px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ── Add Login Staff Modal ─────────────────────────────────────────────────────
function AddLoginStaffModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (creds: any) => void;
}) {
  const hostels = useMyHostels();
  const create = useCreateLoginStaff();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', role: 'WARDEN',
    hostelId: '', password: genPw(),
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hostelId) { toast.error('Select a hostel'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      const res = await create.mutateAsync({
        name: form.name, phone: form.phone,
        email: form.email || undefined,
        role: form.role, hostelId: form.hostelId,
        // We pass password so backend can use it (backend auto-generates if not passed)
        // But our backend generates its own — we'll capture tempPassword from response
      });
      const hostelDoc = (hostels.data || []).find((h: any) => h._id === form.hostelId);
      onCreated({
        name: form.name, role: form.role,
        phone: form.phone, email: form.email,
        hostelCode: hostelDoc?.hostelCode || '—',
        hostelName: hostelDoc?.name || '—',
        password: res.tempPassword || form.password,
      });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create staff');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, maxHeight: '94vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={20} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Add Portal Staff</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Creates login access for Warden / Mess Manager</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Hostel select */}
          <div>
            <label style={lbl}>Hostel *</label>
            {hostels.isLoading
              ? <div style={{ ...inp, color: '#94a3b8' }}>Loading hostels…</div>
              : <select required value={form.hostelId} onChange={e => set('hostelId', e.target.value)} style={inp}>
                  <option value="">— Select Hostel —</option>
                  {(hostels.data || []).map((h: any) => (
                    <option key={h._id} value={h._id}>{h.name} ({h.hostelCode})</option>
                  ))}
                </select>
            }
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Full Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ramesh Warden" style={inp} />
            </div>
            <div>
              <label style={lbl}>Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} style={inp}>
                <option value="WARDEN">Warden</option>
                <option value="MESS_MANAGER">Mess Manager</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Phone *</label>
              <input required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" style={inp} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Email <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="warden@hostel.com" style={inp} />
            </div>
          </div>

          {/* Info box */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#1e40af' }}>
            <strong>Auto-generated credentials</strong> — A secure password will be generated automatically. You'll see it after creation to share with the staff member.
          </div>

          <button type="submit" disabled={create.isPending}
            style={{ padding: '13px 0', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {create.isPending ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />Creating…</> : 'Create Staff & Get Credentials'}
          </button>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Login Staff List Card ─────────────────────────────────────────────────────
function LoginStaffList({ hostelId }: { hostelId: string }) {
  // ⚠️ All hooks MUST be before any early returns (Rules of Hooks)
  const { data, isLoading } = useLoginStaff(hostelId);
  const [permStaff, setPermStaff] = useState<any>(null);

  if (isLoading) return <div style={{ padding: 16, color: '#94a3b8', fontSize: 13 }}>Loading staff…</div>;
  if (!data || data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '24px 16px', color: '#94a3b8', fontSize: 13 }}>
      No portal staff added yet for this hostel.
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((s: any) => {
          const m = ROLE_META[s.role] || ROLE_META.WARDEN;
          return (
            <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1px solid #f1f5f9' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, flexShrink: 0 }}>
                {m.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.phone}{s.email ? ` · ${s.email}` : ''}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: m.bg, color: m.color }}>{m.label}</span>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: s.status === 'ACTIVE' ? '#dcfce7' : '#f3f4f6', color: s.status === 'ACTIVE' ? '#16a34a' : '#6b7280', fontWeight: 600 }}>{s.status}</span>
              {/* Permissions button */}
              <button
                onClick={() => setPermStaff(s)}
                title="Manage permissions"
                style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', color: '#64748b', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
              >
                <Settings2 size={13} /> Permissions
              </button>
            </div>
          );
        })}
      </div>
      {permStaff && (
        <StaffPermissionsModal
          staff={permStaff}
          onClose={() => setPermStaff(null)}
        />
      )}
    </>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function LoginStaffSection() {
  const hostels = useMyHostels();
  const [showModal, setShowModal] = useState(false);
  const [creds, setCreds] = useState<any>(null);
  const [selectedHostel, setSelectedHostel] = useState('');

  const hostelList: any[] = hostels.data || [];

  return (
    <div style={{ marginTop: 32 }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={16} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Portal Staff Accounts</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Warden & Mess Manager with login access</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: 'white', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 10px rgba(99,102,241,0.3)' }}>
          <Plus size={14} /> Add Portal Staff
        </button>
      </div>

      {/* Info banner */}
      <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#5b21b6' }}>
        <strong>[i]</strong> Portal staff get a <strong>hostel code + login ID + password</strong> to access their dedicated panel (Warden / Mess Manager). You generate and share credentials.
      </div>

      {/* Hostel filter */}
      {hostelList.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <select value={selectedHostel} onChange={e => setSelectedHostel(e.target.value)} style={{ ...inp, maxWidth: 280 }}>
            <option value="">All Hostels</option>
            {hostelList.map((h: any) => <option key={h._id} value={h._id}>{h.name} ({h.hostelCode})</option>)}
          </select>
        </div>
      )}

      {/* List per hostel */}
      {hostelList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 24px', background: 'white', borderRadius: 14, border: '1px dashed #e2e8f0' }}>
          <Users size={40} color="#cbd5e1" style={{ marginBottom: 10 }} />
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>No hostels linked yet</p>
          <p style={{ color: '#94a3b8', fontSize: 12 }}>Contact the platform admin to get a hostel assigned.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {hostelList
            .filter(h => !selectedHostel || h._id === selectedHostel)
            .map((h: any) => (
              <div key={h._id} style={{ background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{h.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#dbeafe', color: '#1d4ed8', fontFamily: 'monospace' }}>{h.hostelCode}</span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <LoginStaffList hostelId={h._id} />
                </div>
              </div>
            ))
          }
        </div>
      )}

      {showModal && (
        <AddLoginStaffModal
          onClose={() => setShowModal(false)}
          onCreated={(c) => { setCreds(c); toast.success('Staff account created!'); }}
        />
      )}
      {creds && <CredCard creds={creds} onClose={() => setCreds(null)} />}
    </div>
  );
}
