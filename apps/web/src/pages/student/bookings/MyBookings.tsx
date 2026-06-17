import { useNavigate } from 'react-router-dom';
import { useStudentBookings } from '@/hooks/useBookings';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Calendar, BedDouble, Shield, RefreshCw, ChevronRight,
  MessageSquare, FileText, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  PENDING: { label: 'Pending Approval', bg: 'bg-status-warning/10 border-status-warning/30', text: 'text-status-warning', icon: Clock },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-brand-primary/10 border-brand-primary/30', text: 'text-brand-primary', icon: CheckCircle2 },
  CHECKED_IN: { label: 'Active Stay', bg: 'bg-status-success/10 border-status-success/30', text: 'text-status-success', icon: Shield },
  CHECKED_OUT: { label: 'Checked Out', bg: 'bg-text-faint/10 border-text-faint/30', text: 'text-text-muted', icon: ChevronRight },
  CANCELLED: { label: 'Cancelled', bg: 'bg-status-error/10 border-status-error/30', text: 'text-status-error', icon: AlertCircle }
};

export default function MyBookings() {
  const navigate = useNavigate();
  const { data: bookings, isLoading, refetch } = useStudentBookings();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-6 h-6 text-brand-primary animate-spin" />
        <p className="text-text-faint text-xs">Fetching your bookings...</p>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">No Bookings Yet</h2>
        <p className="text-text-muted text-sm max-w-xs mb-6">
          You haven't booked any hostel or PG bed yet. Explore properties in your area to get started!
        </p>
        <button
          onClick={() => navigate('/app/search')}
          className="px-6 py-2.5 bg-brand-gradient text-white rounded-xl font-bold text-sm shadow-glow"
        >
          Explore Properties
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-text-primary font-bold text-xl">My Bookings</h1>
          <p className="text-text-faint text-xs">Track and manage your stay requests</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl bg-surface-card border border-surface-border text-text-muted hover:text-text-primary transition-all"
          title="Refresh Bookings"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {bookings.map((booking: any) => {
          const status = STATUS_CONFIG[booking.status] || {
            label: booking.status,
            bg: 'bg-surface-border/50',
            text: 'text-text-muted',
            icon: Clock
          };
          const StatusIcon = status.icon;

          return (
            <div key={booking._id} className="glass-card border border-surface-border/50 rounded-2xl overflow-hidden shadow-card">
              {/* Card Header (Property details) */}
              <div className="p-4 bg-surface-card/50 border-b border-surface-border/50 flex gap-3 items-center">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary flex-shrink-0">
                  <BedDouble className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-text-primary font-bold text-sm truncate">{booking.propertyId?.name || 'Property Deleted'}</h3>
                  <p className="text-text-faint text-xs truncate">{booking.propertyId?.address || 'N/A'}</p>
                </div>
                <div className={cn(
                  'border px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 flex-shrink-0',
                  status.bg, status.text
                )}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-text-faint block">Room Number</span>
                    <span className="text-text-primary font-bold">{booking.roomId ? `Room ${booking.roomId.roomNumber}` : 'Pending Assignment'}</span>
                  </div>
                  <div>
                    <span className="text-text-faint block">Bed Details</span>
                    <span className="text-text-primary font-bold">{booking.bedId ? `Bed ${booking.bedId.bedNumber}` : 'Pending Assignment'}</span>
                  </div>
                  <div>
                    <span className="text-text-faint block">Rent / month</span>
                    <span className="text-text-primary font-bold">
                      {booking.roomId ? formatCurrency(booking.roomId.rentPerBed) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-faint block">Booking Date</span>
                    <span className="text-text-primary font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-faint" />
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-border/30 flex justify-between items-center text-xs">
                  <span className="text-text-faint">Security Deposit Paid</span>
                  <span className="text-status-success font-semibold">
                    {booking.roomId ? formatCurrency(booking.roomId.rentPerBed) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Card Footer (Actions) */}
              <div className="px-4 pb-4 pt-2 flex gap-2">
                {booking.status === 'PENDING' && (
                  <div className="text-[11px] text-text-muted bg-surface-dark border border-surface-border/50 rounded-xl p-2.5 w-full flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    <span>Please contact the PG manager for room keys and to verify your document submissions.</span>
                  </div>
                )}

                {booking.status === 'CHECKED_IN' && (
                  <>
                    <button
                      onClick={() => navigate('/app/complaints/raise')}
                      className="flex-1 py-2 rounded-xl border border-surface-border text-text-muted hover:text-text-primary font-semibold text-xs bg-surface-card flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Complaints
                    </button>
                    <button
                      onClick={() => navigate('/app/home')}
                      className="flex-1 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover font-semibold text-xs flex items-center justify-center gap-1.5 shadow-glow transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Rent Receipts
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
