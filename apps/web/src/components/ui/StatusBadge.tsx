import { cn } from '@/lib/utils';

type Status =
  | 'PAID' | 'UNPAID' | 'PARTIAL'
  | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT'
  | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
  | 'APPROVED' | 'REJECTED'
  | 'ACTIVE' | 'SUSPENDED'
  | 'FULL';

const STATUS_MAP: Record<Status, { label: string; className: string }> = {
  // Rent
  PAID:        { label: 'Paid',        className: 'bg-status-success/15 text-status-success border-status-success/30' },
  UNPAID:      { label: 'Unpaid',      className: 'bg-status-error/15 text-status-error border-status-error/30' },
  PARTIAL:     { label: 'Partial',     className: 'bg-status-warning/15 text-status-warning border-status-warning/30' },
  // Booking
  PENDING:     { label: 'Pending',     className: 'bg-status-info/15 text-status-info border-status-info/30' },
  CONFIRMED:   { label: 'Confirmed',   className: 'bg-status-success/15 text-status-success border-status-success/30' },
  CANCELLED:   { label: 'Cancelled',   className: 'bg-status-error/15 text-status-error border-status-error/30' },
  CHECKED_IN:  { label: 'Checked In',  className: 'bg-brand-secondary/15 text-brand-secondary border-brand-secondary/30' },
  CHECKED_OUT: { label: 'Checked Out', className: 'bg-text-muted/15 text-text-muted border-text-muted/30' },
  // Complaint
  OPEN:        { label: 'Open',        className: 'bg-status-error/15 text-status-error border-status-error/30' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-status-warning/15 text-status-warning border-status-warning/30' },
  RESOLVED:    { label: 'Resolved',    className: 'bg-status-success/15 text-status-success border-status-success/30' },
  // Bed/Room
  AVAILABLE:   { label: 'Available',   className: 'bg-status-success/15 text-status-success border-status-success/30' },
  OCCUPIED:    { label: 'Occupied',    className: 'bg-status-error/15 text-status-error border-status-error/30' },
  RESERVED:    { label: 'Reserved',    className: 'bg-status-warning/15 text-status-warning border-status-warning/30' },
  FULL:        { label: 'Full',        className: 'bg-status-error/15 text-status-error border-status-error/30' },
  // Verification
  APPROVED:    { label: 'Approved',    className: 'bg-status-success/15 text-status-success border-status-success/30' },
  REJECTED:    { label: 'Rejected',    className: 'bg-status-error/15 text-status-error border-status-error/30' },
  // User
  ACTIVE:      { label: 'Active',      className: 'bg-status-success/15 text-status-success border-status-success/30' },
  SUSPENDED:   { label: 'Suspended',   className: 'bg-status-error/15 text-status-error border-status-error/30' },
};

interface StatusBadgeProps {
  status: Status | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status as Status];
  if (!cfg) return <span className={cn('badge bg-surface-border text-text-muted border-surface-border', className)}>{status}</span>;
  return (
    <span className={cn('badge border', cfg.className, className)}>
      {cfg.label}
    </span>
  );
}
