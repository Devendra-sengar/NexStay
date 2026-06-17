import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, IndianRupee, AlertCircle, Clock,
  Search, Filter, Loader2, CheckCircle2, Send, RefreshCw, X, CreditCard, Receipt, Zap
} from 'lucide-react';
import {
  useRentStats, useRentRecords, useRentGenerationPreview,
  useRecordPayment, useGenerateMonthlyRent, useSendReminder
} from '@/hooks/useRent';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useProperties } from '@/hooks/useProperties';

// ─── Record Payment Modal ─────────────────────────────────────────────────────
function PaymentModal({ record, onClose }: { record: any; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState<any>(null);
  const mutation = useRecordPayment();

  const remaining = record.amount - record.paidAmount;
  const newPaid = Math.min(Number(amount) || 0, remaining);
  const willBePaid = newPaid >= remaining;

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;
    const res = await mutation.mutateAsync({ id: record._id, data: { paymentAmount: Number(amount), paymentMethod: method, paidAt: date, notes } });
    setResult(res);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-md animate-slide-up shadow-card">
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-primary" />
            <h3 className="text-text-primary font-semibold">Record Payment</h3>
          </div>
          <button onClick={onClose} className="text-text-faint hover:text-text-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5">
          {result ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-status-success mx-auto mb-3" />
              <p className="text-text-primary font-bold mb-1">{result.message}</p>
              {result.remaining > 0 && (
                <p className="text-text-muted text-sm">Remaining: {formatCurrency(result.remaining)}</p>
              )}
              <button onClick={onClose} className="btn-primary mt-4">Done</button>
            </div>
          ) : (
            <>
              {/* Student info */}
              <div className="flex items-center gap-3 p-3 bg-surface-dark rounded-lg mb-4">
                <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
                  {getInitials((record.studentId as any)?.name || '?')}
                </div>
                <div>
                  <p className="text-text-primary font-medium text-sm">{(record.studentId as any)?.name}</p>
                  <p className="text-text-faint text-xs">Due: {formatDate(record.dueDate)} · Total: {formatCurrency(record.amount)}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-text-faint text-xs">Remaining</p>
                  <p className="text-status-warning font-bold">{formatCurrency(remaining)}</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Amount Paid (₹) *</label>
                  <input
                    type="number" className="input-field" value={amount}
                    onChange={e => setAmount(e.target.value)} placeholder={`Max: ₹${remaining}`} min={1} max={remaining}
                  />
                  {Number(amount) > 0 && (
                    <p className={cn('text-xs mt-1', willBePaid ? 'text-status-success' : 'text-status-warning')}>
                      {willBePaid
                        ? '✅ This will mark the rent as PAID'
                        : `⚠️ Partial — ₹${(remaining - Number(amount)).toLocaleString('en-IN')} will remain`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Payment Method</label>
                  <select className="input-field" value={method} onChange={e => setMethod(e.target.value)}>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Date</label>
                  <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Notes (optional)</label>
                  <input className="input-field" placeholder="e.g. Paid via GPay" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleSubmit} disabled={mutation.isPending || !amount}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Record
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Generate Rent Modal ──────────────────────────────────────────────────────
function GenerateRentModal({ onClose }: { onClose: () => void }) {
  const { data: preview, isLoading } = useRentGenerationPreview();
  const generateMutation = useGenerateMonthlyRent();
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    const res = await generateMutation.mutateAsync({});
    setResult(res);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-sm animate-slide-up shadow-card">
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-accent" />
            <h3 className="text-text-primary font-semibold">Generate Monthly Rent</h3>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-text-faint" /></button>
        </div>

        <div className="p-5">
          {result ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-status-success mx-auto mb-3" />
              <p className="text-text-primary font-bold mb-1">{result.message}</p>
              {result.created > 0 && (
                <p className="text-text-muted text-sm">Total: {formatCurrency(result.totalAmount)}</p>
              )}
              <button onClick={onClose} className="btn-primary mt-4">Close</button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
            </div>
          ) : preview ? (
            <>
              <div className="bg-surface-dark rounded-xl p-4 space-y-2 mb-4">
                <p className="text-text-faint text-xs font-medium uppercase tracking-wide">Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Target Month</span>
                  <span className="text-text-primary font-medium">{preview.targetMonth}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Active Tenants</span>
                  <span className="text-brand-primary font-bold">{preview.totalStudents}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-surface-border pt-2 mt-2">
                  <span className="text-text-muted">Estimated Total</span>
                  <span className="text-status-success font-bold">{formatCurrency(preview.estimatedTotal)}</span>
                </div>
              </div>

              {preview.totalStudents === 0 ? (
                <p className="text-text-muted text-sm text-center">Rent already generated for all active tenants this month.</p>
              ) : (
                <div className="flex items-start gap-2 bg-status-warning/5 border border-status-warning/20 rounded-lg p-3 mb-4">
                  <AlertCircle className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                  <p className="text-text-muted text-xs">This will create {preview.totalStudents} UNPAID rent record(s) for {preview.targetMonth}.</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button
                  onClick={handleGenerate} disabled={generateMutation.isPending || preview.totalStudents === 0}
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Generate
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, trend, trendLabel, icon: Icon, color, bg }: any) {
  const isPositive = trend >= 0;
  return (
    <div className="glass-card rounded-xl p-5 hover:border-brand-primary/20 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', bg)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', isPositive ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error')}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-text-muted text-sm">{title}</p>
      <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
      {trendLabel && <p className="text-text-faint text-xs mt-1">{trendLabel}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RentDashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [paymentTarget, setPaymentTarget] = useState<any>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [reminderSent, setReminderSent] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useRentStats();
  const { data, isLoading } = useRentRecords({ search: search || undefined, status: statusFilter || undefined, propertyId: propertyFilter || undefined, from: from || undefined, to: to || undefined, page });
  const { data: propsData } = useProperties();
  const sendReminder = useSendReminder();

  const records = data?.data || [];
  const total = data?.total || 0;
  const properties = propsData?.data || [];

  const handleReminder = async (id: string, name: string) => {
    await sendReminder.mutateAsync(id);
    setReminderSent(name);
    setTimeout(() => setReminderSent(null), 3000);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="section-header">Rent Management</h1>
          <p className="text-text-muted text-sm">{total} rent records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGenerate(true)} className="btn-ghost flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-brand-accent" /> Generate Rent
          </button>
          <button onClick={() => navigate('/erp/rent/generate')} className="hidden" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statsLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="glass-card rounded-xl h-28 animate-pulse" />)
        ) : (
          <>
            <StatCard
              title="Collected This Month" value={formatCurrency(stats?.totalCollection ?? 0)}
              trend={stats?.trendPercent} trendLabel={`vs last month: ${formatCurrency(stats?.lastMonthCollection ?? 0)}`}
              icon={IndianRupee} color="text-status-success" bg="bg-status-success/10"
            />
            <StatCard
              title="Due Collection" value={formatCurrency(stats?.dueCollection ?? 0)}
              icon={AlertCircle} color="text-status-warning" bg="bg-status-warning/10"
              trendLabel="Unpaid + partial balance"
            />
            <StatCard
              title="Pending Records" value={stats?.pendingCount ?? 0}
              icon={Clock} color="text-status-error" bg="bg-status-error/10"
              trendLabel="Awaiting first payment"
            />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
          <input className="input-field pl-9 text-sm" placeholder="Search student..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field w-auto text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
        <select className="input-field w-auto text-sm" value={propertyFilter} onChange={e => { setPropertyFilter(e.target.value); setPage(1); }}>
          <option value="">All Properties</option>
          {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" className="input-field text-sm w-36" value={from} onChange={e => setFrom(e.target.value)} placeholder="From" />
          <span className="text-text-faint text-xs">to</span>
          <input type="date" className="input-field text-sm w-36" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        {(search || statusFilter || propertyFilter || from || to) && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setPropertyFilter(''); setFrom(''); setTo(''); setPage(1); }}
            className="text-text-muted hover:text-text-primary text-xs flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Reminder toast */}
      {reminderSent && (
        <div className="fixed bottom-6 right-6 z-50 bg-status-success border border-status-success/30 text-white px-4 py-2.5 rounded-lg shadow-card flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4" /> Reminder sent to {reminderSent}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-brand-primary animate-spin" /></div>
      ) : records.length === 0 ? (
        <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 text-center">
          <IndianRupee className="w-10 h-10 text-text-faint mb-3" />
          <p className="text-text-muted">No rent records found</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Property / Room</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Due Date</th>
                <th>Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => {
                const student = r.studentId as any;
                const booking = r.bookingId as any;
                const remaining = r.amount - r.paidAmount;

                return (
                  <tr key={r._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary text-xs font-bold flex-shrink-0">
                          {getInitials(student?.name || '?')}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{student?.name}</p>
                          <p className="text-text-faint text-xs">{student?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-text-primary text-sm">{booking?.propertyId?.name || '—'}</p>
                      <p className="text-text-faint text-xs">Room {booking?.roomId?.roomNumber || '—'}</p>
                    </td>
                    <td className="font-semibold">{formatCurrency(r.amount)}</td>
                    <td>
                      <p className="text-status-success font-medium">{formatCurrency(r.paidAmount)}</p>
                      {remaining > 0 && <p className="text-status-error text-xs">−{formatCurrency(remaining)}</p>}
                    </td>
                    <td className="text-text-muted">{formatDate(r.dueDate)}</td>
                    <td className="text-text-faint text-xs">{r.paymentMethod?.replace('_', ' ') || '—'}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <div className="flex items-center gap-1">
                        {r.status !== 'PAID' && (
                          <button onClick={() => setPaymentTarget(r)} title="Record payment"
                            className="p-1.5 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors">
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {r.status === 'PAID' && (
                          <button onClick={() => navigate(`/erp/rent/receipt/${r._id}`)} title="View receipt"
                            className="p-1.5 text-status-success hover:bg-status-success/10 rounded-lg transition-colors">
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {r.status !== 'PAID' && (
                          <button onClick={() => handleReminder(r._id, student?.name)} title="Send reminder"
                            disabled={sendReminder.isPending}
                            className="p-1.5 text-status-warning hover:bg-status-warning/10 rounded-lg transition-colors">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-text-muted text-sm">{total} records · Page {page} of {Math.ceil(total / 25)}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total} className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {paymentTarget && <PaymentModal record={paymentTarget} onClose={() => setPaymentTarget(null)} />}
      {showGenerate && <GenerateRentModal onClose={() => setShowGenerate(false)} />}
    </div>
  );
}
