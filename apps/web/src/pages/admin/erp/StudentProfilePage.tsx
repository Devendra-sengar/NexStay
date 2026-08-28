import { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, User, FileText, Users, Home, Receipt, MessageSquare,
  Phone, Mail, GraduationCap, MapPin, Calendar, ShieldCheck, ShieldAlert,
  Upload, Building2, BedDouble, LogOut, CreditCard, CheckCircle2, Clock, Printer, KeyRound, X, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  useErpStudentById, useStudentRent, useRecordRentPayment, 
  useResetStudentPassword, useUpdateStudentProfile, useVerifyStudentDocument,
  useRelocateTenant, useAdminProperties, useErpRooms, useRoomBeds
} from '@/lib/adminApi';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'guardian', label: 'Guardian', icon: Users },
  { id: 'stay', label: 'Stay Details', icon: Home },
  { id: 'rent', label: 'Rent History', icon: Receipt },
  { id: 'complaints', label: 'Complaints', icon: MessageSquare },
];

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">{label}</span>
      <span className="text-sm text-text-primary">{value || '—'}</span>
    </div>
  );
}

function EditableField({ label, type = 'text', value, onChange, isEditing, options }: any) {
  if (!isEditing) return <InfoRow label={label} value={type === 'date' && value ? new Date(value).toLocaleDateString('en-IN') : value} />;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">{label}</span>
      {options ? (
        <select className="input-field py-1 px-2 text-sm" value={value || ''} onChange={e => onChange(e.target.value)}>
          <option value="">Select...</option>
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} className="input-field py-1 px-2 text-sm" value={value || ''} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

function DocCard({ label, url, verified, onVerify, isEditing, onChange }: { label: string; url?: string; verified?: boolean; onVerify?: () => void; isEditing?: boolean; onChange?: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Only images and PDF accepted'); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (onChange) onChange(res.data.url);
      toast.success('File uploaded successfully');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', url ? 'bg-primary/10' : 'bg-surface-input')}>
        <FileText className={cn('w-5 h-5', url ? 'text-primary' : 'text-text-muted')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">View document ↗</a>
        ) : (
          <p className="text-xs text-text-muted">Not uploaded</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isEditing && onChange ? (
          <>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*,application/pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs btn-secondary py-1 px-2"
            >
              {uploading ? 'Uploading...' : url ? 'Change File' : 'Upload File'}
            </button>
          </>
        ) : (
          <>
            {url && onVerify && !verified && (
              <button onClick={onVerify} className="text-xs btn-primary py-1 px-2">Verify</button>
            )}
            {url && (
              <span className={cn('badge flex-shrink-0', verified ? 'badge-success' : 'badge-warning')}>
                {verified ? <><ShieldCheck className="w-3 h-3" /> Verified</> : <><ShieldAlert className="w-3 h-3" /> Pending</>}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ResetPasswordButton({ id }: { id: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const resetStudent = useResetStudentPassword();
  
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await resetStudent.mutateAsync({ id, newPassword: password });
      toast.success('Password reset successfully');
      setIsOpen(false);
      setPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-secondary mt-4 flex items-center justify-center gap-2 w-full sm:w-auto">
        <KeyRound className="w-4 h-4" /> Reset Login Password
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-surface-border flex items-center justify-between">
              <h3 className="font-bold text-text-primary">Reset Login Password</h3>
              <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleReset} className="p-5">
              <p className="text-sm text-text-muted mb-4">
                Enter a new password for this tenant. They will use this password to log into the tenant portal.
              </p>
              <div className="space-y-1 mb-5">
                <label className="text-sm font-medium text-text-primary">New Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="e.g., NexStay@123"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={resetStudent.isPending} className="btn-primary">
                  {resetStudent.isPending ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}



// ─── Rent Payment Modal ───────────────────────────────────────────────────────
function PayRentModal({ record, studentId, onClose }: { record: any; studentId: string; onClose: () => void }) {
  const [amount, setAmount] = useState(Math.max(0, record.amount + (record.fine || 0) - (record.paidAmount || 0)));
  const [method, setMethod] = useState('CASH');
  const pay = useRecordRentPayment();

  const submit = async () => {
    if (!amount || amount <= 0) { toast.error('Enter valid amount'); return; }
    try {
      await pay.mutateAsync({ id: record._id, studentId, amount, paymentMethod: method });
      toast.success('Payment recorded');
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const balance = Math.max(0, record.amount + (record.fine || 0) - (record.paidAmount || 0));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-bold mb-1">Record Payment</h3>
        <p className="text-sm text-text-muted mb-4">Month: {record.month} • Balance: ₹{balance.toLocaleString('en-IN')}</p>
        <div className="space-y-3">
          <div>
            <label className="form-label">Amount (₹)</label>
            <input type="number" className="input-field" value={amount} max={balance} onChange={e => setAmount(+e.target.value)} />
          </div>
          <div>
            <label className="form-label">Payment Method</label>
            <select className="input-field" value={method} onChange={e => setMethod(e.target.value)}>
              {['CASH','UPI','BANK_TRANSFER','CARD'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={pay.isPending}>{pay.isPending ? 'Recording…' : 'Record Payment'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Relocate Tenant Modal ───────────────────────────────────────────────────
function RelocateTenantModal({ s, onClose }: { s: any; onClose: () => void }) {
  const [propertyId, setPropertyId] = useState(s.propertyId?._id || '');
  const [roomId, setRoomId] = useState(s.room?._id || '');
  const [bedId, setBedId] = useState(s.bedId?._id || '');

  const { data: propertiesRes } = useAdminProperties();
  const properties = propertiesRes?.data || [];
  const { data: rooms } = useErpRooms(propertyId);
  const { data: beds } = useRoomBeds(roomId);

  const relocate = useRelocateTenant();

  const submit = async () => {
    if (!propertyId || !roomId || !bedId) return toast.error('Select property, room, and bed');
    if (String(bedId) === String(s.bedId?._id)) return toast.error('Select a different bed to relocate');

    try {
      await relocate.mutateAsync({ id: s._id, data: { newPropertyId: propertyId, newRoomId: roomId, newBedId: bedId } });
      toast.success('Tenant relocated successfully');
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to relocate tenant');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="font-bold text-lg text-text-primary">Relocate Tenant</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-text-muted mb-4">
          Move <strong>{s.name}</strong> to a different bed, room, or property.
        </p>

        <div className="space-y-4">
          <div>
            <label className="form-label">Property</label>
            <select className="input-field w-full" value={propertyId} onChange={(e) => { setPropertyId(e.target.value); setRoomId(''); setBedId(''); }}>
              <option value="">Select Property...</option>
              {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Room</label>
            <select className="input-field w-full" value={roomId} onChange={(e) => { setRoomId(e.target.value); setBedId(''); }} disabled={!propertyId || !rooms}>
              <option value="">Select Room...</option>
              {rooms?.map((floor: any) => (
                <optgroup key={floor._id} label={floor.name}>
                  {floor.rooms?.map((r: any) => <option key={r._id} value={r._id}>Room {r.roomNumber}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Bed</label>
            <select className="input-field w-full" value={bedId} onChange={(e) => setBedId(e.target.value)} disabled={!roomId || !beds}>
              <option value="">Select Bed...</option>
              {beds?.filter((b: any) => b.status === 'AVAILABLE' || b._id === s.bedId?._id).map((b: any) => (
                <option key={b._id} value={b._id}>{b.bedNumber} {b._id === s.bedId?._id ? '(Current)' : ''}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={relocate.isPending}>
            {relocate.isPending ? 'Relocating...' : 'Confirm Relocation'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Views ────────────────────────────────────────────────────────────────
function PersonalTab({ s }: { s: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: s.name || '',
    phone: s.phone || '',
    email: s.email || '',
    aadhaarNumber: s.aadhaarNumber || '',
    organization: s.organization || s.college || '',
    dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '',
    maritalStatus: s.maritalStatus || '',
    bloodGroup: s.bloodGroup || '',
    medicalHistory: s.medicalHistory || '',
  });

  const update = useUpdateStudentProfile();

  const handleSave = async () => {
    try {
      await update.mutateAsync({ id: s._id, data: formData });
      toast.success('Personal info updated');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
  };

  const initials = s.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary text-white text-xl font-bold flex items-center justify-center flex-shrink-0">{initials}</div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{s.name}</h2>
            <p className="text-sm text-text-muted">{s.email}</p>
          </div>
        </div>
        <div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <Edit className="w-3.5 h-3.5" /> Edit Info
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setIsEditing(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
              <button onClick={handleSave} disabled={update.isPending} className="btn-primary text-xs py-1.5 px-3">
                {update.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <EditableField label="Name" value={formData.name} onChange={(v: string) => setFormData(f => ({ ...f, name: v }))} isEditing={isEditing} />
        <EditableField label="Phone" value={formData.phone} onChange={(v: string) => setFormData(f => ({ ...f, phone: v }))} isEditing={isEditing} />
        <EditableField label="Email" value={formData.email} onChange={(v: string) => setFormData(f => ({ ...f, email: v }))} isEditing={isEditing} />
        <EditableField label="Aadhaar Number" value={formData.aadhaarNumber} onChange={(v: string) => setFormData(f => ({ ...f, aadhaarNumber: v }))} isEditing={isEditing} />
        <EditableField label="Organization / College" value={formData.organization} onChange={(v: string) => setFormData(f => ({ ...f, organization: v }))} isEditing={isEditing} />
        <EditableField label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={(v: string) => setFormData(f => ({ ...f, dateOfBirth: v }))} isEditing={isEditing} />
        <EditableField label="Marital Status" value={formData.maritalStatus} onChange={(v: string) => setFormData(f => ({ ...f, maritalStatus: v }))} isEditing={isEditing} options={['Single', 'Married', 'Divorced', 'Widowed']} />
        <EditableField label="Blood Group" value={formData.bloodGroup} onChange={(v: string) => setFormData(f => ({ ...f, bloodGroup: v }))} isEditing={isEditing} options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} />
        <div className="col-span-full">
          <EditableField label="Medical History" value={formData.medicalHistory} onChange={(v: string) => setFormData(f => ({ ...f, medicalHistory: v }))} isEditing={isEditing} />
        </div>
        <InfoRow label="Status" value={s.status} />
      </div>
      <div className="mt-6 border-t border-surface-border pt-6">
        <ResetPasswordButton id={s._id} />
      </div>
    </div>
  );
}

function DocumentsTab({ s }: { s: any }) {
  const verifyDoc = useVerifyStudentDocument();
  const update = useUpdateStudentProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    aadhaarUrl: s.aadhaarUrl || '',
    studentIdUrl: s.studentIdUrl || '',
    photoUrl: s.photoUrl || '',
  });

  const handleVerify = async (docType: 'aadhaar' | 'studentId' | 'photo') => {
    try {
      await verifyDoc.mutateAsync({ id: s._id, docType, verified: true });
      toast.success('Document verified successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Verification failed');
    }
  };

  const handleSave = async () => {
    try {
      await update.mutateAsync({ id: s._id, data: formData });
      toast.success('Documents updated successfully');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-text-primary text-sm">Tenant Documents</h3>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
            <Edit className="w-3.5 h-3.5" /> Edit Links
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditing(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
            <button onClick={handleSave} disabled={update.isPending} className="btn-primary text-xs py-1.5 px-3">
              {update.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
      
      {!isEditing ? (
        <div className="space-y-3">
          <DocCard label="Aadhaar Card" url={s.aadhaarUrl} verified={s.isAadhaarVerified} onVerify={() => handleVerify('aadhaar')} />
          <DocCard label="Tenant ID Card" url={s.studentIdUrl} verified={s.isStudentIdVerified} onVerify={() => handleVerify('studentId')} />
          <DocCard label="Passport Photo" url={s.photoUrl} verified={s.isPhotoVerified} onVerify={() => handleVerify('photo')} />
        </div>
      ) : (
        <div className="space-y-3">
          <DocCard label="Aadhaar Card" url={formData.aadhaarUrl} isEditing={true} onChange={(v: string) => setFormData(f => ({ ...f, aadhaarUrl: v }))} />
          <DocCard label="Tenant ID Card" url={formData.studentIdUrl} isEditing={true} onChange={(v: string) => setFormData(f => ({ ...f, studentIdUrl: v }))} />
          <DocCard label="Passport Photo" url={formData.photoUrl} isEditing={true} onChange={(v: string) => setFormData(f => ({ ...f, photoUrl: v }))} />
        </div>
      )}
    </div>
  );
}

function GuardianTab({ s }: { s: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    guardianName: s.guardianName || '',
    guardianPhone: s.guardianPhone || '',
    guardianAddress: s.guardianAddress || '',
    fatherName: s.fatherName || '',
    fatherContact: s.fatherContact || '',
    motherName: s.motherName || '',
    fatherOccupation: s.fatherOccupation || '',
  });

  const update = useUpdateStudentProfile();

  const handleSave = async () => {
    try {
      await update.mutateAsync({ id: s._id, data: formData });
      toast.success('Guardian info updated');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-text-primary text-sm">Family & Guardian Info</h3>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
            <Edit className="w-3.5 h-3.5" /> Edit Info
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditing(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
            <button onClick={handleSave} disabled={update.isPending} className="btn-primary text-xs py-1.5 px-3">
              {update.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <EditableField label="Guardian Name" value={formData.guardianName} onChange={(v: string) => setFormData(f => ({ ...f, guardianName: v }))} isEditing={isEditing} />
        <EditableField label="Guardian Phone" value={formData.guardianPhone} onChange={(v: string) => setFormData(f => ({ ...f, guardianPhone: v }))} isEditing={isEditing} />
        <div className="col-span-full">
          <EditableField label="Guardian Address" value={formData.guardianAddress} onChange={(v: string) => setFormData(f => ({ ...f, guardianAddress: v }))} isEditing={isEditing} />
        </div>
        <div className="col-span-full border-t border-surface-border my-2" />
        <EditableField label="Father's Name" value={formData.fatherName} onChange={(v: string) => setFormData(f => ({ ...f, fatherName: v }))} isEditing={isEditing} />
        <EditableField label="Father's Contact" value={formData.fatherContact} onChange={(v: string) => setFormData(f => ({ ...f, fatherContact: v }))} isEditing={isEditing} />
        <EditableField label="Mother's Name" value={formData.motherName} onChange={(v: string) => setFormData(f => ({ ...f, motherName: v }))} isEditing={isEditing} />
        <EditableField label="Father's Occupation" value={formData.fatherOccupation} onChange={(v: string) => setFormData(f => ({ ...f, fatherOccupation: v }))} isEditing={isEditing} />
      </div>
    </div>
  );
}

function StayTab({ s }: { s: any }) {
  const [showRelocateModal, setShowRelocateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    admissionDate: s.admissionDate ? new Date(s.admissionDate).toISOString().split('T')[0] : '',
    stayingPeriod: s.stayingPeriod || '',
    monthlyRent: s.monthlyRent || 0,
    securityDeposit: s.securityDeposit || 0,
    registrationAmount: s.registrationAmount || 0,
    vehicleNumber: s.vehicleNumber || '',
  });

  const prop = s.propertyId as any;
  const room = s.room;
  const floor = s.floor;
  const bed = s.bedId as any;

  const update = useUpdateStudentProfile();

  const handleSave = async () => {
    try {
      await update.mutateAsync({ id: s._id, data: {
        ...formData,
        monthlyRent: Number(formData.monthlyRent),
        securityDeposit: Number(formData.securityDeposit),
        registrationAmount: Number(formData.registrationAmount)
      } });
      toast.success('Stay details updated');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-text-primary text-sm">Accommodation Details</h3>
        <div className="flex gap-2">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <Edit className="w-3.5 h-3.5" /> Edit Info
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setIsEditing(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
              <button onClick={handleSave} disabled={update.isPending} className="btn-primary text-xs py-1.5 px-3">
                {update.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
          <button onClick={() => setShowRelocateModal(true)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
            <Edit className="w-3.5 h-3.5" /> Relocate / Change Bed
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow label="Property" value={prop?.name} />
        <InfoRow label="Floor" value={floor?.name} />
        <InfoRow label="Room" value={room?.roomNumber} />
        <InfoRow label="Bed" value={bed?.bedNumber} />
        
        <EditableField type="date" label="Move-In Date" value={formData.admissionDate} onChange={(v: string) => setFormData(f => ({ ...f, admissionDate: v }))} isEditing={isEditing} />
        <EditableField label="Lock-in Period (Months)" value={formData.stayingPeriod} onChange={(v: string) => setFormData(f => ({ ...f, stayingPeriod: v }))} isEditing={isEditing} />
        
        <InfoRow label="Notice Period Date" value={s.noticePeriodDate ? new Date(s.noticePeriodDate).toLocaleDateString('en-IN') : undefined} />
        <InfoRow label="Expected Exit" value={s.exitDate ? new Date(s.exitDate).toLocaleDateString('en-IN') : 'Active'} />
        
        <EditableField type="number" label="Monthly Rent (₹)" value={formData.monthlyRent} onChange={(v: string) => setFormData(f => ({ ...f, monthlyRent: Number(v) }))} isEditing={isEditing} />
        <EditableField type="number" label="Security Deposit (₹)" value={formData.securityDeposit} onChange={(v: string) => setFormData(f => ({ ...f, securityDeposit: Number(v) }))} isEditing={isEditing} />
        <EditableField type="number" label="Registration Amount (₹)" value={formData.registrationAmount} onChange={(v: string) => setFormData(f => ({ ...f, registrationAmount: Number(v) }))} isEditing={isEditing} />
        <EditableField label="Vehicle Number" value={formData.vehicleNumber} onChange={(v: string) => setFormData(f => ({ ...f, vehicleNumber: v }))} isEditing={isEditing} />
      </div>
      {showRelocateModal && <RelocateTenantModal s={s} onClose={() => setShowRelocateModal(false)} />}
    </div>
  );
}

function RentTab({ studentId }: { studentId: string }) {
  const { data: records, isLoading } = useStudentRent(studentId);
  const [payModal, setPayModal] = useState<any>(null);

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>;
  if (!records?.length) return <p className="text-sm text-text-muted py-4">No rent records yet.</p>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>{['Month','Amount','Fine','Total','Paid','Balance','Status','Paid Date','Action'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {records.map((r: any) => {
              const total = r.amount + (r.fine || 0);
              const balance = Math.max(0, total - (r.paidAmount || 0));
              return (
                <tr key={r._id}>
                  <td className="py-3 px-4 border-b border-surface-border font-medium text-sm">{r.month}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm">₹{r.amount?.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm">{r.fine ? `₹${r.fine}` : '—'}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm">₹{total?.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm text-emerald-600">₹{(r.paidAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm text-danger">₹{balance.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 border-b border-surface-border">
                    <span className={cn('badge', r.status === 'PAID' ? 'badge-success' : r.status === 'PARTIAL' ? 'badge-warning' : 'badge-danger')}>{r.status}</span>
                  </td>
                  <td className="py-3 px-4 border-b border-surface-border text-sm text-text-muted">
                    {r.paidAt ? new Date(r.paidAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="py-3 px-4 border-b border-surface-border">
                    {r.status !== 'PAID' && (
                      <button onClick={() => setPayModal(r)} className="text-xs btn-primary py-1 px-2.5">Pay</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {payModal && <PayRentModal record={payModal} studentId={studentId} onClose={() => setPayModal(null)} />}
    </>
  );
}

function ComplaintsTab({ complaints }: { complaints: any[] }) {
  if (!complaints?.length) return <p className="text-sm text-text-muted py-4">No complaints raised.</p>;
  return (
    <div className="space-y-3">
      {complaints.map((c: any) => (
        <div key={c._id} className="card p-4 flex items-start gap-3">
          <MessageSquare className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-sm font-medium text-text-primary">{c.title}</p>
              <span className={cn('badge text-xs', c.status === 'RESOLVED' ? 'badge-success' : c.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-danger')}>{c.status}</span>
            </div>
            <p className="text-xs text-text-muted">{c.category} • {new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
            <p className="text-xs text-text-secondary mt-1">{c.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isWarden = pathname.startsWith('/warden');
  const [activeTab, setActiveTab] = useState('personal');

  const { data: student, isLoading } = useErpStudentById(id);

  if (isLoading) return (
    <div className="page-container space-y-4">
      <div className="skeleton h-10 w-48 rounded-lg" />
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );

  if (!student) return (
    <div className="page-container text-center py-20">
      <p className="text-text-muted">Tenant not found.</p>
      <button className="btn-primary mt-4" onClick={() => navigate(isWarden ? '/warden/students' : '/admin/tenants')}>Back to Tenants</button>
    </div>
  );

  return (
    <div className="page-container max-w-5xl">
      {/* Breadcrumb */}
      <button onClick={() => navigate(isWarden ? '/warden/students' : '/admin/tenants')} className="flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to Tenants
      </button>

      {/* Hero card */}
      <div className="card p-5 mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white text-xl font-bold flex items-center justify-center flex-shrink-0">
            {student.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{student.name}</h1>
            <p className="text-sm text-text-muted">{student.phone} • {student.organization || student.college || 'No organization'}</p>
            <span className={cn('badge mt-1 text-xs', student.status === 'ACTIVE' ? 'badge-success' : 'badge-gray')}>{student.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Edit Tenant button removed as requested, now inline per tab */}
          <button
            onClick={() => navigate(isWarden ? `/warden/print/${student._id}` : `/admin/print-preview/${student._id}`)}
            className="btn-secondary flex items-center gap-2 bg-surface text-text-primary hover:bg-surface-input"
          >
            <Printer className="w-4 h-4" />Print Registration
          </button>
          {student.status === 'ACTIVE' && (
            <button
              onClick={() => navigate(isWarden ? `/warden/students/checkout/${student._id}` : `/admin/checkout/${student._id}`)}
              className="btn-danger flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />Process Check-Out
            </button>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="card mb-5">
        <div className="flex overflow-x-auto no-scrollbar border-b border-surface-border">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button
              key={tid}
              onClick={() => setActiveTab(tid)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                activeTab === tid
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-input'
              )}
            >
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'personal'   && <PersonalTab s={student} />}
          {activeTab === 'documents'  && <DocumentsTab s={student} />}
          {activeTab === 'guardian'   && <GuardianTab s={student} />}
          {activeTab === 'stay'       && <StayTab s={student} />}
          {activeTab === 'rent'       && <RentTab studentId={student._id} />}
          {activeTab === 'complaints' && <ComplaintsTab complaints={student.complaints ?? []} />}
        </div>
      </div>
    </div>
  );
}
