import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, MapPin, Star, BedDouble, Users, ChevronLeft,
  ChevronRight, Calendar, CheckCircle2, X, Phone, MessageSquare
} from 'lucide-react';
import { usePropertyPublicDetail } from '@/hooks/useMarketplace';
import { AmenityIcon, StarRating, getPropertyImage } from '@/components/student/PropertyCard';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Single (1-sharing)', DOUBLE: 'Double (2-sharing)',
  TRIPLE: 'Triple (3-sharing)', FOUR_SHARING: '4-sharing',
};

const ROOM_TYPE_ICONS: Record<string, string> = {
  SINGLE: '🛏️', DOUBLE: '🛌', TRIPLE: '🚪', FOUR_SHARING: '🏠',
};

// ─── Map Placeholder ─────────────────────────────────────────────────────────
function MapPlaceholder({ address }: { address: string }) {
  return (
    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-950 via-blue-900/50 to-slate-900 border border-surface-border">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 144">
        {[0,1,2,3,4,5,6].map(i => <line key={`h${i}`} x1="0" y1={i*24} x2="400" y2={i*24} stroke="currentColor" strokeWidth="0.5" className="text-indigo-400" />)}
        {[0,1,2,3,4,5,6,7,8,9,10].map(i => <line key={`v${i}`} x1={i*40} y1="0" x2={i*40} y2="144" stroke="currentColor" strokeWidth="0.5" className="text-indigo-400" />)}
      </svg>
      {/* Roads */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 144">
        <line x1="0" y1="72" x2="400" y2="72" stroke="#6C63FF" strokeWidth="3" />
        <line x1="200" y1="0" x2="200" y2="144" stroke="#6C63FF" strokeWidth="2" />
        <line x1="100" y1="0" x2="100" y2="144" stroke="#6C63FF" strokeWidth="1" />
        <line x1="300" y1="0" x2="300" y2="144" stroke="#6C63FF" strokeWidth="1" />
        <line x1="0" y1="36" x2="400" y2="36" stroke="#6C63FF" strokeWidth="1" />
        <line x1="0" y1="108" x2="400" y2="108" stroke="#6C63FF" strokeWidth="1" />
      </svg>
      {/* Pin */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-brand-primary shadow-glow flex items-center justify-center animate-bounce">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div className="mt-1 w-2 h-2 bg-brand-primary rounded-full opacity-50" />
        </div>
      </div>
      {/* Address tooltip */}
      <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5">
        <p className="text-white text-[10px] text-center truncate">{address}</p>
      </div>
    </div>
  );
}

// ─── Image Carousel ───────────────────────────────────────────────────────────
function ImageCarousel({ images, name }: { images: string[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const total = images.length;
  const prev = () => setCurrent(c => (c - 1 + total) % total);
  const next = () => setCurrent(c => (c + 1) % total);

  return (
    <div className="relative">
      <div className="relative h-56 overflow-hidden">
        <img src={images[current]} alt={`${name} - ${current + 1}`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        {total > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
          {current + 1} / {total}
        </div>
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="flex gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar bg-surface-dark">
          {images.map((img, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={cn('flex-shrink-0 w-12 h-9 rounded-lg overflow-hidden border-2 transition-all', i === current ? 'border-brand-primary' : 'border-transparent')}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Visit Modal ──────────────────────────────────────────────────────────────
function VisitModal({ property, onClose }: { property: any; onClose: () => void }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-surface-card border border-surface-border rounded-t-2xl w-full max-w-[430px] animate-slide-up pb-safe">
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <h3 className="font-semibold text-text-primary">Schedule a Visit</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-text-faint" /></button>
        </div>
        <div className="p-4">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-status-success mx-auto mb-3" />
              <p className="text-text-primary font-bold">Visit Requested!</p>
              <p className="text-text-muted text-sm mt-1">The property manager will contact you to confirm.</p>
              <button onClick={onClose} className="btn-primary mt-4">Done</button>
            </div>
          ) : (
            <>
              <p className="text-text-muted text-sm mb-4">Choose a date and time to visit <strong className="text-text-primary">{property?.name}</strong></p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-faint mb-1.5 block">Preferred Date</label>
                  <input type="date" className="input-field w-full" value={date} onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="text-xs text-text-faint mb-1.5 block">Preferred Time</label>
                  <select className="input-field w-full" value={time} onChange={e => setTime(e.target.value)}>
                    {['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={() => date && setSubmitted(true)} disabled={!date}
                className="btn-primary w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-40">
                <Calendar className="w-4 h-4" /> Confirm Visit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeRoomType, setActiveRoomType] = useState('');
  const [showVisitModal, setShowVisitModal] = useState(false);

  const { data, isLoading } = usePropertyPublicDetail(id || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-4 text-center py-16 text-text-muted">Property not found</div>;
  }

  const { property, rooms, roomTypeGroups, availability, reviews } = data;
  const roomTypes = Object.keys(roomTypeGroups || {});
  const currentRoomType = activeRoomType || roomTypes[0];

  // Build display images (placeholder if none)
  const displayImages = property.images?.filter((img: string) => img?.startsWith('http')).length
    ? property.images
    : [
        getPropertyImage(property._id, []),
        `https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80`,
        `https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80`,
      ];

  const avgRating = reviews.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 4.2;
  const startingPrice = property.rentStartingFrom ||
    Math.min(...rooms.map((r: any) => r.rentPerBed || 6000), 6000);

  return (
    <div className="pb-24">
      {/* Image carousel */}
      <div className="relative">
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <ImageCarousel images={displayImages} name={property.name} />
      </div>

      <div className="px-4 pt-4 space-y-5 pb-4">
        {/* Title + rating */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-text-primary font-bold text-xl leading-tight">{property.name}</h1>
            <div className="flex flex-col items-end flex-shrink-0">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-text-primary font-bold">{avgRating.toFixed(1)}</span>
              </div>
              <p className="text-text-faint text-xs">{reviews.length} reviews</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-text-muted text-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span>{property.address}, {property.city}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {property.gender && (
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                property.gender === 'BOYS' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                property.gender === 'GIRLS' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30' :
                'bg-purple-500/10 text-purple-400 border border-purple-500/30')}>
                {property.gender === 'CO_ED' ? 'Co-ed' : property.gender === 'BOYS' ? 'Boys PG' : 'Girls PG'}
              </span>
            )}
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
              availability.totalAvailable > 0 ? 'bg-status-success/10 text-status-success border border-status-success/30' : 'bg-status-error/10 text-status-error border border-status-error/30')}>
              {availability.totalAvailable > 0 ? `${availability.totalAvailable} beds available` : 'Full'}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-text-primary font-semibold mb-2">About this PG</h2>
          <p className="text-text-muted text-sm leading-relaxed">{property.description || 'A comfortable and well-maintained paying guest accommodation with all modern amenities.'}</p>
        </div>

        {/* Amenities */}
        {property.amenities?.length > 0 && (
          <div>
            <h2 className="text-text-primary font-semibold mb-3">Amenities</h2>
            <div className="grid grid-cols-5 gap-3">
              {property.amenities.map((a: string) => (
                <AmenityIcon key={a} type={a} showLabel size="md" />
              ))}
            </div>
          </div>
        )}

        {/* Bed Availability Summary */}
        <div>
          <h2 className="text-text-primary font-semibold mb-3">Availability</h2>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-muted text-sm">Occupancy</span>
              <span className="text-text-primary text-sm font-semibold">
                {availability.totalOccupied}/{availability.totalBeds} beds occupied
              </span>
            </div>
            <div className="h-3 bg-surface-dark rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${availability.totalBeds > 0 ? (availability.totalOccupied / availability.totalBeds) * 100 : 0}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-status-success/5 border border-status-success/20 rounded-lg p-2.5">
                <BedDouble className="w-4 h-4 text-status-success" />
                <div>
                  <p className="text-status-success font-bold text-sm">{availability.totalAvailable}</p>
                  <p className="text-text-faint text-[10px]">Available</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-status-error/5 border border-status-error/20 rounded-lg p-2.5">
                <Users className="w-4 h-4 text-status-error" />
                <div>
                  <p className="text-status-error font-bold text-sm">{availability.totalOccupied}</p>
                  <p className="text-text-faint text-[10px]">Occupied</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Room Types */}
        {roomTypes.length > 0 && (
          <div>
            <h2 className="text-text-primary font-semibold mb-3">Room Types</h2>
            {/* Tabs */}
            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
              {roomTypes.map(rt => (
                <button key={rt}
                  onClick={() => setActiveRoomType(rt)}
                  className={cn(
                    'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    currentRoomType === rt ? 'bg-brand-primary border-brand-primary text-white' : 'border-surface-border text-text-muted'
                  )}>
                  {ROOM_TYPE_ICONS[rt]} {ROOM_TYPE_LABELS[rt] || rt}
                </button>
              ))}
            </div>

            {currentRoomType && roomTypeGroups[currentRoomType] && (
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-text-primary font-semibold">{ROOM_TYPE_LABELS[currentRoomType]}</p>
                    <p className="text-text-faint text-xs">{roomTypeGroups[currentRoomType].rooms?.length || 0} room(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-brand-primary font-bold text-lg">
                      {formatCurrency(roomTypeGroups[currentRoomType].minRent || 6000)}
                    </p>
                    <p className="text-text-faint text-xs">per bed/month</p>
                  </div>
                </div>

                {/* Room list for this type */}
                <div className="space-y-2">
                  {rooms
                    .filter((r: any) => r.roomType === currentRoomType)
                    .slice(0, 4)
                    .map((room: any) => (
                      <div key={room._id} className="flex items-center justify-between bg-surface-dark rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <BedDouble className="w-3.5 h-3.5 text-brand-primary" />
                          <span className="text-text-muted text-xs">Room {room.roomNumber}</span>
                        </div>
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                          room.availableBeds > 0 ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error')}>
                          {room.availableBeds}/{room.totalBeds} free
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div>
          <h2 className="text-text-primary font-semibold mb-3">Location</h2>
          <MapPlaceholder address={`${property.address}, ${property.city}`} />
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-text-primary font-semibold">Reviews</h2>
            <div className="flex items-center gap-1.5">
              <StarRating rating={avgRating} />
              <span className="text-text-muted text-xs">{avgRating.toFixed(1)} ({reviews.length})</span>
            </div>
          </div>

          <div className="space-y-3">
            {reviews.slice(0, 4).map((review: any, i: number) => {
              const studentName = review.studentId?.name || review.studentId || 'Anonymous';
              return (
                <div key={review._id || i} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-text-primary font-medium text-sm">{studentName}</p>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    <span className="text-text-faint text-[10px] flex-shrink-0">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed">{review.comment}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-surface-card border-t border-surface-border px-4 py-3 flex gap-3 z-20">
        <button
          onClick={() => setShowVisitModal(true)}
          className="flex-1 py-3 rounded-xl border-2 border-brand-primary text-brand-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-primary/5 transition-colors"
        >
          <Calendar className="w-4 h-4" /> Schedule Visit
        </button>
        <button
          onClick={() => navigate(`/app/book/${property._id}`)}
          className="flex-1 py-3 rounded-xl bg-brand-gradient text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-glow"
        >
          <CheckCircle2 className="w-4 h-4" /> Book Now
        </button>
      </div>

      {showVisitModal && <VisitModal property={property} onClose={() => setShowVisitModal(false)} />}
    </div>
  );
}
