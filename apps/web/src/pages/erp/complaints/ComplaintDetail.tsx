import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, User, Building2, Calendar, CheckCircle2,
  Zap, UtensilsCrossed, Wifi, Droplets, Sparkles, ChevronDown, AlertCircle
} from 'lucide-react';
import { useComplaint, useUpdateComplaintStatus, useAssignComplaint, usePropertyManagers } from '@/hooks/useComplaints';
import { Timeline } from '@/components/erp/Timeline';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  ELECTRICITY: { icon: Zap,             color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Electricity' },
  FOOD:        { icon: UtensilsCrossed, color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Food'        },
  INTERNET:    { icon: Wifi,            color: 'text-blue-400',   bg: 'bg-blue-400/10',   label: 'Internet'    },
  WATER:       { icon: Droplets,        color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   label: 'Water'       },
  CLEANING:    { icon: Sparkles,        color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Cleaning'    },
};

const STATUS_FLOW = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const STATUS_BUTTON_STYLE: Record<string, string> = {
  OPEN:        'bg-status-warning/10 border-status-warning/40 text-status-warning hover:bg-status-warning hover:text-white',
  IN_PROGRESS: 'bg-brand-primary/10 border-brand-primary/40 text-brand-primary hover:bg-brand-primary hover:text-white',
  RESOLVED:    'bg-status-success/10 border-status-success/40 text-status-success hover:bg-status-success hover:text-white',
  CLOSED:      'bg-surface-dark border-surface-border text-text-muted hover:bg-surface-border',
};

export default function OwnerComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [toast, setToast] = useState('');

  const { data: complaint, isLoading } = useComplaint(id || '');
  const { data: managers = [] } = usePropertyManagers();
  const updateStatus = useUpdateComplaintStatus();
  const assignComplaint = useAssignComplaint();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: id!, status: newStatus, note: note || undefined });
      setNote('');
      showToast(`Status updated to ${newStatus.replace('_', ' ')} ✅`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssign = async (managerId: string) => {
    try {
      await assignComplaint.mutateAsync({ id: id!, assignedTo: managerId || null });
      setAssignedTo(managerId);
      showToast('Complaint assigned ✅');
    } catch {
      showToast('Failed to assign');
    }
  };

  if (isLoading) {
    return <div className="page-container flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 text-brand-primary animate-spin" /></div>;
  }

  if (!complaint) {
    return <div className="page-container text-center py-20"><p className="text-text-muted">Complaint not found</p></div>;
  }

  const student = complaint.studentId as any;
  const property = complaint.propertyId as any;
  const catConfig = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.ELECTRICITY;
  const CatIcon = catConfig.icon;

  const currentStatusIdx = STATUS_FLOW.indexOf(complaint.status as any);
  const nextStatus = currentStatusIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentStatusIdx + 1] : null;

  return (
    <div className="page-container max-w-4xl">
      {/* Back */}
      <button onClick={() => navigate('/erp/complaints')} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-5 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Complaints
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Detail + Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header card */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', catConfig.bg)}>
                <CatIcon className={cn('w-6 h-6', catConfig.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-text-primary font-bold text-lg leading-snug">{complaint.title}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <StatusBadge status={complaint.status} />
                  <span className={cn('text-xs font-medium', catConfig.color)}>{catConfig.label}</span>
                  <span className="text-text-faint text-xs">·</span>
                  <span className="text-text-faint text-xs">#{id?.slice(-6).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <p className="text-text-muted text-sm leading-relaxed mb-4">{complaint.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-text-faint">
                <User className="w-3.5 h-3.5" />
                <span>{student?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-text-faint">
                <Building2 className="w-3.5 h-3.5" />
                <span>{property?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-text-faint">
                <Calendar className="w-3.5 h-3.5" />
                <span>Raised {formatDate(complaint.createdAt)}</span>
              </div>
              {complaint.assignedTo && (
                <div className="flex items-center gap-2 text-text-faint">
                  <User className="w-3.5 h-3.5" />
                  <span>Assigned: {(complaint.assignedTo as any)?.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              Activity Timeline
            </h3>
            <Timeline entries={complaint.timeline || []} />
          </div>
        </div>

        {/* Right — Controls */}
        <div className="space-y-4">
          {/* Student info */}
          <div className="glass-card rounded-xl p-4">
            <p className="text-text-faint text-xs font-medium uppercase tracking-wide mb-3">Student</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
                {getInitials(student?.name || '?')}
              </div>
              <div>
                <p className="text-text-primary font-semibold text-sm">{student?.name}</p>
                <p className="text-text-faint text-xs">{student?.email}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/erp/tenants/${student?._id}`)}
              className="w-full text-xs text-brand-primary hover:underline text-left"
            >
              View Tenant Profile →
            </button>
          </div>

          {/* Assign to */}
          <div className="glass-card rounded-xl p-4">
            <p className="text-text-faint text-xs font-medium uppercase tracking-wide mb-3">Assign To</p>
            <select
              className="input-field text-sm w-full"
              defaultValue={(complaint.assignedTo as any)?._id || ''}
              onChange={e => handleAssign(e.target.value)}
            >
              <option value="">Unassigned</option>
              {managers.map((m: any) => (
                <option key={m._id} value={m._id}>{m.name} ({m.role.replace('_', ' ')})</option>
              ))}
            </select>
          </div>

          {/* Status update */}
          <div className="glass-card rounded-xl p-4">
            <p className="text-text-faint text-xs font-medium uppercase tracking-wide mb-3">Update Status</p>

            {/* Status buttons */}
            <div className="space-y-2 mb-4">
              {STATUS_FLOW.map(s => {
                const sIdx = STATUS_FLOW.indexOf(s);
                const isCurrentOrPast = sIdx <= currentStatusIdx;
                const isNext = s === nextStatus;
                return (
                  <button
                    key={s}
                    onClick={() => !isCurrentOrPast && handleStatusChange(s)}
                    disabled={isCurrentOrPast || updateStatus.isPending}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-200 flex items-center justify-between',
                      isCurrentOrPast && 'opacity-50 cursor-not-allowed border-surface-border text-text-faint',
                      !isCurrentOrPast && STATUS_BUTTON_STYLE[s],
                      isNext && 'ring-1 ring-offset-1 ring-offset-surface-card ring-current'
                    )}
                  >
                    <span>{s.replace('_', ' ')}</span>
                    {complaint.status === s && <CheckCircle2 className="w-4 h-4" />}
                    {isNext && !isCurrentOrPast && <span className="text-[10px] opacity-70">Next →</span>}
                  </button>
                );
              })}
            </div>

            {/* Optional note */}
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Note for student (optional)</label>
              <textarea
                className="input-field text-sm resize-none w-full"
                rows={2}
                placeholder="e.g. Electrician scheduled for tomorrow..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {complaint.status === 'CLOSED' && (
              <div className="mt-3 flex items-center gap-2 bg-status-success/10 border border-status-success/30 rounded-lg p-2.5">
                <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
                <p className="text-status-success text-xs">This complaint is closed.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-card border border-brand-primary/30 text-text-primary px-4 py-2.5 rounded-lg shadow-card flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-status-success" />
          {toast}
        </div>
      )}
    </div>
  );
}
