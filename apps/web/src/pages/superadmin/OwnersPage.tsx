import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  usePendingOwnerVerifications,
  useApproveOwnerVerification,
  useRejectOwnerVerification,
} from '@/lib/superAdminApi';
import { cn } from '@/lib/utils';

export default function OwnersVerificationPage() {
  const { data: owners = [], isLoading } = usePendingOwnerVerifications();
  const approveM = useApproveOwnerVerification();
  const rejectM = useRejectOwnerVerification();
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  const handleApprove = async (id: string, name: string) => {
    try {
      await approveM.mutateAsync(id);
      toast.success(`${name} verified!`);
    } catch { toast.error('Failed'); }
  };

  const handleReject = async () => {
    setErr('');
    if (reason.trim().length < 10) { setErr('Reason must be at least 10 characters.'); return; }
    try {
      await rejectM.mutateAsync({ id: rejectTarget._id, reason });
      toast.success('Verification rejected');
      setRejectTarget(null); setReason('');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="page-container">
      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-text-primary mb-1">Reject Owner Verification</h3>
            <p className="text-sm text-text-secondary mb-3">{rejectTarget.name} — {rejectTarget.businessName}</p>
            <textarea className="input-field w-full resize-none text-sm" rows={3}
              placeholder="Reason for rejection (min 10 chars)…" value={reason}
              onChange={e => { setReason(e.target.value); setErr(''); }} />
            {err && <p className="text-xs text-danger mt-1">{err}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectTarget(null); setReason(''); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReject} disabled={rejectM.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-danger hover:bg-danger/90 disabled:opacity-60 transition-colors">
                {rejectM.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Owner Verification</h1>
        <p className="text-sm text-text-secondary mt-0.5">Pending business verification requests from hostel owners</p>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
        ) : owners.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="font-semibold text-text-primary mb-1">All caught up!</h3>
            <p className="text-sm text-text-muted">No pending owner verifications.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr>{['Name','Business','GST','Email','Document','Registered','Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {owners.map((o: any) => (
                <tr key={o._id} className="hover:bg-surface-input/40">
                  <td className="py-3 px-4 border-b border-surface-border text-sm font-medium">{o.name}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm">{o.businessName || '—'}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm font-mono text-text-muted">{o.gstNumber || '—'}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm text-text-muted">{o.email}</td>
                  <td className="py-3 px-4 border-b border-surface-border">
                    {o.identityProofUrl ? (
                      <a href={o.identityProofUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="w-3 h-3" /> View Doc
                      </a>
                    ) : <span className="text-xs text-text-muted">No doc</span>}
                  </td>
                  <td className="py-3 px-4 border-b border-surface-border text-xs text-text-muted">
                    {new Date(o.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 px-4 border-b border-surface-border">
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(o._id, o.name)} disabled={approveM.isPending}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button onClick={() => setRejectTarget(o)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium bg-red-50 text-danger hover:bg-red-100 transition-colors">
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
