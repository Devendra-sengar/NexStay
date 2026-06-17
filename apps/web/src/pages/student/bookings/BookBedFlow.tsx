import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Check, AlertCircle, Upload, ShieldCheck, CreditCard,
  Loader2, BedDouble, FileText, UserCheck, Smartphone, Landmark,
  X, HelpCircle, CheckCircle2, ChevronRight
} from 'lucide-react';
import { usePropertyPublicDetail } from '@/hooks/useMarketplace';
import { useCreateStudentBooking, useRoomBeds } from '@/hooks/useBookings';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Room', icon: BedDouble },
  { label: 'Bed', icon: BedDouble },
  { label: 'Summary', icon: FileText },
  { label: 'Documents', icon: UserCheck },
  { label: 'Payment', icon: CreditCard },
  { label: 'Success', icon: ShieldCheck }
];

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Single Sharing',
  DOUBLE: 'Double Sharing',
  TRIPLE: 'Triple Sharing',
  FOUR_SHARING: 'Four Sharing'
};

export default function BookBedFlow() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [selectedBedNumber, setSelectedBedNumber] = useState('');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [rentAmount, setRentAmount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  // Upload States
  const [documents, setDocuments] = useState({
    aadhaar: '',
    studentId: '',
    photo: ''
  });
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({
    aadhaar: 0,
    studentId: 0,
    photo: 0
  });
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Payment Simulation
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  // Fetch Property & Rooms
  const { data: propertyData, isLoading: isPropertyLoading } = usePropertyPublicDetail(propertyId || '');
  const { data: bedsData, isLoading: isBedsLoading, refetch: refetchBeds } = useRoomBeds(selectedRoomId);
  const createBookingMutation = useCreateStudentBooking();

  if (isPropertyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!propertyData) {
    return <div className="p-4 text-center py-16 text-text-muted">Property data not found.</div>;
  }

  const { property, rooms, roomTypeGroups } = propertyData;
  const roomTypesAvailable = Object.keys(roomTypeGroups || {});

  // Document Upload Simulation
  const handleFileUpload = (field: 'aadhaar' | 'studentId' | 'photo', file: File) => {
    if (!file) return;

    // Validate size (< 5MB) and type
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB');
      return;
    }

    setUploadingField(field);
    setUploadProgress(prev => ({ ...prev, [field]: 10 }));

    // Simulate upload progress
    let progress = 10;
    const interval = setInterval(() => {
      progress += 30;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(prev => ({ ...prev, [field]: 100 }));
        setUploadingField(null);

        // Generate a mock URL for preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocuments(prev => ({ ...prev, [field]: reader.result as string }));
        };
        reader.readAsDataURL(file);
      } else {
        setUploadProgress(prev => ({ ...prev, [field]: progress }));
      }
    }, 250);
  };

  const handleRemoveFile = (field: 'aadhaar' | 'studentId' | 'photo') => {
    setDocuments(prev => ({ ...prev, [field]: '' }));
    setUploadProgress(prev => ({ ...prev, [field]: 0 }));
  };

  // Stepper validation rules
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return !!selectedRoomType && !!selectedRoomId;
      case 1:
        return !!selectedBedId;
      case 2:
        return termsAccepted;
      case 3:
        return !!guardianName && !!guardianPhone && !!documents.aadhaar && !!documents.studentId && !!documents.photo;
      case 4:
        return true; // Click to pay triggers submission
      default:
        return true;
    }
  };

  // API Booking Submission
  const handlePaymentSubmit = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    // Simulate network delay
    setTimeout(async () => {
      if (simulateFailure) {
        setPaymentError('Payment Gateway: Insufficient funds or transaction timed out. Please try again.');
        setIsProcessingPayment(false);
        return;
      }

      try {
        const response = await createBookingMutation.mutateAsync({
          propertyId: propertyId!,
          roomId: selectedRoomId,
          bedId: selectedBedId,
          guardianName,
          guardianPhone,
          documents: {
            aadhaar: documents.aadhaar.substring(0, 100), // Save small preview string/filename
            studentId: documents.studentId.substring(0, 100),
            photo: documents.photo.substring(0, 100)
          }
        });

        setBookingRef(response.paymentId || 'BK' + Math.floor(100000 + Math.random() * 900000));
        setIsProcessingPayment(false);
        setCurrentStep(5); // Proceed to success screen
      } catch (error: any) {
        setPaymentError(error?.response?.data?.message || 'Server error creating booking. Please retry.');
        setIsProcessingPayment(false);
      }
    }, 1500);
  };

  const nextStep = () => {
    if (currentStep === 0) {
      refetchBeds();
    }
    if (isStepValid()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="pb-10 pt-2 px-4">
      {/* Header */}
      {currentStep < 5 && (
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-surface-card border border-surface-border text-text-muted hover:text-text-primary transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-text-primary font-bold text-lg">Book a Bed</h1>
            <p className="text-text-faint text-xs">{property.name}</p>
          </div>
        </div>
      )}

      {/* Stepper progress indicator */}
      {currentStep < 5 && (
        <div className="mb-6 bg-surface-card border border-surface-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            {STEPS.slice(0, 5).map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < currentStep;
              const isActive = idx === currentStep;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 relative">
                  {/* Connection Line */}
                  {idx > 0 && (
                    <div className={cn(
                      'absolute h-0.5 top-4 -translate-y-1/2 left-[-50%] right-[50%] z-0 transition-colors',
                      idx <= currentStep ? 'bg-brand-primary' : 'bg-surface-border'
                    )} />
                  )}
                  {/* Step bubble */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all font-semibold text-xs border-2',
                    isCompleted ? 'bg-brand-primary border-brand-primary text-white' :
                    isActive ? 'bg-surface-dark border-brand-primary text-brand-primary' :
                    'bg-surface-dark border-surface-border text-text-faint'
                  )}>
                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={cn(
                    'text-[10px] mt-1.5 font-medium transition-colors hidden sm:block',
                    isActive ? 'text-brand-primary font-bold' : 'text-text-faint'
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP CONTENT */}
      <div className="space-y-4">
        {/* Step 1: Select Room */}
        {currentStep === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h2 className="text-text-primary font-bold text-base">Select Room Type</h2>
              <div className="grid grid-cols-1 gap-3">
                {roomTypesAvailable.map(rt => {
                  const group = roomTypeGroups[rt];
                  const minPrice = group?.minRent || 6000;
                  const totalFreeBeds = rooms
                    .filter((r: any) => r.roomType === rt)
                    .reduce((sum: number, r: any) => sum + r.availableBeds, 0);

                  return (
                    <div
                      key={rt}
                      onClick={() => {
                        setSelectedRoomType(rt);
                        setSelectedRoomId('');
                        setSelectedBedId('');
                        setRentAmount(minPrice);
                      }}
                      className={cn(
                        'border rounded-xl p-4 cursor-pointer transition-all flex justify-between items-center bg-surface-dark',
                        selectedRoomType === rt ? 'border-brand-primary ring-1 ring-brand-primary shadow-glow' : 'border-surface-border hover:border-surface-border/80'
                      )}
                    >
                      <div>
                        <p className="text-text-primary font-semibold text-sm">{ROOM_TYPE_LABELS[rt] || rt}</p>
                        <p className="text-text-faint text-xs mt-0.5">{totalFreeBeds} beds available</p>
                      </div>
                      <div className="text-right">
                        <p className="text-brand-primary font-bold text-base">{formatCurrency(minPrice)}</p>
                        <p className="text-text-faint text-[10px]">/ month</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedRoomType && (
              <div className="glass-card rounded-2xl p-5 space-y-4 animate-slide-up">
                <h2 className="text-text-primary font-bold text-base">Select Room</h2>
                <div className="grid grid-cols-2 gap-2">
                  {rooms
                    .filter((r: any) => r.roomType === selectedRoomType)
                    .map((room: any) => (
                      <div
                        key={room._id}
                        onClick={() => {
                          setSelectedRoomId(room._id);
                          setSelectedRoomNumber(room.roomNumber);
                          setSelectedBedId('');
                        }}
                        className={cn(
                          'border rounded-xl p-3 cursor-pointer text-center transition-all bg-surface-dark',
                          selectedRoomId === room._id ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-surface-border hover:border-surface-border/80',
                          room.availableBeds === 0 && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        <p className="text-text-primary font-bold text-sm">Room {room.roomNumber}</p>
                        <p className="text-text-muted text-[10px] mt-0.5">{room.availableBeds}/{room.totalBeds} beds left</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Bed */}
        {currentStep === 1 && (
          <div className="glass-card rounded-2xl p-5 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-text-primary font-bold text-base">Select a Bed</h2>
              <p className="text-text-muted text-xs mt-0.5">Choose an available bed in Room {selectedRoomNumber}</p>
            </div>

            {isBedsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
                <span className="text-xs text-text-faint">Loading beds...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {bedsData?.map((bed: any) => {
                  const isAvailable = bed.status === 'AVAILABLE';
                  const isReserved = bed.status === 'RESERVED';
                  const isOccupied = bed.status === 'OCCUPIED';
                  const isSelected = selectedBedId === bed._id;

                  return (
                    <div
                      key={bed._id}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedBedId(bed._id);
                          setSelectedBedNumber(bed.bedNumber);
                        }
                      }}
                      className={cn(
                        'border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all',
                        isSelected ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-glow scale-105' :
                        isAvailable ? 'border-status-success/30 bg-status-success/5 text-status-success cursor-pointer hover:border-status-success/60' :
                        isReserved ? 'border-status-warning/20 bg-status-warning/5 text-status-warning opacity-50 cursor-not-allowed' :
                        'border-status-error/20 bg-status-error/5 text-status-error opacity-50 cursor-not-allowed'
                      )}
                    >
                      <BedDouble className="w-5 h-5" />
                      <span className="text-xs font-bold">{bed.bedNumber}</span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold">
                        {isSelected ? 'Selected' : isAvailable ? 'Free' : isReserved ? 'Reserved' : 'Occupied'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Color Legend */}
            <div className="flex justify-between items-center bg-surface-dark border border-surface-border/50 rounded-xl p-3 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-status-success/20 border border-status-success/40" />
                <span className="text-text-muted">Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-status-warning/20 border border-status-warning/40" />
                <span className="text-text-muted">Reserved</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-status-error/20 border border-status-error/40" />
                <span className="text-text-muted">Occupied</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h2 className="text-text-primary font-bold text-base">Booking Summary</h2>
              
              <div className="space-y-2 border-b border-surface-border pb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">PG Property</span>
                  <span className="text-text-primary font-medium">{property.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Room Selected</span>
                  <span className="text-text-primary font-medium">Room {selectedRoomNumber} ({ROOM_TYPE_LABELS[selectedRoomType]})</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Bed Assigned</span>
                  <span className="text-text-primary font-medium">Bed {selectedBedNumber}</span>
                </div>
              </div>

              <div className="space-y-2 pb-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Monthly Rent</span>
                  <span className="text-text-primary font-bold">{formatCurrency(rentAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Security Deposit (Refundable)</span>
                  <span className="text-text-primary font-bold">{formatCurrency(rentAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-surface-border pt-3">
                  <span className="text-text-primary">Total Advance Due</span>
                  <span className="text-brand-primary">{formatCurrency(rentAmount * 2)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-brand-primary bg-surface-dark border-surface-border focus:ring-brand-primary"
              />
              <label htmlFor="terms" className="text-xs text-text-muted leading-relaxed cursor-pointer">
                I agree to the NexStay booking terms. I understand that the booking status will remain <span className="text-brand-primary font-bold">PENDING</span> until the property manager verifies my documents and completes the check-in process.
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Documents Upload */}
        {currentStep === 3 && (
          <div className="glass-card rounded-2xl p-5 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-text-primary font-bold text-base">Guardian Details & Documents</h2>
              <p className="text-text-muted text-xs mt-0.5">Please provide details and upload scanned copies.</p>
            </div>

            {/* Guardian Input Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-faint mb-1.5 block">Guardian Name</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="Father's/Mother's full name"
                  value={guardianName}
                  onChange={e => setGuardianName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-text-faint mb-1.5 block">Guardian Phone Number</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="10-digit mobile number"
                  value={guardianPhone}
                  onChange={e => setGuardianPhone(e.target.value)}
                />
              </div>
            </div>

            <hr className="border-surface-border/50" />

            {/* Document upload elements */}
            <div className="space-y-4">
              {(['aadhaar', 'studentId', 'photo'] as const).map(field => {
                const label = field === 'aadhaar' ? 'Aadhaar Card copy' : field === 'studentId' ? 'College Student ID' : 'Passport Photo';
                const fileSelected = documents[field];
                const isUploading = uploadingField === field;

                return (
                  <div key={field} className="border border-surface-border bg-surface-dark rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-text-primary font-semibold">{label}</p>
                        <p className="text-[10px] text-text-faint mt-0.5">JPEG, PNG, or PDF under 5MB</p>
                      </div>
                      
                      {!fileSelected && !isUploading && (
                        <label className="py-1.5 px-3 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          Upload
                          <input
                            type="file"
                            className="hidden"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={e => e.target.files?.[0] && handleFileUpload(field, e.target.files[0])}
                          />
                        </label>
                      )}

                      {fileSelected && (
                        <button onClick={() => handleRemoveFile(field)} className="p-1 rounded-md text-text-faint hover:text-status-error transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {isUploading && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-text-muted">
                          <span>Uploading...</span>
                          <span>{uploadProgress[field]}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                          <div className="h-full bg-brand-primary transition-all duration-300" style={{ width: `${uploadProgress[field]}%` }} />
                        </div>
                      </div>
                    )}

                    {fileSelected && (
                      <div className="flex items-center gap-3 bg-surface-card border border-surface-border/50 rounded-lg p-2.5">
                        {field === 'photo' || field === 'aadhaar' ? (
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-surface-dark border border-surface-border">
                            <img src={fileSelected} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-text-muted truncate">{field.toUpperCase()}_Document.png</p>
                          <span className="text-[9px] bg-status-success/10 text-status-success font-semibold px-1.5 py-0.5 rounded-full mt-0.5 inline-block">Ready to submit</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Mock Payment */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-text-primary font-bold text-base">Secure Checkout</h2>
                <p className="text-text-muted text-xs mt-0.5">All mock payments are simulated end-to-end.</p>
              </div>

              {/* Pay amount display */}
              <div className="bg-surface-dark border border-surface-border/50 rounded-xl p-4 flex justify-between items-center">
                <span className="text-xs text-text-muted font-medium">Deposit + 1st Month Rent</span>
                <span className="text-text-primary font-bold text-lg">{formatCurrency(rentAmount * 2)}</span>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                {[
                  { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)', icon: Smartphone },
                  { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
                  { id: 'NETBANKING', label: 'Net Banking', icon: Landmark }
                ].map(m => (
                  <div
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={cn(
                      'border rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 bg-surface-dark',
                      paymentMethod === m.id ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-surface-border hover:border-surface-border/80'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      paymentMethod === m.id ? 'border-brand-primary text-brand-primary' : 'border-surface-border'
                    )}>
                      {paymentMethod === m.id && <div className="w-2.5 h-2.5 bg-brand-primary rounded-full" />}
                    </div>
                    <m.icon className="w-5 h-5 text-text-muted" />
                    <span className="text-xs font-semibold text-text-primary">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {paymentError && (
              <div className="bg-status-error/10 border border-status-error/30 text-status-error rounded-2xl p-4 flex gap-3 items-start animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">Transaction Failed</p>
                  <p className="text-[11px] leading-relaxed">{paymentError}</p>
                </div>
              </div>
            )}

            {/* Simulation controls */}
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-dashed border-brand-primary/40">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-primary" />
                <div>
                  <p className="text-xs font-bold text-text-primary">Dev Simulation Mode</p>
                  <p className="text-[10px] text-text-faint">Test payment error scenario</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={e => setSimulateFailure(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-accent"></div>
              </label>
            </div>
          </div>
        )}

        {/* Step 6: Booking Success */}
        {currentStep === 5 && (
          <div className="text-center py-8 space-y-6 animate-fade-in">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-status-success rounded-full opacity-10 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-status-success/20 flex items-center justify-center border-2 border-status-success">
                <CheckCircle2 className="w-12 h-12 text-status-success" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-text-primary font-bold text-xl">Booking Requested! 🎉</h2>
              <p className="text-text-muted text-sm max-w-xs mx-auto leading-relaxed">
                Your payment was processed successfully. The booking has been submitted for document verification.
              </p>
            </div>

            {/* Info Summary Card */}
            <div className="glass-card rounded-2xl p-5 text-left space-y-3 max-w-xs mx-auto">
              <div className="flex justify-between text-xs border-b border-surface-border/50 pb-2">
                <span className="text-text-faint">Booking ID</span>
                <span className="text-text-primary font-bold tracking-wider">{bookingRef}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-faint">Property</span>
                <span className="text-text-primary font-semibold">{property.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-faint">Room & Bed</span>
                <span className="text-text-primary font-semibold">Room {selectedRoomNumber}, Bed {selectedBedNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-faint">Advance Paid</span>
                <span className="text-status-success font-bold">{formatCurrency(rentAmount * 2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <button
                onClick={() => navigate('/app/bookings')}
                className="w-full py-3 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-glow flex items-center justify-center gap-2"
              >
                View My Bookings <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/app/home')}
                className="w-full py-3 rounded-xl border border-surface-border text-text-muted font-bold text-sm bg-surface-card hover:bg-surface-card/80 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      {currentStep < 5 && (
        <div className="mt-8 flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 border border-surface-border text-text-muted font-bold text-sm rounded-xl bg-surface-card hover:bg-surface-card/85 transition-colors"
            >
              Back
            </button>
          )}

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all',
                isStepValid() ? 'bg-brand-gradient shadow-glow' : 'bg-surface-border/50 text-text-faint cursor-not-allowed'
              )}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handlePaymentSubmit}
              disabled={isProcessingPayment}
              className="flex-1 py-3 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
                </>
              ) : (
                <>
                  Pay & Complete ({formatCurrency(rentAmount * 2)})
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
