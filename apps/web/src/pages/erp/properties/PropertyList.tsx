import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, Loader2, Building2, MapPin, BedDouble, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { useProperties, useDeleteProperty } from '@/hooks/useProperties';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const VERIFICATION_OPTIONS = ['', 'PENDING', 'APPROVED', 'REJECTED'];

function DeleteConfirmDialog({ name, onConfirm, onCancel, isLoading }: {
  name: string; onConfirm: () => void; onCancel: () => void; isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl p-6 w-full max-w-sm animate-slide-up shadow-card">
        <div className="w-12 h-12 rounded-full bg-status-error/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-status-error" />
        </div>
        <h3 className="text-text-primary font-bold text-center mb-1">Delete Property</h3>
        <p className="text-text-muted text-sm text-center mb-6">
          Are you sure you want to delete <span className="text-text-primary font-medium">"{name}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-md bg-status-error hover:bg-status-error/80 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertyCard({ property, onEdit, onDelete, canDelete }: any) {
  return (
    <div className="glass-card rounded-xl overflow-hidden hover:border-brand-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brand">
      {/* Image / gradient header */}
      <div className="h-32 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/10 flex items-center justify-center relative">
        <Building2 className="w-10 h-10 text-brand-primary/40" />
        <div className="absolute top-3 right-3">
          <StatusBadge status={property.verificationStatus} />
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-text-primary font-bold text-base mb-1 truncate">{property.name}</h3>
        <div className="flex items-center gap-1 text-text-muted text-xs mb-3">
          <MapPin className="w-3 h-3" />
          <span>{property.city}</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Rooms', value: property.totalRooms },
            { label: 'Beds', value: property.totalBeds },
            { label: 'Occupancy', value: `${property.occupancyRate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center bg-surface-dark/60 rounded-lg py-2">
              <p className="text-text-primary font-bold text-sm">{value}</p>
              <p className="text-text-faint text-[10px]">{label}</p>
            </div>
          ))}
        </div>

        {/* Occupancy bar */}
        <div className="mb-4">
          <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gradient rounded-full transition-all duration-700"
              style={{ width: `${property.occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Amenity chips */}
        <div className="flex flex-wrap gap-1 mb-4">
          {property.amenities?.slice(0, 3).map((a: string) => (
            <span key={a} className="px-2 py-0.5 bg-surface-dark rounded-full text-[10px] text-text-muted border border-surface-border">{a}</span>
          ))}
          {property.amenities?.length > 3 && (
            <span className="px-2 py-0.5 bg-surface-dark rounded-full text-[10px] text-text-muted border border-surface-border">+{property.amenities.length - 3}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => onEdit(property._id)} className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1.5 py-2">
            <Edit className="w-3.5 h-3.5" /> Manage
          </button>
          {canDelete && (
            <button onClick={() => onDelete(property)} className="px-3 py-2 rounded-md text-status-error hover:bg-status-error/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyRow({ property, onEdit, onDelete, canDelete }: any) {
  return (
    <tr>
      <td>
        <div>
          <p className="font-medium text-text-primary">{property.name}</p>
          <p className="text-text-faint text-xs">{property.address}</p>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-1 text-text-muted">
          <MapPin className="w-3 h-3" />{property.city}
        </div>
      </td>
      <td className="font-medium">{property.totalRooms}</td>
      <td>
        <div className="flex items-center gap-1">
          <BedDouble className="w-3.5 h-3.5 text-text-faint" />
          <span>{property.occupiedBeds}/{property.totalBeds}</span>
          <span className="text-text-faint text-xs ml-1">({property.occupancyRate}%)</span>
        </div>
      </td>
      <td><StatusBadge status={property.verificationStatus} /></td>
      <td>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(property._id)} className="text-brand-primary hover:underline text-sm">Manage</button>
          {canDelete && (
            <button onClick={() => onDelete(property)} className="text-status-error hover:text-status-error/80 text-sm">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function PropertyListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<'card' | 'table'>('card');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data, isLoading } = useProperties({ search: search || undefined, verificationStatus: statusFilter || undefined });
  const deleteMutation = useDeleteProperty();

  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'PG_OWNER';
  const properties = data?.data || [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget._id);
    setDeleteTarget(null);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="section-header">Properties</h1>
          <p className="text-text-muted text-sm">{data?.total ?? 0} properties total</p>
        </div>
        {(user?.role === 'PG_OWNER' || user?.role === 'SUPER_ADMIN') && (
          <button onClick={() => navigate('/erp/properties/new')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Property
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
          <input
            className="input-field pl-9 text-sm"
            placeholder="Search by name or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-auto text-sm"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        {/* View toggle */}
        <div className="flex items-center bg-surface-card border border-surface-border rounded-lg p-1 ml-auto">
          <button onClick={() => setView('card')} className={cn('p-1.5 rounded transition-colors', view === 'card' ? 'bg-brand-primary text-white' : 'text-text-muted hover:text-text-primary')}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('table')} className={cn('p-1.5 rounded transition-colors', view === 'table' ? 'bg-brand-primary text-white' : 'text-text-muted hover:text-text-primary')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="w-12 h-12 text-text-faint mb-4" />
          <h3 className="text-text-primary font-semibold mb-1">No properties found</h3>
          <p className="text-text-muted text-sm mb-4">Add your first PG property to get started</p>
          {canDelete && (
            <button onClick={() => navigate('/erp/properties/new')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Property
            </button>
          )}
        </div>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p: any) => (
            <PropertyCard key={p._id} property={p} onEdit={(id: string) => navigate(`/erp/properties/${id}`)}
              onDelete={setDeleteTarget} canDelete={canDelete} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Property</th><th>City</th><th>Rooms</th><th>Beds</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {properties.map((p: any) => (
                <PropertyRow key={p._id} property={p} onEdit={(id: string) => navigate(`/erp/properties/${id}`)}
                  onDelete={setDeleteTarget} canDelete={canDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
