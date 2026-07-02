import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, LayoutGrid, List, Map, ChevronDown, Loader2 } from 'lucide-react';
import { usePublicProperties, usePublicCities, type PublicProperty, type PropertySearchParams } from '@/lib/publicApi';
import PropertyCard from '@/components/marketplace/PropertyCard';
import PropertyCardSkeleton from '@/components/marketplace/PropertyCardSkeleton';
import MapView from '@/components/marketplace/MapView';

// ─── Constants ────────────────────────────────────────────────────────────────
const AMENITY_OPTIONS = ['WIFI', 'FOOD', 'AC', 'PARKING', 'LAUNDRY', 'CCTV', 'SECURITY'];
const ROOM_TYPE_OPTIONS = ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING'];
const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'distance',   label: 'Nearest' },
];

// ─── Price Slider ─────────────────────────────────────────────────────────────
function PriceSlider({ min, max, onChange }: {
  min: number; max: number;
  onChange: (min: number, max: number) => void;
}) {
  const MIN = 1000; const MAX = 20000; const STEP = 500;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-2">
        <span>₹{min.toLocaleString('en-IN')}</span>
        <span>₹{max.toLocaleString('en-IN')}</span>
      </div>
      <div className="space-y-2">
        <input type="range" min={MIN} max={MAX} step={STEP} value={min}
          onChange={e => onChange(Math.min(+e.target.value, max - STEP), max)}
          className="w-full accent-blue-600 cursor-pointer" />
        <input type="range" min={MIN} max={MAX} step={STEP} value={max}
          onChange={e => onChange(min, Math.max(+e.target.value, min + STEP))}
          className="w-full accent-blue-600 cursor-pointer" />
      </div>
    </div>
  );
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────
interface FilterState {
  city: string; gender: string; minPrice: number; maxPrice: number;
  amenities: string[]; roomTypes: string[]; sortBy: string;
}

function FilterPanel({ filters, cities, onChange, onClear, hasActive }: {
  filters: FilterState; cities: string[]; hasActive: boolean;
  onChange: (k: keyof FilterState, v: any) => void;
  onClear: () => void;
}) {
  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  return (
    <div className="space-y-6 text-sm">
      {/* City */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">City / Area</label>
        <input list="cities-list" value={filters.city}
          onChange={e => onChange('city', e.target.value)}
          placeholder="e.g. Pune, Bangalore..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        <datalist id="cities-list">
          {cities.map(c => <option key={c} value={c} />)}
        </datalist>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Price Range</label>
        <PriceSlider min={filters.minPrice} max={filters.maxPrice}
          onChange={(mn, mx) => { onChange('minPrice', mn); onChange('maxPrice', mx); }} />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Gender</label>
        <div className="space-y-1.5">
          {[['BOYS','Boys PG'],['GIRLS','Girls PG'],['CO_ED','Co-Living']].map(([val, lbl]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="gender" value={val}
                checked={filters.gender === val}
                onChange={() => onChange('gender', filters.gender === val ? '' : val)}
                onClick={() => filters.gender === val && onChange('gender', '')}
                className="accent-blue-600" />
              <span className="text-slate-700">{lbl}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Room Type */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Room Type</label>
        <div className="space-y-1.5">
          {ROOM_TYPE_OPTIONS.map(rt => (
            <label key={rt} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.roomTypes.includes(rt)}
                onChange={() => onChange('roomTypes', toggleArr(filters.roomTypes, rt))}
                className="accent-blue-600 rounded" />
              <span className="text-slate-700">{rt.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Amenities</label>
        <div className="grid grid-cols-2 gap-1.5">
          {AMENITY_OPTIONS.map(a => (
            <label key={a} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.amenities.includes(a)}
                onChange={() => onChange('amenities', toggleArr(filters.amenities, a))}
                className="accent-blue-600 rounded" />
              <span className="text-slate-700 text-xs">{a}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sort By</label>
        <select value={filters.sortBy} onChange={e => onChange('sortBy', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {hasActive && (
        <button onClick={onClear}
          className="w-full py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors">
          Clear All Filters
        </button>
      )}
    </div>
  );
}

// ─── Default filter state ─────────────────────────────────────────────────────
const DEFAULT_FILTERS: FilterState = {
  city: '', gender: '', minPrice: 1000, maxPrice: 20000,
  amenities: [], roomTypes: [], sortBy: 'newest',
};

function paramsToFilters(sp: URLSearchParams): FilterState {
  return {
    city:      sp.get('city') ?? '',
    gender:    sp.get('gender') ?? '',
    minPrice:  sp.has('minPrice') ? +sp.get('minPrice')! : 1000,
    maxPrice:  sp.has('maxPrice') ? +sp.get('maxPrice')! : 20000,
    amenities: sp.get('amenities') ? sp.get('amenities')!.split(',').filter(Boolean) : [],
    roomTypes: sp.get('roomType') ? sp.get('roomType')!.split(',').filter(Boolean) : [],
    sortBy:    sp.get('sortBy') ?? 'newest',
  };
}

function filtersToParams(f: FilterState): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.city)               p.city = f.city;
  if (f.gender)             p.gender = f.gender;
  if (f.minPrice !== 1000)  p.minPrice = String(f.minPrice);
  if (f.maxPrice !== 20000) p.maxPrice = String(f.maxPrice);
  if (f.amenities.length)   p.amenities = f.amenities.join(',');
  if (f.roomTypes.length)   p.roomType = f.roomTypes.join(',');
  if (f.sortBy !== 'newest') p.sortBy = f.sortBy;
  return p;
}

function isActive(f: FilterState): boolean {
  return !!(f.city || f.gender || f.minPrice !== 1000 || f.maxPrice !== 20000 ||
    f.amenities.length || f.roomTypes.length || f.sortBy !== 'newest');
}

// ─── Main Search Page ─────────────────────────────────────────────────────────
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<FilterState>(() => paramsToFilters(searchParams));
  const [showMap, setShowMap] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | undefined>();

  // Sync URL → filters when URL changes externally
  useEffect(() => {
    setFilters(paramsToFilters(searchParams));
    setPage(1);
  }, [searchParams.toString()]);

  // Sync filters → URL
  const applyFilters = useCallback((f: FilterState) => {
    setFilters(f);
    setPage(1);
    setSearchParams(filtersToParams(f), { replace: true });
  }, [setSearchParams]);

  const handleChange = (k: keyof FilterState, v: any) => {
    const next = { ...filters, [k]: v };
    applyFilters(next);
  };

  const handleClear = () => {
    applyFilters(DEFAULT_FILTERS);
  };

  // Build API params
  const apiParams: PropertySearchParams = {
    ...(filters.city       ? { city: filters.city }               : {}),
    ...(filters.gender     ? { gender: filters.gender }           : {}),
    ...(filters.minPrice !== 1000  ? { minPrice: filters.minPrice }  : {}),
    ...(filters.maxPrice !== 20000 ? { maxPrice: filters.maxPrice }  : {}),
    ...(filters.amenities.length   ? { amenities: filters.amenities.join(',') } : {}),
    ...(filters.roomTypes.length   ? { roomType:  filters.roomTypes.join(',')  } : {}),
    sortBy: filters.sortBy as any,
    page,
    limit: 12,
  };

  const { data, isLoading, isFetching } = usePublicProperties(apiParams);
  const { data: citiesData } = usePublicCities();

  const properties: PublicProperty[] = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const hasNextPage = data?.hasNextPage ?? false;
  const cities = citiesData?.data ?? [];

  const activeFilters = isActive(filters);

  // Active filter chips for display
  const filterChips: { label: string; key: keyof FilterState; value?: any }[] = [
    ...(filters.city ? [{ label: `City: ${filters.city}`, key: 'city' as keyof FilterState }] : []),
    ...(filters.gender ? [{ label: `Gender: ${filters.gender}`, key: 'gender' as keyof FilterState }] : []),
    ...(filters.maxPrice !== 20000 ? [{ label: `Under ₹${filters.maxPrice.toLocaleString('en-IN')}`, key: 'maxPrice' as keyof FilterState, value: 20000 }] : []),
    ...(filters.minPrice !== 1000  ? [{ label: `Above ₹${filters.minPrice.toLocaleString('en-IN')}`, key: 'minPrice' as keyof FilterState, value: 1000 }] : []),
    ...filters.amenities.map(a => ({ label: a, key: 'amenities' as keyof FilterState, value: filters.amenities.filter(x => x !== a) })),
    ...filters.roomTypes.map(r => ({ label: r.replace('_', ' '), key: 'roomTypes' as keyof FilterState, value: filters.roomTypes.filter(x => x !== r) })),
  ];

  const dismissChip = (chip: typeof filterChips[0]) => {
    const next = { ...filters, [chip.key]: chip.value !== undefined ? chip.value : '' };
    applyFilters(next);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">

          {/* ── Desktop Sidebar ────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-20">
              <h2 className="font-semibold text-slate-900 mb-5 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filters
              </h2>
              <FilterPanel filters={filters} cities={cities} hasActive={activeFilters}
                onChange={handleChange} onClear={handleClear} />
            </div>
          </aside>

          {/* ── Results ───────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {isLoading ? 'Searching…' : `${totalCount} hostel${totalCount !== 1 ? 's' : ''}${filters.city ? ` in ${filters.city}` : ''}`}
                </h1>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* Mobile filter button */}
                <button onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                  {activeFilters && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
                </button>

                {/* View toggles */}
                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button onClick={() => { setViewMode('grid'); setShowMap(false); }}
                    className={`px-2.5 py-2 transition-colors ${!showMap && viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setViewMode('list'); setShowMap(false); }}
                    className={`px-2.5 py-2 transition-colors ${!showMap && viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <List className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowMap(s => !s)}
                    className={`px-2.5 py-2 transition-colors flex items-center gap-1 text-sm font-medium ${showMap ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Map className="w-4 h-4" /> {showMap ? 'Hide Map' : 'Show Map'}
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {filterChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filterChips.map((chip, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {chip.label}
                    <button onClick={() => dismissChip(chip)} className="hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button onClick={handleClear} className="text-xs text-red-500 hover:text-red-700 font-medium px-2">
                  Clear all
                </button>
              </div>
            )}

            {/* Map + List split view */}
            {showMap ? (
              <div className="flex gap-4 h-[600px]">
                {/* Narrow card list */}
                <div className="w-72 flex-shrink-0 overflow-y-auto space-y-3 pr-1">
                  {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} variant="list" />)
                    : properties.length === 0
                      ? <p className="text-sm text-slate-400 text-center py-10">No results</p>
                      : properties.map(p => (
                          <div key={p._id}
                            className={`transition-all duration-200 rounded-xl ${highlightedId === p._id ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => navigate(`/property/${p._id}`)}>
                            <PropertyCard property={p} variant="map-narrow" />
                          </div>
                        ))}
                </div>
                {/* Map */}
                <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <MapView
                    properties={properties}
                    highlightedId={highlightedId}
                    onPinClick={(id) => setHighlightedId(id)}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Grid or List */}
                {isLoading ? (
                  <div className={viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                    : 'space-y-4'}>
                    {Array.from({ length: 8 }).map((_, i) =>
                      <PropertyCardSkeleton key={i} variant={viewMode} />)}
                  </div>
                ) : properties.length === 0 ? (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl text-slate-400 font-bold">□</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No hostels found</h3>
                    <p className="text-slate-500 mb-6">Try adjusting your filters or searching a different city.</p>
                    <button onClick={handleClear}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  <div className={viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                    : 'space-y-4'}>
                    {properties.map(p => <PropertyCard key={p._id} property={p} variant={viewMode} />)}
                  </div>
                )}

                {/* Load more */}
                {!isLoading && hasNextPage && (
                  <div className="flex justify-center mt-8">
                    <button onClick={() => setPage(p => p + 1)} disabled={isFetching}
                      className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60">
                      {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </h2>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterPanel filters={filters} cities={cities} hasActive={activeFilters}
              onChange={handleChange} onClear={handleClear} />
            <button onClick={() => setDrawerOpen(false)}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              Show {totalCount} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
