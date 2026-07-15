import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Phone, Mail, MapPin, Calendar, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStaffById, useToggleStaffStatus } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const ROLE_ICONS: Record<string,string> = { WARDEN:'■', COOK:'◆', CLEANER:'✦', SECURITY:'●', MESS_MANAGER:'◊', OTHER:'◎' };

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string; icon?: any }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-surface-border last:border-0">
      {Icon && <Icon className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />}
      <div><p className="text-xs text-text-muted font-medium">{label}</p><p className="text-sm text-text-primary font-medium mt-0.5">{value || '—'}</p></div>
    </div>
  );
}

export default function StaffProfilePage() {
  const { id } = useParams<{id:string}>();
  const navigate = useNavigate();
  const { data: staff, isLoading } = useStaffById(id);
  const toggle = useToggleStaffStatus();

  if (isLoading) return <div className="page-container space-y-4"><div className="skeleton h-40 rounded-xl"/><div className="skeleton h-60 rounded-xl"/></div>;
  if (!staff) return <div className="page-container text-center py-20"><p className="text-text-muted">Staff member not found.</p><button className="btn-primary mt-4" onClick={()=>navigate('/admin/staff')}>Back</button></div>;

  const handleToggle = async () => {
    try { await toggle.mutateAsync(staff._id); toast.success(staff.isActive ? 'Deactivated' : 'Reactivated'); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="page-container max-w-3xl">
      <button onClick={()=>navigate('/admin/staff')} className="flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors"><ArrowLeft className="w-4 h-4"/>Back to Staff</button>

      {/* Hero */}
      <div className="card p-6 mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {staff.photoUrl
            ? <img src={staff.photoUrl} alt={staff.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"/>
            : <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary text-2xl font-bold flex items-center justify-center flex-shrink-0">{staff.name[0]}</div>}
          <div>
            <h1 className="text-xl font-bold text-text-primary">{staff.name}</h1>
            <p className="text-sm text-text-muted">{ROLE_ICONS[staff.role]} {staff.role} • {(staff.propertyId as any)?.name}</p>
            <span className={cn('badge mt-1', staff.isActive ? 'badge-success' : 'badge-gray')}>{staff.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
        </div>
        <button onClick={handleToggle} disabled={toggle.isPending} className={cn('btn-secondary', !staff.isActive && 'border-emerald-500 text-emerald-600 hover:bg-emerald-50')}>
          {staff.isActive ? 'Deactivate' : 'Reactivate'}
        </button>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <p className="text-sm font-semibold text-text-primary mb-2">Contact Details</p>
          <InfoRow label="Phone" value={staff.phone} icon={Phone}/>
          <InfoRow label="Email" value={staff.email} icon={Mail}/>
          <InfoRow label="Address" value={staff.address} icon={MapPin}/>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-text-primary mb-2">Employment</p>
          <InfoRow label="Joining Date" value={staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString('en-IN') : undefined} icon={Calendar}/>
          <InfoRow label="Monthly Salary" value={`₹${staff.salary?.toLocaleString('en-IN')}`} icon={Banknote}/>
          {staff.notes && <InfoRow label="Notes" value={staff.notes}/>}
        </div>
      </div>

      {/* Attendance Coming Soon */}
      <div className="card p-8 text-center border-2 border-dashed border-surface-border">
        <div className="w-12 h-12 rounded-2xl bg-surface-input flex items-center justify-center mx-auto mb-3"><Lock className="w-6 h-6 text-text-muted"/></div>
        <p className="font-semibold text-text-primary mb-1">Attendance & Shifts</p>
        <p className="text-sm text-text-muted">This feature is coming in the next update. Track shift schedules, daily attendance, and overtime records.</p>
        <span className="inline-block mt-3 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">Coming Soon</span>
      </div>
    </div>
  );
}
