import { useState } from 'react';
import { useAdminPayments } from '@/hooks/useAdmin';
import { Search, Filter, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useAdminPayments({ q: search, status });
  const records = data?.records || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PARTIAL':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Payments & Transactions</h2>
          <p className="text-text-muted text-sm">Monitor all invoice records and collections processed across the platform.</p>
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
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
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
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface-dark/50 text-text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Amount / Paid</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-sm text-text-secondary">
                {records.map((record: any) => (
                  <tr key={record._id} className="hover:bg-surface-dark/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{record.studentId?.name || 'Deleted Tenant'}</div>
                      <div className="text-xs text-text-faint">{record.studentId?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{record.bookingId?.propertyId?.name || 'N/A'}</div>
                      <div className="text-xs text-text-faint">{record.bookingId?.propertyId?.city || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      <div>₹{(record.amount || 0).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-emerald-400 font-medium">Paid: ₹{(record.paidAmount || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {new Date(record.dueDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={CreditCard}
            title="No Payment Records"
            description={search || status ? "No payment transactions match the specified search or filter criteria." : "There are currently no transactions or rent records on the platform."}
          />
        )}
      </div>
    </div>
  );
}
