import { useState } from 'react';
import { useAdminOwners, useUpdateUserStatus } from '@/hooks/useAdmin';
import { Search, UserCheck, UserX, AlertTriangle, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminOwnersPage() {
  const [search, setSearch] = useState('');
  const { data: owners, isLoading } = useAdminOwners(search);
  const updateStatus = useUpdateUserStatus();

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    currentStatus: string;
  } | null>(null);

  const handleToggleStatus = async () => {
    if (!confirmModal) return;
    const { userId, currentStatus } = confirmModal;
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    try {
      await updateStatus.mutateAsync({ id: userId, status: nextStatus });
      toast.success(`User account has been ${nextStatus.toLowerCase()} successfully.`);
    } catch {
      toast.error('Failed to update user status.');
    } finally {
      setConfirmModal(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">PG Owners Management</h2>
          <p className="text-text-muted text-sm">Monitor business credentials and control platform access for registered owners.</p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-faint" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-dark border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : owners && owners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface-dark/50 text-text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Verification Status</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-sm text-text-secondary">
                {owners.map((owner: any) => (
                  <tr key={owner._id} className="hover:bg-surface-dark/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{owner.name}</div>
                      <div className="text-xs text-text-faint">ID: {owner._id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{owner.email}</div>
                      <div className="text-xs text-text-faint">{owner.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        owner.ownerVerificationStatus === 'APPROVED'
                          ? 'bg-status-success/10 text-status-success border-status-success/20'
                          : owner.ownerVerificationStatus === 'REJECTED'
                          ? 'bg-status-error/10 text-status-error border-status-error/20'
                          : 'bg-status-warning/10 text-status-warning border-status-warning/20'
                      }`}>
                        {owner.ownerVerificationStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        owner.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {owner.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {owner.status === 'ACTIVE' ? (
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, userId: owner._id, userName: owner.name, currentStatus: 'ACTIVE' })}
                          className="inline-flex items-center gap-1 text-xs text-status-error hover:underline bg-status-error/10 px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" /> Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, userId: owner._id, userName: owner.name, currentStatus: 'SUSPENDED' })}
                          className="inline-flex items-center gap-1 text-xs text-status-success hover:underline bg-status-success/10 px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No Owners Found"
            description={search ? `No PG owners matched "${search}". Try searching for another name or email.` : "There are currently no registered PG Owners on the platform."}
          />
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                confirmModal.currentStatus === 'ACTIVE' ? 'bg-status-error/10 text-status-error' : 'bg-status-success/10 text-status-success'
              }`}>
                {confirmModal.currentStatus === 'ACTIVE' ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  {confirmModal.currentStatus === 'ACTIVE' ? 'Suspend Owner Account' : 'Reactivate Owner Account'}
                </h3>
                <p className="text-xs text-text-muted">Action verification request</p>
              </div>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed">
              Are you sure you want to {confirmModal.currentStatus === 'ACTIVE' ? 'suspend' : 'reactivate'} the account for{' '}
              <strong className="text-text-primary">{confirmModal.userName}</strong>?
              {confirmModal.currentStatus === 'ACTIVE' && ' Suspended owners will be immediately blocked from signing in or modifying their properties.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-surface-border text-text-secondary hover:text-text-primary rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                  confirmModal.currentStatus === 'ACTIVE'
                    ? 'bg-status-error hover:bg-status-error/90'
                    : 'bg-status-success hover:bg-status-success/90'
                }`}
              >
                {confirmModal.currentStatus === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
