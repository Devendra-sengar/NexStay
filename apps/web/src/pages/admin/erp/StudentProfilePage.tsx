import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, FileText, Users, Home, Receipt, MessageSquare,
  Phone, Mail, GraduationCap, MapPin, Calendar, ShieldCheck, ShieldAlert,
  Upload, Building2, BedDouble, LogOut, CreditCard, CheckCircle2, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useErpStudentById, useStudentRent, useRecordRentPayment } from '@/lib/adminApi';
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

function DocCard({ label, url, verified }: { label: string; url?: string; verified?: boolean }) {
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
      {url && (
        <span className={cn('badge flex-shrink-0', verified ? 'badge-success' : 'badge-warning')}>
          {verified ? <><ShieldCheck className="w-3 h-3" /> Verified</> : <><ShieldAlert className="w-3 h-3" /> Pending</>}
        </span>
      )}
    </div>
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

// ─── Tab Views ────────────────────────────────────────────────────────────────
function PersonalTab({ s }: { s: any }) {
  const initials = s.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary text-white text-xl font-bold flex items-center justify-center flex-shrink-0">{initials}</div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{s.name}</h2>
          <p className="text-sm text-text-muted">{s.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow label="Phone" value={s.phone} />
        <InfoRow label="Email" value={s.email} />
        <InfoRow label="College" value={s.college} />
        <InfoRow label="Status" value={s.status} />
      </div>
    </div>
  );
}

function DocumentsTab({ s }: { s: any }) {
  const verified = s.bookingId?.documentsVerified;
  return (
    <div className="space-y-3">
      <DocCard label="Aadhaar Card" url={s.aadhaarUrl} verified={!!verified} />
      <DocCard label="Student ID Card" url={s.studentIdUrl} verified={!!verified} />
      <DocCard label="Passport Photo" url={s.photoUrl} verified={!!verified} />
    </div>
  );
}

function GuardianTab({ s }: { s: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InfoRow label="Guardian Name" value={s.guardianName} />
      <InfoRow label="Guardian Phone" value={s.guardianPhone} />
    </div>
  );
}

function StayTab({ s }: { s: any }) {
  const prop = s.propertyId as any;
  const room = s.room;
  const floor = s.floor;
  const bed = s.bedId as any;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow label="Property" value={prop?.name} />
        <InfoRow label="Floor" value={floor?.name} />
        <InfoRow label="Room" value={room?.roomNumber} />
        <InfoRow label="Bed" value={bed?.bedNumber} />
        <InfoRow label="Move-In Date" value={s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-IN') : undefined} />
        <InfoRow label="Notice Period Date" value={s.noticePeriodDate ? new Date(s.noticePeriodDate).toLocaleDateString('en-IN') : undefined} />
        <InfoRow label="Expected Exit" value={s.exitDate ? new Date(s.exitDate).toLocaleDateString('en-IN') : 'Active'} />
        <InfoRow label="Monthly Rent" value={`₹${s.monthlyRent?.toLocaleString('en-IN')}`} />
        <InfoRow label="Security Deposit" value={`₹${s.securityDeposit?.toLocaleString('en-IN') ?? 0}`} />
        <InfoRow label="Deposit Status" value="Held" />
      </div>
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
      <p className="text-text-muted">Student not found.</p>
      <button className="btn-primary mt-4" onClick={() => navigate('/admin/tenants')}>Back to Students</button>
    </div>
  );

  return (
    <div className="page-container max-w-5xl">
      {/* Breadcrumb */}
      <button onClick={() => navigate('/admin/tenants')} className="flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to Students
      </button>

      {/* Hero card */}
      <div className="card p-5 mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white text-xl font-bold flex items-center justify-center flex-shrink-0">
            {student.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{student.name}</h1>
            <p className="text-sm text-text-muted">{student.phone} • {student.college || 'No college'}</p>
            <span className={cn('badge mt-1 text-xs', student.status === 'ACTIVE' ? 'badge-success' : 'badge-gray')}>{student.status}</span>
          </div>
        </div>
        {student.status === 'ACTIVE' && (
          <button
            onClick={() => navigate(`/admin/checkout/${student._id}`)}
            className="btn-danger flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />Process Check-Out
          </button>
        )}
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
