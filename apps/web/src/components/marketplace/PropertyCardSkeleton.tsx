export default function PropertyCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'list' }) {
  if (variant === 'list') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex gap-0 animate-pulse">
        <div className="w-48 h-32 bg-slate-200 flex-shrink-0" />
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="flex gap-1 mt-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-5 w-14 bg-slate-100 rounded" />)}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-slate-200 rounded-lg" />
              <div className="h-8 w-20 bg-slate-300 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse flex flex-col">
      <div className="h-44 bg-slate-200 flex-shrink-0" />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="flex gap-1 mt-1">
          {[1, 2, 3].map((i) => <div key={i} className="h-4 w-12 bg-slate-100 rounded" />)}
        </div>
        <div className="flex-1 min-h-4" />
        <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
          <div className="h-4 bg-slate-200 rounded w-20" />
          <div className="h-4 bg-slate-200 rounded w-24" />
        </div>
        <div className="flex gap-2 mt-1">
          <div className="flex-1 h-8 bg-slate-100 rounded-lg" />
          <div className="flex-1 h-8 bg-slate-300 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
