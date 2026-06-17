import { useNavigate } from 'react-router-dom';
import { Wifi, Utensils, Car, ShieldCheck, WashingMachine, Wind, Zap, Tv, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

const AMENITY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  WIFI:       { icon: Wifi,          label: 'WiFi',      color: 'text-blue-400'   },
  FOOD:       { icon: Utensils,      label: 'Food',      color: 'text-orange-400' },
  PARKING:    { icon: Car,           label: 'Parking',   color: 'text-emerald-400'},
  CCTV:       { icon: ShieldCheck,   label: 'CCTV',      color: 'text-red-400'    },
  LAUNDRY:    { icon: WashingMachine,label: 'Laundry',   color: 'text-purple-400' },
  AC:         { icon: Wind,          label: 'AC',        color: 'text-cyan-400'   },
  POWER_BACKUP:{ icon: Zap,          label: 'Power',     color: 'text-yellow-400' },
  TV:         { icon: Tv,            label: 'TV',        color: 'text-pink-400'   },
  WATER:      { icon: Droplets,      label: 'Water',     color: 'text-sky-400'    },
};

export function AmenityIcon({ type, showLabel = false, size = 'sm' }: { type: string; showLabel?: boolean; size?: 'sm' | 'md' }) {
  const cfg = AMENITY_CONFIG[type];
  if (!cfg) return null;
  const { icon: Icon, label, color } = cfg;
  const iconSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  const containerSize = size === 'md' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('rounded-lg bg-surface-dark flex items-center justify-center', containerSize)}>
        <Icon className={cn(iconSize, color)} />
      </div>
      {showLabel && <span className="text-[9px] text-text-faint font-medium">{label}</span>}
    </div>
  );
}

export { AMENITY_CONFIG };

// ─── Property Card ────────────────────────────────────────────────────────────
// Consistent placeholder images using property ID as a seed
const UNSPLASH_SEEDS = [
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80',
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80',
  'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
  'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=400&q=80',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400&q=80',
];

export function getPropertyImage(id: string, images: string[] = []): string {
  if (images?.length && images[0]?.startsWith('http')) return images[0];
  // derive consistent index from id
  const idx = id ? parseInt(id.slice(-2), 16) % UNSPLASH_SEEDS.length : 0;
  return UNSPLASH_SEEDS[idx];
}

interface PropertyCardProps {
  property: any;
  compact?: boolean;
}

export function PropertyCard({ property, compact = false }: PropertyCardProps) {
  const navigate = useNavigate();
  const imgSrc = getPropertyImage(property._id, property.images);
  const rating = property.rating?.toFixed(1) || '4.2';
  const amenitySlice = (property.amenities || []).slice(0, compact ? 3 : 4);

  const genderColor: Record<string, string> = {
    BOYS: 'bg-blue-500/80', GIRLS: 'bg-pink-500/80', CO_ED: 'bg-purple-500/80',
  };

  return (
    <div
      onClick={() => navigate(`/app/property/${property._id}`)}
      className={cn(
        'flex-shrink-0 bg-surface-card border border-surface-border rounded-2xl overflow-hidden cursor-pointer',
        'hover:border-brand-primary/40 hover:shadow-card transition-all duration-200 active:scale-[0.98]',
        compact ? 'w-48' : 'w-56'
      )}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: compact ? 120 : 140 }}>
        <img src={imgSrc} alt={property.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {property.gender && (
            <span className={cn('text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full', genderColor[property.gender] || 'bg-gray-500/80')}>
              {property.gender === 'CO_ED' ? 'Co-ed' : property.gender === 'BOYS' ? 'Boys' : 'Girls'}
            </span>
          )}
        </div>
        <div className="absolute bottom-2 right-2">
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
            (property.availableBeds || 0) > 0 ? 'bg-status-success/90 text-white' : 'bg-status-error/90 text-white'
          )}>
            {property.availableBeds || 0} beds
          </span>
        </div>
        {/* Rating */}
        <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
          <span className="text-yellow-400 text-[10px]">★</span>
          <span className="text-white text-[10px] font-semibold">{rating}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-text-primary font-semibold text-sm leading-tight truncate">{property.name}</p>
        <p className="text-text-faint text-xs mt-0.5 truncate">{property.city}</p>

        {/* Amenity icons */}
        {amenitySlice.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {amenitySlice.map((a: string) => (
              <AmenityIcon key={a} type={a} />
            ))}
            {(property.amenities?.length || 0) > (compact ? 3 : 4) && (
              <span className="text-text-faint text-[10px] self-center">+{property.amenities.length - (compact ? 3 : 4)}</span>
            )}
          </div>
        )}

        {/* Price */}
        <p className="text-brand-primary font-bold text-sm mt-2">
          from ₹{((property.rentStartingFrom || 5000) / 1000).toFixed(1)}k
          <span className="text-text-faint font-normal text-xs">/mo</span>
        </p>
      </div>
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
export function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={cn('text-base', i < Math.floor(rating) ? 'text-yellow-400' : i < rating ? 'text-yellow-400/50' : 'text-surface-border')}>★</span>
      ))}
    </div>
  );
}
