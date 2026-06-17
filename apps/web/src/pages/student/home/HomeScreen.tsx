import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Sparkles, TrendingUp, MapPin, Star, ArrowRight } from 'lucide-react';
import { useHomeData } from '@/hooks/useMarketplace';
import { PropertyCard } from '@/components/student/PropertyCard';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

function SectionRow({ title, icon: Icon, color, properties, emptyMsg }: any) {
  if (!properties?.length) return (
    <div className="px-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('w-4 h-4', color)} />
        <h2 className="text-text-primary font-bold text-base">{title}</h2>
      </div>
      <p className="text-text-faint text-sm py-4">{emptyMsg || 'No properties available.'}</p>
    </div>
  );

  return (
    <div>
      <div className="px-4 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', color)} />
          <h2 className="text-text-primary font-bold text-base">{title}</h2>
        </div>
        <button className="flex items-center gap-0.5 text-brand-primary text-xs font-semibold">
          See all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {properties.map((p: any) => (
          <PropertyCard key={p._id} property={p} />
        ))}
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading } = useHomeData();

  const handleSearch = () => {
    if (searchInput.trim()) navigate(`/app/search?q=${encodeURIComponent(searchInput.trim())}`);
    else navigate('/app/search');
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="pb-4">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-4 pt-5 pb-10 overflow-hidden">
        {/* bg decorations */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />

        <p className="text-indigo-200 text-xs font-medium mb-0.5">{greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</p>
        <h1 className="text-white text-xl font-bold mb-4 leading-tight">
          Find your perfect<br />PG accommodation
        </h1>

        {/* Search bar */}
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-lg">
          <div className="flex-1 flex items-center gap-2 pl-3">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              className="flex-1 bg-transparent text-gray-800 text-sm placeholder-gray-400 outline-none py-2"
              placeholder="Search by city, locality..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-brand-gradient text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex-shrink-0"
          >
            Search
          </button>
        </div>
      </div>

      {/* Quick filter chips */}
      <div className="-mt-5 px-4 mb-4">
        <div className="bg-surface-card border border-surface-border rounded-xl p-2 flex gap-2 overflow-x-auto no-scrollbar shadow-card">
          {['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad'].map(city => (
            <button key={city} onClick={() => navigate(`/app/search?city=${city}`)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-dark border border-surface-border text-text-muted text-xs font-medium hover:border-brand-primary/40 hover:text-text-primary transition-all">
              <MapPin className="w-3 h-3" />{city}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <SectionRow title="Featured PGs" icon={Sparkles} color="text-brand-accent" properties={data?.featured} />
          <SectionRow title="Nearby PGs" icon={MapPin} color="text-brand-primary" properties={data?.nearby} />
          <SectionRow title="Top Rated" icon={Star} color="text-yellow-400" properties={data?.popular} />
          <SectionRow title="Recommended" icon={TrendingUp} color="text-status-success" properties={data?.recommended} />
        </div>
      )}

      {/* Approved badge note */}
      {!isLoading && data && (
        <p className="text-center text-text-faint text-[10px] mt-6 px-4">
          ✅ All listed properties are verified and approved by NexStay
        </p>
      )}
    </div>
  );
}
