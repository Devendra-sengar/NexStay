import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  propertyName: string;
  propertyId?: string;
}

export default function ImageGallery({ images, propertyName, propertyId }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // If no images, generate 3 seeded picsum images using the propertyId
  const seed = propertyId ? propertyId.slice(-8) : 'nexstay';
  const fallbackImages = [
    `https://picsum.photos/seed/${seed}/1200/600`,
    `https://picsum.photos/seed/${seed}a/1200/600`,
    `https://picsum.photos/seed/${seed}b/1200/600`,
  ];

  const displayImages = images && images.length > 0 ? images : fallbackImages;
  const total = displayImages.length;

  const prev = () => setCurrent(c => (c - 1 + total) % total);
  const next = () => setCurrent(c => (c + 1) % total);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, total]);

  return (
    <>
      {/* Main carousel */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 group" style={{ height: 380 }}>
        <img
          src={displayImages[current]}
          alt={`${propertyName} — photo ${current + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        {/* Overlay controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Zoom button */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {total > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter */}
        <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {current + 1} / {total}
        </span>
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
          {displayImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === current ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white hover:text-slate-300 z-10">
            <X className="w-7 h-7" />
          </button>
          {total > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img
            src={displayImages[current]}
            alt={`${propertyName} — photo ${current + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          <span className="absolute bottom-4 text-white/60 text-sm">{current + 1} / {total}</span>
        </div>
      )}
    </>
  );
}
