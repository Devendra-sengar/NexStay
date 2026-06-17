import { useState } from 'react';
import { usePendingProperties, useVerifyProperty } from '@/hooks/useAdmin';
import { Eye, ShieldCheck, XCircle, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminPropertyVerificationPage() {
  const { data: properties, isLoading, refetch } = usePendingProperties();
  const verifyProperty = useVerifyProperty();

  // Review Modal State
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleVerify = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedProperty) return;
    if (status === 'REJECTED' && !rejectReason.trim()) {
      toast.error('Please specify a reason for rejecting the property.');
      return;
    }

    try {
      await verifyProperty.mutateAsync({
        id: selectedProperty._id,
        status,
        reason: status === 'REJECTED' ? rejectReason : undefined,
      });
      toast.success(`Property has been ${status.toLowerCase()} successfully.`);
      refetch();
      setSelectedProperty(null);
      setRejectReason('');
      setShowRejectInput(false);
    } catch {
      toast.error('Failed to update property status.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Property Verification Requests</h2>
        <p className="text-text-muted text-sm">Review, approve, or reject newly registered properties before they appear on the marketplace.</p>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface-dark/50 text-text-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Property Name</th>
                  <th className="px-6 py-4">Owner Name</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Pricing Start</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-sm text-text-secondary">
                {properties.map((prop: any) => (
                  <tr key={prop._id} className="hover:bg-surface-dark/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{prop.name}</div>
                      <div className="text-xs text-text-faint">ID: {prop._id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">{prop.ownerId?.name || 'N/A'}</div>
                      <div className="text-xs text-text-faint">{prop.ownerId?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{prop.address}</div>
                      <div className="text-xs text-text-faint">{prop.city}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      ₹{(prop.rentStartingFrom || 0).toLocaleString('en-IN')}/mo
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedProperty(prop);
                          setShowRejectInput(false);
                          setRejectReason('');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-3.5 py-2 rounded-lg font-medium transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="All Properties Verified"
            description="There are currently no new properties pending verification."
          />
        )}
      </div>

      {/* Review Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="border-b border-surface-border pb-4">
              <h3 className="text-xl font-bold text-text-primary">{selectedProperty.name}</h3>
              <p className="text-xs text-brand-primary font-medium uppercase mt-0.5">Verification Detail Review</p>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-text-muted text-xs block uppercase font-semibold">Owner Contact</span>
                <p className="text-sm text-text-primary font-medium">
                  {selectedProperty.ownerId?.name} ({selectedProperty.ownerId?.email} | {selectedProperty.ownerId?.phone})
                </p>
              </div>

              <div>
                <span className="text-text-muted text-xs block uppercase font-semibold">Address & City</span>
                <p className="text-sm text-text-primary">{selectedProperty.address}, {selectedProperty.city}</p>
              </div>

              <div>
                <span className="text-text-muted text-xs block uppercase font-semibold">Description</span>
                <p className="text-sm text-text-secondary leading-relaxed bg-surface-dark p-3 rounded-lg border border-surface-border">
                  {selectedProperty.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <span className="text-text-muted text-xs block uppercase font-semibold mb-1">Amenities</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProperty.amenities?.map((amenity: string, idx: number) => (
                    <span key={idx} className="bg-surface-dark border border-surface-border text-xs px-2.5 py-1 rounded-md text-text-secondary">
                      {amenity}
                    </span>
                  )) || <span className="text-sm text-text-muted">None specified</span>}
                </div>
              </div>
            </div>

            {showRejectInput && (
              <div className="space-y-2 pt-2 animate-fade-in">
                <label className="text-xs font-bold text-status-error uppercase block">Rejection Reason</label>
                <textarea
                  placeholder="Specify why this property is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-surface-dark border border-surface-border rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:border-status-error min-h-[80px]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
              <button
                onClick={() => setSelectedProperty(null)}
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
                    <ShieldCheck className="w-4 h-4" /> Approve Listing
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
