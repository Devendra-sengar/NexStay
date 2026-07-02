import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit2, Search, ToggleLeft, ToggleRight, X, ShieldCheck, ChefHat, Wrench, Lock, Briefcase, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStaff, useCreateStaff, useUpdateStaff, useToggleStaffStatus, useAdminProperties } from '@/lib/adminApi';
import { cn } from '@/lib/utils';
import LoginStaffSection from './LoginStaffSection';
import CloudinaryUpload from '@/components/ui/CloudinaryUpload';

const ROLES = ['WARDEN','COOK','CLEANER','SECURITY','MANAGER','OTHER'];
const ROLE_COLORS: Record<string,string> = { WARDEN:'badge-primary', COOK:'badge-warning', CLEANER:'badge-success', SECURITY:'badge-danger', MANAGER:'badge-gray', OTHER:'badge-gray' };
const ROLE_LABEL: Record<string,string> = { WARDEN:'Warden', COOK:'Cook', CLEANER:'Cleaner', SECURITY:'Security', MANAGER:'Manager', OTHER:'Other' };

function StaffModal({ staff, properties, onClose }: { staff?: any; properties: any[]; onClose: () => void }) {
  const [form, setForm] = useState({
    name: staff?.name || '', phone: staff?.phone || '', email: staff?.email || '',
    role: staff?.role || 'WARDEN', propertyId: staff?.propertyId?._id || staff?.propertyId || properties[0]?._id || '',
    salary: staff?.salary || '', joiningDate: staff?.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    address: staff?.address || '', notes: staff?.notes || '', photoUrl: staff?.photoUrl || '',
  });
  const create = useCreateStaff(); const update = useUpdateStaff();
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
  const submit = async () => {
    if (!form.name || !form.phone || !form.propertyId) { toast.error('Name, phone, property required'); return; }
    try {
      if (staff) { await update.mutateAsync({ id: staff._id, ...form }); toast.success('Staff updated'); }
      else { await create.mutateAsync(form); toast.success('Staff added'); }
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">{staff?'Edit':'Add'} Staff Member</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="form-label">Name *</label><input className="input-field" value={form.name} onChange={set('name')} /></div>
          <div><label className="form-label">Phone *</label><input className="input-field" value={form.phone} onChange={set('phone')} /></div>
          <div><label className="form-label">Email</label><input type="email" className="input-field" value={form.email} onChange={set('email')} /></div>
          <div><label className="form-label">Role *</label>
            <select className="input-field" value={form.role} onChange={set('role')}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>)}
            </select></div>
          <div><label className="form-label">Property *</label>
            <select className="input-field" value={form.propertyId} onChange={set('propertyId')}>
              {properties.map((p:any) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select></div>
          <div><label className="form-label">Salary (₹/mo)</label><input type="number" className="input-field" value={form.salary} onChange={set('salary')} /></div>
          <div><label className="form-label">Joining Date</label><input type="date" className="input-field" value={form.joiningDate} onChange={set('joiningDate')} /></div>
          <div className="col-span-2"><label className="form-label">Address</label><input className="input-field" value={form.address} onChange={set('address')} /></div>
          <div className="col-span-2">
            <label className="form-label">Staff Photo <span className="text-text-muted font-normal">(optional)</span></label>
            <CloudinaryUpload
              value={form.photoUrl ? [form.photoUrl] : []}
              onChange={urls => setForm(f => ({ ...f, photoUrl: urls[0] || '' }))}
              maxImages={1}
            />
          </div>
          <div className="col-span-2"><label className="form-label">Notes</label><textarea className="input-field resize-none min-h-[60px]" value={form.notes} onChange={set('notes')} /></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={create.isPending||update.isPending}>{create.isPending||update.isPending?'Saving…':staff?'Update':'Add Staff'}</button>
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const navigate = useNavigate();
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data ?? [];
  const [propId, setPropId] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{open:boolean;staff?:any}>({open:false});
  const toggle = useToggleStaffStatus();

  const { data, isLoading } = useStaff({ propertyId:propId||undefined, role:role||undefined, status:status||undefined, search:search||undefined });
  const members = data?.data ?? [];

  const handleToggle = async (id: string, name: string, active: boolean) => {
    try { await toggle.mutateAsync(id); toast.success(`${name} ${active?'deactivated':'reactivated'}`); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 className="text-2xl font-bold text-text-primary">Staff</h1>
          <p className="text-sm text-text-secondary mt-0.5">{data?.total ?? 0} members across your properties</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={()=>setModal({open:true})}><Plus className="w-4 h-4"/>Add Staff</button>
      </div>

      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"/><input className="input-field pl-9" placeholder="Search name…" value={search} onChange={e=>setSearch(e.target.value)} /></div>
        <select className="input-field w-40" value={propId} onChange={e=>setPropId(e.target.value)}><option value="">All Properties</option>{properties.map((p:any)=><option key={p._id} value={p._id}>{p.name}</option>)}</select>
        <select className="input-field w-36" value={role} onChange={e=>setRole(e.target.value)}><option value="">All Roles</option>{ROLES.map(r=><option key={r} value={r}>{ROLE_LABEL[r]||r}</option>)}</select>
        <div className="flex rounded-lg border border-surface-border overflow-hidden">
          {['ALL','ACTIVE','INACTIVE'].map(s=><button key={s} onClick={()=>setStatus(s)} className={cn('px-3 py-2 text-xs font-medium',status===s?'bg-primary text-white':'bg-white text-text-secondary hover:bg-surface-input')}>{s}</button>)}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-14 rounded-lg"/>)}</div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center"><Users className="w-10 h-10 text-text-muted mx-auto mb-3"/><p className="text-text-muted">No staff members found.</p></div>
        ) : (
          <table className="data-table">
            <thead><tr>{['Member','Role','Property','Phone','Salary','Status','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {members.map((m:any)=>(
                <tr key={m._id} className="hover:bg-surface-input/40 cursor-pointer" onClick={()=>navigate(`/admin/staff/${m._id}`)}>
                  <td className="py-3 px-4 border-b border-surface-border">
                    <div className="flex items-center gap-3">
                      {m.photoUrl ? <img src={m.photoUrl} alt={m.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" /> : <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">{m.name[0]}</div>}
                      <div><p className="text-sm font-medium text-text-primary">{m.name}</p><p className="text-xs text-text-muted">{m.email||'—'}</p></div>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b border-surface-border"><span className={cn('badge',ROLE_COLORS[m.role]||'badge-gray')}>{ROLE_LABEL[m.role]||m.role}</span></td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm text-text-muted">{(m.propertyId as any)?.name||'—'}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm">{m.phone}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm font-medium">₹{m.salary?.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 border-b border-surface-border"><span className={cn('badge',m.isActive?'badge-success':'badge-gray')}>{m.isActive?'ACTIVE':'INACTIVE'}</span></td>
                  <td className="py-3 px-4 border-b border-surface-border" onClick={e=>e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={()=>setModal({open:true,staff:m})} className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-text-muted"><Edit2 className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>handleToggle(m._id,m.name,m.isActive)} className={cn('p-1.5 rounded-lg text-text-muted',m.isActive?'hover:bg-danger/10 hover:text-danger':'hover:bg-emerald-50 hover:text-emerald-700')} title={m.isActive?'Deactivate':'Reactivate'}>
                        {m.isActive?<ToggleRight className="w-3.5 h-3.5"/>:<ToggleLeft className="w-3.5 h-3.5"/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal.open && <StaffModal staff={modal.staff} properties={properties} onClose={()=>setModal({open:false})} />}

      {/* ── Portal Login Staff (WARDEN / MESS_MANAGER) ── */}
      <LoginStaffSection />
    </div>
  );
}
