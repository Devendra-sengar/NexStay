import { useState } from 'react';
import {
  Building2, Plus, Search, ToggleLeft, ToggleRight, Trash2, Users,
  X, Loader2, Eye, EyeOff, Copy, CheckCheck, KeyRound, RefreshCw, ShieldCheck,
} from 'lucide-react';
import {
  useSuperHostels, useCreateHostelWithOwner, useToggleHostelActive, useDeleteHostel, useUpdateHostel
} from '@/lib/superAdminApi';
import toast from 'react-hot-toast';
import OwnerPermissionsModal from './OwnerPermissionsModal';

const GENDER_LABELS: Record<string, string> = { BOYS: '♂ Boys', GIRLS: '♀ Girls', CO_ED: '⚥ Co-ed' };

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 };
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

// ── Random password generator ────────────────────────────────────────────────
function genPassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#!';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Credentials Modal ────────────────────────────────────────────────────────
function CredentialsModal({ creds, hostelName, onClose }: {
  creds: { email: string; phone: string; password: string; hostelCode: string };
  hostelName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const credText = `NexStay — Hostel Login Credentials\n\nHostel: ${hostelName}\nHostel Code: ${creds.hostelCode}\n\nLogin: ${creds.email} (or phone: ${creds.phone})\nPassword: ${creds.password}\n\nPortal: ${window.location.origin}/login\n\nPlease change your password after first login.`;

  const copyAll = () => {
    navigator.clipboard.writeText(credText);
    setCopied(true);
    toast.success('Credentials copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={22} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>✓ Hostel Created!</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Share these credentials with the owner</p>
          </div>
        </div>

        {/* Credentials Box */}
        <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <Row label="Hostel" value={hostelName} />
            <Row label="Hostel Code" value={creds.hostelCode} badge />
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: 0 }} />
            <Row label="Email" value={creds.email} mono />
            <Row label="Phone" value={creds.phone} mono />
            <Row label="Password" value={creds.password} mono secret />
            <Row label="Login URL" value={`${window.location.origin}/login`} mono />
          </div>
        </div>

        {/* Warning */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e', marginBottom: 16 }}>
          [!] <strong>Share securely.</strong> This password will not be shown again. Ask the owner to change it after first login.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copyAll}
            style={{ flex: 1, padding: '12px 0', background: copied ? '#10b981' : '#1d4ed8', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}>
            {copied ? <><CheckCheck size={16} />Copied!</> : <><Copy size={16} />Copy All Credentials</>}
          </button>
          <button onClick={onClose}
            style={{ padding: '12px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, badge, secret }: { label: string; value: string; mono?: boolean; badge?: boolean; secret?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {badge ? (
          <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 100, background: '#dbeafe', color: '#1d4ed8', fontFamily: 'monospace' }}>{value}</span>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: mono ? 'monospace' : 'inherit', background: mono ? '#f1f5f9' : 'transparent', padding: mono ? '2px 6px' : 0, borderRadius: 4 }}>
            {secret && !show ? '••••••••••' : value}
          </span>
        )}
        {secret && (
          <button onClick={() => setShow(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Create Hostel + Owner Modal ───────────────────────────────────────────────
function CreateHostelModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (creds: any, hostelName: string) => void;
}) {
  const create = useCreateHostelWithOwner();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    // Owner
    ownerName: '', ownerEmail: '', ownerPhone: '', ownerPassword: genPassword(), businessName: '',
    // Hostel
    hostelName: '', gender: 'BOYS',
    city: '', state: '', street: '', pincode: '',
    contactPhone: '', contactEmail: '',
    messEnabled: true,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.ownerPassword.length < 6) { toast.error('Password must be at least 6 chars'); return; }
    try {
      const res = await create.mutateAsync({
        ownerName: form.ownerName, ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone, ownerPassword: form.ownerPassword,
        businessName: form.businessName,
        hostelName: form.hostelName, gender: form.gender,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
        contactPhone: form.contactPhone || form.ownerPhone,
        contactEmail: form.contactEmail || form.ownerEmail,
        messEnabled: form.messEnabled,
      });
      onCreated(res.data.credentials, form.hostelName);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create hostel');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 620, maxHeight: '94vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Register New Hostel</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Creates the hostel + owner login in one step</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Section: Owner Account ── */}
          <div style={{ background: '#eff6ff', borderRadius: 12, padding: 16, border: '1px solid #bfdbfe' }}>
            <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>Owner / Admin Account</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Full Name *</label>
                <input required value={form.ownerName} onChange={e => set('ownerName', e.target.value)} placeholder="e.g. Rajesh Sharma" style={inp} />
              </div>
              <div>
                <label style={lbl}>Email *</label>
                <input required type="email" value={form.ownerEmail} onChange={e => set('ownerEmail', e.target.value)} placeholder="owner@hostel.com" style={inp} />
              </div>
              <div>
                <label style={lbl}>Phone *</label>
                <input required value={form.ownerPhone} onChange={e => set('ownerPhone', e.target.value)} placeholder="9876543210" style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Business / Company Name</label>
                <input value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="e.g. Sharma Hostels Pvt. Ltd." style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Login Password *</label>
                  <button type="button" onClick={() => set('ownerPassword', genPassword())}
                    style={{ fontSize: 11, color: '#1d4ed8', background: 'white', border: '1px solid #bfdbfe', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RefreshCw size={10} /> Generate
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input required type={showPw ? 'text' : 'password'} value={form.ownerPassword} onChange={e => set('ownerPassword', e.target.value)}
                    style={{ ...inp, paddingRight: 40, fontFamily: 'monospace', letterSpacing: showPw ? 1 : 3 }} />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#3b82f6' }}>You'll get this to share with the owner after creation</p>
              </div>
            </div>
          </div>

          {/* ── Section: Hostel Details ── */}
          <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, border: '1px solid #bbf7d0' }}>
            <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#15803d' }}>Hostel Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Hostel Name *</label>
                <input required value={form.hostelName} onChange={e => set('hostelName', e.target.value)} placeholder="e.g. Sharma Boys Hostel" style={inp} />
              </div>
              <div>
                <label style={lbl}>Gender *</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} style={inp}>
                  <option value="BOYS">Boys</option>
                  <option value="GIRLS">Girls</option>
                  <option value="CO_ED">Co-ed</option>
                </select>
              </div>
              <div>
                <label style={lbl}>City</label>
                <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Pune" style={inp} />
              </div>
              <div>
                <label style={lbl}>State</label>
                <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Street Address</label>
                <input value={form.street} onChange={e => set('street', e.target.value)} placeholder="12, Model Colony" style={inp} />
              </div>
              <div>
                <label style={lbl}>Pincode</label>
                <input value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="411016" style={inp} />
              </div>
              <div>
                <label style={lbl}>Contact Phone</label>
                <input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="(defaults to owner phone)" style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Contact Email</label>
                <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="(defaults to owner email)" style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="messEnabled" checked={form.messEnabled} onChange={e => set('messEnabled', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="messEnabled" style={{ fontSize: 14, color: '#374151', cursor: 'pointer' }}>Enable Mess / Cafeteria</label>
              </div>
            </div>
          </div>

          <button type="submit" disabled={create.isPending}
            style={{ padding: '14px 0', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {create.isPending ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />Creating…</> : 'Create Hostel & Owner Account'}
          </button>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HostelsPage() {
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [credentials, setCredentials] = useState<{ creds: any; hostelName: string } | null>(null);
  const [permOwner, setPermOwner] = useState<any>(null); // owner for permissions modal

  const { data, isLoading } = useSuperHostels({
    ...(search ? { search } : {}),
    ...(gender !== 'ALL' ? { gender } : {}),
  });

  const toggleActive = useToggleHostelActive();
  const deleteHostel = useDeleteHostel();
  const updateHostel = useUpdateHostel();

  const hostels: any[] = data?.data || [];
  const total: number = data?.total || 0;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteHostel.mutateAsync(id);
      toast.success('Hostel deleted');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cannot delete hostel with active students');
    }
  };

  const handleToggle = async (id: string) => {
    try { await toggleActive.mutateAsync(id); toast.success('Status updated'); }
    catch { toast.error('Failed to update'); }
  };

  const handleToggleMess = async (id: string, currentStatus: boolean) => {
    try {
      await updateHostel.mutateAsync({ id, messEnabled: !currentStatus });
      toast.success(`Mess module ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update mess module');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Hostel Management</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>{total} total hostel{total !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(29,78,216,0.3)' }}>
          <Plus size={16} /> Register New Hostel
        </button>
      </div>

      {/* Info Banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <KeyRound size={16} color="#1d4ed8" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 13, color: '#1e40af' }}>
          <strong>Super Admin Control:</strong> Only you can register hostels. The owner account is created automatically and credentials are shown to you for sharing.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or code…" style={{ ...inp, paddingLeft: 38 }} />
        </div>
        {['ALL', 'BOYS', 'GIRLS', 'CO_ED'].map(g => (
          <button key={g} onClick={() => setGender(g)}
            style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${gender === g ? '#1d4ed8' : '#e5e7eb'}`, background: gender === g ? '#eff6ff' : 'white', color: gender === g ? '#1d4ed8' : '#374151', fontWeight: gender === g ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
            {g === 'ALL' ? 'All' : GENDER_LABELS[g]}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 76, background: '#f1f5f9', borderRadius: 12, animation: 'pulse 1.5s ease infinite' }} />)}
        </div>
      ) : hostels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 16, border: '1px dashed #e2e8f0' }}>
          <Building2 size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <p style={{ color: '#64748b', fontSize: 16, fontWeight: 600 }}>No hostels registered yet</p>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Click "Register New Hostel" to create the first one</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hostels.map((h: any) => (
            <div key={h._id} style={{ background: 'white', borderRadius: 14, padding: '16px 20px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: h.isActive ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{h.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#e0f2fe', color: '#0369a1' }}>{h.hostelCode}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: '#f3f4f6', color: '#374151' }}>{GENDER_LABELS[h.gender]}</span>
                  <button onClick={() => handleToggleMess(h._id, h.messEnabled)}
                    style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: h.messEnabled ? '#fef3c7' : '#f1f5f9', color: h.messEnabled ? '#92400e' : '#64748b', border: '1px solid ' + (h.messEnabled ? '#fde68a' : '#e2e8f0'), cursor: 'pointer', transition: 'all 0.2s' }}
                    title={h.messEnabled ? 'Disable Mess' : 'Enable Mess'}>
                    {h.messEnabled ? '◆ Mess Enabled' : '◇ Mess Disabled'}
                  </button>
                  {!h.isActive && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: '#fee2e2', color: '#991b1b' }}>Inactive</span>}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{(h.ownerId as any)?.name || 'Unassigned'}</span>
                  {h.address?.city && <span style={{ fontSize: 12, color: '#64748b' }}>◎ {h.address.city}{h.address.state ? `, ${h.address.state}` : ''}</span>}
                  <span style={{ fontSize: 12, color: '#64748b' }}><Users size={11} style={{ display: 'inline', marginRight: 3 }} />{h.studentCount ?? 0} students</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Permissions gear for owner */}
                {(h.ownerId as any)?._id && (
                  <button onClick={() => setPermOwner(h.ownerId)} title="Set owner permissions"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: 4 }}>
                    <ShieldCheck size={17} />
                  </button>
                )}
                <button onClick={() => handleToggle(h._id)} title={h.isActive ? 'Deactivate' : 'Activate'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: h.isActive ? '#22c55e' : '#94a3b8' }}>
                  {h.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
                <button onClick={() => handleDelete(h._id, h.name)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateHostelModal
          onClose={() => setShowCreate(false)}
          onCreated={(creds, hostelName) => {
            setShowCreate(false);
            setCredentials({ creds, hostelName });
            toast.success('Hostel created! Share credentials with the owner.');
          }}
        />
      )}

      {credentials && (
        <CredentialsModal
          creds={credentials.creds}
          hostelName={credentials.hostelName}
          onClose={() => setCredentials(null)}
        />
      )}

      {/* Owner Permissions Modal */}
      {permOwner && (
        <OwnerPermissionsModal
          owner={permOwner}
          onClose={() => setPermOwner(null)}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
