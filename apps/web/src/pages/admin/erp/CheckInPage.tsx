import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, BedDouble, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useProcessCheckIn, useAdminProperties, useErpRooms, useRoomBeds } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const getToken = () => localStorage.getItem('accessToken');
const authH = () => ({ Authorization: `Bearer ${getToken()}` });

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

  // Common stay fields
  const [stayDetails, setStayDetails] = useState({ moveInDate: new Date().toISOString().split('T')[0], monthlyRent: booking?.monthlyRent ?? 6000, securityDeposit: 0, noticePeriodDays: 30 });

  const isBookingFlow = !!bookingId && !!booking;
  const totalSteps = isBookingFlow ? 4 : 5;
  const guest = booking?.guestId as any;

  const canProceed = () => {
    if (isBookingFlow) {
      if (step === 0) return docVerified.aadhaar && docVerified.studentId && docVerified.photo;
      if (step === 1) return true;
      return true;
    } else {
      if (step === 0) return walkin.name && walkin.phone && walkin.email;
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
            {[['name','Name *'],['phone','Phone *'],['email','Email *'],['college','College'],['guardianName','Guardian Name'],['guardianPhone','Guardian Phone']].map(([field, lbl]) => (
              <div key={field}>
                <label className="form-label">{lbl}</label>
                <input className="input-field" value={(walkin as any)[field]} onChange={e => setWalkin(w => ({ ...w, [field]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}

        {!isBookingFlow && step === 1 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-text-primary mb-3">Upload Documents (URLs)</h2>
            {[['aadhaarUrl','Aadhaar Card URL'],['studentIdUrl','Student ID URL'],['photoUrl','Photo URL']].map(([field, lbl]) => (
              <div key={field}>
                <label className="form-label">{lbl}</label>
                <input className="input-field" placeholder="https://…" value={(walkinDocs as any)[field]} onChange={e => setWalkinDocs(d => ({ ...d, [field]: e.target.value }))} />
              </div>
            ))}
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
