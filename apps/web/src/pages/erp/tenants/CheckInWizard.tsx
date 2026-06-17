import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, Loader2, BedDouble,
  User, Building2, FileText, AlertCircle, Check
} from 'lucide-react';
import { useBooking, useAvailableBeds, useProcessCheckIn } from '@/hooks/useTenants';
import { Stepper } from '@/components/erp/Stepper';
import { formatDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Review Booking', description: 'Verify details' },
  { id: 2, label: 'Documents', description: 'Approve / Reject' },
  { id: 3, label: 'Assign Bed', description: 'Confirm or override' },
  { id: 4, label: 'Confirm', description: 'Finalize check-in' },
];

type DocStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
interface DocState {
  aadhaar: DocStatus;
  studentId: DocStatus;
  photo: DocStatus;
  rejectionReasons: { aadhaar?: string; studentId?: string; photo?: string };
}

const DOC_LABELS: Record<string, string> = {
  aadhaar: 'Aadhaar Card',
  studentId: 'Student / College ID',
  photo: 'Photograph',
};

export default function CheckInWizard() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [docs, setDocs] = useState<DocState>({
    aadhaar: 'PENDING', studentId: 'PENDING', photo: 'PENDING',
    rejectionReasons: {},
  });
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [rentAmount, setRentAmount] = useState<number>(7000);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: booking, isLoading: bookingLoading } = useBooking(bookingId || '');
  const propertyId = booking?.propertyId?._id || '';
  const roomType = booking?.roomId?.roomType;

  const { data: availableBeds = [] } = useAvailableBeds(propertyId, roomType);
  const processCheckIn = useProcessCheckIn();

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

  const setDocStatus = (doc: keyof Omit<DocState, 'rejectionReasons'>, status: DocStatus) => {
    setDocs(prev => ({ ...prev, [doc]: status }));
  };

  const setRejectionReason = (doc: string, reason: string) => {
    setDocs(prev => ({ ...prev, rejectionReasons: { ...prev.rejectionReasons, [doc]: reason } }));
  };

  const allDocsDecided = docs.aadhaar !== 'PENDING' && docs.studentId !== 'PENDING' && docs.photo !== 'PENDING';
  const hasRejectedDocs = docs.aadhaar === 'REJECTED' || docs.studentId === 'REJECTED' || docs.photo === 'REJECTED';

  const effectiveBedId = selectedBedId || bed?._id;

  const handleConfirmCheckIn = async () => {
    setErrorMessage('');
    try {
      await processCheckIn.mutateAsync({
        bookingId: bookingId!,
        data: {
          bedId: effectiveBedId,
          rentAmount,
          documentVerification: {
            aadhaar: docs.aadhaar,
            studentId: docs.studentId,
            photo: docs.photo,
            rejectionReasons: docs.rejectionReasons,
          },
        },
      });
      setSuccessMessage('Check-in completed successfully!');
      setTimeout(() => navigate('/erp/tenants'), 2000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to process check-in');
    }
  };

  // Success screen
  if (successMessage) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-status-success/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-status-success" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Check-In Complete!</h2>
          <p className="text-text-muted">{successMessage}</p>
          <p className="text-text-faint text-sm mt-2">Redirecting to Tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      {/* Back */}
      <button onClick={() => navigate('/erp/tenants')} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Tenants
      </button>

      <h1 className="section-header mb-1">Process Check-In</h1>
      <p className="text-text-muted text-sm mb-6">Guided workflow — complete all steps to finalize check-in</p>

      {/* Stepper */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <Stepper steps={STEPS} currentStep={step} />
      </div>

      {/* Step Content */}
      <div className="glass-card rounded-xl p-6">

        {/* ── Step 1: Review Booking ── */}
        {step === 1 && (
          <div>
            <h2 className="text-text-primary font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center">1</span>
              Review Booking Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-surface-dark rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {getInitials(student?.name || '?')}
                  </div>
                  <div>
                    <p className="text-text-primary font-semibold">{student?.name}</p>
                    <p className="text-text-muted text-xs">{student?.email}</p>
                    <p className="text-text-faint text-xs">{student?.phone}</p>
                  </div>
                </div>

                <div className="p-3 bg-surface-dark rounded-lg space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    <span className="text-text-muted">Property:</span>
                    <span className="text-text-primary font-medium">{property?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BedDouble className="w-4 h-4 text-brand-secondary flex-shrink-0" />
                    <span className="text-text-muted">Room:</span>
                    <span className="text-text-primary font-medium">Room {room?.roomNumber} ({room?.roomType?.replace('_', ' ')})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BedDouble className="w-4 h-4 text-brand-accent flex-shrink-0" />
                    <span className="text-text-muted">Bed:</span>
                    <span className="text-text-primary font-medium">Bed {bed?.bedNumber}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-surface-dark rounded-lg">
                <p className="text-text-faint text-xs font-medium uppercase tracking-wide mb-2">Booking Info</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Booking ID</span>
                    <span className="text-text-faint font-mono text-xs">{bookingId?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">City</span>
                    <span className="text-text-primary">{property?.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Status</span>
                    <span className="text-status-warning font-semibold">PENDING</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Verify Documents ── */}
        {step === 2 && (
          <div>
            <h2 className="text-text-primary font-bold text-lg mb-1 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center">2</span>
              Document Verification
            </h2>
            <p className="text-text-muted text-sm mb-5">Review and approve or reject each required document.</p>

            <div className="space-y-3">
              {(Object.keys(DOC_LABELS) as Array<keyof typeof DOC_LABELS>).map((docKey) => {
                const status = docs[docKey as keyof Omit<DocState, 'rejectionReasons'>];
                return (
                  <div key={docKey} className={cn(
                    'border rounded-xl p-4 transition-all',
                    status === 'APPROVED' ? 'border-status-success/40 bg-status-success/5'
                      : status === 'REJECTED' ? 'border-status-error/40 bg-status-error/5'
                        : 'border-surface-border'
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-brand-primary" />
                        </div>
                        <p className="text-text-primary font-medium text-sm">{DOC_LABELS[docKey]}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDocStatus(docKey as any, 'APPROVED')}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                            status === 'APPROVED'
                              ? 'bg-status-success border-status-success text-white'
                              : 'border-status-success/40 text-status-success hover:bg-status-success hover:text-white'
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setDocStatus(docKey as any, 'REJECTED')}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                            status === 'REJECTED'
                              ? 'bg-status-error border-status-error text-white'
                              : 'border-status-error/40 text-status-error hover:bg-status-error hover:text-white'
                          )}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                    {status === 'REJECTED' && (
                      <input
                        className="input-field text-xs mt-2"
                        placeholder="Reason for rejection (will be sent to student)..."
                        value={docs.rejectionReasons[docKey as keyof typeof docs.rejectionReasons] || ''}
                        onChange={e => setRejectionReason(docKey, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {hasRejectedDocs && (
              <div className="mt-4 flex items-start gap-2 bg-status-warning/10 border border-status-warning/30 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                <p className="text-status-warning text-xs">
                  Some documents are rejected. The student will be notified. You can still proceed to assign a bed, 
                  but the student should be asked to resubmit before full clearance.
                </p>
              </div>
            )}

            {!allDocsDecided && (
              <p className="mt-3 text-text-faint text-xs">Please approve or reject all 3 documents to continue.</p>
            )}
          </div>
        )}

        {/* ── Step 3: Assign Bed ── */}
        {step === 3 && (
          <div>
            <h2 className="text-text-primary font-bold text-lg mb-1 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center">3</span>
              Confirm Bed Assignment
            </h2>
            <p className="text-text-muted text-sm mb-5">
              The booking's original bed is pre-selected. Override only if it's no longer available.
            </p>

            {/* Original bed */}
            <div className={cn(
              'border-2 rounded-xl p-4 mb-4 transition-all cursor-pointer',
              !selectedBedId ? 'border-brand-primary bg-brand-primary/5' : 'border-surface-border hover:border-brand-primary/30'
            )} onClick={() => setSelectedBedId('')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center', !selectedBedId ? 'border-brand-primary bg-brand-primary' : 'border-surface-border')}>
                    {!selectedBedId && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-text-primary font-semibold">Bed {bed?.bedNumber} (Original)</p>
                    <p className="text-text-muted text-xs">Room {room?.roomNumber} · {property?.name}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-full">Booked</span>
              </div>
            </div>

            {/* Alternative beds */}
            {availableBeds.length > 0 && (
              <>
                <p className="text-text-faint text-xs font-medium uppercase tracking-wide mb-2">
                  Override — Available Beds (Same Room Type)
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableBeds.filter((b: any) => String(b._id) !== String(bed?._id)).map((b: any) => (
                    <div
                      key={b._id}
                      className={cn(
                        'border-2 rounded-xl p-3 cursor-pointer transition-all',
                        selectedBedId === b._id ? 'border-brand-secondary bg-brand-secondary/5' : 'border-surface-border hover:border-brand-secondary/30'
                      )}
                      onClick={() => setSelectedBedId(b._id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0', selectedBedId === b._id ? 'border-brand-secondary bg-brand-secondary' : 'border-surface-border')}>
                          {selectedBedId === b._id && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <p className="text-text-primary font-medium text-sm">Bed {b.bedNumber}</p>
                          <p className="text-text-faint text-xs">Room {(b.roomId as any)?.roomNumber} · {(b.roomId as any)?.roomType?.replace('_', ' ')}</p>
                        </div>
                        <span className="ml-auto text-xs px-2 py-0.5 bg-status-success/10 text-status-success rounded-full">Available</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Rent Amount */}
            <div className="mt-4 pt-4 border-t border-surface-border">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Monthly Rent Amount (₹)</label>
              <input
                type="number"
                className="input-field max-w-xs"
                value={rentAmount}
                onChange={e => setRentAmount(Number(e.target.value))}
                min={1000}
              />
              <p className="text-text-faint text-xs mt-1">This will create the first rent record due on the 1st of next month.</p>
            </div>
          </div>
        )}

        {/* ── Step 4: Confirm ── */}
        {step === 4 && (
          <div>
            <h2 className="text-text-primary font-bold text-lg mb-1 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center">4</span>
              Confirm Check-In
            </h2>
            <p className="text-text-muted text-sm mb-5">Review the summary below before finalizing.</p>

            <div className="bg-surface-dark rounded-xl p-5 space-y-3 mb-5">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <span className="text-text-muted text-sm">Student</span>
                <span className="text-text-primary font-semibold">{student?.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <span className="text-text-muted text-sm">Property</span>
                <span className="text-text-primary">{property?.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <span className="text-text-muted text-sm">Room & Bed</span>
                <span className="text-text-primary">Room {room?.roomNumber} · Bed {
                  selectedBedId
                    ? (availableBeds.find((b: any) => b._id === selectedBedId) as any)?.bedNumber
                    : bed?.bedNumber
                }</span>
              </div>
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <span className="text-text-muted text-sm">Monthly Rent</span>
                <span className="text-text-primary font-bold">₹{rentAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">Documents</span>
                <div className="flex gap-2">
                  {Object.entries({ aadhaar: docs.aadhaar, studentId: docs.studentId, photo: docs.photo }).map(([k, v]) => (
                    <span key={k} className={cn('text-xs px-2 py-0.5 rounded-full font-medium', v === 'APPROVED' ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error')}>
                      {v === 'APPROVED' ? '✓' : '✗'} {k.charAt(0).toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
              <p className="text-brand-primary text-xs">
                This will: mark the booking as <strong>CHECKED_IN</strong>, set the bed to <strong>OCCUPIED</strong>, 
                link the student to this bed, and create the first rent record. This action is permanent.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-status-error/10 border border-status-error/30 rounded-lg p-3 mb-4 text-status-error text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/erp/tenants')}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 2 && !allDocsDecided}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleConfirmCheckIn}
            disabled={processCheckIn.isPending}
            className="px-6 py-2.5 rounded-md bg-status-success hover:bg-status-success/80 text-white font-semibold text-sm transition-all flex items-center gap-2"
          >
            {processCheckIn.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirm Check-In
          </button>
        )}
      </div>
    </div>
  );
}
