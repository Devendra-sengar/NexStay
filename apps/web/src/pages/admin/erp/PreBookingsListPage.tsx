import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreBookings, useDeletePreBooking } from '@/lib/adminApi';
import { format } from 'date-fns';
import { Plus, Search, Calendar, ChevronRight, UserPlus, CheckCircle2, Clock, Trash2, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import ReceiptModal from '@/components/ui/ReceiptModal';

export default function PreBookingsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isWarden = user?.role === 'WARDEN';
  const { data, isLoading } = usePreBookings();
  const deletePreBooking = useDeletePreBooking();
  const preBookings = data?.data || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this future booking? This action cannot be undone.')) return;
    try {
      await deletePreBooking.mutateAsync(id);
      toast.success('Booking deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete booking');
    }
  };

  const filtered = preBookings.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.phone.includes(searchTerm) ||
    b.preferredRoomType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Future Bookings</h1>
          <p className="text-sm text-text-muted mt-1">Manage offline pre-bookings and convert them to tenants</p>
        </div>
        <button 
          onClick={() => navigate(isWarden ? '/warden/pre-bookings/new' : '/admin/pre-bookings/new')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" /> New Booking
        </button>
      </div>

      <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-surface-border">
        <Search className="w-4 h-4 text-text-muted ml-2" />
        <input 
          type="text" 
          placeholder="Search by name, phone, or room type..." 
          className="flex-1 bg-transparent border-none focus:outline-none text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-surface-border">
          <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-text-primary">No bookings found</h3>
          <p className="text-text-muted text-sm mt-1">Create a new booking to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/50 border-b border-surface-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="p-4">Name & Contact</th>
                  <th className="p-4">Property</th>
                  <th className="p-4">Room Type</th>
                  <th className="p-4">Expected Joining</th>
                  <th className="p-4">Token Paid</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map(booking => (
                  <tr key={booking._id} className="hover:bg-surface-input transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-sm text-text-primary">{booking.name}</p>
                      <p className="text-xs text-text-muted">{booking.phone}</p>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">
                      {booking.propertyId?.name || 'Unknown'}
                    </td>
                    <td className="p-4 text-sm font-medium text-text-secondary">
                      {booking.preferredRoomType}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        {format(new Date(booking.expectedJoiningDate), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-emerald-600">
                      ₹{booking.tokenAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 w-max',
                        booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        booking.status === 'CONVERTED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {booking.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {booking.status === 'CONVERTED' && <CheckCircle2 className="w-3 h-3" />}
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {booking.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setReceiptId(booking._id)}
                            className="p-1.5 text-text-muted hover:text-primary bg-surface-input hover:bg-primary/10 rounded-lg transition-colors"
                            title="Print Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(isWarden ? `/warden/check-in?preBookingId=${booking._id}` : `/admin/checkin?preBookingId=${booking._id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                          >
                            Convert to Tenant <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(booking._id)}
                            className="p-1.5 text-status-error bg-status-error/10 hover:bg-status-error/20 rounded-lg transition-colors"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {booking.status === 'CONVERTED' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setReceiptId(booking._id)}
                            className="p-1.5 text-text-muted hover:text-primary bg-surface-input hover:bg-primary/10 rounded-lg transition-colors"
                            title="Print Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-medium text-text-muted">Already Converted</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {receiptId && (
        <ReceiptModal
          url={`/hostel-admin/erp/pre-bookings/${receiptId}/receipt`}
          fileName={`Advance_Receipt_${receiptId}.pdf`}
          onClose={() => setReceiptId(null)}
        />
      )}
    </div>
  );
}
