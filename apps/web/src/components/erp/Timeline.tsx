import { CheckCircle2, Clock, AlertCircle, XCircle, Circle } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface TimelineEntry {
  status: string;
  note?: string;
  changedBy?: { name?: string; role?: string } | string;
  changedAt: string | Date;
}

interface TimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; dot: string }> = {
  OPEN:        { icon: Circle,        color: 'text-status-warning', bg: 'bg-status-warning/10', dot: 'bg-status-warning' },
  IN_PROGRESS: { icon: Clock,         color: 'text-brand-primary',  bg: 'bg-brand-primary/10',  dot: 'bg-brand-primary'  },
  RESOLVED:    { icon: CheckCircle2,  color: 'text-status-success', bg: 'bg-status-success/10', dot: 'bg-status-success' },
  CLOSED:      { icon: XCircle,       color: 'text-text-muted',     bg: 'bg-surface-dark',      dot: 'bg-text-muted'     },
  DEFAULT:     { icon: AlertCircle,   color: 'text-text-faint',     bg: 'bg-surface-dark',      dot: 'bg-text-faint'     },
};

function getConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;
}

function getChangedByName(changedBy: TimelineEntry['changedBy']): string {
  if (!changedBy) return 'System';
  if (typeof changedBy === 'string') return changedBy;
  return changedBy.name || 'Unknown';
}

export function Timeline({ entries, className }: TimelineProps) {
  if (!entries?.length) {
    return (
      <div className="flex items-center gap-2 text-text-faint text-sm py-4">
        <Clock className="w-4 h-4" />
        <span>No timeline entries yet</span>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {entries.map((entry, idx) => {
        const { icon: Icon, color, bg, dot } = getConfig(entry.status);
        const isLast = idx === entries.length - 1;
        const changedByName = getChangedByName(entry.changedBy);

        return (
          <div key={idx} className="relative flex gap-4">
            {/* Left: dot + connector */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 border-surface-dark', bg)}>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 my-1 bg-surface-border min-h-[20px]" />
              )}
            </div>

            {/* Right: content */}
            <div className={cn('pb-5 flex-1 min-w-0', isLast && 'pb-0')}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                      entry.status === 'OPEN'        && 'bg-status-warning/10 border-status-warning/30 text-status-warning',
                      entry.status === 'IN_PROGRESS' && 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary',
                      entry.status === 'RESOLVED'    && 'bg-status-success/10 border-status-success/30 text-status-success',
                      entry.status === 'CLOSED'      && 'bg-surface-dark border-surface-border text-text-muted',
                    )}>
                      {entry.status.replace('_', ' ')}
                    </span>
                    <span className="text-text-faint text-xs">by {changedByName}</span>
                  </div>
                  {entry.note && (
                    <p className="text-text-muted text-sm mt-1 leading-relaxed">{entry.note}</p>
                  )}
                </div>
                <p className="text-text-faint text-xs whitespace-nowrap">
                  {formatDate(entry.changedAt)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
