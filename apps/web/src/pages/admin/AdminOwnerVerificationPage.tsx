import { useState } from 'react';
import { useAdminOwners, useVerifyOwner } from '@/hooks/useAdmin';
import { Eye, ShieldCheck, XCircle, BadgeCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminOwnerVerificationPage() {
  const { data: owners, isLoading, refetch } = useAdminOwners();
  const verifyOwner = useVerifyOwner();

  const pendingOwners = owners?.filter((o: any) => o.ownerVerificationStatus === 'PENDING') || [];

  // Review Modal State
  const [selectedOwner, setSelectedOwner] = useState<any | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleVerify = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedOwner) return;
    if (status === 'REJECTED' && !rejectReason.trim()) {
      toast.error('Please specify a reason for rejecting verification.');
      return;
    }

    try {
      await verifyOwner.mutateAsync({
        id: selectedOwner._id,
        status,
        reason: status === 'REJECTED' ? rejectReason : undefined,
      });
      toast.success(`Owner registration has been ${status.toLowerCase()} successfully.`);
      refetch();
      setSelectedOwner(null);
      setRejectReason('');
      setShowRejectInput(false);
    } catch {
      toast.error('Failed to complete owner verification.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Owner Verification Requests</h2>
        <p className="text-text-muted text-sm">Review, approve, or reject business credentials and tax IDs for new PG Owners.</p>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : pendingOwners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface-dark/50 text-text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Owner Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Business Name</th>
                  <th className="px-6 py-4">GST Number</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-sm text-text-secondary">
                {pendingOwners.map((owner: any) => (
                  <tr key={owner._id} className="hover:bg-surface-dark/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{owner.name}</div>
                      <div className="text-xs text-text-faint">ID: {owner._id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{owner.email}</div>
                      <div className="text-xs text-text-faint">{owner.phone}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      {owner.businessName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium text-text-muted">
                      {owner.gstNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOwner(owner);
                          setShowRejectInput(false);
                          setRejectReason('');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-3.5 py-2 rounded-lg font-medium transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review Business Info
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={BadgeCheck}
            title="All Owners Verified"
            description="There are currently no new owner registration requests pending verification."
          />
        )}
      </div>

      {/* Review Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scale-in">
            <div className="border-b border-surface-border pb-4">
              <h3 className="text-xl font-bold text-text-primary">Review Owner Registration</h3>
              <p className="text-xs text-brand-primary font-medium uppercase mt-0.5">{selectedOwner.name}</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-text-muted text-xs block uppercase font-semibold">Email</span>
                  <p className="text-sm text-text-primary font-medium">{selectedOwner.email}</p>
                </div>
                <div>
                  <span className="text-text-muted text-xs block uppercase font-semibold">Phone</span>
                  <p className="text-sm text-text-primary font-medium">{selectedOwner.phone}</p>
                </div>
              </div>

              <div>
                <span className="text-text-muted text-xs block uppercase font-semibold">Registered Business Name</span>
                <p className="text-sm text-text-primary bg-surface-dark p-3 rounded-lg border border-surface-border font-medium">
                  {selectedOwner.businessName || 'Not Provided'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-text-muted text-xs block uppercase font-semibold">GST Number</span>
                  <p className="text-sm text-text-primary bg-surface-dark p-3 rounded-lg border border-surface-border font-mono">
                    {selectedOwner.gstNumber || 'Not Provided'}
                  </p>
                </div>
                <div>
                  <span className="text-text-muted text-xs block uppercase font-semibold">PAN Number</span>
                  <p className="text-sm text-text-primary bg-surface-dark p-3 rounded-lg border border-surface-border font-mono">
                    {selectedOwner.panNumber || 'Not Provided'}
                  </p>
                </div>
              </div>
            </div>

            {showRejectInput && (
              <div className="space-y-2 pt-2 animate-fade-in">
                <label className="text-xs font-bold text-status-error uppercase block">Rejection Reason</label>
                <textarea
                  placeholder="Specify why verification is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-surface-dark border border-surface-border rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:border-status-error min-h-[80px]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
              <button
                onClick={() => setSelectedOwner(null)}
                className="px-4 py-2 border border-surface-border text-text-secondary hover:text-text-primary rounded-lg text-sm transition-colors"
              >
                Close
              </button>

              {!showRejectInput ? (
                <>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="px-4 py-2 bg-status-error/10 hover:bg-status-error/20 text-status-error font-semibold rounded-lg text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleVerify('APPROVED')}
                    className="px-4 py-2 bg-status-success hover:bg-status-success/90 text-white font-semibold rounded-lg text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" /> Approve Owner
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="px-4 py-2 border border-surface-border text-text-secondary rounded-lg text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleVerify('REJECTED')}
                    className="px-4 py-2 bg-status-error hover:bg-status-error/95 text-white font-semibold rounded-lg text-sm transition-colors"
                  >
                    Confirm Rejection
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
