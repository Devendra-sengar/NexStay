import { useState } from 'react';
import { Search, ShieldOff, ShieldCheck, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSuperGuests, useSuperOwners, useSuspendUser, useReactivateUser } from '@/lib/superAdminApi';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: string }) {
  return <span className={cn('badge', status === 'ACTIVE' ? 'badge-success' : 'badge-danger')}>{status}</span>;
}

function SuspendModal({ user, onClose, onConfirm, loading }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <h3 className="font-bold text-text-primary mb-2">
          {user.status === 'ACTIVE' ? '⛔ Suspend User?' : '✅ Reactivate User?'}
        </h3>
        <p className="text-sm text-text-secondary mb-5">
          {user.status === 'ACTIVE'
            ? `Are you sure you want to suspend ${user.name}? They won't be able to log in until reactivated.`
            : `Reactivate ${user.name}? They will regain access immediately.`}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors',
              user.status === 'ACTIVE' ? 'bg-danger hover:bg-danger/90' : 'bg-emerald-600 hover:bg-emerald-700')}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GuestsTab() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [actionUser, setActionUser] = useState<any>(null);
  const { data, isLoading } = useSuperGuests({ ...(search && { search }), ...(status !== 'ALL' && { status }) });
  const suspend = useSuspendUser();
  const reactivate = useReactivateUser();

  const guests = data?.data ?? [];

  const handleAction = async () => {
    if (!actionUser) return;
    try {
      if (actionUser.status === 'ACTIVE') {
        await suspend.mutateAsync(actionUser._id);
        toast.success(`${actionUser.name} suspended`);
      } else {
        await reactivate.mutateAsync(actionUser._id);
        toast.success(`${actionUser.name} reactivated`);
      }
      setActionUser(null);
    } catch { toast.error('Action failed'); }
  };

  return (
    <>
      {actionUser && <SuspendModal user={actionUser} onClose={() => setActionUser(null)} onConfirm={handleAction} loading={suspend.isPending || reactivate.isPending} />}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input className="input-field pl-9 w-full" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-36" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
        ) : (
          <table className="data-table">
            <thead><tr>{['Name','Email','Phone','Status','Registered','Active Bookings','Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {guests.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-text-muted">No guests found</td></tr>
              ) : guests.map((g: any) => (
                <tr key={g._id} className={cn('hover:bg-surface-input/40', g.status === 'SUSPENDED' && 'bg-red-50/40')}>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm font-medium">{g.name}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm text-text-muted">{g.email}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm">{g.phone}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border"><StatusBadge status={g.status} /></td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-xs text-text-muted">{new Date(g.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm text-center">{g.activeBookings}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border">
                    <button onClick={() => setActionUser(g)}
                      className={cn('flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors',
                        g.status === 'ACTIVE' ? 'bg-red-50 text-danger hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}>
                      {g.status === 'ACTIVE' ? <><ShieldOff className="w-3 h-3" />Suspend</> : <><ShieldCheck className="w-3 h-3" />Reactivate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function OwnersTab() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [verif, setVerif] = useState('ALL');
  const [actionUser, setActionUser] = useState<any>(null);
  const { data, isLoading } = useSuperOwners({ ...(search && { search }), ...(status !== 'ALL' && { status }), ...(verif !== 'ALL' && { verificationStatus: verif }) });
  const suspend = useSuspendUser();
  const reactivate = useReactivateUser();

  const owners = data?.data ?? [];

  const handleAction = async () => {
    if (!actionUser) return;
    try {
      if (actionUser.status === 'ACTIVE') {
        await suspend.mutateAsync(actionUser._id);
        toast.success(`${actionUser.name} suspended`);
      } else {
        await reactivate.mutateAsync(actionUser._id);
        toast.success(`${actionUser.name} reactivated`);
      }
      setActionUser(null);
    } catch { toast.error('Action failed'); }
  };

  const verifBadge = (s: string) => {
    if (s === 'APPROVED') return <span className="badge badge-success">VERIFIED</span>;
    if (s === 'REJECTED') return <span className="badge badge-danger">REJECTED</span>;
    return <span className="badge badge-warning">PENDING</span>;
  };

  return (
    <>
      {actionUser && <SuspendModal user={actionUser} onClose={() => setActionUser(null)} onConfirm={handleAction} loading={suspend.isPending || reactivate.isPending} />}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input className="input-field pl-9 w-full" placeholder="Search name, business or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-36" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select className="input-field w-40" value={verif} onChange={e => setVerif(e.target.value)}>
          <option value="ALL">All Verification</option>
          <option value="APPROVED">Verified</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
        ) : (
          <table className="data-table">
            <thead><tr>{['Name','Business','Email','Account','Verification','Properties','Registered','Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {owners.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-text-muted">No owners found</td></tr>
              ) : owners.map((o: any) => (
                <tr key={o._id} className={cn('hover:bg-surface-input/40', o.status === 'SUSPENDED' && 'bg-red-50/40')}>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm font-medium">{o.name}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm text-text-muted">{o.businessName || '—'}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-sm text-text-muted">{o.email}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border"><StatusBadge status={o.status} /></td>
                  <td className="py-2.5 px-4 border-b border-surface-border">{verifBadge(o.ownerVerificationStatus)}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-xs text-text-muted">
                    <span className="text-emerald-600 font-medium">{o.approvedProps}</span> / {o.approvedProps + o.pendingProps} total
                  </td>
                  <td className="py-2.5 px-4 border-b border-surface-border text-xs text-text-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="py-2.5 px-4 border-b border-surface-border">
                    <button onClick={() => setActionUser(o)}
                      className={cn('flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors',
                        o.status === 'ACTIVE' ? 'bg-red-50 text-danger hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}>
                      {o.status === 'ACTIVE' ? <><ShieldOff className="w-3 h-3" />Suspend</> : <><ShieldCheck className="w-3 h-3" />Reactivate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function SuperUsersPage() {
  const [tab, setTab] = useState<'guests' | 'owners'>('guests');
  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
        <p className="text-sm text-text-secondary mt-0.5">Manage guests and hostel owners across the platform</p>
      </div>
      <div className="flex gap-1 mb-5 p-1 bg-surface-input rounded-xl w-fit">
        {(['guests','owners'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all',
              tab === t ? 'bg-white shadow text-primary' : 'text-text-secondary hover:text-text-primary')}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'guests' ? <GuestsTab /> : <OwnersTab />}
    </div>
  );
}
