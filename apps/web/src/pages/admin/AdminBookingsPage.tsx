import { useState } from 'react';
import { useAdminBookings } from '@/hooks/useAdmin';
import { Search, Filter, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminBookingsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data: bookings, isLoading } = useAdminBookings({ q: search, status });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CHECKED_IN':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'CHECKED_OUT':
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Platform Bookings</h2>
          <p className="text-text-muted text-sm">Read-only listing of all student room reservations across properties.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-faint" />
            <input
              type="text"
              placeholder="Search student or property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-dark border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-text-faint" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-surface-dark border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface-dark/50 text-text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Room & Bed</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-sm text-text-secondary">
                {bookings.map((booking: any) => (
                  <tr key={booking._id} className="hover:bg-surface-dark/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{booking.studentId?.name || 'Deleted User'}</div>
                      <div className="text-xs text-text-faint">{booking.studentId?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{booking.propertyId?.name || 'Deleted Property'}</div>
                      <div className="text-xs text-text-faint">{booking.propertyId?.city || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-primary font-medium">Room {booking.roomId?.roomNumber || 'N/A'}</div>
                      <div className="text-xs text-text-faint">Bed {booking.bedId?.bedNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No Bookings Found"
            description={search || status ? "No bookings match the specified search query or status filter." : "There are currently no room bookings on the platform."}
          />
        )}
      </div>
    </div>
  );
}
