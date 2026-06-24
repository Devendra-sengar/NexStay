import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, UserCheck, LogOut, CreditCard, Filter, UserPlus } from 'lucide-react';
import { useErpStudents, useAdminProperties } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const STATUSES = ['ALL', 'ACTIVE', 'CHECKED_OUT'];

export default function StudentsPage() {
  const navigate = useNavigate();
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data ?? [];

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [propertyId, setPropertyId] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useErpStudents({
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
    propertyId: propertyId || undefined,
    page,
  });

  const students = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Students</h1>
          <p className="text-sm text-text-secondary mt-0.5">{total} total • Manage checked-in tenants and their lifecycle</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => navigate('/admin/checkin')}
        >
          <UserPlus className="w-4 h-4" />Walk-In Check-In
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            className="input-field pl-9"
            placeholder="Search name or phone…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input-field w-44"
          value={propertyId}
          onChange={e => { setPropertyId(e.target.value); setPage(1); }}
        >
          <option value="">All Properties</option>
          {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <div className="flex rounded-lg border border-surface-border overflow-hidden">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={cn(
                'px-3 py-2 text-xs font-medium transition-colors',
                status === s ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-surface-input'
              )}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
            </div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="font-medium text-text-primary mb-1">No students found</p>
              <p className="text-sm text-text-muted">Try changing filters or add a walk-in check-in.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  {['Student', 'College', 'Property', 'Room / Bed', 'Monthly Rent', 'Move-In', 'Status', 'Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s: any) => {
                  const room = s.room;
                  const floor = s.floor;
                  const bed = s.bedId;
                  return (
                    <tr key={s._id} className="hover:bg-surface-input/40 transition-colors cursor-pointer" onClick={() => navigate(`/admin/tenants/${s._id}`)}>
                      <td className="py-3 px-4 border-b border-surface-border">
                        <div>
                          <p className="font-medium text-text-primary text-sm">{s.name}</p>
                          <p className="text-xs text-text-muted">{s.phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm text-text-secondary">{s.college || '—'}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm">{(s.propertyId as any)?.name || '—'}</td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm">
                        <span className="text-text-secondary">{room?.roomNumber || '—'}</span>
                        {bed && <span className="text-text-muted"> / {bed.bedNumber}</span>}
                      </td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm font-medium">
                        ₹{s.monthlyRent?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm text-text-secondary">
                        {s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-3 px-4 border-b border-surface-border">
                        <span className={cn('badge', s.status === 'ACTIVE' ? 'badge-success' : 'badge-gray')}>{s.status}</span>
                      </td>
                      <td className="py-3 px-4 border-b border-surface-border" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/tenants/${s._id}`)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-text-muted"
                            title="View Profile"
                          ><UserCheck className="w-3.5 h-3.5" /></button>
                          {s.status === 'ACTIVE' && (
                            <button
                              onClick={() => navigate(`/admin/checkout/${s._id}`)}
                              className="p-1.5 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors text-text-muted"
                              title="Process Check-Out"
                            ><LogOut className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-4 py-3 border-t border-surface-border flex items-center justify-between">
            <p className="text-sm text-text-muted">Page {page}</p>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1.5 px-3" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="btn-secondary text-xs py-1.5 px-3" disabled={!data?.hasNextPage} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
