import { useState } from 'react';
import { cn, getInitials } from '@/lib/utils';
import { User, X, ExternalLink } from 'lucide-react';

interface Bed {
  _id: string;
  bedNumber: string;
  bedType: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  tenant?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  bookingId?: string;
}

interface BedGridProps {
  beds: Bed[];
  onAddBed?: () => void;
  canAdd?: boolean;
}

const BED_COLORS = {
  AVAILABLE: {
    tile: 'bg-status-success/10 border-status-success/40 hover:bg-status-success/20 hover:border-status-success/60',
    dot: 'bg-status-success',
    label: 'text-status-success',
  },
  OCCUPIED: {
    tile: 'bg-status-error/10 border-status-error/40 hover:bg-status-error/20 hover:border-status-error/60',
    dot: 'bg-status-error',
    label: 'text-status-error',
  },
  RESERVED: {
    tile: 'bg-status-warning/10 border-status-warning/40 hover:bg-status-warning/20 hover:border-status-warning/60',
    dot: 'bg-status-warning',
    label: 'text-status-warning',
  },
};

function BedTile({ bed }: { bed: Bed }) {
  const [showPopover, setShowPopover] = useState(false);
  const colors = BED_COLORS[bed.status];
  const isOccupied = bed.status !== 'AVAILABLE';

  return (
    <div className="relative">
      <button
        onClick={() => isOccupied && setShowPopover(!showPopover)}
        className={cn(
          'w-full aspect-square min-w-[72px] rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2',
          colors.tile,
          isOccupied ? 'cursor-pointer' : 'cursor-default'
        )}
      >
        {/* Status dot */}
        <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', colors.dot)} />
        {/* Bed number */}
        <span className="text-xs font-bold text-text-primary leading-none">{bed.bedNumber}</span>
        {/* Bed type */}
        <span className={cn('text-[9px] font-medium leading-none', colors.label)}>
          {bed.status}
        </span>
        {/* Tenant initial if occupied */}
        {isOccupied && bed.tenant && (
          <div className="w-5 h-5 rounded-full bg-surface-border flex items-center justify-center text-[8px] text-text-muted font-bold">
            {getInitials(bed.tenant.name)}
          </div>
        )}
      </button>

      {/* Tenant popover */}
      {showPopover && isOccupied && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPopover(false)} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 animate-slide-up">
            <div className="bg-surface-card border border-surface-border rounded-xl p-3 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {bed.status === 'RESERVED' ? 'Reserved For' : 'Current Tenant'}
                </span>
                <button onClick={() => setShowPopover(false)} className="text-text-faint hover:text-text-muted">
                  <X className="w-3 h-3" />
                </button>
              </div>
              {bed.tenant ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(bed.tenant.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">{bed.tenant.name}</p>
                    <p className="text-text-muted text-xs truncate">{bed.tenant.email}</p>
                    {bed.tenant.phone && <p className="text-text-faint text-xs">{bed.tenant.phone}</p>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-text-muted">
                  <User className="w-4 h-4" />
                  <span className="text-xs">No tenant info</span>
                </div>
              )}
              {bed.bookingId && (
                <div className="mt-2 pt-2 border-t border-surface-border">
                  <a href={`/erp/bookings/${bed.bookingId}`} className="flex items-center gap-1 text-brand-primary text-xs hover:underline">
                    <ExternalLink className="w-3 h-3" /> View Booking
                  </a>
                </div>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface-border" />
          </div>
        </>
      )}
    </div>
  );
}

export function BedGrid({ beds, onAddBed, canAdd = true }: BedGridProps) {
  const available = beds.filter(b => b.status === 'AVAILABLE').length;
  const occupied = beds.filter(b => b.status === 'OCCUPIED').length;
  const reserved = beds.filter(b => b.status === 'RESERVED').length;

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-status-success" />
          <span>Available ({available})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-status-error" />
          <span>Occupied ({occupied})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-status-warning" />
          <span>Reserved ({reserved})</span>
        </div>
      </div>

      {/* Bed tiles */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {beds.map(bed => <BedTile key={bed._id} bed={bed} />)}
        {/* Add bed placeholder */}
        {canAdd && onAddBed && (
          <button
            onClick={onAddBed}
            className="aspect-square min-w-[72px] rounded-xl border-2 border-dashed border-surface-border hover:border-brand-primary hover:bg-brand-primary/5 transition-all duration-200 flex flex-col items-center justify-center gap-1 text-text-faint hover:text-brand-primary"
          >
            <span className="text-xl leading-none">+</span>
            <span className="text-[9px] font-medium">Add Bed</span>
          </button>
        )}
      </div>

      {beds.length === 0 && (
        <div className="text-center py-6 text-text-muted text-sm">
          No beds added yet. {canAdd && 'Click "Add Bed" to get started.'}
        </div>
      )}
    </div>
  );
}
