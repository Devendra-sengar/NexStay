interface BedTile {
  _id: string;
  bedNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

interface BedGridProps {
  beds: BedTile[];
  selectedBedId?: string;
  onSelect?: (bed: BedTile) => void;
  readonly?: boolean;
}

const STATUS_CONFIG = {
  AVAILABLE: { bg: 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer', text: 'text-green-700', label: 'Available' },
  OCCUPIED:  { bg: 'bg-red-100 border-red-200 cursor-not-allowed opacity-70', text: 'text-red-600', label: 'Occupied' },
  RESERVED:  { bg: 'bg-amber-100 border-amber-300 cursor-not-allowed opacity-70', text: 'text-amber-700', label: 'Reserved' },
};

export default function BedGrid({ beds, selectedBedId, onSelect, readonly = false }: BedGridProps) {
  if (!beds.length) return <p className="text-sm text-slate-400">No beds found.</p>;

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`w-3 h-3 rounded border ${cfg.bg.split(' ')[0]} ${cfg.bg.split(' ')[1]}`} />
            {cfg.label}
          </div>
        ))}
      </div>

      {/* Bed tiles */}
      <div className="flex flex-wrap gap-2">
        {beds.map(bed => {
          const cfg = STATUS_CONFIG[bed.status] ?? STATUS_CONFIG.OCCUPIED;
          const isSelected = bed._id === selectedBedId;
          const isAvailable = bed.status === 'AVAILABLE';

          return (
            <button
              key={bed._id}
              disabled={readonly || !isAvailable}
              onClick={() => isAvailable && onSelect?.(bed)}
              className={`
                relative w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-150
                ${cfg.bg}
                ${isSelected ? '!border-blue-600 !bg-blue-50 ring-2 ring-blue-300 scale-105' : ''}
              `}
              title={`Bed ${bed.bedNumber} — ${bed.status}`}
            >
              <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : cfg.text}`}>
                {bed.bedNumber}
              </span>
              {isSelected && (
                <span className="text-[10px] text-blue-600 font-semibold">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
