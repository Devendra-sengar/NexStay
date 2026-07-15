import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, Printer, CheckCircle2, Clock, AlertCircle, Upload, Image as ImageIcon, X, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const statusColor = (s: string) =>
  s === 'PAID'    ? { bg: '#dcfce7', color: '#16a34a' } :
  s === 'PARTIAL' ? { bg: '#fef3c7', color: '#d97706' } :
                    { bg: '#fee2e2', color: '#dc2626' };

const proofBadge = (s?: string) => {
  if (!s || s === 'NONE') return null;
  if (s === 'PENDING')  return { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending Verification' };
  if (s === 'APPROVED') return { bg: '#dcfce7', color: '#15803d', label: '✅ Proof Approved' };
  if (s === 'REJECTED') return { bg: '#fee2e2', color: '#dc2626', label: '❌ Proof Rejected' };
  return null;
};

// ── Upload Proof Modal (Slide-over) ─────────────────────────────────────────────
function UploadProofModal({ record, onClose }: { record: any; onClose: () => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isFullAmount, setIsFullAmount] = useState(true);
  const remainingAmount = record.amount + (record.fine || 0) - (record.paidAmount || 0);
  const [customAmount, setCustomAmount] = useState(remainingAmount.toString());
  const [transactionId, setTransactionId] = useState('');

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      const amt = isFullAmount ? remainingAmount : Number(customAmount);
      if (isNaN(amt) || amt <= 0) throw new Error('Invalid amount');
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('amount', amt.toString());
      formData.append('paymentMode', 'ONLINE');
      formData.append('transactionId', transactionId);

      const { data } = await api.post(`/student/rent/${record._id}/payment-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Payment proof submitted! Admin will verify shortly. ✅');
      qc.invalidateQueries({ queryKey: ['student-rent'] });
      qc.invalidateQueries({ queryKey: ['student-rent-current'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Upload failed'),
  });

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    if (f.size > 8 * 1024 * 1024) { toast.error('File must be under 8MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white shadow-2xl w-full max-w-md h-full flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div>
            <h3 className="font-bold text-text-primary text-lg">Upload Payment Proof</h3>
            <p className="text-xs text-text-muted mt-1">Due: ₹{remainingAmount.toLocaleString('en-IN')}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-input flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Drop Zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              dragging ? "border-primary bg-primary/5" : preview ? "border-emerald-400 bg-emerald-50" : "border-surface-border bg-surface-input hover:border-primary/40"
            )}
          >
            {preview ? (
              <div>
                <img src={preview} alt="preview" className="max-h-48 max-w-full mx-auto rounded-lg object-contain mb-3 shadow-sm" />
                <p className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Image selected — click to change</p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3 text-indigo-600">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">Drag & drop or click to upload</p>
                <p className="text-xs text-text-muted">JPG, PNG, WebP · Max 8MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          <div>
            <label className="form-label">Amount Paid</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <input type="radio" checked={isFullAmount} onChange={() => setIsFullAmount(true)} className="text-primary focus:ring-primary h-4 w-4" />
                Full (₹{remainingAmount.toLocaleString('en-IN')})
              </label>
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <input type="radio" checked={!isFullAmount} onChange={() => setIsFullAmount(false)} className="text-primary focus:ring-primary h-4 w-4" />
                Custom
              </label>
            </div>
            {!isFullAmount && (
              <input type="number" className="input-field" value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder="Enter amount" />
            )}
          </div>

          <div>
            <label className="form-label">Transaction ID / UTR (Optional)</label>
            <input type="text" className="input-field" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. 123456789012" />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-blue-700 text-xs flex items-start gap-2">
            <span>💡</span> 
            <span>Upload screenshot of your UPI/bank transfer. Admin will review and confirm your payment.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-surface-border bg-slate-50 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => upload.mutate()}
            disabled={!file || upload.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {upload.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Submit Proof</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View Proof Modal (Slide-over) ─────────────────────────────────────────────
function ViewProofModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white shadow-2xl w-full max-w-lg h-full flex flex-col animate-slide-in">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h3 className="font-bold text-text-primary text-lg">Payment Proof</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-input flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
        <div className="flex-1 bg-surface-input overflow-y-auto p-4 flex items-center justify-center">
          <img src={url} alt="Payment proof" className="max-w-full rounded-xl shadow-sm border border-surface-border" />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────
export default function StudentRentPage() {
  const queryClient = useQueryClient();
  const { data: hist, isLoading } = useQuery({
    queryKey: ['student-rent'],
    queryFn: () => api.get('/student/rent').then(r => r.data),
  });
  const { data: txsData, isLoading: txsLoading } = useQuery({
    queryKey: ['student-transactions'],
    queryFn: () => api.get('/student/transactions').then(r => r.data),
  });
  const { data: cur } = useQuery({
    queryKey: ['student-rent-current'],
    queryFn: () => api.get('/student/rent/current').then(r => r.data.data),
  });

  const [uploadRecord, setUploadRecord] = useState<any>(null);
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  if (isLoading || txsLoading) return (
    <div className="p-10 space-y-4">
      <div className="skeleton h-32 rounded-xl" />
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );

  const records: any[] = hist?.data || [];

  return (
    <div className="page-container max-w-5xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Rent &amp; Payments</h1>

      {/* Pending Cash Receipts (Admin initiated) */}
      {txsData?.data?.filter((t: any) => t.status === 'PENDING_RESIDENT').map((tx: any) => (
        <div key={tx._id} className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex gap-4">
          <div className="bg-amber-500 text-white p-2.5 rounded-lg h-min">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-amber-900 mb-1">Confirm Cash Payment</h3>
            <p className="text-sm text-amber-900/90 mb-4">
              The owner recorded a payment of <strong className="font-bold">₹{tx.claimedAmount.toLocaleString('en-IN')}</strong> via {tx.paymentMode}. Please confirm if you paid this amount.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  api.post(`/student/rent/cash/${tx._id}/confirm`).then(() => {
                    toast.success('Payment confirmed!');
                    queryClient.invalidateQueries({ queryKey: ['student-transactions'] });
                    queryClient.invalidateQueries({ queryKey: ['student-rent'] });
                    queryClient.invalidateQueries({ queryKey: ['student-rent-current'] });
                  }).catch(() => toast.error('Error confirming payment'));
                }}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 py-2 px-4"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  if (!confirm('Are you sure you want to reject this receipt?')) return;
                  api.post(`/student/rent/cash/${tx._id}/reject`).then(() => {
                    toast.success('Payment rejected');
                    queryClient.invalidateQueries({ queryKey: ['student-transactions'] });
                  }).catch(() => toast.error('Error rejecting payment'));
                }}
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 py-2 px-4"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Current month card */}
      {cur && (() => {
        const total = cur.amount + (cur.fine || 0);
        const paid = cur.paidAmount || 0;
        const remaining = Math.max(0, total - paid);
        return (
        <div className="bg-white border border-surface-border rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Current Month — {cur.month}</p>
              {cur.status === 'PAID' ? (
                <p className="text-3xl font-bold text-emerald-600 tracking-tight">Fully Paid</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-text-primary tracking-tight mb-1">₹{remaining.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-text-muted">Remaining Balance</p>
                </>
              )}
            </div>
            <span className={cn('badge text-xs px-3 py-1', cur.status === 'PAID' ? 'badge-success' : cur.status === 'PARTIAL' ? 'badge-warning' : 'badge-danger')}>
              {cur.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-surface-border mb-4">
            <div>
              <p className="text-xs text-text-muted mb-0.5">Total</p>
              <p className="font-semibold text-sm">₹{total.toLocaleString('en-IN')}</p>
            </div>
            <div className="border-l border-surface-border pl-4">
              <p className="text-xs text-text-muted mb-0.5">Paid</p>
              <p className="font-semibold text-sm">₹{paid.toLocaleString('en-IN')}</p>
            </div>
            <div className="border-l border-surface-border pl-4">
              <p className="text-xs text-text-muted mb-0.5">Due Date</p>
              <p className="font-semibold text-sm">{cur.dueDate ? new Date(cur.dueDate).toLocaleDateString('en-IN') : 'N/A'}</p>
            </div>
          </div>

          {/* Payment proof section for current month */}
          {cur.status !== 'PAID' && (
            <div className="bg-white border border-surface-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {(!cur.paymentProofStatus || cur.paymentProofStatus === 'NONE') && (
                <>
                  <p className="text-sm text-text-secondary">
                    <span className="mr-2">💸</span>Made a UPI/bank transfer? Upload your payment screenshot
                  </p>
                  <button onClick={() => setUploadRecord(cur)} className="btn-primary py-2 px-4 flex items-center justify-center gap-2 whitespace-nowrap">
                    <Upload className="w-4 h-4" /> Upload Proof
                  </button>
                </>
              )}
              {cur.paymentProofStatus === 'PENDING' && (
                <>
                  <p className="text-sm text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-md">⏳ Payment proof under review by admin…</p>
                  {cur.paymentProofUrl && (
                    <button onClick={() => setViewProofUrl(cur.paymentProofUrl)} className="btn-secondary py-1.5 px-3 flex items-center justify-center gap-2 text-xs">
                      <Eye className="w-4 h-4" /> View Uploaded
                    </button>
                  )}
                </>
              )}
              {cur.paymentProofStatus === 'REJECTED' && (
                <>
                  <div className="flex-1">
                    <p className="text-sm text-danger font-semibold mb-1">❌ Proof rejected</p>
                    <p className="text-xs text-text-muted">{cur.paymentProofNote || 'Please re-upload a clear screenshot.'}</p>
                  </div>
                  <button onClick={() => setUploadRecord(cur)} className="btn-danger py-2 px-4 flex items-center justify-center gap-2 whitespace-nowrap">
                    <RefreshCw className="w-4 h-4" /> Re-upload Proof
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        );
      })()}

      {hist?.securityDeposit > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 text-sm text-emerald-800">
          <strong>Security Deposit Paid:</strong> ₹{hist.securityDeposit?.toLocaleString('en-IN')} <span className="text-emerald-600/80 ml-1">— Refundable on checkout</span>
        </div>
      )}

      {/* History */}
      <h2 className="text-lg font-bold text-text-primary mb-3">Payment History</h2>
      {records.length === 0 ? (
        <div className="card p-10 text-center text-text-muted text-sm">No rent records found</div>
      ) : (
        <div className="card overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Proof Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r: any) => {
                  const pb = proofBadge(r.paymentProofStatus);
                  const total = (r.amount || 0) + (r.fine || 0);
                  const due = Math.max(0, total - (r.paidAmount || 0));
                  return (
                    <tr key={r._id}>
                      <td className="font-semibold text-text-primary">{r.month}</td>
                      <td>₹{total.toLocaleString('en-IN')}</td>
                      <td className="text-emerald-600">₹{(r.paidAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="text-danger">{due > 0 ? `₹${due.toLocaleString('en-IN')}` : '—'}</td>
                      <td>
                        <span className={cn('badge text-xs', r.status === 'PAID' ? 'badge-success' : r.status === 'PARTIAL' ? 'badge-warning' : 'badge-danger')}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        {r.status !== 'PAID' ? (
                          pb ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold px-2 py-1 rounded" style={{ background: pb.bg, color: pb.color }}>{pb.label}</span>
                              {r.paymentProofUrl && (
                                <button onClick={() => setViewProofUrl(r.paymentProofUrl)} className="p-1 text-text-muted hover:text-primary transition-colors" title="View Proof">
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              {r.paymentProofStatus === 'REJECTED' && (
                                <button onClick={() => setUploadRecord(r)} className="p-1 text-danger hover:text-red-700 transition-colors" title="Re-upload">
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <button onClick={() => setUploadRecord(r)} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                              <Upload className="w-3 h-3"/> Upload
                            </button>
                          )
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {r.status === 'PAID' ? (
                          <a href={`/api/hostel-admin/erp/rent/${r._id}/receipt`} target="_blank" rel="noreferrer" className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
                            <Printer className="w-3.5 h-3.5" /> Receipt
                          </a>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ledger History (Transactions) */}
      <h2 className="text-lg font-bold text-text-primary mb-3">Payment Ledger</h2>
      {txsData?.data?.length === 0 ? (
        <div className="card p-10 text-center text-text-muted text-sm mb-10">No transactions found.</div>
      ) : (
        <div className="card overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Proof</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {txsData?.data?.map((tx: any) => (
                  <tr key={tx._id}>
                    <td>{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="font-mono text-text-secondary">{tx.invoiceId?.month}</td>
                    <td className="font-bold text-emerald-600">₹{tx.amountSubmitted?.toLocaleString('en-IN')}</td>
                    <td>{tx.paymentMode}</td>
                    <td>
                      {tx.paymentProof?.screenshotUrl ? (
                        <button onClick={() => setViewProofUrl(tx.paymentProof.screenshotUrl)} className="text-primary hover:underline text-xs flex items-center gap-1 font-semibold">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      ) : <span className="text-text-muted text-xs">—</span>}
                    </td>
                    <td>
                      <span className={cn('badge text-[10px]', tx.status === 'APPROVED' ? 'badge-success' : tx.status === 'REJECTED' ? 'badge-danger' : 'badge-warning')}>
                        {tx.status.replace('_', ' ')}
                      </span>
                      {tx.status === 'REJECTED' && tx.rejectionReason && (
                        <p className="text-[10px] text-danger mt-0.5">{tx.rejectionReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {uploadRecord && <UploadProofModal record={uploadRecord} onClose={() => setUploadRecord(null)} />}
      {viewProofUrl && <ViewProofModal url={viewProofUrl} onClose={() => setViewProofUrl(null)} />}

    </div>
  );
}
