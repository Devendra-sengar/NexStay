import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, LogOut, AlertTriangle, CheckCircle2,
  Loader2, CreditCard, Calendar, AlertCircle
} from 'lucide-react';
import { useBooking, useBookingDues, useProcessCheckOut } from '@/hooks/useTenants';
import { Stepper } from '@/components/erp/Stepper';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Outstanding Dues', description: 'Check balance' },
  { id: 2, label: 'Checkout Date', description: 'Confirm date' },
  { id: 3, label: 'Confirm', description: 'Finalize checkout' },
];

export default function CheckOutWizard() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [overrideReason, setOverrideReason] = useState('');
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: booking, isLoading: bookingLoading } = useBooking(bookingId || '');
  const { data: duesData, isLoading: duesLoading } = useBookingDues(bookingId || '');
  const processCheckOut = useProcessCheckOut();

  if (bookingLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-text-muted">Booking not found</p>
      </div>
    );
  }

  const student = booking.studentId as any;
  const property = booking.propertyId as any;
  const room = booking.roomId as any;
  const bed = booking.bedId as any;
  const totalDues: number = duesData?.totalDues ?? 0;
  const unpaidRecords: any[] = duesData?.unpaidRecords ?? [];
  const hasDues = totalDues > 0;
  const canProceedWithDues = hasDues && overrideReason.trim().length >= 10;
  const canProceed = !hasDues || canProceedWithDues;

  const handleConfirmCheckOut = async () => {
    setErrorMessage('');
    try {
      await processCheckOut.mutateAsync({
        bookingId: bookingId!,
        data: {
          checkoutDate,
          overrideReason: overrideReason || undefined,
        },
      });
      setSuccessMessage('Check-out processed successfully!');
      setTimeout(() => navigate('/erp/tenants'), 2000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to process check-out');
    }
  };

  if (successMessage) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-status-success/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-status-success" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Check-Out Complete!</h2>
          <p className="text-text-muted">{successMessage}</p>
          <p className="text-text-faint text-sm mt-2">Redirecting to Tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="section-header mb-1">Initiate Check-Out</h1>
      <p className="text-text-muted text-sm mb-6">Guided check-out workflow for <strong className="text-text-primary">{student?.name}</strong></p>

      {/* Stepper */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <Stepper steps={STEPS} currentStep={step} />
      </div>

      {/* Step Content */}
      <div className="glass-card rounded-xl p-6">

        {/* ── Step 1: Outstanding Dues ── */}
        {step === 1 && (
          <div>
            <h2 className="text-text-primary font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center">1</span>
              Outstanding Dues
            </h2>

            {/* Tenant summary */}
            <div className="flex items-center gap-3 p-3 bg-surface-dark rounded-lg mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
                {getInitials(student?.name || '?')}
              </div>
              <div>
                <p className="text-text-primary font-semibold">{student?.name}</p>
                <p className="text-text-faint text-xs">{property?.name} · Room {room?.roomNumber} · Bed {bed?.bedNumber}</p>
              </div>
            </div>

            {duesLoading ? (
              <div className="flex items-center gap-2 text-text-muted py-6">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking dues...
              </div>
            ) : hasDues ? (
              <>
                {/* Dues warning */}
                <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-status-error flex-shrink-0" />
                    <div>
                      <p className="text-status-error font-bold">Outstanding dues: {formatCurrency(totalDues)}</p>
                      <p className="text-status-error/80 text-xs">Checkout is blocked until dues are cleared or an override is provided.</p>
                    </div>
                  </div>

                  {/* Unpaid records */}
                  <div className="space-y-1.5">
                    {unpaidRecords.map((r: any) => (
                      <div key={r._id} className="flex items-center justify-between text-sm bg-surface-dark rounded-lg p-2">
                        <span className="text-text-muted">{formatDate(r.dueDate)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-text-primary">{formatCurrency(r.amount)}</span>
                          {r.paidAmount > 0 && <span className="text-text-faint text-xs">({formatCurrency(r.paidAmount)} paid)</span>}
                          <span className="text-status-error text-xs font-semibold">{r.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Override section */}
                <div className="bg-status-warning/5 border border-status-warning/30 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                    <p className="text-status-warning text-sm font-medium">Owner Override: Proceed with pending dues</p>
                  </div>
                  <p className="text-text-muted text-xs mb-2">Provide a reason to override the dues block (e.g., tenant agreement, special case). Minimum 10 characters.</p>
                  <textarea
                    className="input-field resize-none text-sm"
                    rows={2}
                    placeholder="Override reason (e.g. Tenant has signed dues acknowledgement, will clear via bank transfer)..."
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                  />
                  {overrideReason.length > 0 && overrideReason.length < 10 && (
                    <p className="text-status-error text-xs mt-1">Please provide at least 10 characters for audit trail.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-status-success/10 border border-status-success/30 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-status-success flex-shrink-0" />
                <div>
                  <p className="text-status-success font-semibold">All dues cleared!</p>
                  <p className="text-status-success/80 text-xs">No outstanding rent for this tenant. Safe to proceed.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Checkout Date ── */}
        {step === 2 && (
          <div>
            <h2 className="text-text-primary font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center">2</span>
              Confirm Checkout Date
            </h2>

            <div className="max-w-xs space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  <Calendar className="w-4 h-4 inline mr-1.5" />Checkout Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={checkoutDate}
                  onChange={e => setCheckoutDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-text-faint text-xs mt-1">Cannot be a future date.</p>
              </div>

              <div className="p-3 bg-surface-dark rounded-lg text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-text-muted">Room</span>
                  <span className="text-text-primary">Room {room?.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Bed</span>
                  <span className="text-text-primary">Bed {bed?.bedNumber} → will be freed</span>
                </div>
                {hasDues && overrideReason && (
                  <div className="flex justify-between pt-1 border-t border-surface-border">
                    <span className="text-status-warning">Dues Override</span>
                    <span className="text-status-warning font-medium">{formatCurrency(totalDues)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <div>
            <h2 className="text-text-primary font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-status-error text-white text-sm font-bold flex items-center justify-center">3</span>
              Final Confirmation
            </h2>

            <div className="bg-surface-dark rounded-xl p-5 space-y-3 mb-5">
              <div className="flex justify-between border-b border-surface-border pb-2 text-sm">
                <span className="text-text-muted">Tenant</span>
                <span className="text-text-primary font-semibold">{student?.name}</span>
              </div>
              <div className="flex justify-between border-b border-surface-border pb-2 text-sm">
                <span className="text-text-muted">Property</span>
                <span className="text-text-primary">{property?.name}</span>
              </div>
              <div className="flex justify-between border-b border-surface-border pb-2 text-sm">
                <span className="text-text-muted">Checkout Date</span>
                <span className="text-text-primary font-medium">{formatDate(checkoutDate)}</span>
              </div>
              <div className="flex justify-between border-b border-surface-border pb-2 text-sm">
                <span className="text-text-muted">Bed Released</span>
                <span className="text-status-success font-medium">Room {room?.roomNumber} · Bed {bed?.bedNumber}</span>
              </div>
              {hasDues && (
                <div className="flex justify-between text-sm">
                  <span className="text-status-warning">Outstanding Dues (Override)</span>
                  <span className="text-status-warning font-bold">{formatCurrency(totalDues)}</span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 bg-status-error/5 border border-status-error/20 rounded-lg p-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-status-error flex-shrink-0 mt-0.5" />
              <p className="text-status-error text-xs">
                This will mark the booking as <strong>CHECKED_OUT</strong> and free the bed. 
                The student's stay record will be archived. This cannot be undone.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-status-error/10 border border-status-error/30 rounded-lg p-3 text-status-error text-sm mb-4">
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && !canProceed}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            title={step === 1 && hasDues && !canProceedWithDues ? 'Clear dues or provide an override reason (min 10 chars)' : ''}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleConfirmCheckOut}
            disabled={processCheckOut.isPending}
            className="px-6 py-2.5 rounded-md bg-status-error hover:bg-status-error/80 text-white font-semibold text-sm transition-all flex items-center gap-2"
          >
            {processCheckOut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Confirm Check-Out
          </button>
        )}
      </div>
    </div>
  );
}
