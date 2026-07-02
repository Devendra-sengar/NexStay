import { useState } from 'react';
import { Receipt, Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useAdminProperties } from '@/lib/adminApi';
import { cn } from '@/lib/utils';
import CloudinaryUpload from '@/components/ui/CloudinaryUpload';

const ym = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const FMT = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const CATEGORIES = ['ELECTRICITY','WATER','STAFF_SALARY','MAINTENANCE','INTERNET','FOOD','MISCELLANEOUS'];
const CAT_COLORS: Record<string,string> = {
  ELECTRICITY:'#f59e0b', WATER:'#3b82f6', STAFF_SALARY:'#8b5cf6',
  MAINTENANCE:'#ef4444', INTERNET:'#06b6d4', FOOD:'#10b981', MISCELLANEOUS:'#6b7280',
};
const CAT_LABEL: Record<string,string> = {
  ELECTRICITY:'Electricity', WATER:'Water', STAFF_SALARY:'Staff Salary',
  MAINTENANCE:'Maintenance', INTERNET:'Internet', FOOD:'Food', MISCELLANEOUS:'Miscellaneous',
};

// ── Donut chart (pure SVG) ─────────────────────────────────────────────────────
function DonutChart({ byCategory, total }: { byCategory: Record<string,number>; total: number }) {
  if (total === 0) return <div className="flex items-center justify-center h-32 text-sm text-text-muted">No expenses</div>;
  let cumAngle = -90;
  const r = 52; const cx = 64; const cy = 64;
  const slices = Object.entries(byCategory).map(([cat, amt]) => {
    const pct = amt / total;
    const startAngle = cumAngle;
    cumAngle += pct * 360;
    const endAngle = cumAngle;
    const toRad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle - 0.01));
    const y2 = cy + r * Math.sin(toRad(endAngle - 0.01));
    const large = pct > 0.5 ? 1 : 0;
    return { cat, amt, pct, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });

  return (
    <div className="flex items-start gap-4">
      <svg width={128} height={128} className="flex-shrink-0">
        {slices.map(({ cat, path }) => (
          <path key={cat} d={path} fill={CAT_COLORS[cat] || '#6b7280'} stroke="white" strokeWidth={2} />
        ))}
        <circle cx={cx} cy={cy} r={30} fill="white" />
      </svg>
      <div className="flex-1 space-y-1.5 pt-1">
        {slices.map(({ cat, amt, pct }) => (
          <div key={cat} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[cat] || '#6b7280' }} />
            <span className="text-xs text-text-secondary flex-1 truncate">{CAT_LABEL[cat] || cat.replace(/_/g,' ')}</span>
            <span className="text-xs font-medium text-text-primary">{FMT(amt)}</span>
            <span className="text-[10px] text-text-muted">({(pct*100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Expense Modal ──────────────────────────────────────────────────────────────
function ExpenseModal({ expense, properties, onClose }: { expense?: any; properties: any[]; onClose: () => void }) {
  const [form, setForm] = useState({
    propertyId: expense?.propertyId?._id || expense?.propertyId || properties[0]?._id || '',
    category: expense?.category || 'ELECTRICITY',
    amount: expense?.amount || '',
    date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: expense?.description || '',
    receiptUrl: expense?.receiptUrl || '',
  });
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
  const submit = async () => {
    if (!form.propertyId || !form.category || !form.amount || !form.date) { toast.error('Fill required fields'); return; }
    try {
      if (expense) { await update.mutateAsync({ id: expense._id, ...form }); toast.success('Updated'); }
      else { await create.mutateAsync(form); toast.success('Expense added'); }
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };
  const busy = create.isPending || update.isPending;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between mb-4"><h3 className="font-bold">{expense?'Edit':'Add'} Expense</h3><button onClick={onClose}><X className="w-4 h-4"/></button></div>
        <div className="space-y-3">
          <div><label className="form-label">Property *</label>
            <select className="input-field" value={form.propertyId} onChange={set('propertyId')}>
              {properties.map((p:any)=><option key={p._id} value={p._id}>{p.name}</option>)}
            </select></div>
          <div><label className="form-label">Category *</label>
            <select className="input-field" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c=><option key={c} value={c}>{CAT_LABEL[c]||c.replace(/_/g,' ')}</option>)}
            </select></div>
          <div><label className="form-label">Amount (₹) *</label><input type="number" className="input-field" value={form.amount} onChange={set('amount')} /></div>
          <div><label className="form-label">Date *</label><input type="date" className="input-field" value={form.date} onChange={set('date')} /></div>
          <div><label className="form-label">Description</label><input className="input-field" value={form.description} onChange={set('description')} /></div>
          <div>
            <label className="form-label">Receipt <span className="text-text-muted font-normal">(optional)</span></label>
            <CloudinaryUpload
              value={form.receiptUrl ? [form.receiptUrl] : []}
              onChange={urls => setForm(f => ({ ...f, receiptUrl: urls[0] || '' }))}
              maxImages={1}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={busy}>{busy?'Saving…':expense?'Update':'Add Expense'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data ?? [];
  const [propId, setPropId] = useState('');
  const [month, setMonth] = useState(ym());
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{open:boolean;expense?:any}>({open:false});
  const [delConfirm, setDelConfirm] = useState<any>(null);

  const { data, isLoading } = useExpenses({ propertyId:propId||undefined, month:month||undefined, page });
  const deleteExp = useDeleteExpense();

  const expenses = data?.data ?? [];
  const summary = data?.summary;

  const handleDelete = async () => {
    try { await deleteExp.mutateAsync(delConfirm._id); toast.success('Deleted'); setDelConfirm(null); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 className="text-2xl font-bold text-text-primary">Expenses</h1>
          <p className="text-sm text-text-secondary mt-0.5">Track property-level expenses by category</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={()=>setModal({open:true})}><Plus className="w-4 h-4"/>Add Expense</button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <select className="input-field w-44" value={propId} onChange={e=>{setPropId(e.target.value);setPage(1);}}>
          <option value="">All Properties</option>
          {properties.map((p:any)=><option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <input type="month" className="input-field w-36" value={month} onChange={e=>{setMonth(e.target.value);setPage(1);}} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-lg"/>)}</div>
            ) : expenses.length === 0 ? (
              <div className="p-10 text-center"><Receipt className="w-10 h-10 text-text-muted mx-auto mb-3"/><p className="text-text-muted">No expenses for this period.</p></div>
            ) : (
              <table className="data-table">
                <thead><tr>{['Category','Description','Amount','Date','Property','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {expenses.map((e:any)=>(
                    <tr key={e._id} className="hover:bg-surface-input/40">
                      <td className="py-3 px-4 border-b border-surface-border">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background: CAT_COLORS[e.category] || '#6b7280'}} />
                          <span style={{color:CAT_COLORS[e.category]}}>{CAT_LABEL[e.category]||e.category.replace(/_/g,' ')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm text-text-secondary">{e.description||'—'}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm font-semibold">{FMT(e.amount)}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-xs text-text-muted">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-xs text-text-muted">{(e.propertyId as any)?.name||'—'}</td>
                      <td className="py-3 px-4 border-b border-surface-border">
                        <div className="flex gap-1">
                          <button onClick={()=>setModal({open:true,expense:e})} className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-text-muted"><Edit2 className="w-3.5 h-3.5"/></button>
                          <button onClick={()=>setDelConfirm(e)} className="p-1.5 hover:bg-danger/10 hover:text-danger rounded-lg text-text-muted"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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

        {/* Summary Panel */}
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-sm font-semibold text-text-primary mb-4">Category Breakdown</p>
            {summary && <DonutChart byCategory={summary.byCategory || {}} total={summary.totalExpense || 0} />}
          </div>
          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-text-primary">Monthly Summary</p>
            <div className="flex justify-between text-sm py-2 border-b border-surface-border">
              <span className="text-text-muted">Rent Collected</span>
              <span className="font-medium text-emerald-600">{FMT(summary?.rentCollected||0)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-surface-border">
              <span className="text-text-muted">Total Expenses</span>
              <span className="font-medium text-danger">{FMT(summary?.totalExpense||0)}</span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span className="font-semibold">Net</span>
              <span className={cn('font-bold text-lg',(summary?.net||0)>=0?'text-emerald-600':'text-danger')}>
                {(summary?.net||0)>=0?'+':''}{FMT(summary?.net||0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {modal.open && <ExpenseModal expense={modal.expense} properties={properties} onClose={()=>setModal({open:false})} />}
      {delConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="font-bold mb-2">Delete Expense?</p>
            <p className="text-sm text-text-muted mb-5">{delConfirm.category.replace('_',' ')} — {FMT(delConfirm.amount)}</p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={()=>setDelConfirm(null)}>Cancel</button>
              <button className="btn-danger flex-1" onClick={handleDelete} disabled={deleteExp.isPending}>{deleteExp.isPending?'Deleting…':'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
