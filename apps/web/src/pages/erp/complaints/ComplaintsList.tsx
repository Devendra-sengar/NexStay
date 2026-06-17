import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, Loader2, Zap, UtensilsCrossed, Wifi, Droplets, Sparkles, ChevronRight, Filter } from 'lucide-react';
import { useComplaints } from '@/hooks/useComplaints';
import { useProperties } from '@/hooks/useProperties';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  ELECTRICITY: { icon: Zap,             color: 'text-yellow-400' },
  FOOD:        { icon: UtensilsCrossed, color: 'text-orange-400' },
  INTERNET:    { icon: Wifi,            color: 'text-blue-400'   },
  WATER:       { icon: Droplets,        color: 'text-cyan-400'   },
  CLEANING:    { icon: Sparkles,        color: 'text-purple-400' },
};

const STATUS_COLORS: Record<string, string> = {
  OPEN:        'text-status-warning',
  IN_PROGRESS: 'text-brand-primary',
  RESOLVED:    'text-status-success',
  CLOSED:      'text-text-muted',
};

export default function ComplaintsListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useComplaints({ status: status || undefined, category: category || undefined, propertyId: propertyId || undefined, page });
  const { data: propsData } = useProperties();

  const complaints = data?.data || [];
  const total = data?.total || 0;
  const properties = propsData?.data || [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="section-header">Complaints</h1>
          <p className="text-text-muted text-sm">{total} total complaints</p>
        </div>
        {/* Quick status summary */}
        <div className="flex gap-2">
          {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map(s => {
            const count = complaints.filter((c: any) => c.status === s).length;
            return (
              <button key={s} onClick={() => setStatus(status === s ? '' : s)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  status === s ? 'bg-brand-primary border-brand-primary text-white' : 'border-surface-border text-text-muted hover:border-brand-primary/30')}>
                {s.replace('_', ' ')}: {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5 text-text-faint">
          <Filter className="w-4 h-4" />
        </div>
        <select className="input-field w-auto text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select className="input-field w-auto text-sm" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          <option value="ELECTRICITY">Electricity</option>
          <option value="FOOD">Food</option>
          <option value="INTERNET">Internet</option>
          <option value="WATER">Water</option>
          <option value="CLEANING">Cleaning</option>
        </select>
        <select className="input-field w-auto text-sm" value={propertyId} onChange={e => { setPropertyId(e.target.value); setPage(1); }}>
          <option value="">All Properties</option>
          {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="w-10 h-10 text-text-faint mb-3" />
          <p className="text-text-muted">No complaints found</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Property</th>
                <th>Complaint</th>
                <th>Category</th>
                <th>Status</th>
                <th>Raised</th>
                <th>Assigned To</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c: any) => {
                const catCfg = CATEGORY_CONFIG[c.category];
                const CatIcon = catCfg?.icon || MessageSquare;
                const student = c.studentId as any;
                return (
                  <tr key={c._id} className="cursor-pointer" onClick={() => navigate(`/erp/complaints/${c._id}`)}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {getInitials(student?.name || '?')}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">{student?.name}</p>
                          <p className="text-text-faint text-xs">{student?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-text-muted text-sm">{(c.propertyId as any)?.name}</td>
                    <td>
                      <p className="text-text-primary font-medium text-sm">{c.title}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <CatIcon className={cn('w-3.5 h-3.5', catCfg?.color)} />
                        <span className="text-text-muted text-xs capitalize">{c.category.toLowerCase()}</span>
                      </div>
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="text-text-muted text-sm">{formatDate(c.createdAt)}</td>
                    <td className="text-text-muted text-sm">{(c.assignedTo as any)?.name || '—'}</td>
                    <td><ChevronRight className="w-4 h-4 text-text-faint" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {total > 25 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-surface-border">
              <p className="text-text-muted text-xs">{total} complaints · Page {page}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
