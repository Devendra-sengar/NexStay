import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, AlertTriangle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useErpStudentById, useStudentDues, useRecordRentPayment, useProcessCheckOut } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
            i < current ? 'bg-primary border-primary text-white' :
            i === current ? 'border-primary text-primary bg-white' :
            'border-surface-border text-text-muted bg-white')}>
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && <div className={cn('flex-1 h-0.5', i < current ? 'bg-primary' : 'bg-surface-border')} />}
        </div>
      ))}
    </div>
  );
}

function PayInlineModal({ record, studentId, onClose }: { record: any; studentId: string; onClose: () => void }) {
  const [amount, setAmount] = useState(Math.max(0, record.amount + (record.fine || 0) - (record.paidAmount || 0)));
  const pay = useRecordRentPayment();
  const submit = async () => {
    try {
      await pay.mutateAsync({ id: record._id, studentId, amount, paymentMethod: 'CASH' });
      toast.success('Payment recorded');
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-bold mb-1">Record Payment — {record.month}</h3>
        <p className="text-sm text-text-muted mb-4">Balance: ₹{Math.max(0, record.amount + (record.fine || 0) - (record.paidAmount || 0)).toLocaleString('en-IN')}</p>
        <input type="number" className="input-field mb-4" value={amount} onChange={e => setAmount(+e.target.value)} />
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={pay.isPending}>{pay.isPending ? 'Saving…' : 'Record'}</button>
        </div>
      </div>
    </div>
  );
}

export default function CheckOutPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const { data: student } = useErpStudentById(studentId);
  const { data: duesData, refetch: refetchDues } = useStudentDues(studentId);
  const checkout = useProcessCheckOut();

  const [step, setStep] = useState(0);
  const [overrideReason, setOverrideReason] = useState('');
  const [useOverride, setUseOverride] = useState(false);
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositReturn, setDepositReturn] = useState(0);
  const [notes, setNotes] = useState('');
  const [payModal, setPayModal] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  const records = duesData?.records ?? [];
  const totalDue = duesData?.totalDue ?? 0;
  const allCleared = totalDue === 0;

  const canProceedStep0 = allCleared || (useOverride && overrideReason.trim().length >= 20);

  const handleCheckout = async () => {
    try {
      await checkout.mutateAsync({
        studentId,
        checkoutDate,
        depositReturn,
        notes,
        overrideReason: useOverride ? overrideReason : undefined,
      });
      setSuccess(true);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Check-out failed');
    }
  };

  if (success) return (
    <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">Check-Out Complete!</h2>
      <p className="text-text-secondary mb-6">Bed is now <span className="text-emerald-600 font-semibold">AVAILABLE</span>.</p>
      <div className="flex gap-3">
        <button className="btn-secondary" onClick={() => navigate('/admin/tenants')}>View Students</button>
        <button className="btn-primary" onClick={() => navigate('/admin/rooms')}>View BedGrid</button>
      </div>
    </div>
  );

  const stepLabels = ['Dues Check', 'Check-Out Details', 'Confirm'];

  return (
    <div className="page-container max-w-2xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>
      <h1 className="text-2xl font-bold mb-1">Process Check-Out</h1>
      {student && <p className="text-sm text-text-muted mb-6">{student.name} • {student.phone}</p>}

      <StepBar current={step} total={3} />

      <div className="card p-6">
        {/* Step 0 — Dues */}
        {step === 0 && (
          <div>
            <h2 className="font-semibold text-text-primary mb-4">Step 1 — Dues Check</h2>
            {allCleared ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 mb-4">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-medium text-emerald-800">No outstanding dues. Ready to proceed!</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
                    <p className="text-sm font-semibold text-danger">Total Outstanding: ₹{totalDue.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="text-xs text-red-600">Student has unpaid dues. Clear them or provide an override reason.</p>
                </div>

                <div className="space-y-2 mb-4">
                  {records.map((r: any) => {
                    const balance = Math.max(0, r.amount + (r.fine || 0) - (r.paidAmount || 0));
                    return (
                      <div key={r._id} className="flex items-center justify-between p-3 border border-surface-border rounded-xl">
                        <div>
                          <p className="text-sm font-medium">{r.month}</p>
                          <p className="text-xs text-text-muted">Balance: ₹{balance.toLocaleString('en-IN')}</p>
                        </div>
                        <button onClick={() => setPayModal(r)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />Pay Now
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-surface-border pt-4">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input type="checkbox" className="rounded" checked={useOverride} onChange={e => setUseOverride(e.target.checked)} />
                    <span className="text-sm font-medium text-text-primary">Override / Waive dues</span>
                  </label>
                  {useOverride && (
                    <div>
                      <label className="form-label">Override Reason (min 20 chars)</label>
                      <textarea
                        className="input-field min-h-[80px] resize-none"
                        placeholder="Explain reason for waiving dues…"
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                      />
                      <p className="text-xs text-text-muted mt-1">{overrideReason.trim().length}/20 chars minimum</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-text-primary mb-3">Step 2 — Check-Out Details</h2>
            <div>
              <label className="form-label">Check-Out Date</label>
              <input type="date" className="input-field" value={checkoutDate} onChange={e => setCheckoutDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Security Deposit Held: ₹{student?.securityDeposit?.toLocaleString('en-IN') ?? 0}</label>
              <label className="form-label mt-2">Amount to Return (₹)</label>
              <input type="number" className="input-field" value={depositReturn} max={student?.securityDeposit ?? 0}
                onChange={e => setDepositReturn(+e.target.value)} />
            </div>
            <div>
              <label className="form-label">Final Notes (optional)</label>
              <textarea className="input-field resize-none min-h-[80px]" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 2 — Confirm */}
        {step === 2 && (
          <div>
            <h2 className="font-semibold text-text-primary mb-4">Step 3 — Confirm Check-Out</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Student</span><span className="font-medium">{student?.name}</span></div>
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Check-Out Date</span><span className="font-medium">{checkoutDate}</span></div>
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Deposit Return</span><span className="font-medium text-emerald-600">₹{depositReturn.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Outstanding Dues</span><span className={cn('font-medium', allCleared ? 'text-emerald-600' : 'text-danger')}>{allCleared ? 'Cleared' : `₹${totalDue.toLocaleString('en-IN')} (overridden)`}</span></div>
              {useOverride && <div className="py-2"><p className="text-text-muted text-xs">Override Reason:</p><p className="text-xs">{overrideReason}</p></div>}
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">This will free the bed and mark the student as CHECKED_OUT. This action cannot be undone.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>}
          {step < 2 ? (
            <button className="btn-primary flex-1" onClick={async () => { if (step === 0) await refetchDues(); setStep(s => s + 1); }} disabled={step === 0 && !canProceedStep0}>
              Next
            </button>
          ) : (
            <button className="btn-danger flex-1" onClick={handleCheckout} disabled={checkout.isPending}>
              {checkout.isPending ? 'Processing…' : 'Confirm Check-Out'}
            </button>
          )}
        </div>
      </div>

      {payModal && (
        <PayInlineModal
          record={payModal}
          studentId={studentId!}
          onClose={() => { setPayModal(null); refetchDues(); }}
        />
      )}
    </div>
  );
}
