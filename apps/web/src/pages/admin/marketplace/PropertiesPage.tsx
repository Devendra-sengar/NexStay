import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, MoreVertical, Edit2, Eye, Pause, Play, Trash2,
  Building2, BedDouble, Users, TrendingUp, Loader2, X, CheckCircle,
  AlertCircle, ExternalLink
} from 'lucide-react';
import { useAdminProperties, useDeleteProperty, useTogglePause } from '@/lib/adminApi';
import AddPropertyForm from '@/components/admin/AddPropertyForm';
import EditPropertyModal from '@/components/admin/EditPropertyModal';

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING:  'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-600',
};

function ConfirmDialog({ message, onConfirm, onClose, loading }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-5">
          <AlertCircle className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
          <p className="text-sm text-text-primary">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2 bg-danger hover:bg-red-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertyCard({ property, onEdit, onDelete, onTogglePause, onToggleMenu, menuOpen }: any) {
  const navigate = useNavigate();
  const coverImage = property.images?.[0];

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover */}
      <div className="relative h-40 bg-slate-100">
        {coverImage ? (
          <img src={coverImage} alt={property.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-12 h-12 text-slate-300" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[property.verificationStatus] ?? 'bg-slate-100 text-slate-600'}`}>
            {property.verificationStatus}
          </span>
          {property.isPaused && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">PAUSED</span>
          )}
        </div>
        {/* Actions */}
        <div className="absolute top-2 right-2">
          <button onClick={onToggleMenu} className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow">
            <MoreVertical className="w-4 h-4 text-text-primary" />
          </button>
          {menuOpen && (
            <div className="absolute top-9 right-0 bg-white border border-surface-border rounded-xl shadow-lg py-1 w-48 z-10">
              <button onClick={onEdit} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface text-text-primary">
                <Edit2 className="w-3.5 h-3.5" /> Edit Property
              </button>
              {property.verificationStatus === 'APPROVED' && (
                <a href={`/property/${property._id}`} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface text-text-primary">
                  <ExternalLink className="w-3.5 h-3.5" /> View on Marketplace
                </a>
              )}
              <button onClick={onTogglePause} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface text-amber-600">
                {property.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {property.isPaused ? 'Activate Listing' : 'Pause Listing'}
              </button>
              <div className="border-t border-surface-border my-1" />
              <button onClick={onDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface text-danger">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-text-primary text-sm truncate mb-0.5">{property.name}</h3>
        <p className="text-xs text-text-muted mb-3">{property.city}, {property.state}</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { icon: Building2, label: 'Rooms', value: property.totalRooms ?? '—' },
            { icon: BedDouble, label: 'Beds', value: property.totalBeds ?? '—' },
            { icon: Users, label: 'Occupied', value: property.occupiedBeds ?? '—' },
            { icon: TrendingUp, label: 'Fill %', value: `${property.occupancyPct ?? 0}%` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <p className="text-base font-bold text-text-primary">{value}</p>
              <p className="text-[10px] text-text-muted">{label}</p>
            </div>
          ))}
        </div>

        {property.monthlyRevenue > 0 && (
          <div className="bg-green-50 rounded-lg px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs text-text-muted">Monthly Revenue</span>
            <span className="text-sm font-bold text-green-700">₹{(property.monthlyRevenue ?? 0).toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);

  const { data, isLoading, refetch } = useAdminProperties({ q: searchQ || undefined });
  const deleteMutation = useDeleteProperty();
  const togglePauseMutation = useTogglePause();

  const properties = data?.data ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Delete failed');
    }
  };

  if (showAddForm) {
    return (
      <div className="page-container">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setShowAddForm(false)} className="text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-text-primary">Add New Property</h1>
        </div>
        <AddPropertyForm onCancel={() => setShowAddForm(false)} />
      </div>
    );
  }

  return (
    <div className="page-container" onClick={() => setOpenMenu(null)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">My Properties</h1>
          <p className="text-text-secondary text-sm mt-0.5">{data?.total ?? 0} propert{(data?.total ?? 0) !== 1 ? 'ies' : 'y'} listed</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input className="input-field pl-9" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search properties…" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <Building2 className="w-12 h-12 text-text-muted opacity-30" />
          <p className="font-semibold text-text-primary">No properties found</p>
          <p className="text-text-muted text-sm">{searchQ ? 'Try a different search term' : 'Add your first property to get started'}</p>
          {!searchQ && (
            <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Property
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {properties.map((p: any) => (
            <PropertyCard
              key={p._id}
              property={p}
              menuOpen={openMenu === p._id}
              onToggleMenu={(e: React.MouseEvent) => { e.stopPropagation(); setOpenMenu(openMenu === p._id ? null : p._id); }}
              onEdit={() => { setOpenMenu(null); setEditTarget(p._id); }}
              onDelete={() => { setOpenMenu(null); setDeleteTarget(p); }}
              onTogglePause={() => { setOpenMenu(null); togglePauseMutation.mutate(p._id); }}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone and will fail if there are active tenants.`}
          loading={deleteMutation.isPending}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {editTarget && (
        <EditPropertyModal
          propertyId={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
