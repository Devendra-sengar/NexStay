import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Loader2, MapPin, ArrowLeft } from 'lucide-react';
import { useSearchProperties } from '@/hooks/useMarketplace';
import { PropertyCard } from '@/components/student/PropertyCard';
import { cn } from '@/lib/utils';

const AMENITY_OPTIONS = [
  { value: 'WIFI', label: '📶 WiFi' },
  { value: 'FOOD', label: '🍽️ Food' },
  { value: 'PARKING', label: '🚗 Parking' },
  { value: 'CCTV', label: '📷 CCTV' },
  { value: 'LAUNDRY', label: '👕 Laundry' },
  { value: 'AC', label: '❄️ AC' },
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'newest', label: 'Newest' },
];

interface Filters {
  city: string;
  minPrice: number;
  maxPrice: number;
  gender: string;
  amenities: string[];
  sort: string;
}

const DEFAULT_FILTERS: Filters = {
  city: '', minPrice: 0, maxPrice: 25000, gender: '', amenities: [], sort: 'rating',
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    city: searchParams.get('city') || '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useSearchProperties({
    q: q || undefined,
    city: filters.city || undefined,
    minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
    maxPrice: filters.maxPrice < 25000 ? filters.maxPrice : undefined,
    gender: filters.gender || undefined,
    amenities: filters.amenities.length ? filters.amenities.join(',') : undefined,
    sort: filters.sort,
    page,
  });

  const properties = data?.data || [];
  const total = data?.total || 0;

  const activeFilterCount = [
    filters.city, filters.gender,
    filters.minPrice > 0 || filters.maxPrice < 25000 ? 'price' : '',
    ...filters.amenities,
  ].filter(Boolean).length;

  const toggleAmenity = (a: string) => {
    setFilters(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  };

  const clearFilters = () => { setFilters(DEFAULT_FILTERS); setQ(''); setPage(1); };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 bg-surface-card border-b border-surface-border">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-text-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-surface-dark border border-surface-border rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-text-faint flex-shrink-0" />
            <input
              className="flex-1 bg-transparent text-text-primary text-sm placeholder-text-faint outline-none"
              placeholder="City, locality or PG name..."
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
            />
            {q && <button onClick={() => setQ('')}><X className="w-4 h-4 text-text-faint" /></button>}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'relative w-10 h-10 rounded-xl flex items-center justify-center border transition-all',
              showFilters ? 'bg-brand-primary border-brand-primary text-white' : 'bg-surface-dark border-surface-border text-text-muted'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Sort pills */}
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
          {SORT_OPTIONS.map(s => (
            <button key={s.value}
              onClick={() => setFilters(f => ({ ...f, sort: s.value }))}
              className={cn(
                'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all',
                filters.sort === s.value ? 'bg-brand-primary border-brand-primary text-white' : 'border-surface-border text-text-muted'
              )}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Panel (collapsible) */}
      {showFilters && (
        <div className="bg-surface-card border-b border-surface-border px-4 py-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <p className="text-text-primary font-semibold text-sm">Filters</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-brand-primary text-xs font-semibold flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          {/* City */}
          <div className="mb-3">
            <label className="block text-xs text-text-faint mb-1.5">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
              <input className="input-field pl-8 text-sm w-full"
                placeholder="e.g. Pune, Mumbai"
                value={filters.city}
                onChange={e => setFilters(f => ({ ...f, city: e.target.value }))} />
            </div>
          </div>

          {/* Gender */}
          <div className="mb-3">
            <label className="block text-xs text-text-faint mb-1.5">PG Type</label>
            <div className="flex gap-2">
              {[{ v: '', l: 'All' }, { v: 'BOYS', l: '♂ Boys' }, { v: 'GIRLS', l: '♀ Girls' }, { v: 'CO_ED', l: '⚥ Co-ed' }].map(g => (
                <button key={g.v}
                  onClick={() => setFilters(f => ({ ...f, gender: g.v }))}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    filters.gender === g.v ? 'bg-brand-primary border-brand-primary text-white' : 'border-surface-border text-text-muted'
                  )}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>

          {/* Budget slider */}
          <div className="mb-3">
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-text-faint">Budget</label>
              <span className="text-xs text-brand-primary font-semibold">
                ₹{filters.minPrice.toLocaleString('en-IN')} – ₹{filters.maxPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="space-y-2">
              <input type="range" min={0} max={25000} step={500}
                value={filters.minPrice}
                onChange={e => setFilters(f => ({ ...f, minPrice: Number(e.target.value) }))}
                className="w-full accent-indigo-500" />
              <input type="range" min={0} max={25000} step={500}
                value={filters.maxPrice}
                onChange={e => setFilters(f => ({ ...f, maxPrice: Number(e.target.value) }))}
                className="w-full accent-violet-500" />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-xs text-text-faint mb-1.5">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(a => (
                <button key={a.value}
                  onClick={() => { toggleAmenity(a.value); setPage(1); }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    filters.amenities.includes(a.value) ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'border-surface-border text-text-muted'
                  )}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Count + active filters */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-text-muted text-xs">
            {isLoading ? 'Searching...' : `${total} properties found`}
          </p>
          {isFetching && !isLoading && <Loader2 className="w-3.5 h-3.5 text-brand-primary animate-spin" />}
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
            {filters.city && <span className="flex-shrink-0 text-[10px] px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20">{filters.city}</span>}
            {filters.gender && <span className="flex-shrink-0 text-[10px] px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20">{filters.gender}</span>}
            {(filters.minPrice > 0 || filters.maxPrice < 25000) && <span className="flex-shrink-0 text-[10px] px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20">₹{filters.minPrice/1000}k–₹{filters.maxPrice/1000}k</span>}
            {filters.amenities.map(a => <span key={a} className="flex-shrink-0 text-[10px] px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20">{a}</span>)}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-surface-card animate-pulse" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-text-primary font-bold mb-1">No PGs found</h3>
            <p className="text-text-muted text-sm mb-4">Try adjusting your filters or search in a different city.</p>
            <button onClick={clearFilters} className="btn-primary text-sm flex items-center gap-1.5">
              <X className="w-4 h-4" /> Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((p: any) => (
              <SearchResultCard key={p._id} property={p} />
            ))}

            {total > 20 && (
              <div className="flex gap-2 justify-center pt-3">
                <button onClick={() => setPage(pg => Math.max(1, pg - 1))} disabled={page === 1} className="btn-ghost text-xs px-4 py-2 disabled:opacity-40">Prev</button>
                <span className="text-text-faint text-xs self-center">Page {page} of {Math.ceil(total / 20)}</span>
                <button onClick={() => setPage(pg => pg + 1)} disabled={page * 20 >= total} className="btn-ghost text-xs px-4 py-2 disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── List card (wider, horizontal) ───────────────────────────────────────────
import { getPropertyImage, AmenityIcon } from '@/components/student/PropertyCard';
import { useNavigate as useNav } from 'react-router-dom';

function SearchResultCard({ property }: { property: any }) {
  const nav = useNav();
  const imgSrc = getPropertyImage(property._id, property.images);
  return (
    <div onClick={() => nav(`/app/property/${property._id}`)}
      className="flex gap-3 bg-surface-card border border-surface-border rounded-xl overflow-hidden cursor-pointer hover:border-brand-primary/30 transition-all active:scale-[0.99]"
    >
      <div className="relative w-28 flex-shrink-0">
        <img src={imgSrc} alt={property.name} className="w-full h-full object-cover" loading="lazy" />
        <span className={cn('absolute top-2 left-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full',
          (property.availableBeds || 0) > 0 ? 'bg-status-success/90' : 'bg-status-error/90')}>
          {property.availableBeds || 0} avail
        </span>
      </div>
      <div className="py-3 pr-3 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="text-text-primary font-semibold text-sm leading-tight truncate">{property.name}</p>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-text-muted text-xs font-semibold">{property.rating?.toFixed(1) || '4.2'}</span>
          </div>
        </div>
        <p className="text-text-faint text-xs mt-0.5 flex items-center gap-0.5">
          <MapPin className="w-3 h-3" />{property.city}
        </p>
        <div className="flex gap-1.5 mt-1.5">
          {(property.amenities || []).slice(0, 4).map((a: string) => <AmenityIcon key={a} type={a} />)}
        </div>
        <p className="text-brand-primary font-bold text-sm mt-1.5">
          ₹{(property.rentStartingFrom || 5000).toLocaleString('en-IN')}<span className="text-text-faint font-normal text-xs">/mo</span>
        </p>
      </div>
    </div>
  );
}
