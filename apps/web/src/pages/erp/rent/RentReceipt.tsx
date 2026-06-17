import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Building2, Phone, Mail, Calendar, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { useRentRecord } from '@/hooks/useRent';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function RentReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: record, isLoading } = useRentRecord(id || '');

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-text-muted">Receipt not found</p>
      </div>
    );
  }

  const student = record.studentId as any;
  const booking = record.bookingId as any;

  return (
    <div className="page-container max-w-2xl">
      {/* Action bar — hidden on print */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={() => window.print()}
          className="ml-auto btn-primary flex items-center gap-2 text-sm"
        >
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
      </div>

      {/* Receipt Card */}
      <div id="receipt" className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-card border border-surface-border print:shadow-none print:border-gray-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5" />
                <span className="text-xl font-bold">NexStay</span>
              </div>
              <p className="text-indigo-200 text-sm">PG & Hostel Management Platform</p>
            </div>
            <div className="text-right">
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide">Receipt</p>
              <p className="text-white font-mono font-bold text-sm mt-0.5">#{id?.slice(-8).toUpperCase()}</p>
              <p className="text-indigo-200 text-xs mt-1">{record.paidAt ? formatDate(record.paidAt) : formatDate(record.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Status badge */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-green-700 font-semibold text-sm">
                {record.status === 'PAID' ? 'Payment Received in Full' : 'Partial Payment Recorded'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Student Info */}
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Received From</p>
              <p className="text-gray-900 font-bold text-base">{student?.name}</p>
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <Mail className="w-3 h-3" />{student?.email}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <Phone className="w-3 h-3" />{student?.phone}
                </div>
              </div>
            </div>

            {/* Property Info */}
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Property</p>
              <p className="text-gray-900 font-bold text-base">{booking?.propertyId?.name}</p>
              <div className="space-y-1 mt-2">
                <p className="text-gray-500 text-xs">{booking?.propertyId?.address}</p>
                <p className="text-gray-500 text-xs">{booking?.propertyId?.city}</p>
                <p className="text-gray-500 text-xs">Room {booking?.roomId?.roomNumber} · Bed {booking?.bedId?.bedNumber}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">Payment Details</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rent Period</span>
                <span className="text-gray-900">{formatDate(record.dueDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Rent</span>
                <span className="text-gray-900">{formatCurrency(record.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method</span>
                <span className="text-gray-900">{record.paymentMethod?.replace('_', ' ') || 'Cash'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Date</span>
                <span className="text-gray-900">{record.paidAt ? formatDate(record.paidAt) : '—'}</span>
              </div>
              {record.notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Notes</span>
                  <span className="text-gray-900">{record.notes}</span>
                </div>
              )}
            </div>

            {/* Amount due / paid */}
            <div className="border-t border-gray-200 pt-3 mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid</span>
                <span className="text-green-600 font-bold">{formatCurrency(record.paidAmount)}</span>
              </div>
              {record.amount - record.paidAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Balance Remaining</span>
                  <span className="text-red-500 font-semibold">{formatCurrency(record.amount - record.paidAmount)}</span>
                </div>
              )}
            </div>

            {/* Big total */}
            <div className="mt-4 p-3 bg-indigo-600 rounded-lg flex justify-between items-center">
              <span className="text-indigo-200 font-medium">Amount Paid</span>
              <span className="text-white font-bold text-xl">{formatCurrency(record.paidAmount)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-gray-400 text-xs">Generated by NexStay</p>
              <p className="text-gray-300 text-xs">This is a computer-generated receipt</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Thank you for your payment!</p>
              <p className="text-indigo-600 font-semibold text-sm">NexStay Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles — injected via a style tag */}
      <style>{`
        @media print {
          body { background: white !important; }
          .page-container { padding: 0 !important; }
          #receipt { border: 1px solid #e5e7eb !important; }
        }
      `}</style>
    </div>
  );
}
