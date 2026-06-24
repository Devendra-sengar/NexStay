import { useState } from 'react';
import { Download, BarChart3, TrendingUp, Users, Receipt, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import {
  useOccupancyReport, useRevenueReport, useCollectionReport,
  useExpenseReport, useProfitReport, useAdminProperties, exportReportCsv,
} from '@/lib/adminApi';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────
const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316','#ec4899'];
const FMT = (v: number) => `₹${v.toLocaleString('en-IN')}`;
const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

const TABS = [
  { id: 'occupancy',  label: 'Occupancy',  icon: Users },
  { id: 'revenue',    label: 'Revenue',    icon: TrendingUp },
  { id: 'collection', label: 'Collection', icon: BarChart3 },
  { id: 'expenses',   label: 'Expenses',   icon: Receipt },
  { id: 'profit',     label: 'Profit',     icon: DollarSign },
];

function StatCard({ label, value, sub, color = 'text-text-primary' }: any) {
  return (
    <div className="card p-4">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Tab: Occupancy ────────────────────────────────────────────────────────────
function OccupancyTab({ propId }: { propId: string }) {
  const { data, isLoading } = useOccupancyReport({ propertyId: propId || undefined });
  if (isLoading) return <div className="skeleton h-64 rounded-xl" />;
  if (!data) return null;
  const chartData = (data.byProperty || []).map((p: any) => ({
    name: p.propertyName.substring(0, 10), Occupied: p.occupied, Vacant: p.vacant,
  }));
  const donut = [
    { name: 'Occupied', value: data.occupied },
    { name: 'Vacant', value: data.vacant },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Beds" value={data.totalBeds} />
        <StatCard label="Occupied" value={data.occupied} color="text-primary" />
        <StatCard label="Vacant" value={data.vacant} color="text-emerald-600" />
        <StatCard label="Occupancy %" value={`${data.occupancyPct}%`} color={data.occupancyPct >= 75 ? 'text-emerald-600' : 'text-amber-500'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <p className="text-sm font-semibold text-text-primary mb-4">By Property</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => v} /><Legend />
              <Bar dataKey="Occupied" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="Vacant" fill="#e2e8f0" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-text-primary mb-4">Overall Today</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={donut} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
              {donut.map((_, i) => <Cell key={i} fill={['#6366f1','#e2e8f0'][i]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Revenue ──────────────────────────────────────────────────────────────
function RevenueTab({ propId }: { propId: string }) {
  const { data, isLoading } = useRevenueReport({ propertyId: propId || undefined });
  if (isLoading) return <div className="skeleton h-64 rounded-xl" />;
  if (!data) return null;
  const last6 = data.last6 || [];
  const last12 = data.last12 || [];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Collected (12 months)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={last12}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={FMT} /><Legend />
              <Line type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Collected" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-text-primary mb-4">Collected vs Expenses (6 months)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last6}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={FMT} /><Legend />
              <Bar dataKey="collected" fill="#6366f1" radius={[4,4,0,0]} name="Collected" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4,4,0,0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr>{['Month','Due','Collected','Pending','Expenses','Net Surplus'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {last12.map((r: any) => (
              <tr key={r.month} className="hover:bg-surface-input/40">
                <td className="py-2.5 px-4 border-b border-surface-border text-sm font-medium">{r.label}</td>
                <td className="py-2.5 px-4 border-b border-surface-border text-sm">{FMT(r.due)}</td>
                <td className="py-2.5 px-4 border-b border-surface-border text-sm text-primary font-medium">{FMT(r.collected)}</td>
                <td className="py-2.5 px-4 border-b border-surface-border text-sm text-amber-600">{FMT(r.pending)}</td>
                <td className="py-2.5 px-4 border-b border-surface-border text-sm text-danger">{FMT(r.expenses)}</td>
                <td className={cn('py-2.5 px-4 border-b border-surface-border text-sm font-semibold', r.net >= 0 ? 'text-emerald-600' : 'text-danger')}>{FMT(r.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Collection ───────────────────────────────────────────────────────────
function CollectionTab({ propId, month, setMonth }: { propId: string; month: string; setMonth: (m: string) => void }) {
  const { data: raw, isLoading } = useCollectionReport({ propertyId: propId || undefined, month });
  const data = raw?.data;
  const summary = data?.summary;
  const records = data?.records || [];
  const pieData = summary ? [
    { name: 'Paid', value: summary.paid },
    { name: 'Partial', value: summary.partial },
    { name: 'Unpaid', value: summary.unpaid },
  ].filter(d => d.value > 0) : [];
  if (isLoading) return <div className="skeleton h-64 rounded-xl" />;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input type="month" className="input-field w-44" value={month} onChange={e=>setMonth(e.target.value)} />
      </div>
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card p-5 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={['#22c55e','#f59e0b','#ef4444'][i]} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:col-span-2 grid grid-cols-3 gap-4 content-start">
            <StatCard label="Paid" value={summary.paid} color="text-emerald-600" />
            <StatCard label="Partial" value={summary.partial} color="text-amber-500" />
            <StatCard label="Unpaid" value={summary.unpaid} color="text-danger" />
          </div>
        </div>
      )}
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr>{['Student','Phone','Room','Due','Paid','Balance','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {records.map((r: any) => {
              const stu = r.hostelStudentId as any;
              const bal = Math.max(0, (r.amount+(r.fine||0)) - (r.paidAmount||0));
              return (
                <tr key={r._id} className={cn('hover:bg-surface-input/40', r.status==='UNPAID'&&'bg-red-50/50', r.status==='PARTIAL'&&'bg-amber-50/30')}>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm font-medium">{stu?.name||'—'}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-xs text-text-muted">{stu?.phone||'—'}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm">{(r.roomId as any)?.roomNumber||'—'}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm">{FMT(r.amount+(r.fine||0))}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm text-emerald-600 font-medium">{FMT(r.paidAmount||0)}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm text-danger font-medium">{FMT(bal)}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border"><span className={cn('badge',r.status==='PAID'?'badge-success':r.status==='PARTIAL'?'badge-warning':'badge-danger')}>{r.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Expenses ─────────────────────────────────────────────────────────────
function ExpensesTab({ propId, month, setMonth }: { propId: string; month: string; setMonth: (m: string) => void }) {
  const [compare, setCompare] = useState(false);
  const { data, isLoading } = useExpenseReport({ propertyId: propId || undefined, month });
  if (isLoading) return <div className="skeleton h-64 rounded-xl" />;
  if (!data) return null;
  const cats = data.table || [];
  const donutData = cats.map((c: any) => ({ name: c.category, value: c.amount }));
  const prevDonutData = cats.map((c: any) => ({ name: c.category, value: c.prevAmount }));
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input type="month" className="input-field w-44" value={month} onChange={e=>setMonth(e.target.value)} />
        <button onClick={()=>setCompare(c=>!c)} className={cn('btn-secondary text-xs', compare&&'border-primary text-primary bg-primary/5')}>
          {compare ? 'Single View' : 'Compare Mode'}
        </button>
      </div>
      <div className={cn('grid gap-5', compare ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-3')}>
        <div className="card p-5 flex flex-col items-center">
          <p className="text-sm font-semibold mb-3">{month} — Total: {FMT(data.total)}</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" label={({name,pct})=>`${name} ${pct}%`} labelLine={false}>
              {donutData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip formatter={FMT} /></PieChart>
          </ResponsiveContainer>
        </div>
        {compare && (
          <div className="card p-5 flex flex-col items-center">
            <p className="text-sm font-semibold mb-3">{data.prevMonth}</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={prevDonutData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" labelLine={false}>
                {prevDonutData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip formatter={FMT} /></PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {!compare && (
          <div className="lg:col-span-2 card overflow-hidden">
            <table className="data-table">
              <thead><tr>{['Category','Amount','% of Total','vs Last Month'].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {cats.map((c: any) => (
                  <tr key={c.category} className="hover:bg-surface-input/40">
                    <td className="py-2.5 px-4 border-b border-surface-border text-sm font-medium">{c.category}</td>
                    <td className="py-2.5 px-4 border-b border-surface-border text-sm">{FMT(c.amount)}</td>
                    <td className="py-2.5 px-4 border-b border-surface-border text-sm">{c.pct}%</td>
                    <td className="py-2.5 px-4 border-b border-surface-border text-sm">
                      {c.trend === 'UP' && <span className="text-danger">↑ {FMT(c.amount - c.prevAmount)}</span>}
                      {c.trend === 'DOWN' && <span className="text-emerald-600">↓ {FMT(c.prevAmount - c.amount)}</span>}
                      {c.trend === 'FLAT' && <span className="text-text-muted">— No change</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Profit ───────────────────────────────────────────────────────────────
function ProfitTab({ propId }: { propId: string }) {
  const { data: rows, isLoading } = useProfitReport({ propertyId: propId || undefined });
  if (isLoading) return <div className="skeleton h-64 rounded-xl" />;
  if (!rows) return null;
  return (
    <div className="space-y-5">
      <div className="card p-5">
        <p className="text-sm font-semibold text-text-primary mb-4">Net P&L Trend (12 months)</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={45} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={FMT} />
            <defs>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} name="Net" fill="url(#netGrad)" />
            <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={1.5} dot={{ r: 2 }} name="Revenue" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} name="Expenses" strokeDasharray="4 2" />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr>{['Month','Revenue','Expenses','Net','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.month} className={cn('hover:bg-surface-input/40', r.status==='LOSS'&&'bg-red-50/50')}>
                <td className="py-2.5 px-4 border-b border-surface-border text-sm font-medium">{r.label}</td>
                <td className="py-2.5 px-4 border-b border-surface-border text-sm text-emerald-600 font-medium">{FMT(r.revenue)}</td>
                <td className="py-2.5 px-4 border-b border-surface-border text-sm text-danger">{FMT(r.expenses)}</td>
                <td className={cn('py-2.5 px-4 border-b border-surface-border text-sm font-bold', r.net>=0?'text-emerald-600':'text-danger')}>{FMT(r.net)}</td>
                <td className="py-2.5 px-4 border-b border-surface-border"><span className={cn('badge',r.status==='PROFIT'?'badge-success':'badge-danger')}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tab, setTab] = useState('occupancy');
  const [propId, setPropId] = useState('');
  const [month, setMonth] = useState(ym(new Date()));
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data ?? [];

  const handleExport = () => {
    const params: Record<string, string> = {};
    if (propId) params.propertyId = propId;
    if (['collection','expenses'].includes(tab)) params.month = month;
    exportReportCsv(tab, params);
  };

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
          <p className="text-sm text-text-secondary mt-0.5">Analytics and insights across all your properties</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <select className="input-field w-48" value={propId} onChange={e=>setPropId(e.target.value)}>
          <option value="">All Properties</option>
          {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-5 p-1 bg-surface-input rounded-xl w-full overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center',
              tab === t.id ? 'bg-white shadow text-primary' : 'text-text-secondary hover:text-text-primary')}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'occupancy'  && <OccupancyTab propId={propId} />}
      {tab === 'revenue'    && <RevenueTab propId={propId} />}
      {tab === 'collection' && <CollectionTab propId={propId} month={month} setMonth={setMonth} />}
      {tab === 'expenses'   && <ExpensesTab propId={propId} month={month} setMonth={setMonth} />}
      {tab === 'profit'     && <ProfitTab propId={propId} />}
    </div>
  );
}
