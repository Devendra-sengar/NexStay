import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, BedDouble, Upload, Loader2, CheckCircle2, AlertCircle, X, FileImage } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import api from '@/lib/api';
import { useProcessCheckIn, useAdminProperties, useErpRooms, useRoomBeds } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const getToken = () => localStorage.getItem('accessToken');
const authH = () => ({ Authorization: `Bearer ${getToken()}` });

// ─── Single Document Upload Component ────────────────────────────────────────
function DocUpload({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Only images and PDF accepted'); return;
    }
    if (file.size > 5 * 1024 * 1024) { setError('Max file size is 5MB'); return; }
    setError(''); setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.url);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="form-label">{label}</label>
      {value ? (
        /* ── Uploaded Preview ── */
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <img src={value} alt={label} className="w-14 h-10 object-cover rounded-lg border border-emerald-200 flex-shrink-0"
            onError={e => { (e.target as any).style.display = 'none'; }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
            </p>
            <a href={value} target="_blank" rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:underline truncate block">View document ↗</a>
          </div>
          <button type="button" onClick={() => onChange('')}
            className="w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center flex-shrink-0 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* ── Upload Zone ── */
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
            isDragging ? 'border-primary bg-primary/5' : 'border-surface-border hover:border-primary/50 hover:bg-surface-input',
            uploading && 'pointer-events-none opacity-70'
          )}
        >
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFileChange} />
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', isDragging ? 'bg-primary text-white' : 'bg-surface-border text-text-muted')}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {uploading ? 'Uploading…' : isDragging ? 'Drop here!' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-text-muted">Image or PDF · Max 5MB</p>
          </div>
          {!uploading && <FileImage className="w-4 h-4 text-text-muted ml-auto" />}
        </div>
      )}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>
      )}
    </div>
  );
}

function useSingleBooking(id?: string) {
  return useQuery({
    queryKey: ['single-booking', id],
    queryFn: async () => {
      const { data } = await axios({ url: `/api/hostel-admin/bookings`, headers: authH(), params: { page: 1, limit: 50 } });
      return (data.data as any[]).find((b: any) => b._id === id) ?? null;
    },
    enabled: !!id,
  });
}

// ─── Step indicator ───────────────────────────────────────────────────────────
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

// ─── BedPicker (for walk-in Step 3) ──────────────────────────────────────────
function BedPicker({ value, onChange }: { value: string; onChange: (bedId: string, propertyId: string) => void }) {
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data ?? [];
  const [propId, setPropId] = useState('');
  const [floorIdx, setFloorIdx] = useState(0);
  const [selRoom, setSelRoom] = useState<string | undefined>();

  const { data: floors } = useErpRooms(propId);
  const { data: beds } = useRoomBeds(selRoom);

  const currentFloor = floors?.[floorIdx];

  return (
    <div className="space-y-4">
      <div>
        <label className="form-label">Property</label>
        <select className="input-field" value={propId} onChange={e => { setPropId(e.target.value); setFloorIdx(0); setSelRoom(undefined); }}>
          <option value="">Select property…</option>
          {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>
      {floors && floors.length > 0 && (
        <>
          <div className="flex gap-2 flex-wrap">
            {floors.map((f: any, i: number) => (
              <button key={f._id} onClick={() => { setFloorIdx(i); setSelRoom(undefined); }}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all', i === floorIdx ? 'bg-primary text-white border-primary' : 'bg-white border-surface-border text-text-secondary')}>
                {f.name}
              </button>
            ))}
          </div>
          {currentFloor?.rooms?.map((room: any) => (
            <div key={room._id}>
              <button onClick={() => setSelRoom(selRoom === room._id ? undefined : room._id)}
                className={cn('w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition-all mb-2', selRoom === room._id ? 'border-primary bg-primary/5' : 'border-surface-border hover:bg-surface-input')}>
                Room {room.roomNumber} — {room.availableBeds}/{room.totalBeds} available
              </button>
              {selRoom === room._id && beds && (
                <div className="flex flex-wrap gap-2 pl-3 mb-2">
                  {beds.map((bed: any) => (
                    <button key={bed._id}
                      onClick={() => bed.status === 'AVAILABLE' && onChange(bed._id, propId)}
                      disabled={bed.status !== 'AVAILABLE'}
                      className={cn('px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all',
                        value === bed._id ? 'bg-primary text-white border-primary' :
                        bed.status === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' :
                        bed.status === 'OCCUPIED' ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed' :
                        'bg-amber-50 border-amber-200 text-amber-400 cursor-not-allowed')}>
                      {bed.bedNumber} ({bed.status})
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CheckInPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId');

  const { data: booking } = useSingleBooking(bookingId ?? undefined);
  const checkIn = useProcessCheckIn();
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);

  // Booking-linked fields
  const [docVerified, setDocVerified] = useState({ aadhaar: false, studentId: false, photo: false });

  // Walk-in fields
  const [walkin, setWalkin] = useState({ name: '', phone: '', email: '', college: '', guardianName: '', guardianPhone: '' });
  const [walkinDocs, setWalkinDocs] = useState({ aadhaarUrl: '', studentIdUrl: '', photoUrl: '' });
  const [selectedBedId, setSelectedBedId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [guardianPhoneError, setGuardianPhoneError] = useState('');

  // Common stay fields
  const [stayDetails, setStayDetails] = useState({ moveInDate: new Date().toISOString().split('T')[0], monthlyRent: booking?.monthlyRent ?? 6000, securityDeposit: 0, noticePeriodDays: 30 });

  const isBookingFlow = !!bookingId && !!booking;
  const totalSteps = isBookingFlow ? 4 : 5;
  const guest = booking?.guestId as any;

  const isPhoneValid = walkin.phone.replace(/\D/g, '').length === 10;
  const isGuardianPhoneValid = !walkin.guardianPhone || walkin.guardianPhone.replace(/\D/g, '').length === 10;
  const allDocsUploaded = !!walkinDocs.aadhaarUrl && !!walkinDocs.studentIdUrl && !!walkinDocs.photoUrl;

  const canProceed = () => {
    if (isBookingFlow) {
      if (step === 0) return docVerified.aadhaar && docVerified.studentId && docVerified.photo;
      if (step === 1) return true;
      return true;
    } else {
      if (step === 0) return walkin.name.trim() && isPhoneValid && walkin.email.trim() && isGuardianPhoneValid;
      if (step === 1) return allDocsUploaded; // ← ALL 3 docs required
      if (step === 2) return !!selectedBedId;
      return true;
    }
  };

  const handleComplete = async () => {
    try {
      const payload = isBookingFlow
        ? { bookingId: booking._id, bedId: String(booking.bedId?._id ?? booking.bedId), propertyId: String(booking.propertyId?._id ?? booking.propertyId), ...stayDetails }
        : { ...walkin, ...walkinDocs, bedId: selectedBedId, propertyId: selectedPropertyId, ...stayDetails };

      const res = await checkIn.mutateAsync(payload);
      setSuccess(res.data?.message ?? 'Check-In complete!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Check-in failed');
    }
  };

  if (success) return (
    <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">Check-In Complete!</h2>
      <p className="text-text-secondary mb-6">{success}</p>
      <div className="flex gap-3">
        <button className="btn-secondary" onClick={() => navigate('/admin/tenants')}>View Students</button>
        <button className="btn-primary" onClick={() => navigate('/admin/rooms')}>View BedGrid</button>
      </div>
    </div>
  );

  const stepLabels = isBookingFlow
    ? ['Verify Documents', 'Confirm Bed', 'Stay Details', 'Confirm']
    : ['Student Info', 'Documents', 'Select Bed', 'Stay Details', 'Confirm'];

  return (
    <div className="page-container max-w-2xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </button>
      <h1 className="text-2xl font-bold mb-2">{isBookingFlow ? 'Process Check-In' : 'Walk-In Check-In'}</h1>
      <p className="text-sm text-text-muted mb-6">Step {step + 1} of {totalSteps} — {stepLabels[step]}</p>

      <StepBar current={step} total={totalSteps} />

      <div className="card p-6">
        {/* ── BOOKING FLOW ── */}
        {isBookingFlow && step === 0 && (
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Verify Documents</h2>
            <p className="text-sm text-text-muted mb-4">{guest?.name} • {guest?.phone}</p>
            <div className="space-y-3">
              {[
                { key: 'aadhaar', label: 'Aadhaar Card', url: booking.aadhaarUrl },
                { key: 'studentId', label: 'Student ID', url: booking.studentIdUrl },
                { key: 'photo', label: 'Photo', url: booking.photoUrl },
              ].map(({ key, label, url }) => (
                <div key={key} className="flex items-center justify-between p-3 border border-surface-border rounded-xl">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View ↗</a>
                      : <p className="text-xs text-text-muted">Not uploaded</p>}
                  </div>
                  <button
                    onClick={() => setDocVerified(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2',
                      (docVerified as any)[key] ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-white border-surface-border text-text-muted hover:border-primary')}>
                    {(docVerified as any)[key] ? '✓ Verified' : 'Mark Verified'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isBookingFlow && step === 1 && (
          <div>
            <h2 className="font-semibold text-text-primary mb-1">Confirm Bed Assignment</h2>
            <p className="text-sm text-text-muted mb-4">Pre-assigned bed for this booking</p>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <BedDouble className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Bed: {(booking.bedId as any)?.bedNumber ?? '—'}</p>
                <p className="text-xs text-emerald-600">Room {(booking.roomId as any)?.roomNumber} • {(booking.propertyId as any)?.name}</p>
              </div>
            </div>
          </div>
        )}

        {isBookingFlow && step === 2 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-text-primary mb-3">Stay Details</h2>
            <div><label className="form-label">Move-In Date</label><input type="date" className="input-field" value={stayDetails.moveInDate} onChange={e => setStayDetails(s => ({ ...s, moveInDate: e.target.value }))} /></div>
            <div><label className="form-label">Monthly Rent (₹)</label><input type="number" className="input-field" value={stayDetails.monthlyRent} onChange={e => setStayDetails(s => ({ ...s, monthlyRent: +e.target.value }))} /></div>
            <div><label className="form-label">Security Deposit (₹)</label><input type="number" className="input-field" value={stayDetails.securityDeposit} onChange={e => setStayDetails(s => ({ ...s, securityDeposit: +e.target.value }))} /></div>
            <div><label className="form-label">Notice Period (days)</label><input type="number" className="input-field" value={stayDetails.noticePeriodDays} onChange={e => setStayDetails(s => ({ ...s, noticePeriodDays: +e.target.value }))} /></div>
          </div>
        )}

        {isBookingFlow && step === 3 && (
          <div>
            <h2 className="font-semibold text-text-primary mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Student</span><span className="font-medium">{guest?.name}</span></div>
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Bed</span><span className="font-medium">{(booking.bedId as any)?.bedNumber}</span></div>
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Move-In</span><span className="font-medium">{stayDetails.moveInDate}</span></div>
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Monthly Rent</span><span className="font-medium">₹{stayDetails.monthlyRent?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between py-2"><span className="text-text-muted">Security Deposit</span><span className="font-medium">₹{stayDetails.securityDeposit?.toLocaleString('en-IN')}</span></div>
            </div>
          </div>
        )}

        {/* ── WALK-IN FLOW ── */}
        {!isBookingFlow && step === 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-text-primary mb-3">Student Information</h2>
            {([
              ['name', 'Name *', 'text'],
              ['email', 'Email *', 'email'],
              ['college', 'College', 'text'],
              ['guardianName', 'Guardian Name', 'text'],
            ] as [string, string, string][]).map(([field, lbl, type]) => (
              <div key={field}>
                <label className="form-label">{lbl}</label>
                <input
                  type={type}
                  className="input-field"
                  value={(walkin as any)[field]}
                  onChange={e => setWalkin(w => ({ ...w, [field]: e.target.value }))}
                />
              </div>
            ))}
            {/* Student Phone */}
            <div>
              <label className="form-label">Phone * <span className="text-text-muted font-normal">(10 digits)</span></label>
              <input
                type="tel"
                className={cn('input-field', phoneError && 'border-red-400 focus:border-red-500')}
                value={walkin.phone}
                maxLength={10}
                inputMode="numeric"
                placeholder="e.g. 9876543210"
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setWalkin(w => ({ ...w, phone: val }));
                  if (val.length > 0 && val.length !== 10) {
                    setPhoneError('Phone number must be exactly 10 digits');
                  } else {
                    setPhoneError('');
                  }
                }}
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {phoneError}
                </p>
              )}
              {walkin.phone.length === 10 && !phoneError && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid phone number
                </p>
              )}
            </div>
            {/* Guardian Phone — compulsory, 10 digits */}
            <div>
              <label className="form-label">Guardian Phone * <span className="text-text-muted font-normal">(10 digits required)</span></label>
              <input
                type="tel"
                className={cn('input-field', guardianPhoneError && 'border-red-400 focus:border-red-500')}
                value={walkin.guardianPhone}
                maxLength={10}
                inputMode="numeric"
                placeholder="e.g. 9876543210"
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setWalkin(w => ({ ...w, guardianPhone: val }));
                  if (val.length > 0 && val.length !== 10) {
                    setGuardianPhoneError('Guardian phone must be exactly 10 digits');
                  } else {
                    setGuardianPhoneError('');
                  }
                }}
              />
              {guardianPhoneError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {guardianPhoneError}
                </p>
              )}
              {walkin.guardianPhone.length === 10 && !guardianPhoneError && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid guardian phone
                </p>
              )}
            </div>
          </div>
        )}

        {!isBookingFlow && step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-text-primary mb-1">Upload Documents</h2>
              <p className="text-xs text-text-muted mb-1">All 3 documents are <strong>compulsory</strong>. Next is enabled only after all are uploaded.</p>
              {/* Status badges */}
              <div className="flex gap-2 mt-2 mb-4 flex-wrap">
                {([['Aadhaar', walkinDocs.aadhaarUrl], ['Student ID', walkinDocs.studentIdUrl], ['Photo', walkinDocs.photoUrl]] as [string,string][]).map(([label, url]) => (
                  <span key={label} className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
                    url ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-400 border border-red-200')}>
                    {url ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <DocUpload label="Aadhaar Card *" value={walkinDocs.aadhaarUrl} onChange={url => setWalkinDocs(d => ({ ...d, aadhaarUrl: url }))} />
            <DocUpload label="Student ID *" value={walkinDocs.studentIdUrl} onChange={url => setWalkinDocs(d => ({ ...d, studentIdUrl: url }))} />
            <DocUpload label="Photo *" value={walkinDocs.photoUrl} onChange={url => setWalkinDocs(d => ({ ...d, photoUrl: url }))} />
            {!allDocsUploaded && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Upload all 3 documents to proceed to the next step.
              </p>
            )}
          </div>
        )}

        {!isBookingFlow && step === 2 && (
          <div>
            <h2 className="font-semibold text-text-primary mb-3">Select Bed</h2>
            <BedPicker value={selectedBedId} onChange={(bid, pid) => { setSelectedBedId(bid); setSelectedPropertyId(pid); }} />
            {selectedBedId && <p className="mt-3 text-sm text-emerald-600 font-medium">✓ Bed selected</p>}
          </div>
        )}

        {!isBookingFlow && step === 3 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-text-primary mb-3">Stay Details</h2>
            <div><label className="form-label">Move-In Date</label><input type="date" className="input-field" value={stayDetails.moveInDate} onChange={e => setStayDetails(s => ({ ...s, moveInDate: e.target.value }))} /></div>
            <div><label className="form-label">Monthly Rent (₹)</label><input type="number" className="input-field" value={stayDetails.monthlyRent} onChange={e => setStayDetails(s => ({ ...s, monthlyRent: +e.target.value }))} /></div>
            <div><label className="form-label">Security Deposit (₹)</label><input type="number" className="input-field" value={stayDetails.securityDeposit} onChange={e => setStayDetails(s => ({ ...s, securityDeposit: +e.target.value }))} /></div>
            <div><label className="form-label">Notice Period (days)</label><input type="number" className="input-field" value={stayDetails.noticePeriodDays} onChange={e => setStayDetails(s => ({ ...s, noticePeriodDays: +e.target.value }))} /></div>
          </div>
        )}

        {!isBookingFlow && step === 4 && (
          <div>
            <h2 className="font-semibold text-text-primary mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Name</span><span className="font-medium">{walkin.name}</span></div>
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Phone</span><span className="font-medium">{walkin.phone}</span></div>
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Move-In</span><span className="font-medium">{stayDetails.moveInDate}</span></div>
              <div className="flex justify-between py-2 border-b border-surface-border"><span className="text-text-muted">Monthly Rent</span><span className="font-medium">₹{stayDetails.monthlyRent?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between py-2"><span className="text-text-muted">Security Deposit</span><span className="font-medium">₹{stayDetails.securityDeposit?.toLocaleString('en-IN')}</span></div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>}
          {step < totalSteps - 1 ? (
            <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
              Next<ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button className="btn-primary flex-1" onClick={handleComplete} disabled={checkIn.isPending}>
              {checkIn.isPending ? 'Processing…' : '✓ Complete Check-In'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
