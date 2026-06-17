import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Loader2, Zap, UtensilsCrossed, Wifi, Droplets, Sparkles, ChevronRight } from 'lucide-react';
import { useMyComplaints } from '@/hooks/useComplaints';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ELECTRICITY: { icon: Zap,              color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  FOOD:        { icon: UtensilsCrossed,  color: 'text-orange-400', bg: 'bg-orange-400/10' },
  INTERNET:    { icon: Wifi,             color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  WATER:       { icon: Droplets,         color: 'text-cyan-400',   bg: 'bg-cyan-400/10'   },
  CLEANING:    { icon: Sparkles,         color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

const STATUS_PROGRESS: Record<string, number> = {
  OPEN: 25, IN_PROGRESS: 60, RESOLVED: 90, CLOSED: 100,
};

export default function MyComplaintsPage() {
  const navigate = useNavigate();
  const { data: complaints = [], isLoading } = useMyComplaints();

  return (
    <div className="px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-text-primary">My Complaints</h1>
          <p className="text-text-faint text-xs">{complaints.length} total raised</p>
        </div>
        <button
          onClick={() => navigate('/app/complaints/raise')}
          className="flex items-center gap-1.5 btn-primary text-sm py-2 px-3"
        >
          <Plus className="w-4 h-4" /> Raise
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-brand-primary/50" />
          </div>
          <h3 className="text-text-primary font-semibold mb-1">No complaints yet</h3>
          <p className="text-text-muted text-sm mb-5">Have an issue? Let your manager know.</p>
          <button onClick={() => navigate('/app/complaints/raise')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Raise a Complaint
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint: any) => {
            const catConfig = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.ELECTRICITY;
            const CatIcon = catConfig.icon;
            const progress = STATUS_PROGRESS[complaint.status] || 25;

            return (
              <div
                key={complaint._id}
                onClick={() => navigate(`/app/complaints/${complaint._id}`)}
                className="glass-card rounded-xl p-4 cursor-pointer hover:border-brand-primary/30 transition-all duration-200 active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  {/* Category icon */}
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', catConfig.bg)}>
                    <CatIcon className={cn('w-5 h-5', catConfig.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-text-primary font-semibold text-sm truncate">{complaint.title}</p>
                      <ChevronRight className="w-4 h-4 text-text-faint flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={complaint.status} />
                      <span className="text-text-faint text-xs">{formatDate(complaint.createdAt)}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-surface-dark rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          complaint.status === 'RESOLVED' || complaint.status === 'CLOSED'
                            ? 'bg-status-success'
                            : complaint.status === 'IN_PROGRESS'
                            ? 'bg-brand-primary'
                            : 'bg-status-warning'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
