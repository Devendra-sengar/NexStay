import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, Printer, CheckCircle2, Clock, AlertCircle, Upload, Image as ImageIcon, X, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

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

// ── Upload Proof Modal ──────────────────────────────────────────────────────────
function UploadProofModal({ record, onClose }: { record: any; onClose: () => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      const formData = new FormData();
      formData.append('image', file);
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Upload Payment Proof</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Month: {record.month} · Due: ₹{record.amount?.toLocaleString('en-IN')}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#64748b" />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Drop Zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            style={{
              border: `2px dashed ${dragging ? '#3b82f6' : preview ? '#22c55e' : '#cbd5e1'}`,
              borderRadius: 14,
              background: dragging ? '#eff6ff' : preview ? '#f0fdf4' : '#f8fafc',
              padding: 24,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 16,
            }}
          >
            {preview ? (
              <div>
                <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 10, objectFit: 'contain', marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, margin: 0 }}>✓ Image selected — click to change</p>
              </div>
            ) : (
              <div>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <ImageIcon size={26} color="#4f46e5" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>Drag & drop or click to upload</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>JPG, PNG, WebP · Max 8MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* Info box */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: '#1d4ed8', margin: 0 }}>
              💡 Upload screenshot of your UPI/bank transfer. Admin will review and confirm your payment.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px 0', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={() => upload.mutate()}
              disabled={!file || upload.isPending}
              style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, background: file ? '#2563eb' : '#94a3b8', color: 'white', fontSize: 14, fontWeight: 600, cursor: file ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s' }}
            >
              {upload.isPending ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</> : <><Upload size={14} /> Submit Proof</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── View Proof Modal ────────────────────────────────────────────────────────────
function ViewProofModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: -16, right: -16, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <X size={18} />
        </button>
        <img src={url} alt="Payment proof" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 14, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────
export default function StudentRentPage() {
  const { data: hist, isLoading } = useQuery({
    queryKey: ['student-rent'],
    queryFn: () => api.get('/student/rent').then(r => r.data),
  });
  const { data: cur } = useQuery({
    queryKey: ['student-rent-current'],
    queryFn: () => api.get('/student/rent/current').then(r => r.data.data),
  });

  const [uploadRecord, setUploadRecord] = useState<any>(null);
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
      <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
      Loading rent records…
    </div>
  );

  const records: any[] = hist?.data || [];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>Rent &amp; Payments</h1>

      {/* Current month card */}
      {cur && (
        <div style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', borderRadius: 16, padding: '20px 24px', marginBottom: 20, color: 'white' }}>
          <p style={{ margin: '0 0 4px', opacity: 0.7, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Current Month — {cur.month}</p>
          <p style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 700 }}>₹{cur.amount?.toLocaleString('en-IN')}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Due: {cur.dueDate ? new Date(cur.dueDate).toLocaleDateString('en-IN') : 'N/A'}</span>
            <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: cur.status === 'PAID' ? 'rgba(22,163,74,0.3)' : 'rgba(239,68,68,0.3)', color: 'white' }}>
              {cur.status}
            </span>
          </div>

          {/* Payment proof section for current month */}
          {cur.status !== 'PAID' && (
            <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px' }}>
              {(!cur.paymentProofStatus || cur.paymentProofStatus === 'NONE') && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <p style={{ fontSize: 13, opacity: 0.9, margin: 0 }}>💸 Made a UPI/bank transfer? Upload your payment screenshot</p>
                  <button
                    onClick={() => setUploadRecord(cur)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', color: '#1e40af', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Upload size={13} /> Upload Proof
                  </button>
                </div>
              )}
              {cur.paymentProofStatus === 'PENDING' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#fef3c7', fontWeight: 600 }}>⏳ Payment proof under review by admin…</span>
                  {cur.paymentProofUrl && (
                    <button onClick={() => setViewProofUrl(cur.paymentProofUrl)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Eye size={12} /> View Uploaded
                    </button>
                  )}
                </div>
              )}
              {cur.paymentProofStatus === 'REJECTED' && (
                <div>
                  <p style={{ fontSize: 13, color: '#fca5a5', fontWeight: 600, margin: '0 0 6px' }}>
                    ❌ Proof rejected: {cur.paymentProofNote || 'Please re-upload a clear screenshot.'}
                  </p>
                  <button
                    onClick={() => setUploadRecord(cur)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <RefreshCw size={13} /> Re-upload Proof
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {hist?.securityDeposit > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ color: '#166534', fontSize: 13, margin: 0 }}>
            <strong>Security Deposit Paid:</strong> ₹{hist.securityDeposit?.toLocaleString('en-IN')} — Refundable on checkout
          </p>
        </div>
      )}

      {/* History */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Payment History</h2>
      {records.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>No rent records found</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map((r: any) => {
            const sc = statusColor(r.status);
            const pb = proofBadge(r.paymentProofStatus);
            return (
              <div key={r._id} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Icon */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {r.status === 'PAID' ? <CheckCircle2 size={18} color={sc.color} /> : r.status === 'PARTIAL' ? <Clock size={18} color={sc.color} /> : <AlertCircle size={18} color={sc.color} />}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>{r.month}</p>
                    <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
                      ₹{r.amount?.toLocaleString('en-IN')} {r.fine > 0 && `+ ₹${r.fine} fine`}
                      {r.paidAt && ` · Paid ${new Date(r.paidAt).toLocaleDateString('en-IN')}`}
                      {r.paymentMethod && ` via ${r.paymentMethod}`}
                    </p>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{r.status}</span>
                    {r.status === 'PAID' && (
                      <a href={`/api/hostel-admin/erp/rent/${r._id}/receipt`} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1d4ed8', fontSize: 12, textDecoration: 'none' }}>
                        <Printer size={12} /> Receipt
                      </a>
                    )}
                  </div>
                </div>

                {/* Payment proof status row */}
                {r.status !== 'PAID' && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    {pb ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: pb.bg, color: pb.color }}>{pb.label}</span>
                        {r.paymentProofUrl && (
                          <button onClick={() => setViewProofUrl(r.paymentProofUrl)}
                            style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={11} /> View
                          </button>
                        )}
                        {r.paymentProofStatus === 'REJECTED' && (
                          <button onClick={() => setUploadRecord(r)}
                            style={{ fontSize: 11, color: '#dc2626', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <RefreshCw size={11} /> Re-upload
                          </button>
                        )}
                        {r.paymentProofNote && r.paymentProofStatus === 'REJECTED' && (
                          <p style={{ fontSize: 11, color: '#dc2626', margin: 0 }}>Reason: {r.paymentProofNote}</p>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>No proof uploaded yet</p>
                        <button onClick={() => setUploadRecord(r)}
                          style={{ fontSize: 12, color: '#2563eb', background: '#eff6ff', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Upload size={12} /> Upload Proof
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {uploadRecord && <UploadProofModal record={uploadRecord} onClose={() => setUploadRecord(null)} />}
      {viewProofUrl && <ViewProofModal url={viewProofUrl} onClose={() => setViewProofUrl(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
