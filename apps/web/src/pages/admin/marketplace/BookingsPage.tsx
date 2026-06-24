import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter, Search, Check, X, Loader2, ChevronDown, MapPin,
  BedDouble, Calendar, CreditCard, FileText, AlertCircle, User, UserCheck
} from 'lucide-react';
import { useAdminBookings, useAcceptBooking, useRejectBooking } from '@/lib/adminApi';
import { useAdminProperties } from '@/lib/adminApi';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['ALL','PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED'];
const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-700 border-amber-200',
  CONFIRMED:  'bg-blue-100 text-blue-700 border-blue-200',
  CHECKED_IN: 'bg-green-100 text-green-700 border-green-200',
  CHECKED_OUT:'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED:  'bg-red-100 text-red-600 border-red-200',
};

// ─── Reject dialog ────────────────────────────────────────────────────────────
function RejectDialog({ booking, onConfirm, onClose, loading }: any) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary">Reject Booking</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-text-muted" /></button>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Rejecting booking for <strong>{booking.guestId?.name ?? 'guest'}</strong>. Please provide a reason (shown to the guest).
        </p>
        <textarea className="input-field mb-4" rows={3} value={reason} onChange={e => setReason(e.target.value)}
          placeholder="e.g. No vacancy for the selected room type currently..." />
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            className="flex-1 py-2 bg-danger hover:bg-red-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Detail Drawer ────────────────────────────────────────────────────
function BookingDetail({ booking, onClose, onAccept, onReject, onCheckIn, acceptLoading, rejectLoading }: any) {
  const [showReject, setShowReject] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-40 flex">
        <div className="flex-1 bg-black/40" onClick={onClose} />
        <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h2 className="font-bold text-text-primary text-base">Booking Details</h2>
              <p className="text-xs text-text-muted font-mono">{booking._id.slice(-8).toUpperCase()}</p>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {/* Status */}
            <span className={`inline-flex text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[booking.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {booking.status}
            </span>

            {/* Guest info */}
            <section>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Guest Information</h3>
              <div className="card p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{booking.guestId?.name ?? '—'}</p>
                    <p className="text-xs text-text-muted">{booking.guestId?.email ?? '—'}</p>
                    <p className="text-xs text-text-muted">{booking.guestId?.phone ?? '—'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Property/Room */}
            <section>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Property & Room</h3>
              <div className="card p-4 space-y-2 text-sm">
                {[
                  { icon: MapPin, label: 'Property', value: `${booking.propertyId?.name ?? '—'}, ${booking.propertyId?.city ?? ''}` },
                  { icon: BedDouble, label: 'Room', value: `Room ${booking.roomId?.roomNumber ?? '—'} (${booking.roomId?.roomType ?? '—'})` },
                  { icon: BedDouble, label: 'Bed', value: booking.bedId?.bedNumber ?? '—' },
                  { icon: Calendar, label: 'Check-in', value: booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'TBD' },
                  { icon: CreditCard, label: 'Monthly Rent', value: `₹${(booking.monthlyRent ?? 0).toLocaleString('en-IN')}` },
                  { icon: CreditCard, label: 'Advance Paid', value: `₹${(booking.advancePaid ?? 0).toLocaleString('en-IN')}` },
                  { icon: FileText, label: 'Payment Method', value: booking.paymentMethod || 'UPI' },
                  { icon: Calendar, label: 'Booked On', value: new Date(booking.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                    <span className="text-text-muted w-28 flex-shrink-0 text-xs">{label}</span>
                    <span className="text-text-primary font-medium text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Documents */}
            <section>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Documents</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Aadhaar', url: booking.aadhaarUrl },
                  { label: 'ID Card', url: booking.studentIdUrl },
                  { label: 'Photo', url: booking.photoUrl },
                ].map(({ label, url }) => (
                  <div key={label} className="border border-surface-border rounded-xl p-2 text-center">
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={label} className="w-full h-16 object-cover rounded mb-1" />
                        <p className="text-[10px] text-primary hover:underline">{label} ↗</p>
                      </a>
                    ) : (
                      <>
                        <div className="w-full h-16 bg-surface rounded flex items-center justify-center mb-1">
                          <FileText className="w-5 h-5 text-text-muted opacity-30" />
                        </div>
                        <p className="text-[10px] text-text-muted">{label} — not uploaded</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Notes */}
            {booking.notes && (
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Notes</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">{booking.notes}</div>
              </section>
            )}
          </div>

          {/* Actions */}
          {booking.status === 'PENDING' && (
            <div className="px-5 py-4 border-t border-surface-border flex gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowReject(true)} disabled={rejectLoading}
                className="flex-1 py-2.5 border-2 border-danger text-danger hover:bg-red-50 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                <X className="w-4 h-4" /> Reject
              </button>
              <button onClick={() => onAccept(booking._id)} disabled={acceptLoading}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {acceptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accept
              </button>
            </div>
          )}
          {booking.status === 'CONFIRMED' && (
            <div className="px-5 py-4 border-t border-surface-border sticky bottom-0 bg-white">
              <button
                onClick={() => onCheckIn(booking._id)}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                <UserCheck className="w-4 h-4" /> Process Check-In
              </button>
            </div>
          )}
        </div>
      </div>

      {showReject && (
        <RejectDialog
          booking={booking}
          loading={rejectLoading}
          onClose={() => setShowReject(false)}
          onConfirm={(reason: string) => { onReject(booking._id, reason); setShowReject(false); }}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketplaceBookingsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [page, setPage] = useState(1);

  const { data: propData } = useAdminProperties();
  const properties = propData?.data ?? [];

  const { data, isLoading, refetch } = useAdminBookings({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    propertyId: propertyFilter || undefined,
    page,
  });

  const acceptMutation = useAcceptBooking();
  const rejectMutation = useRejectBooking();

  const bookings = (data?.data ?? []).filter((b: any) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return b.guestId?.name?.toLowerCase().includes(q) ||
           b.guestId?.email?.toLowerCase().includes(q) ||
           b.propertyId?.name?.toLowerCase().includes(q);
  });

  const handleAccept = async (id: string) => {
    await acceptMutation.mutateAsync(id);
    if (selectedBooking?._id === id) setSelectedBooking((b: any) => ({ ...b, status: 'CONFIRMED' }));
  };

  const handleReject = async (id: string, reason: string) => {
    await rejectMutation.mutateAsync({ id, reason });
    if (selectedBooking?._id === id) setSelectedBooking((b: any) => ({ ...b, status: 'CANCELLED', notes: reason }));
  };

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Marketplace Bookings</h1>
        <p className="text-text-secondary text-sm mt-0.5">Manage guest booking requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input className="input-field pl-9 w-52" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search guest or property…" />
        </div>
        <select className="input-field text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
        </select>
        <select className="input-field text-sm" value={propertyFilter} onChange={e => { setPropertyFilter(e.target.value); setPage(1); }}>
          <option value="">All Properties</option>
          {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-text-muted opacity-30" />
          <p className="font-semibold text-text-primary">No bookings found</p>
          <p className="text-text-muted text-sm">Adjust your filters or wait for guest requests</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface">
                    {['Booking ID','Guest','Property','Room/Bed','Status','Date','Amount','Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-text-muted font-semibold py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {bookings.map((b: any) => (
                    <tr key={b._id} className="hover:bg-surface cursor-pointer" onClick={() => setSelectedBooking(b)}>
                      <td className="py-3 px-4 font-mono text-xs text-text-muted">{b._id.slice(-8).toUpperCase()}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-text-primary text-xs">{b.guestId?.name ?? '—'}</p>
                        <p className="text-[11px] text-text-muted">{b.guestId?.phone ?? ''}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-text-secondary max-w-[120px] truncate">{b.propertyId?.name ?? '—'}</td>
                      <td className="py-3 px-4 text-xs text-text-muted">
                        {b.roomId?.roomNumber ?? '—'} / {b.bedId?.bedNumber ?? '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[b.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-text-muted whitespace-nowrap">
                        {new Date(b.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-text-primary">₹{(b.monthlyRent ?? 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        {b.status === 'PENDING' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleAccept(b._id)} disabled={acceptMutation.isPending}
                              className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors disabled:opacity-50">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setSelectedBooking(b)}
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-text-muted text-xs">Showing {bookings.length} of {data?.total ?? 0} bookings</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
              <button disabled={!data?.hasNextPage} onClick={() => setPage(p => p + 1)}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
            </div>
          </div>
        </>
      )}

      {selectedBooking && (
        <BookingDetail
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onAccept={handleAccept}
          onReject={handleReject}
          onCheckIn={(id: string) => { setSelectedBooking(null); navigate(`/admin/checkin?bookingId=${id}`); }}
          acceptLoading={acceptMutation.isPending}
          rejectLoading={rejectMutation.isPending}
        />
      )}
    </div>
  );
}
