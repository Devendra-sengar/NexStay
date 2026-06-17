import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, User, Phone, Mail, Home, BedDouble, CreditCard,
  FileText, Shield, MessageSquare, LogOut, Calendar, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { useTenant } from '@/hooks/useTenants';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const TABS = ['Personal Info', 'Documents', 'Guardian', 'Stay Details', 'Rent History', 'Complaints'] as const;
type Tab = typeof TABS[number];

const DocCard = ({ label, status }: { label: string; status?: string }) => (
  <div className="glass-card rounded-xl p-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
        <FileText className="w-5 h-5 text-brand-primary" />
      </div>
      <div>
        <p className="text-text-primary font-medium text-sm">{label}</p>
        <p className="text-text-faint text-xs">Required document</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {status === 'APPROVED' ? (
        <span className="flex items-center gap-1 text-status-success text-xs font-medium">
          <CheckCircle2 className="w-4 h-4" /> Verified
        </span>
      ) : status === 'REJECTED' ? (
        <span className="flex items-center gap-1 text-status-error text-xs font-medium">
          <XCircle className="w-4 h-4" /> Rejected
        </span>
      ) : (
        <span className="flex items-center gap-1 text-status-warning text-xs font-medium">
          <Clock className="w-4 h-4" /> Pending
        </span>
      )}
      <button className="btn-ghost text-xs px-3 py-1">View</button>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
  <div className="flex items-start gap-3 py-3 border-b border-surface-border last:border-0">
    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-brand-primary" />
    </div>
    <div>
      <p className="text-text-faint text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-text-primary font-medium mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('Personal Info');

  const { data, isLoading } = useTenant(id || '');

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-text-muted">Tenant not found</p>
      </div>
    );
  }

  const { user, profile, bookings, rentRecords, complaints } = data;
  const activeBooking = bookings?.find((b: any) => b.status === 'CHECKED_IN');
  const pendingBooking = bookings?.find((b: any) => b.status === 'PENDING');

  return (
    <div className="page-container">
      {/* Back */}
      <button onClick={() => navigate('/erp/tenants')} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-4 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Tenants
      </button>

      {/* Profile Header */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-xl font-bold shadow-glow">
              {getInitials(user?.name || '?')}
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{user?.name}</h1>
              <p className="text-text-muted text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {activeBooking && <StatusBadge status="CHECKED_IN" />}
                {pendingBooking && !activeBooking && <StatusBadge status="PENDING" />}
                {!activeBooking && !pendingBooking && bookings?.length > 0 && <StatusBadge status="CHECKED_OUT" />}
                {!bookings?.length && <span className="badge bg-surface-border text-text-faint">No Booking</span>}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {pendingBooking && (
              <button
                onClick={() => navigate(`/erp/tenants/checkin/${pendingBooking._id}`)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Process Check-In
              </button>
            )}
            {activeBooking && (
              <button
                onClick={() => navigate(`/erp/tenants/checkout/${activeBooking._id}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-status-error/10 border border-status-error/30 text-status-error text-sm font-semibold hover:bg-status-error hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" /> Initiate Check-Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border mb-5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab ? 'text-brand-primary border-brand-primary' : 'text-text-muted border-transparent hover:text-text-primary'
            )}
          >
            {tab}
            {tab === 'Rent History' && rentRecords?.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-surface-border text-text-faint rounded-full px-1.5">{rentRecords.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Personal Info' && (
        <div className="glass-card rounded-xl p-5 max-w-lg">
          <InfoRow icon={User} label="Full Name" value={user?.name} />
          <InfoRow icon={Phone} label="Mobile" value={user?.phone} />
          <InfoRow icon={Mail} label="Email" value={user?.email} />
          <InfoRow icon={Shield} label="Status" value={user?.status} />
        </div>
      )}

      {activeTab === 'Documents' && (
        <div className="max-w-lg space-y-3">
          <DocCard label="Aadhaar Card" status={profile?.documents?.find((d: any) => d.type === 'AADHAAR')?.status} />
          <DocCard label="Student ID / College ID" status={profile?.documents?.find((d: any) => d.type === 'STUDENT_ID')?.status} />
          <DocCard label="Photograph" status={profile?.documents?.find((d: any) => d.type === 'PHOTO')?.status} />
        </div>
      )}

      {activeTab === 'Guardian' && (
        <div className="glass-card rounded-xl p-5 max-w-lg">
          <InfoRow icon={User} label="Guardian Name" value={profile?.guardianName} />
          <InfoRow icon={Phone} label="Guardian Phone" value={profile?.guardianPhone} />
          <InfoRow icon={User} label="Relation" value={profile?.guardianRelation} />
        </div>
      )}

      {activeTab === 'Stay Details' && (
        <div className="glass-card rounded-xl p-5 max-w-lg">
          <InfoRow icon={Home} label="Current Property" value={(profile?.currentPropertyId as any)?.name} />
          <InfoRow icon={BedDouble} label="Room" value={(profile?.currentRoomId as any)?.roomNumber ? `Room ${(profile?.currentRoomId as any)?.roomNumber}` : undefined} />
          <InfoRow icon={BedDouble} label="Bed" value={(profile?.currentBedId as any)?.bedNumber ? `Bed ${(profile?.currentBedId as any)?.bedNumber}` : undefined} />
          {activeBooking && (
            <>
              <InfoRow icon={Calendar} label="Check-In Date" value={activeBooking.createdAt ? formatDate(activeBooking.createdAt) : undefined} />
              <InfoRow icon={CreditCard} label="Monthly Rent" value={rentRecords?.[0] ? formatCurrency(rentRecords[0].amount) : undefined} />
              <InfoRow icon={Calendar} label="Next Due Date" value={rentRecords?.[0] ? formatDate(rentRecords[0].dueDate) : undefined} />
            </>
          )}
        </div>
      )}

      {activeTab === 'Rent History' && (
        <div className="glass-card rounded-xl overflow-hidden">
          {rentRecords?.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>Month</th><th>Amount</th><th>Paid</th><th>Due Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rentRecords.map((r: any) => (
                  <tr key={r._id}>
                    <td className="text-text-muted">{formatDate(r.dueDate)}</td>
                    <td className="font-medium">{formatCurrency(r.amount)}</td>
                    <td className={r.paidAmount > 0 ? 'text-status-success font-medium' : 'text-text-faint'}>{formatCurrency(r.paidAmount)}</td>
                    <td className="text-text-muted">{formatDate(r.dueDate)}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center text-text-muted">No rent records found.</div>
          )}
        </div>
      )}

      {activeTab === 'Complaints' && (
        <div className="glass-card rounded-xl overflow-hidden">
          {complaints?.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr><th>Title</th><th>Property</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {complaints.map((c: any) => (
                  <tr key={c._id}>
                    <td className="font-medium">{c.title}</td>
                    <td className="text-text-muted">{(c.propertyId as any)?.name || '—'}</td>
                    <td className="text-text-muted">{formatDate(c.createdAt)}</td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center text-text-muted">No complaints raised.</div>
          )}
        </div>
      )}

      {/* Booking History */}
      {activeTab === 'Stay Details' && bookings?.length > 1 && (
        <div className="mt-4 glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-border">
            <h3 className="text-text-primary font-semibold text-sm">Booking History</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>Property</th><th>Room</th><th>Bed</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {bookings.map((b: any) => (
                <tr key={b._id}>
                  <td>{(b.propertyId as any)?.name || '—'}</td>
                  <td>{(b.roomId as any)?.roomNumber ? `Room ${(b.roomId as any).roomNumber}` : '—'}</td>
                  <td>{(b.bedId as any)?.bedNumber ? `Bed ${(b.bedId as any).bedNumber}` : '—'}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td className="text-text-muted">{formatDate(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
