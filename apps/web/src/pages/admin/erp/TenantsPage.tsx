import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Search, UserCheck, LogOut, CreditCard, Filter, UserPlus, Printer, Upload, Trash } from 'lucide-react';
import { useErpStudents, useAdminProperties, useDeleteDraft } from '@/lib/adminApi';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { BulkUploadModal } from './BulkUploadModal';
import { FinalizeDraftModal } from './FinalizeDraftModal';
import { useBulkDeleteDrafts } from '@/lib/adminApi';

const STATUSES = ['ALL', 'ACTIVE', 'DRAFT', 'CHECKED_OUT'];

export default function StudentsPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isWarden = pathname.startsWith('/warden');
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data ?? [];

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [propertyId, setPropertyId] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [studentToFinalize, setStudentToFinalize] = useState<any>(null);
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);

  const { mutate: deleteDraft, isPending: isDeleting } = useDeleteDraft();
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useBulkDeleteDrafts();

  const { data, isLoading } = useErpStudents({
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
    propertyId: propertyId || undefined,
    page,
    sort,
  });

  const students = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tenants</h1>
          <p className="text-sm text-text-secondary mt-0.5">{total} total • Manage checked-in tenants and their lifecycle</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => setShowBulkUpload(true)}
          >
            <Upload className="w-4 h-4" />Bulk Upload
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => navigate(isWarden ? '/warden/students/checkin' : '/admin/checkin')}
          >
            <UserPlus className="w-4 h-4" />Walk-In Check-In
          </button>
          
          {selectedDrafts.length > 0 && (
            <button
              className="btn-danger flex items-center gap-2 ml-2"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${selectedDrafts.length} selected drafts?`)) {
                  bulkDelete(selectedDrafts, {
                    onSuccess: () => {
                      toast.success(`Deleted ${selectedDrafts.length} drafts`);
                      setSelectedDrafts([]);
                    }
                  });
                }
              }}
              disabled={isBulkDeleting}
            >
              <Trash className="w-4 h-4" />Delete Selected ({selectedDrafts.length})
            </button>
          )}
        </div>
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
        
        <select
          className="input-field w-36"
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1); }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="rent_high">Rent (High-Low)</option>
          <option value="rent_low">Rent (Low-High)</option>
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
      <div className="card overflow-x-auto">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
            </div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="font-medium text-text-primary mb-1">No tenants found</p>
              <p className="text-sm text-text-muted">Try changing filters or add a walk-in check-in.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">
                    {status === 'DRAFT' && students.length > 0 && (
                      <input 
                        type="checkbox" 
                        checked={selectedDrafts.length === students.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDrafts(students.map((s: any) => s._id));
                          } else {
                            setSelectedDrafts([]);
                          }
                        }}
                        className="rounded border-surface-border text-primary focus:ring-primary"
                      />
                    )}
                  </th>
                  {['Tenant', 'Organization', 'Property', 'Room / Bed', 'Monthly Rent', 'Move-In', 'Status', 'Actions'].map(h => (
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
                    <tr key={s._id} className="hover:bg-surface-input/40 transition-colors cursor-pointer" onClick={() => navigate(isWarden ? `/warden/students/${s._id}` : `/admin/tenants/${s._id}`)}>
                      <td className="py-3 px-4 border-b border-surface-border" onClick={e => e.stopPropagation()}>
                        {s.status === 'DRAFT' && (
                          <input 
                            type="checkbox" 
                            checked={selectedDrafts.includes(s._id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedDrafts(prev => [...prev, s._id]);
                              else setSelectedDrafts(prev => prev.filter(id => id !== s._id));
                            }}
                            className="rounded border-surface-border text-primary focus:ring-primary"
                          />
                        )}
                      </td>
                      <td className="py-3 px-4 border-b border-surface-border">
                        <div>
                          <p className="font-medium text-text-primary text-sm">{s.name}</p>
                          <p className="text-xs text-text-muted">{s.phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 border-b border-surface-border text-sm text-text-secondary">{s.organization || s.college || '—'}</td>
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
                          {s.status === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => setStudentToFinalize(s)}
                                className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-text-muted"
                                title="Finalize Draft"
                              ><UserCheck className="w-3.5 h-3.5" /></button>
                              <button
                                onClick={() => {
                                  if(confirm('Are you sure you want to delete this draft?')) {
                                    deleteDraft(s._id, {
                                      onSuccess: () => toast.success('Draft deleted')
                                    });
                                  }
                                }}
                                disabled={isDeleting}
                                className="p-1.5 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors text-text-muted"
                                title="Delete Draft"
                              ><Trash className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                          <button
                            onClick={() => navigate(isWarden ? `/warden/students/${s._id}` : `/admin/tenants/${s._id}`)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-text-muted"
                            title="View Profile"
                          ><UserCheck className="w-3.5 h-3.5" /></button>
                          <button
                            onClick={() => navigate(isWarden ? `/warden/print/${s._id}` : `/admin/print-preview/${s._id}`)}
                            className="p-1.5 rounded-lg hover:bg-secondary/10 hover:text-secondary transition-colors text-text-muted"
                            title="Print Registration"
                          ><Printer className="w-3.5 h-3.5" /></button>
                          {s.status === 'ACTIVE' && (
                            <button
                              onClick={() => navigate(isWarden ? `/warden/students/checkout/${s._id}` : `/admin/checkout/${s._id}`)}
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
      {showBulkUpload && <BulkUploadModal onClose={() => setShowBulkUpload(false)} />}
      {studentToFinalize && <FinalizeDraftModal student={studentToFinalize} onClose={() => setStudentToFinalize(null)} />}
    </div>
  );
}
