import { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartTooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Plus, Edit2, Trash2, Loader2, X, CheckCircle2, TrendingUp,
  TrendingDown, IndianRupee, BarChart2, Zap, AlertCircle
} from 'lucide-react';
import { useExpenses, useExpenseBreakdown, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { useProperties } from '@/hooks/useProperties';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'ELECTRICITY', label: 'Electricity', color: '#6C63FF' },
  { value: 'WATER', label: 'Water', color: '#22D3EE' },
  { value: 'STAFF_SALARY', label: 'Staff Salary', color: '#F97316' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: '#F59E0B' },
  { value: 'MISC', label: 'Miscellaneous', color: '#10B981' },
];

const getCategoryColor = (cat: string) =>
  CATEGORIES.find(c => c.value === cat)?.color || '#94A3B8';

const getCategoryLabel = (cat: string) =>
  CATEGORIES.find(c => c.value === cat)?.label || cat;

// ─── Expense Form Modal ───────────────────────────────────────────────────────
function ExpenseFormModal({
  expense, properties, onClose,
}: { expense?: any; properties: any[]; onClose: () => void }) {
  const isEdit = !!expense;
  const [form, setForm] = useState({
    propertyId: expense?.propertyId?._id || expense?.propertyId || '',
    category: expense?.category || 'ELECTRICITY',
    amount: expense?.amount?.toString() || '',
    date: expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
    notes: expense?.notes || '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const create = useCreateExpense();
  const update = useUpdateExpense();

  const handleSubmit = async () => {
    setError('');
    if (!form.propertyId || !form.amount || !form.date) {
      setError('Property, amount and date are required.'); return;
    }
    try {
      if (isEdit) {
        await update.mutateAsync({ id: expense._id, ...form, amount: Number(form.amount) });
      } else {
        await create.mutateAsync({ ...form, amount: Number(form.amount) });
      }
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save expense');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-md animate-slide-up shadow-card">
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <h3 className="text-text-primary font-semibold">{isEdit ? 'Edit Expense' : 'Add Expense'}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-text-faint" /></button>
        </div>

        <div className="p-5">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-status-success mx-auto mb-2" />
              <p className="text-text-primary font-semibold">Expense {isEdit ? 'updated' : 'added'}!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Property *</label>
                <select className="input-field" value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}>
                  <option value="">Select property</option>
                  {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Category *</label>
                <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Amount (₹) *</label>
                  <input type="number" className="input-field" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 3500" min={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Date *</label>
                  <input type="date" className="input-field" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Notes</label>
                <input className="input-field" placeholder="Optional description" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              {error && <p className="text-status-error text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSubmit} disabled={create.isPending || update.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {(create.isPending || update.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEdit ? 'Update' : 'Add Expense'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteDialog({ expense, onConfirm, onCancel, isLoading }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-sm animate-slide-up shadow-card p-6">
        <div className="w-12 h-12 rounded-full bg-status-error/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-status-error" />
        </div>
        <h3 className="text-text-primary font-bold text-center mb-2">Delete Expense</h3>
        <p className="text-text-muted text-sm text-center mb-6">
          Remove <strong className="text-text-primary">{getCategoryLabel(expense.category)}</strong> — {formatCurrency(expense.amount)}?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={isLoading}
            className="flex-1 py-2.5 rounded-md bg-status-error hover:bg-status-error/80 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Tooltip for Pie ───────────────────────────────────────────────────
const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 shadow-card">
      <p className="text-text-primary font-semibold text-sm">{getCategoryLabel(d.category)}</p>
      <p className="text-brand-primary font-bold">{formatCurrency(d.total)}</p>
      <p className="text-text-faint text-xs">{d.percentage}% of total</p>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: propsData } = useProperties();
  const properties = propsData?.data || [];

  const { data, isLoading } = useExpenses({
    propertyId: propertyFilter || undefined,
    category: categoryFilter || undefined,
    month,
    year,
    page,
  });

  const { data: breakdown, isLoading: breakdownLoading } = useExpenseBreakdown({
    propertyId: propertyFilter || undefined,
    month,
    year,
  });

  const deleteExpense = useDeleteExpense();

  const expenses = data?.data || [];
  const total = data?.total || 0;
  const pieData = breakdown?.breakdown || [];

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="section-header">Expenses</h1>
          <p className="text-text-muted text-sm">{total} records · {breakdown?.month}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Month / Property filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-surface-card border border-surface-border rounded-lg p-1">
          {MONTHS.map((m, i) => (
            <button key={m} onClick={() => { setMonth(i + 1); setPage(1); }}
              className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors', month === i + 1 ? 'bg-brand-primary text-white' : 'text-text-muted hover:text-text-primary')}>
              {m}
            </button>
          ))}
        </div>
        <select className="input-field w-auto text-sm"
          value={year} onChange={e => setYear(Number(e.target.value))}>
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select className="input-field w-auto text-sm" value={propertyFilter} onChange={e => { setPropertyFilter(e.target.value); setPage(1); }}>
          <option value="">All Properties</option>
          {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <select className="input-field w-auto text-sm" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        {/* Donut Chart */}
        <div className="xl:col-span-1 glass-card rounded-xl p-5">
          <h2 className="text-text-primary font-semibold mb-4">Category Breakdown</h2>
          {breakdownLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
            </div>
          ) : pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData.map((d: any) => ({ ...d, name: getCategoryLabel(d.category) }))}
                    dataKey="total" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color || getCategoryColor(entry.category)} />
                    ))}
                  </Pie>
                  <RechartTooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="space-y-1.5 mt-2">
                {pieData.map((d: any) => (
                  <div key={d.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color || getCategoryColor(d.category) }} />
                      <span className="text-text-muted">{getCategoryLabel(d.category)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-faint">{d.percentage}%</span>
                      <span className="text-text-primary font-medium">{formatCurrency(d.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <BarChart2 className="w-8 h-8 text-text-faint mb-2" />
              <p className="text-text-muted text-sm">No expense data for this period</p>
            </div>
          )}
        </div>

        {/* Net View */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 content-start">
          {[
            {
              label: 'Total Collection',
              value: formatCurrency(breakdown?.totalCollection || 0),
              icon: IndianRupee,
              color: 'text-status-success',
              bg: 'bg-status-success/10',
            },
            {
              label: 'Total Expenses',
              value: formatCurrency(breakdown?.totalExpenses || 0),
              icon: Zap,
              color: 'text-status-warning',
              bg: 'bg-status-warning/10',
            },
            {
              label: 'Net Collection',
              value: formatCurrency(breakdown?.netCollection || 0),
              icon: (breakdown?.netCollection || 0) >= 0 ? TrendingUp : TrendingDown,
              color: (breakdown?.netCollection || 0) >= 0 ? 'text-status-success' : 'text-status-error',
              bg: (breakdown?.netCollection || 0) >= 0 ? 'bg-status-success/10' : 'bg-status-error/10',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="glass-card rounded-xl p-5">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <p className="text-text-muted text-sm">{label}</p>
              <p className={cn('text-xl font-bold mt-1', color)}>{value}</p>
              <p className="text-text-faint text-xs mt-1">{breakdown?.month}</p>
            </div>
          ))}

          {/* Category bars */}
          <div className="sm:col-span-3 glass-card rounded-xl p-5">
            <h3 className="text-text-primary font-semibold mb-3 text-sm">Spend by Category</h3>
            {breakdownLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-6 bg-surface-dark rounded animate-pulse" />)}</div>
            ) : pieData.length > 0 ? (
              <div className="space-y-2">
                {pieData.map((d: any) => (
                  <div key={d.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-muted text-xs">{getCategoryLabel(d.category)}</span>
                      <span className="text-text-primary text-xs font-medium">{formatCurrency(d.total)}</span>
                    </div>
                    <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${d.percentage}%`, backgroundColor: d.color || getCategoryColor(d.category) }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-faint text-sm">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Expense Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="glass-card rounded-xl flex flex-col items-center justify-center py-14 text-center">
          <Zap className="w-10 h-10 text-text-faint mb-3" />
          <p className="text-text-muted">No expenses for this period</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add First Expense
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Property</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e: any) => (
                <tr key={e._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(e.category) }} />
                      <span className="text-text-primary font-medium text-sm">{getCategoryLabel(e.category)}</span>
                    </div>
                  </td>
                  <td className="text-text-muted text-sm">{(e.propertyId as any)?.name || '—'}</td>
                  <td className="font-semibold text-status-warning">{formatCurrency(e.amount)}</td>
                  <td className="text-text-muted text-sm">{formatDate(e.date)}</td>
                  <td className="text-text-faint text-sm max-w-[200px] truncate">{e.notes || '—'}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditTarget(e)}
                        className="p-1.5 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(e)}
                        className="p-1.5 text-status-error hover:bg-status-error/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {total > 30 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-surface-border">
              <p className="text-text-muted text-xs">{total} expenses · Page {page}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 30 >= total} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {(showForm || editTarget) && (
        <ExpenseFormModal
          expense={editTarget}
          properties={properties}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          expense={deleteTarget}
          onConfirm={async () => { await deleteExpense.mutateAsync(deleteTarget._id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteExpense.isPending}
        />
      )}
    </div>
  );
}
