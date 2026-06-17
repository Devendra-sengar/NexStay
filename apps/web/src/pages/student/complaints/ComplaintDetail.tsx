import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Building2, Calendar, User } from 'lucide-react';
import { Zap, UtensilsCrossed, Wifi, Droplets, Sparkles } from 'lucide-react';
import { useComplaint } from '@/hooks/useComplaints';
import { Timeline } from '@/components/erp/Timeline';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  ELECTRICITY: { icon: Zap,             color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Electricity' },
  FOOD:        { icon: UtensilsCrossed, color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Food'        },
  INTERNET:    { icon: Wifi,            color: 'text-blue-400',   bg: 'bg-blue-400/10',   label: 'Internet'    },
  WATER:       { icon: Droplets,        color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   label: 'Water'       },
  CLEANING:    { icon: Sparkles,        color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Cleaning'    },
};

export default function StudentComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: complaint, isLoading } = useComplaint(id || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    );
  }
  if (!complaint) {
    return <div className="p-4 text-text-muted text-center py-16">Complaint not found</div>;
  }

  const catConfig = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.ELECTRICITY;
  const CatIcon = catConfig.icon;

  return (
    <div className="px-4 py-5 pb-8">
      {/* Back */}
      <button onClick={() => navigate('/app/complaints')} className="flex items-center gap-2 text-text-muted mb-5 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header card */}
      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', catConfig.bg)}>
            <CatIcon className={cn('w-6 h-6', catConfig.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-text-primary font-bold text-base leading-snug">{complaint.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={complaint.status} />
              <span className={cn('text-xs font-medium', catConfig.color)}>{catConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-text-muted text-sm leading-relaxed mb-3">{complaint.description}</p>

        {/* Meta */}
        <div className="space-y-1.5 text-xs text-text-faint border-t border-surface-border pt-3">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>{(complaint.propertyId as any)?.name} — {(complaint.propertyId as any)?.city}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Raised on {formatDate(complaint.createdAt)}</span>
          </div>
          {complaint.assignedTo && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Handling: <span className="text-text-muted font-medium">{(complaint.assignedTo as any)?.name}</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Status progress */}
      <div className="glass-card rounded-xl p-4 mb-4">
        <p className="text-text-primary font-semibold text-sm mb-3">Progress</p>
        <div className="flex items-center gap-1">
          {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s, idx) => {
            const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
            const currentIdx = statuses.indexOf(complaint.status);
            const isActive = idx <= currentIdx;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 flex-shrink-0 transition-all',
                  isActive ? 'bg-brand-primary border-brand-primary text-white' : 'bg-surface-dark border-surface-border text-text-faint'
                )}>
                  {idx + 1}
                </div>
                {idx < 3 && (
                  <div className={cn('flex-1 h-0.5 mx-1', isActive && idx < currentIdx ? 'bg-brand-primary' : 'bg-surface-border')} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
            <span key={s} className="text-[10px] text-text-faint text-center" style={{ width: '25%' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-text-primary font-semibold text-sm mb-4">Activity Timeline</p>
        <Timeline entries={complaint.timeline || []} />
      </div>
    </div>
  );
}
