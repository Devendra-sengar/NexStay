import { useState } from 'react';
import { Bell, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { usePlatformRevenue } from '@/lib/superAdminApi';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const FMT = (v: number) => `₹${v.toLocaleString('en-IN')}`;

export default function SuperReportsPage() {
  const { data: rows = [], isLoading } = usePlatformRevenue();
  const [notified, setNotified] = useState(false);

  const totalCollected = rows.reduce((s: number, r: any) => s + (r.collected || 0), 0);
  const totalPending   = rows.reduce((s: number, r: any) => s + (r.pending  || 0), 0);

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Platform Revenue</h1>
        <p className="text-sm text-text-secondary mt-0.5">Aggregated rent collection across all properties — last 12 months</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Collected (12m)', value: FMT(totalCollected), color: 'text-emerald-600' },
          { label: 'Total Pending',         value: FMT(totalPending),   color: 'text-amber-500' },
          { label: 'Months Tracked',        value: `${rows.length}`,    color: 'text-text-primary' },
          { label: 'Active Properties',     value: rows[rows.length - 1]?.activeProps ?? '—', color: 'text-primary' },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-text-muted mb-1">{c.label}</p>
            <p className={cn('text-xl font-bold', c.color)}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-5 mb-5">
        <p className="text-sm font-semibold text-text-primary mb-4">Rent Collected vs Pending (12 months)</p>
        {isLoading ? (
          <div className="skeleton h-52 rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={FMT} />
              <Legend />
              <Bar dataKey="collected" fill="#22c55e" radius={[4,4,0,0]} name="Collected" />
              <Bar dataKey="pending"   fill="#f59e0b" radius={[4,4,0,0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data table */}
      <div className="card overflow-hidden mb-6">
        {isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-8 rounded" />)}</div>
        ) : (
          <table className="data-table">
            <thead><tr>{['Month','Rent Due','Collected','Pending','Active Props'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.month} className={cn('hover:bg-surface-input/40', r.pending > r.collected && 'bg-amber-50/30')}>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm font-medium">{r.month}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm">{FMT(r.due)}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm text-emerald-600 font-medium">{FMT(r.collected)}</td>
                  <td className={cn('py-2.5 px-4 border-b border-surface-border text-sm font-medium', r.pending > 0 ? 'text-amber-600' : 'text-text-muted')}>{FMT(r.pending)}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm text-center">{r.activeProps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Commission — Coming Soon */}
      <div className="card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-text-primary">Commission Management</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full uppercase">Coming Soon</span>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Configure platform commission percentage per booking, set tier-based rates for different property categories,
              and track commission payouts in real-time. Full accounting reconciliation included.
            </p>
            <button
              onClick={() => { if (!notified) { toast.success("We'll notify you when Commission Management launches!"); setNotified(true); } }}
              disabled={notified}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                notified
                  ? 'bg-emerald-100 text-emerald-700 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              )}
            >
              <Bell className="w-4 h-4" />
              {notified ? '✓ You\'ll be notified' : 'Notify Me When Live'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
