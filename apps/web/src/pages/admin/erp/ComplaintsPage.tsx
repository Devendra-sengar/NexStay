import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, ChevronRight, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAdminComplaints, useAdminComplaintById, useUpdateComplaintStatus,
  useAddInternalNote, useAdminProperties, useStaff,
} from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const CAT_ICONS: Record<string,string> = { ELECTRICITY:'⚡', FOOD:'🍽️', INTERNET:'📶', WATER:'💧', CLEANING:'🧹', OTHER:'📋' };
const STATUS_OPTS = ['ALL','OPEN','IN_PROGRESS','RESOLVED','CLOSED'];
const CATEGORIES = ['ALL','ELECTRICITY','FOOD','INTERNET','WATER','CLEANING','OTHER'];
const STATUS_COLORS: Record<string,string> = { OPEN:'badge-danger', IN_PROGRESS:'badge-warning', RESOLVED:'badge-success', CLOSED:'badge-gray' };
const NEXT_STATUSES: Record<string,string[]> = { OPEN:['IN_PROGRESS','RESOLVED','CLOSED'], IN_PROGRESS:['RESOLVED','CLOSED'], RESOLVED:['CLOSED'], CLOSED:[] };

// ── Timeline ──────────────────────────────────────────────────────────────────
function Timeline({ history }: { history: any[] }) {
  return (
    <div className="relative pl-5 space-y-4">
      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-surface-border"/>
      {history.map((h: any, i: number) => (
        <div key={i} className="relative flex gap-3">
          <div className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow flex-shrink-0 mt-0.5"/>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('badge text-xs', STATUS_COLORS[h.status]||'badge-gray')}>{h.status.replace('_',' ')}</span>
              <span className="text-xs text-text-muted">{h.changedBy || 'Admin'}</span>
              <span className="text-xs text-text-muted ml-auto">{new Date(h.changedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
            </div>
            {h.note && <p className="text-xs text-text-secondary mt-1">{h.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Complaint Drawer ──────────────────────────────────────────────────────────
function ComplaintDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: complaint, isLoading } = useAdminComplaintById(id);
  const { data: staffData } = useStaff({});
  const staffList = staffData?.data ?? [];
  const updateStatus = useUpdateComplaintStatus();
  const addNote = useAddInternalNote();

  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [assignStaff, setAssignStaff] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [tab, setTab] = useState<'timeline'|'notes'>('timeline');

  const handleStatusUpdate = async () => {
    if (!newStatus || !statusNote.trim()) { toast.error('Status and note required'); return; }
    try {
      await updateStatus.mutateAsync({ id, status: newStatus, note: statusNote, assignedToStaffId: assignStaff || undefined });
      toast.success('Status updated'); setNewStatus(''); setStatusNote(''); setAssignStaff('');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleAddNote = async () => {
    if (!internalNote.trim()) { toast.error('Note cannot be empty'); return; }
    try { await addNote.mutateAsync({ id, note: internalNote }); toast.success('Note added'); setInternalNote(''); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const person = complaint?.hostelStudentId || complaint?.guestId;
  const nextStatuses = NEXT_STATUSES[complaint?.status || 'OPEN'] || [];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose}/>
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3"><div className="skeleton h-8 rounded"/><div className="skeleton h-32 rounded"/></div>
        ) : !complaint ? (
          <div className="p-6 text-center text-text-muted">Not found</div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="font-bold text-text-primary">{complaint.title}</p>
                <p className="text-xs text-text-muted">{CAT_ICONS[complaint.category]} {complaint.category} • {(complaint.propertyId as any)?.name}</p>
              </div>
              <button onClick={onClose}><X className="w-5 h-5 text-text-muted"/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Status + person */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={cn('badge', STATUS_COLORS[complaint.status]||'badge-gray')}>{complaint.status.replace('_',' ')}</span>
                {person && (
                  <button onClick={()=>{ if (complaint.hostelStudentId) navigate(`/admin/tenants/${(complaint.hostelStudentId as any)._id||complaint.hostelStudentId}`); }} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <User className="w-3.5 h-3.5"/>{person.name || '—'}
                  </button>
                )}
                {complaint.assignedToStaffId && (
                  <span className="text-xs text-text-muted">Assigned: {(complaint.assignedToStaffId as any).name}</span>
                )}
              </div>
              <p className="text-sm text-text-secondary">{complaint.description}</p>

              {/* Status update */}
              {nextStatuses.length > 0 && (
                <div className="p-4 bg-surface-input/50 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-text-primary uppercase tracking-wide">Update Status</p>
                  <select className="input-field" value={newStatus} onChange={e=>setNewStatus(e.target.value)}>
                    <option value="">Select new status…</option>
                    {nextStatuses.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                  <select className="input-field" value={assignStaff} onChange={e=>setAssignStaff(e.target.value)}>
                    <option value="">Assign to staff (optional)…</option>
                    {staffList.map((s:any)=><option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
                  </select>
                  <textarea className="input-field resize-none min-h-[70px]" placeholder="Note is required…" value={statusNote} onChange={e=>setStatusNote(e.target.value)}/>
                  <button className="btn-primary w-full" onClick={handleStatusUpdate} disabled={updateStatus.isPending}>{updateStatus.isPending?'Saving…':'Update Status'}</button>
                </div>
              )}

              {/* Tabs */}
              <div className="border-b border-surface-border flex">
                {(['timeline','notes'] as const).map(t=>(
                  <button key={t} onClick={()=>setTab(t)} className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-all',tab===t?'border-primary text-primary':'border-transparent text-text-secondary hover:text-text-primary')}>
                    {t==='timeline'?'Timeline':'Internal Notes'}
                  </button>
                ))}
              </div>

              {tab==='timeline' && (
                complaint.statusHistory?.length > 0
                  ? <Timeline history={[...complaint.statusHistory].reverse()} />
                  : <p className="text-sm text-text-muted">No history yet.</p>
              )}

              {tab==='notes' && (
                <div className="space-y-3">
                  {complaint.internalNotes?.map((n:any, i:number)=>(
                    <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs text-amber-700 font-medium mb-1">{n.addedBy} • {new Date(n.addedAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                      <p className="text-sm">{n.note}</p>
                    </div>
                  ))}
                  <textarea className="input-field resize-none min-h-[70px]" placeholder="Add internal note (admin-only)…" value={internalNote} onChange={e=>setInternalNote(e.target.value)}/>
                  <button className="btn-secondary w-full" onClick={handleAddNote} disabled={addNote.isPending}>{addNote.isPending?'Adding…':'Add Note'}</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminComplaintsPage() {
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data ?? [];
  const [propId, setPropId] = useState('');
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const [drawerComplaintId, setDrawerComplaintId] = useState<string|null>(null);

  const { data, isLoading } = useAdminComplaints({ propertyId:propId||undefined, status:status==='ALL'?undefined:status, category:category==='ALL'?undefined:category, page });
  const complaints = data?.data ?? [];

  return (
    <div className="page-container">
      <div className="mb-6"><h1 className="text-2xl font-bold text-text-primary">Complaints</h1>
        <p className="text-sm text-text-secondary mt-0.5">Manage and resolve student & guest complaints</p></div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <select className="input-field w-44" value={propId} onChange={e=>{setPropId(e.target.value);setPage(1);}}><option value="">All Properties</option>{properties.map((p:any)=><option key={p._id} value={p._id}>{p.name}</option>)}</select>
        <select className="input-field w-36" value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}>{CATEGORIES.map(c=><option key={c} value={c}>{c==='ALL'?'All Categories':`${CAT_ICONS[c]} ${c}`}</option>)}</select>
        <div className="flex rounded-lg border border-surface-border overflow-hidden">
          {STATUS_OPTS.map(s=><button key={s} onClick={()=>{setStatus(s);setPage(1);}} className={cn('px-2.5 py-2 text-xs font-medium',status===s?'bg-primary text-white':'bg-white text-text-secondary hover:bg-surface-input')}>{s.replace('_',' ')}</button>)}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-lg"/>)}</div>
        ) : complaints.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-green-500" />
            </div>
            <p className="font-semibold text-text-primary mb-1">All quiet</p>
            <p className="text-text-muted text-sm">No complaints from your tenants.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr>{['Student/Guest','Property','Title','Category','Status','Assigned To','Raised','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {complaints.map((c:any)=>{
                const person = c.hostelStudentId || c.guestId;
                return (
                  <tr key={c._id} className="hover:bg-surface-input/40 cursor-pointer" onClick={()=>setDrawerComplaintId(c._id)}>
                    <td className="py-3 px-4 border-b border-surface-border"><p className="text-sm font-medium">{person?.name||'—'}</p><p className="text-xs text-text-muted">{person?.phone||person?.email||'—'}</p></td>
                    <td className="py-3 px-4 border-b border-surface-border text-xs text-text-muted">{(c.propertyId as any)?.name||'—'}</td>
                    <td className="py-3 px-4 border-b border-surface-border"><p className="text-sm font-medium max-w-[160px] truncate" title={c.title}>{c.title}</p></td>
                    <td className="py-3 px-4 border-b border-surface-border text-sm">{CAT_ICONS[c.category]} {c.category}</td>
                    <td className="py-3 px-4 border-b border-surface-border"><span className={cn('badge',STATUS_COLORS[c.status]||'badge-gray')}>{c.status.replace('_',' ')}</span></td>
                    <td className="py-3 px-4 border-b border-surface-border text-xs text-text-muted">{(c.assignedToStaffId as any)?.name||'—'}</td>
                    <td className="py-3 px-4 border-b border-surface-border text-xs text-text-muted">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 border-b border-surface-border"><button className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-text-muted"><ChevronRight className="w-4 h-4"/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {(data?.total ?? 0) > 20 && (
          <div className="px-4 py-3 border-t border-surface-border flex justify-between text-sm">
            <span className="text-text-muted text-xs">Page {page}</span>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1.5 px-3" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</button>
              <button className="btn-secondary text-xs py-1.5 px-3" disabled={!data?.hasNextPage} onClick={()=>setPage(p=>p+1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {drawerComplaintId && <ComplaintDrawer id={drawerComplaintId} onClose={()=>setDrawerComplaintId(null)} />}
    </div>
  );
}
