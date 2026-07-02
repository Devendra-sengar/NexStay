import { LucideIcon } from 'lucide-react';
import { BarChart2 } from 'lucide-react';

interface EmptyShellProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  phase?: string;
}

export default function EmptyShell({ title, subtitle, icon: Icon = BarChart2, phase = 'Phase 1' }: EmptyShellProps) {
  return (
    <div className="page-container">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Icon className="w-7 h-7 text-primary/60" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
        <p className="text-text-secondary max-w-xs text-sm mb-4">
          {subtitle || 'This section will be fully built in the next phase.'}
        </p>
        <span className="badge-info text-xs px-3 py-1">▷ Coming in {phase}</span>
      </div>
    </div>
  );
}
