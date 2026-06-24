import { useState } from 'react';
import { Search, CheckCircle, XCircle, X, Loader2, ExternalLink, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useSuperProperties, useSuperPropertyDetail,
  useApproveProperty, useRejectProperty,
} from '@/lib/superAdminApi';
import { cn } from '@/lib/utils';

const TABS = ['PENDING', 'APPROVED', 'REJECTED'] as const;

function PropertyReviewDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: prop, isLoading } = useSuperPropertyDetail(id);
  const approve = useApproveProperty();
  const reject = useRejectProperty();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(id);
      toast.success('Property approved! Owner notified.');
      onClose();
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async () => {
    setErr('');
    if (reason.trim().length < 30) { setErr('Reason must be at least 30 characters.'); return; }
    try {
      await reject.mutateAsync({ id, reason: reason.trim() });
      toast.success('Property rejected. Owner notified.');
      onClose();
    } catch { toast.error('Failed to reject'); }
  };

  const owner = prop?.tenantId as any;
  const wasRejected = prop?.rejectionReason;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-white sticky top-0 z-10">
          <h2 className="font-bold text-text-primary">{isLoading ? 'Loading…' : prop?.name}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-input rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
          ) : prop ? (
            <>
              {/* Re-review warning */}
              {wasRejected && prop.verificationStatus === 'PENDING' && (
                <div className="card p-4 border-l-4 border-amber-400 bg-amber-50">
                  <p className="text-sm font-semibold text-amber-800">⚠️ Previously Rejected — Re-submitted</p>
                  <p className="text-sm text-amber-700 mt-1">Previous rejection reason: "{prop.rejectionReason}"</p>
                </div>
              )}

              {/* Owner info */}
              <div className="card p-4">
                <p className="text-xs font-semibold text-text-muted uppercase mb-3">Owner Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-text-muted">Name:</span> <span className="font-medium ml-1">{owner?.name}</span></div>
                  <div><span className="text-text-muted">Email:</span> <span className="font-medium ml-1">{owner?.email}</span></div>
                  <div><span className="text-text-muted">Business:</span> <span className="font-medium ml-1">{owner?.businessName || '—'}</span></div>
                  <div><span className="text-text-muted">Verification:</span>
                    <span className={cn('ml-1 badge', owner?.ownerVerificationStatus === 'APPROVED' ? 'badge-success' : 'badge-warning')}>
                      {owner?.ownerVerificationStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Property info */}
              <div className="card p-4">
                <p className="text-xs font-semibold text-text-muted uppercase mb-3">Property Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-text-muted">City:</span> <span className="font-medium ml-1">{prop.city}</span></div>
                  <div><span className="text-text-muted">State:</span> <span className="font-medium ml-1">{prop.state}</span></div>
                  <div><span className="text-text-muted">Gender:</span> <span className="font-medium ml-1">{prop.gender}</span></div>
                  <div><span className="text-text-muted">Food:</span> <span className="font-medium ml-1">{prop.foodIncluded ? 'Included' : 'Not included'}</span></div>
                  <div className="col-span-2"><span className="text-text-muted">Address:</span> <span className="font-medium ml-1">{prop.address}</span></div>
                </div>
              </div>

              {/* Description */}
              {prop.description && (
                <div className="card p-4">
                  <p className="text-xs font-semibold text-text-muted uppercase mb-2">Description</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{prop.description}</p>
                </div>
              )}

              {/* Amenities */}
              {prop.amenities?.length > 0 && (
                <div className="card p-4">
                  <p className="text-xs font-semibold text-text-muted uppercase mb-3">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {prop.amenities.map((a: string) => <span key={a} className="badge badge-default">{a}</span>)}
                  </div>
                </div>
              )}

              {/* Images */}
              {prop.images?.length > 0 && (
                <div className="card p-4">
                  <p className="text-xs font-semibold text-text-muted uppercase mb-3">Images ({prop.images.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {prop.images.slice(0, 6).map((img: string, i: number) => (
                      <a key={i} href={img} target="_blank" rel="noreferrer">
                        <img src={img} alt={`img${i}`} className="w-full h-24 object-cover rounded-lg hover:opacity-90 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reject form */}
              {showRejectForm && (
                <div className="card p-4 border-l-4 border-danger">
                  <p className="text-sm font-semibold text-danger mb-2">Rejection Reason (min 30 chars)</p>
                  <textarea value={reason} onChange={e => { setReason(e.target.value); setErr(''); }}
                    rows={3} placeholder="Describe why this property is not approved…"
                    className="w-full input-field resize-none text-sm" />
                  <div className="flex items-center justify-between mt-2">
                    <span className={cn('text-xs', reason.trim().length < 30 ? 'text-danger' : 'text-emerald-600')}>
                      {reason.trim().length}/30 chars min
                    </span>
                    {err && <span className="text-xs text-danger">{err}</span>}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-10 text-center text-text-muted">Property not found</div>
          )}
        </div>

        {/* Action buttons — only for PENDING */}
        {prop?.verificationStatus === 'PENDING' && (
          <div className="px-5 py-4 border-t border-surface-border bg-white flex gap-3 flex-shrink-0">
            {!showRejectForm ? (
              <>
                <button onClick={handleApprove} disabled={approve.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors">
                  {approve.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve Property
                </button>
                <button onClick={() => setShowRejectForm(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-danger hover:bg-danger/90 text-white rounded-xl font-semibold text-sm transition-colors">
                  <XCircle className="w-4 h-4" /> Reject Property
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setShowRejectForm(false); setReason(''); setErr(''); }} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleReject} disabled={reject.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-danger hover:bg-danger/90 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors">
                  {reject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Confirm Rejection
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuperPropertiesPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('PENDING');
  const [search, setSearch] = useState('');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const { data, isLoading } = useSuperProperties({ verificationStatus: tab, ...(search && { search }) });
  const props = data?.data ?? [];

  const isNew = (d: string) => Date.now() - new Date(d).getTime() < 86400000;

  return (
    <div className="page-container">
      {reviewId && <PropertyReviewDrawer id={reviewId} onClose={() => setReviewId(null)} />}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Property Verification</h1>
        <p className="text-sm text-text-secondary mt-0.5">Review and approve/reject property submissions</p>
      </div>

      <div className="flex gap-1 mb-5 p-1 bg-surface-input rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t ? 'bg-white shadow text-primary' : 'text-text-secondary hover:text-text-primary')}>
            {t === 'PENDING' ? '⏳' : t === 'APPROVED' ? '✅' : '❌'} {t}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input className="input-field pl-9 w-full max-w-sm" placeholder="Search by name or city…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-lg" />)}</div>
        ) : (
          <table className="data-table">
            <thead><tr>{['Property','Owner','City','Submitted','Images','Status','Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {props.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-text-muted">No {tab.toLowerCase()} properties</td></tr>
              ) : props.map((p: any) => {
                const owner = p.tenantId as any;
                return (
                  <tr key={p._id} className="hover:bg-surface-input/40">
                    <td className="py-2.5 px-4 border-b border-surface-border text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {p.name}
                        {isNew(p.createdAt) && tab === 'PENDING' && (
                          <span className="badge badge-info text-[10px]">NEW</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 border-b border-surface-border text-sm">{owner?.name || '—'}</td>
                    <td className="py-2.5 px-4 border-b border-surface-border text-sm">{p.city}</td>
                    <td className="py-2.5 px-4 border-b border-surface-border text-xs text-text-muted">
                      {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 border-b border-surface-border text-sm text-center">{p.images?.length ?? 0}</td>
                    <td className="py-2.5 px-4 border-b border-surface-border">
                      <span className={cn('badge', tab === 'APPROVED' ? 'badge-success' : tab === 'REJECTED' ? 'badge-danger' : 'badge-warning')}>
                        {tab}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 border-b border-surface-border">
                      <button onClick={() => setReviewId(p._id)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
