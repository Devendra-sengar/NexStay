import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { useSuperBookings } from '@/lib/superAdminApi';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['ALL','PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED'];

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-warning', CONFIRMED: 'badge-success', CHECKED_IN: 'bg-blue-100 text-blue-700',
  CHECKED_OUT: 'badge-default', CANCELLED: 'badge-danger',
};

export default function SuperBookingsPage() {
  const [status, setStatus] = useState('ALL');
  const [city, setCity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useSuperBookings({
    ...(status !== 'ALL' && { status }),
    ...(city && { city }),
    ...(from && { from }),
    ...(to && { to }),
    limit: '50',
  });

  const bookings = data?.data ?? [];

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Platform Bookings</h1>
        <p className="text-sm text-text-secondary mt-0.5">All bookings across every property — read-only view</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input className="input-field pl-9 w-44" placeholder="Filter by city…" value={city} onChange={e => setCity(e.target.value)} />
        </div>
        <select className="input-field w-40" value={status} onChange={e => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <input type="date" className="input-field w-36" value={from} onChange={e => setFrom(e.target.value)} />
          <span className="text-text-muted text-sm">→</span>
          <input type="date" className="input-field w-36" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        {(status !== 'ALL' || city || from || to) && (
          <button onClick={() => { setStatus('ALL'); setCity(''); setFrom(''); setTo(''); }}
            className="text-xs text-text-muted hover:text-danger transition-colors underline">Clear filters</button>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
        ) : (
          <>
            <div className="px-4 py-2.5 border-b border-surface-border bg-surface-input/30">
              <p className="text-xs text-text-muted font-medium">{bookings.length} booking{bookings.length !== 1 ? 's' : ''} shown</p>
            </div>
            <table className="data-table">
              <thead>
                <tr>{['Booking ID','Guest','Owner','Property','City','Status','Date','Rent'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-text-muted">No bookings match the filters</td></tr>
                ) : bookings.map((b: any) => {
                  const guest = b.guestId as any;
                  const prop = b.propertyId as any;
                  const owner = prop?.tenantId as any;
                  return (
                    <tr key={b._id} className="hover:bg-surface-input/40">
                      <td className="py-2.5 px-4 border-b border-surface-border text-xs font-mono text-text-muted">
                        {String(b._id).slice(-8).toUpperCase()}
                      </td>
                      <td className="py-2.5 px-4 border-b border-surface-border text-sm font-medium">{guest?.name || '—'}</td>
                      <td className="py-2.5 px-4 border-b border-surface-border text-sm text-text-muted">{owner?.name || owner?.businessName || '—'}</td>
                      <td className="py-2.5 px-4 border-b border-surface-border text-sm">{prop?.name || '—'}</td>
                      <td className="py-2.5 px-4 border-b border-surface-border text-sm text-text-muted">{prop?.city || '—'}</td>
                      <td className="py-2.5 px-4 border-b border-surface-border">
                        <span className={cn('badge', STATUS_BADGE[b.status] ?? 'badge-default')}>{b.status}</span>
                      </td>
                      <td className="py-2.5 px-4 border-b border-surface-border text-xs text-text-muted">
                        {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-4 border-b border-surface-border text-sm font-medium">
                        {b.monthlyRent ? `₹${Number(b.monthlyRent).toLocaleString('en-IN')}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
