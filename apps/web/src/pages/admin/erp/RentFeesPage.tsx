import { useState } from 'react';
import { CreditCard, Plus, Bell, RefreshCw, X, Check, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useRentDashboard, useRentRecords, usePreviewGenerateRent, useGenerateRent,
  useAddFine, useSendReminders, useRecordRentPayment, useAdminProperties, useErpStudents,
  useCreateFee,
} from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const ym = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const FMT = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// ── Receipt printer ────────────────────────────────────────────────────────────
function printReceipt(r: any) {
  const student = r.hostelStudentId as any;
  const prop = r.propertyId as any;
  const room = r.roomId as any;
  const w = window.open('', '_blank')!;
  w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
  <style>body{font-family:sans-serif;max-width:500px;margin:40px auto;color:#0f172a}
  h2{color:#2563eb}.row{display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding:6px 0}
  .total{font-weight:bold;font-size:1.1em}.sig{margin-top:40px;border-top:1px solid #0f172a;width:200px;padding-top:4px;font-size:12px}</style>
  </head><body>
  <h2>NexStay</h2><p>Receipt #RCPT-${r.month}-${String(r._id).slice(-6).toUpperCase()}</p>
  <div class="row"><span>Student</span><span>${student?.name||'—'}</span></div>
  <div class="row"><span>Property</span><span>${prop?.name||'—'}</span></div>
  <div class="row"><span>Room</span><span>${room?.roomNumber||'—'}</span></div>
  <div class="row"><span>Month</span><span>${r.month}</span></div>
  <div class="row"><span>Rent</span><span>${FMT(r.amount)}</span></div>
  <div class="row"><span>Fine</span><span>${FMT(r.fine||0)}</span></div>
  <div class="row total"><span>Amount Paid</span><span>${FMT(r.paidAmount||0)}</span></div>
  <div class="row"><span>Method</span><span>${r.paymentMethod||'—'}</span></div>
  <div class="row"><span>Date</span><span>${r.paidAt?new Date(r.paidAt).toLocaleDateString('en-IN'):'—'}</span></div>
  <div class="sig">Admin Signature</div></body></html>`);
  w.print();
}

// ── StatCard ───────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-text-muted font-medium mb-1">{label}</p>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
    </div>
  );
}

// ── Mini bar chart ─────────────────────────────────────────────────────────────
function TrendChart({ trend }: { trend: any[] }) {
  const max = Math.max(...trend.flatMap((t: any) => [t.due, t.collected]), 1);
  return (
    <div className="card p-4 col-span-2">
      <p className="text-sm font-semibold text-text-primary mb-4">6-Month Collection Trend</p>
      <div className="flex items-end gap-3 h-28">
        {trend.map((t: any) => (
          <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-0.5 items-end" style={{ height: 80 }}>
              <div className="flex-1 rounded-t bg-blue-200" style={{ height: `${(t.due/max)*100}%` }} title={`Due: ${FMT(t.due)}`} />
              <div className="flex-1 rounded-t bg-primary" style={{ height: `${(t.collected/max)*100}%` }} title={`Collected: ${FMT(t.collected)}`} />
            </div>
            <span className="text-[10px] text-text-muted">{t.month}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-text-muted"><span className="w-3 h-3 rounded bg-blue-200 inline-block"/>Due</span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted"><span className="w-3 h-3 rounded bg-primary inline-block"/>Collected</span>
      </div>
    </div>
  );
}

// ── Pay Modal ──────────────────────────────────────────────────────────────────
function PayModal({ record, onClose }: { record: any; onClose: () => void }) {
  const balance = Math.max(0, record.amount + (record.fine||0) - (record.paidAmount||0));
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const pay = useRecordRentPayment();
  const remaining = Math.max(0, balance - amount);
  const submit = async () => {
    if (amount <= 0) { toast.error('Enter valid amount'); return; }
    try {
      await pay.mutateAsync({ id: record._id, amount, paymentMethod: method, notes });
      toast.success('Payment recorded');
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between mb-4"><h3 className="font-bold">Record Payment</h3><button onClick={onClose}><X className="w-4 h-4"/></button></div>
        <p className="text-sm text-text-muted mb-3">Balance: {FMT(balance)} • Month: {record.month}</p>
        <div className="space-y-3">
          <div><label className="form-label">Amount (₹)</label>
            <input type="number" className="input-field" value={amount} max={balance} onChange={e=>setAmount(+e.target.value)} /></div>
          <p className="text-xs text-text-muted">Remaining after: {FMT(remaining)}</p>
          <div><label className="form-label">Method</label>
            <select className="input-field" value={method} onChange={e=>setMethod(e.target.value)}>
              {['CASH','UPI','CARD','BANK_TRANSFER'].map(m=><option key={m} value={m}>{m.replace('_',' ')}</option>)}
            </select></div>
          <div><label className="form-label">Notes (optional)</label>
            <input className="input-field" value={notes} onChange={e=>setNotes(e.target.value)} /></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={pay.isPending}>{pay.isPending?'Saving…':'Record'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Fine Modal ─────────────────────────────────────────────────────────────────
function FineModal({ record, onClose }: { record: any; onClose: () => void }) {
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const addFine = useAddFine();
  const submit = async () => {
    if (!amount || !reason.trim()) { toast.error('Amount and reason required'); return; }
    try { await addFine.mutateAsync({ id: record._id, amount, reason }); toast.success('Fine added'); onClose(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between mb-4"><h3 className="font-bold">Add Fine</h3><button onClick={onClose}><X className="w-4 h-4"/></button></div>
        <div className="space-y-3">
          <div><label className="form-label">Fine Amount (₹)</label><input type="number" className="input-field" value={amount} onChange={e=>setAmount(+e.target.value)} /></div>
          <div><label className="form-label">Reason *</label><input className="input-field" value={reason} onChange={e=>setReason(e.target.value)} /></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-danger flex-1" onClick={submit} disabled={addFine.isPending}>{addFine.isPending?'Saving…':'Add Fine'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Generate Modal ─────────────────────────────────────────────────────────────
function GenerateModal({ onClose }: { onClose: () => void }) {
  const [month] = useState(ym());
  const [dueDate, setDueDate] = useState(`${ym()}-05`);
  const { data: preview } = usePreviewGenerateRent(month);
  const generate = useGenerateRent();
  const submit = async () => {
    try {
      const res = await generate.mutateAsync({ month, dueDate });
      toast.success(res.message); onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between mb-4"><h3 className="font-bold">Generate Rent</h3><button onClick={onClose}><X className="w-4 h-4"/></button></div>
        {preview?.alreadyGenerated ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 mb-4">
            Rent for {month} is already generated. {preview.existingCount} records exist.
          </div>
        ) : (
          <p className="text-sm text-text-secondary mb-4">
            Generate rent for <strong>{preview?.studentCount||0}</strong> active students.
            Total expected: <strong>{FMT(preview?.totalExpected||0)}</strong>
          </p>
        )}
        <div><label className="form-label">Due Date</label><input type="date" className="input-field" value={dueDate} onChange={e=>setDueDate(e.target.value)} /></div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={generate.isPending||preview?.alreadyGenerated}>
            {generate.isPending?'Generating…':'Generate Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Fee Modal ──────────────────────────────────────────────────────────────
function AddFeeModal({ onClose }: { onClose: () => void }) {
  const { data: studData } = useErpStudents({ status: 'ACTIVE' });
  const students = studData?.data ?? [];
  const [studentId, setStudentId] = useState('');
  const [feeType, setFeeType] = useState('Admission Fee');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const create = useCreateFee();
  const FEE_TYPES = ['Admission Fee','Security Deposit','Maintenance','Laundry','Food Add-On','Other'];
  const submit = async () => {
    if (!studentId || !amount) { toast.error('Student and amount required'); return; }
    try { await create.mutateAsync({ hostelStudentId: studentId, feeType, amount, dueDate, notes }); toast.success('Fee created'); onClose(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between mb-4"><h3 className="font-bold">Add Fee</h3><button onClick={onClose}><X className="w-4 h-4"/></button></div>
        <div className="space-y-3">
          <div><label className="form-label">Student</label>
            <select className="input-field" value={studentId} onChange={e=>setStudentId(e.target.value)}>
              <option value="">Select student…</option>
              {students.map((s:any)=><option key={s._id} value={s._id}>{s.name} ({s.phone})</option>)}
            </select></div>
          <div><label className="form-label">Fee Type</label>
            <select className="input-field" value={feeType} onChange={e=>setFeeType(e.target.value)}>
              {FEE_TYPES.map(f=><option key={f} value={f}>{f}</option>)}
            </select></div>
          <div><label className="form-label">Amount (₹)</label><input type="number" className="input-field" value={amount} onChange={e=>setAmount(+e.target.value)} /></div>
          <div><label className="form-label">Due Date</label><input type="date" className="input-field" value={dueDate} onChange={e=>setDueDate(e.target.value)} /></div>
          <div><label className="form-label">Notes</label><input className="input-field" value={notes} onChange={e=>setNotes(e.target.value)} /></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={create.isPending}>{create.isPending?'Saving…':'Create Fee'}</button>
        </div>
      </div>
    </div>
  );
}

const STATUS_OPTS = ['ALL','PAID','UNPAID','PARTIAL'];

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RentFeesPage() {
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data ?? [];
  const [propId, setPropId] = useState('');
  const [status, setStatus] = useState('ALL');
  const [month, setMonth] = useState(ym());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'RENT'|'FEE'>('RENT');
  const [selected, setSelected] = useState<string[]>([]);
  const [modal, setModal] = useState<{type:string;record?:any}|null>(null);
  const sendReminders = useSendReminders();

  const { data: dash } = useRentDashboard(propId||undefined);
  const { data: records, isLoading } = useRentRecords({ propertyId:propId||undefined, status:status==='ALL'?undefined:status, month:month||undefined, search:search||undefined, page, type:tab });

  const rows = records?.data ?? [];
  const total = records?.total ?? 0;

  const toggleSelect = (id: string) => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);
  const allSelected = rows.length > 0 && rows.every((r:any) => selected.includes(r._id));

  const handleBulkReminder = async () => {
    if (!selected.length) { toast.error('Select records first'); return; }
    try { const res = await sendReminders.mutateAsync(selected); toast.success(res.message); setSelected([]); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 className="text-2xl font-bold text-text-primary">Rent & Fees</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage rent collection, fines, and additional fees</p></div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={()=>setModal({type:'fee'})}><Plus className="w-4 h-4"/>Add Fee</button>
          <button className="btn-primary flex items-center gap-2" onClick={()=>setModal({type:'generate'})}><RefreshCw className="w-4 h-4"/>Generate Rent</button>
        </div>
      </div>

      {/* Stats */}
      {dash && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard label="Total Due This Month" value={FMT(dash.totalDue)} color="text-danger" />
          <StatCard label="Collected This Month" value={FMT(dash.totalCollected)} color="text-emerald-600" />
          <StatCard label="Partially Paid" value={String(dash.partialCount)} color="text-amber-600" />
          <StatCard label="Overdue Amount" value={FMT(dash.overdueAmt)} color="text-red-700" />
          {dash.trend?.length > 0 && <TrendChart trend={dash.trend} />}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex rounded-lg border border-surface-border overflow-hidden">
          {(['RENT','FEE'] as const).map(t=>(
            <button key={t} onClick={()=>{setTab(t);setPage(1);}} className={cn('px-4 py-2 text-xs font-medium',tab===t?'bg-primary text-white':'bg-white text-text-secondary hover:bg-surface-input')}>{t==='RENT'?'Rent':'Fees'}</button>
          ))}
        </div>
        <select className="input-field w-40" value={propId} onChange={e=>{setPropId(e.target.value);setPage(1);}}>
          <option value="">All Properties</option>
          {properties.map((p:any)=><option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <input type="month" className="input-field w-36" value={month} onChange={e=>{setMonth(e.target.value);setPage(1);}} />
        <div className="flex rounded-lg border border-surface-border overflow-hidden">
          {STATUS_OPTS.map(s=>(
            <button key={s} onClick={()=>{setStatus(s);setPage(1);}} className={cn('px-2.5 py-2 text-xs font-medium',status===s?'bg-primary text-white':'bg-white text-text-secondary hover:bg-surface-input')}>{s}</button>
          ))}
        </div>
        <input className="input-field flex-1 min-w-36" placeholder="Search student…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} />
        {selected.length > 0 && (
          <button className="btn-secondary flex items-center gap-2 text-xs" onClick={handleBulkReminder} disabled={sendReminders.isPending}>
            <Bell className="w-3.5 h-3.5"/>Send Reminders ({selected.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-lg"/>)}</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center"><CreditCard className="w-10 h-10 text-text-muted mx-auto mb-3"/><p className="text-text-muted">No records found.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr>
                <th><input type="checkbox" checked={allSelected} onChange={()=>allSelected?setSelected([]):setSelected(rows.map((r:any)=>r._id))} /></th>
                {['Student','Property','Room','Month','Due Date','Rent','Fine','Total','Paid','Balance','Status','Actions'].map(h=><th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((r:any)=>{
                  const student = r.hostelStudentId as any;
                  const total = r.amount + (r.fine||0);
                  const bal = Math.max(0, total - (r.paidAmount||0));
                  return (
                    <tr key={r._id} className={cn('hover:bg-surface-input/40', selected.includes(r._id)&&'bg-primary/5')}>
                      <td className="py-3 px-4 border-b border-surface-border"><input type="checkbox" checked={selected.includes(r._id)} onChange={()=>toggleSelect(r._id)} /></td>
                      <td className="py-3 px-4 border-b border-surface-border"><p className="text-sm font-medium">{student?.name||'—'}</p><p className="text-xs text-text-muted">{student?.phone}</p></td>
                      <td className="py-3 px-4 border-b border-surface-border text-xs text-text-muted">{(r.propertyId as any)?.name||'—'}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-xs">{(r.roomId as any)?.roomNumber||'—'}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-xs font-mono">{r.month}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-xs">{r.dueDate?new Date(r.dueDate).toLocaleDateString('en-IN'):'—'}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm">{FMT(r.amount)}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm text-danger">{r.fine?FMT(r.fine):'—'}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm font-medium">{FMT(total)}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm text-emerald-600">{FMT(r.paidAmount||0)}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm text-danger">{FMT(bal)}</td>
                      <td className="py-3 px-4 border-b border-surface-border">
                        <span className={cn('badge text-xs',r.status==='PAID'?'badge-success':r.status==='PARTIAL'?'badge-warning':'badge-danger')}>{r.status}</span>
                      </td>
                      <td className="py-3 px-4 border-b border-surface-border">
                        <div className="flex gap-1">
                          {r.status!=='PAID'&&<button title="Record Payment" onClick={()=>setModal({type:'pay',record:r})} className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-text-muted"><CreditCard className="w-3.5 h-3.5"/></button>}
                          {r.status!=='PAID'&&<button title="Add Fine" onClick={()=>setModal({type:'fine',record:r})} className="p-1.5 hover:bg-danger/10 hover:text-danger rounded-lg text-text-muted text-xs font-bold">+₹</button>}
                          {r.status==='PAID'&&<button title="Print Receipt" onClick={()=>printReceipt(r)} className="p-1.5 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-text-muted"><Printer className="w-3.5 h-3.5"/></button>}
                          <button title="Send Reminder" onClick={async()=>{try{await sendReminders.mutateAsync([r._id]);toast.success('Reminder sent');}catch(e:any){toast.error(e.response?.data?.message||'Error');}}} className="p-1.5 hover:bg-amber-50 hover:text-amber-700 rounded-lg text-text-muted"><Bell className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {total > 20 && (
          <div className="px-4 py-3 border-t border-surface-border flex justify-between text-sm">
            <span className="text-text-muted">Page {page} of {Math.ceil(total/20)}</span>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1.5 px-3" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</button>
              <button className="btn-secondary text-xs py-1.5 px-3" disabled={!records?.hasNextPage} onClick={()=>setPage(p=>p+1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {modal?.type==='pay'    && <PayModal      record={modal.record} onClose={()=>setModal(null)} />}
      {modal?.type==='fine'   && <FineModal     record={modal.record} onClose={()=>setModal(null)} />}
      {modal?.type==='generate' && <GenerateModal onClose={()=>setModal(null)} />}
      {modal?.type==='fee'    && <AddFeeModal   onClose={()=>setModal(null)} />}
    </div>
  );
}
