import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Loader2, User, Phone, Building2, BedDouble, PlayCircle, Clock } from 'lucide-react';
import { useTenants, usePendingBookings } from '@/hooks/useTenants';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const TABS = ['All Tenants', 'Pending Check-In'] as const;
type TenantTab = typeof TABS[number];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CHECKED_OUT', label: 'Checked Out' },
];

function TenantRow({ tenant, onClick }: { tenant: any; onClick: () => void }) {
  const user = tenant.userId as any;
  const statusColorMap: Record<string, string> = {
    ACTIVE: 'text-status-success',
    PENDING: 'text-status-warning',
    CONFIRMED: 'text-status-info',
    CHECKED_OUT: 'text-text-muted',
    NO_BOOKING: 'text-text-faint',
  };

  return (
    <tr className="cursor-pointer hover:bg-surface-dark/50 transition-colors" onClick={onClick}>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.name || '?')}
          </div>
          <div>
            <p className="font-medium text-text-primary">{user?.name || '—'}</p>
            <p className="text-text-faint text-xs">{user?.email}</p>
          </div>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-1 text-text-muted">
          <Phone className="w-3 h-3" />{user?.phone || '—'}
        </div>
      </td>
      <td>
        {tenant.currentPropertyId ? (
          <div>
            <p className="text-text-primary text-sm">{(tenant.currentPropertyId as any)?.name}</p>
            <p className="text-text-faint text-xs">{(tenant.currentPropertyId as any)?.city}</p>
          </div>
        ) : <span className="text-text-faint text-sm">—</span>}
      </td>
      <td className="text-text-muted text-sm">
        {tenant.currentRoomId ? `Room ${(tenant.currentRoomId as any)?.roomNumber}` : '—'}
      </td>
      <td className="text-text-muted text-sm">
        {tenant.currentBedId ? `Bed ${(tenant.currentBedId as any)?.bedNumber}` : '—'}
      </td>
      <td className="text-text-primary font-medium text-sm">
        {tenant.latestRent ? formatCurrency(tenant.latestRent.amount) : '—'}
      </td>
      <td>
        <span className={cn('text-xs font-semibold', statusColorMap[tenant.displayStatus] || 'text-text-faint')}>
          {tenant.displayStatus?.replace('_', ' ') || '—'}
        </span>
      </td>
    </tr>
  );
}

function PendingBookingCard({ booking, onProcessCheckIn }: { booking: any; onProcessCheckIn: () => void }) {
  const student = booking.studentId as any;
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-status-warning/30 transition-all">
      <div className="w-10 h-10 rounded-full bg-status-warning/15 flex items-center justify-center text-status-warning font-bold text-sm flex-shrink-0">
        {getInitials(student?.name || '?')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-text-primary font-semibold">{student?.name || '—'}</p>
          <StatusBadge status="PENDING" />
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted flex-wrap">
          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{(booking.propertyId as any)?.name}</span>
          <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />Room {(booking.roomId as any)?.roomNumber} · Bed {(booking.bedId as any)?.bedNumber}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Applied {formatDate(booking.createdAt)}</span>
        </div>
      </div>
      <button
        onClick={onProcessCheckIn}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-sm font-semibold hover:bg-status-success hover:text-white transition-all duration-200 flex-shrink-0"
      >
        <PlayCircle className="w-4 h-4" /> Process Check-In
      </button>
    </div>
  );
}

export default function TenantListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TenantTab>('All Tenants');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useTenants({ search: search || undefined, status: statusFilter || undefined, page });
  const { data: pendingBookings = [], isLoading: pendingLoading } = usePendingBookings();

  const tenants = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="section-header">Tenants</h1>
          <p className="text-text-muted text-sm">{total} tenants · {pendingBookings.length} pending check-ins</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border mb-5">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors relative',
              activeTab === tab
                ? 'text-brand-primary border-brand-primary'
                : 'text-text-muted border-transparent hover:text-text-primary'
            )}
          >
            {tab}
            {tab === 'Pending Check-In' && pendingBookings.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-status-warning text-white text-[10px] rounded-full font-bold">
                {pendingBookings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'All Tenants' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                className="input-field pl-9 text-sm"
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="input-field w-auto text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              {STATUS_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-12 h-12 text-text-faint mb-4" />
              <h3 className="text-text-primary font-semibold mb-1">No tenants found</h3>
              <p className="text-text-muted text-sm">Try adjusting your search or filter</p>
            </div>
          ) : (
            <>
              <div className="glass-card rounded-xl overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Mobile</th>
                      <th>Property</th>
                      <th>Room</th>
                      <th>Bed</th>
                      <th>Rent</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t: any) => (
                      <TenantRow
                        key={t._id}
                        tenant={t}
                        onClick={() => navigate(`/erp/tenants/${(t.userId as any)?._id || t._id}`)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > 20 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-text-muted text-sm">Page {page} of {Math.ceil(total / 20)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40">
                      Previous
                    </button>
                    <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40">
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'Pending Check-In' && (
        <div>
          {pendingLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
            </div>
          ) : pendingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-status-success/10 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-status-success" />
              </div>
              <h3 className="text-text-primary font-semibold mb-1">All clear!</h3>
              <p className="text-text-muted text-sm">No pending check-ins at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((booking: any) => (
                <PendingBookingCard
                  key={booking._id}
                  booking={booking}
                  onProcessCheckIn={() => navigate(`/erp/tenants/checkin/${booking._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
