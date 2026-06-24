import { useNavigate } from 'react-router-dom';
import { Star, MapPin, BedDouble, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { PublicProperty } from '@/lib/publicApi';

interface PropertyCardProps {
  property: PublicProperty;
  variant?: 'grid' | 'list' | 'map-narrow';
}

const GENDER_LABELS: Record<string, { label: string; color: string }> = {
  BOYS:   { label: 'Boys',      color: 'bg-blue-100 text-blue-700' },
  GIRLS:  { label: 'Girls',     color: 'bg-pink-100 text-pink-700' },
  CO_ED:  { label: 'Co-Living', color: 'bg-violet-100 text-violet-700' },
};

const AMENITY_ICONS: Record<string, string> = {
  WIFI: '📶', FOOD: '🍽️', AC: '❄️', PARKING: '🅿️',
  LAUNDRY: '🧺', CCTV: '📷', SECURITY: '🔐', POWER_BACKUP: '🔋',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  );
}

export default function PropertyCard({ property, variant = 'grid' }: PropertyCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const gender = GENDER_LABELS[property.gender] ?? { label: property.gender, color: 'bg-slate-100 text-slate-600' };

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate(`/login?returnUrl=/property/${property._id}`);
    } else {
      navigate(`/property/${property._id}`);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/property/${property._id}`);
  };

  if (variant === 'list') {
    return (
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex gap-0 overflow-hidden cursor-pointer group"
        onClick={() => navigate(`/property/${property._id}`)}
      >
        {/* Image */}
        <div className="relative w-48 flex-shrink-0 overflow-hidden bg-slate-100">
          <img
            src={property.images?.[0] || `https://picsum.photos/seed/${property._id.slice(-8)}/400/300`}
            alt={property.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${gender.color}`}>
            {gender.label}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-base truncate">{property.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {[property.locality, property.city].filter(Boolean).join(', ')}
              {property.distance !== undefined && (
                <span className="text-blue-600 font-medium ml-1">· {property.distance} km</span>
              )}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {property.amenities.slice(0, 4).map((a) => (
                <span key={a} className="text-xs bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600">
                  {AMENITY_ICONS[a] ?? ''} {a}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <StarRating rating={property.rating} />
              <span className="text-xs text-slate-500">{property.rating.toFixed(1)} ({property.reviewCount})</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${property.availableBeds > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {property.availableBeds > 0 ? `${property.availableBeds} beds available` : 'Full'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold text-base">
                From ₹{(property.startingPrice || (property as any).rentStartingFrom || 0).toLocaleString('en-IN')}
                <span className="text-slate-400 font-normal text-xs">/mo</span>
              </span>
              <button onClick={handleViewDetails} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">View</button>
              <button onClick={handleBookNow} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold">Book Now</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // map-narrow variant
  if (variant === 'map-narrow') {
    return (
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex gap-0 overflow-hidden cursor-pointer group"
        onClick={() => navigate(`/property/${property._id}`)}
      >
        <div className="relative w-20 flex-shrink-0 overflow-hidden bg-slate-100">
          <img
            src={property.images?.[0] || `https://picsum.photos/seed/${property._id.slice(-8)}/160/120`}
            alt={property.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 p-2">
          <h3 className="font-semibold text-slate-900 text-xs truncate">{property.name}</h3>
          <p className="text-[10px] text-slate-500 truncate">{[property.locality, property.city].filter(Boolean).join(', ')}</p>
          <p className="text-green-600 font-bold text-xs mt-1">
            ₹{(property.startingPrice || (property as any).rentStartingFrom || 0).toLocaleString('en-IN')}/mo
          </p>
        </div>
      </div>
    );
  }

  // Default: grid variant
  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer group flex flex-col"
      onClick={() => navigate(`/property/${property._id}`)}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-slate-100 flex-shrink-0">
        <img
          src={property.images?.[0] || `https://picsum.photos/seed/${property._id.slice(-8)}/800/400`}
          alt={property.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Gender badge overlay */}
        <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${gender.color}`}>
          {gender.label}
        </span>
        {/* Beds badge */}
        <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
          property.availableBeds > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {property.availableBeds > 0 ? `${property.availableBeds} beds` : 'Full'}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate">{property.name}</h3>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{[property.locality, property.city].filter(Boolean).join(', ')}</span>
          {property.distance !== undefined && (
            <span className="text-blue-600 font-medium flex-shrink-0">· {property.distance} km</span>
          )}
        </p>

        {/* Amenities pills */}
        <div className="flex flex-wrap gap-1 mt-2">
          {property.amenities.slice(0, 3).map((a) => (
            <span key={a} className="text-[10px] bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 text-slate-500">
              {AMENITY_ICONS[a] ?? ''} {a}
            </span>
          ))}
          {property.amenities.length > 3 && (
            <span className="text-[10px] text-slate-400">+{property.amenities.length - 3}</span>
          )}
        </div>

        <div className="flex-1" />

        {/* Rating + Price row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <StarRating rating={property.rating} />
            <span className="text-xs text-slate-500">{property.rating > 0 ? property.rating.toFixed(1) : 'New'}</span>
            {property.reviewCount > 0 && (
              <span className="text-xs text-slate-400">({property.reviewCount})</span>
            )}
          </div>
          <span className="text-green-600 font-bold text-sm">
            From ₹{(property.startingPrice || (property as any).rentStartingFrom || 0).toLocaleString('en-IN')}
            <span className="text-slate-400 font-normal text-xs">/mo</span>
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleViewDetails}
            className="flex-1 text-xs py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium"
          >
            View Details
          </button>
          <button
            onClick={handleBookNow}
            className="flex-1 text-xs py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold shadow-sm"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
