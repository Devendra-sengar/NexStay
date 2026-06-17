import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, MapPin, Wifi, Plus, ChevronDown, ChevronRight, Loader2, Trash2, BedDouble, Home, CheckCircle2 } from 'lucide-react';
import { useProperty, useFloors, useCreateFloor, useUpdateFloor, useDeleteFloor, useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom, useCreateBed, useDeleteBed, useBeds } from '@/hooks/useProperties';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BedGrid } from '@/components/erp/BedGrid';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ─── Modals ───────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-sm animate-slide-up shadow-card">
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <h3 className="text-text-primary font-semibold">{title}</h3>
          <button onClick={onClose} className="text-text-faint hover:text-text-muted">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Bed Manager (expanded under a room) ─────────────────────────────────────
function BedManager({ propertyId, floorId, room, canEdit }: { propertyId: string; floorId: string; room: any; canEdit: boolean }) {
  const [showAdd, setShowAdd] = useState(false);
  const [bedNumber, setBedNumber] = useState('');
  const { data: beds = [], isLoading } = useBeds(propertyId, floorId, room._id);
  const createBed = useCreateBed(propertyId, floorId, room._id);
  const deleteBed = useDeleteBed(room._id);

  const handleAddBed = async () => {
    if (!bedNumber) return;
    await createBed.mutateAsync({ bedNumber, bedType: 'Standard' });
    setBedNumber('');
    setShowAdd(false);
  };

  return (
    <div className="mt-4 pl-4 border-l-2 border-brand-primary/20">
      {isLoading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading beds...
        </div>
      ) : (
        <BedGrid beds={beds} canAdd={canEdit} onAddBed={() => setShowAdd(true)} />
      )}

      {showAdd && (
        <Modal title="Add Bed" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Bed Number</label>
              <input value={bedNumber} onChange={e => setBedNumber(e.target.value)} placeholder="e.g. B1, B2"
                className="input-field" onKeyDown={e => e.key === 'Enter' && handleAddBed()} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleAddBed} disabled={createBed.isPending} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {createBed.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Room Row ─────────────────────────────────────────────────────────────────
function RoomRow({ propertyId, floorId, room, canEdit, onDelete }: any) {
  const [expanded, setExpanded] = useState(false);

  const ROOM_TYPE_LABELS: Record<string, string> = {
    SINGLE: 'Single', DOUBLE: 'Double', TRIPLE: 'Triple', FOUR_SHARING: '4 Sharing'
  };

  return (
    <div className="border border-surface-border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-surface-dark/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-text-faint flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-text-faint flex-shrink-0" />}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
          <span className="text-text-primary font-semibold text-sm">Room {room.roomNumber}</span>
          <span className="text-text-muted text-xs">{ROOM_TYPE_LABELS[room.roomType] || room.roomType}</span>
          <div className="flex items-center gap-1 text-text-muted text-xs">
            <BedDouble className="w-3 h-3" />
            <span>{room.occupiedBeds || 0}/{room.totalBeds || 0} occupied</span>
          </div>
          <StatusBadge status={room.status} />
        </div>
        {canEdit && (
          <button onClick={e => { e.stopPropagation(); onDelete(room._id); }}
            className="text-text-faint hover:text-status-error transition-colors p-1 ml-2">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {expanded && (
        <div className="p-4 bg-surface-dark/30 border-t border-surface-border">
          <BedManager propertyId={propertyId} floorId={floorId} room={room} canEdit={canEdit} />
        </div>
      )}
    </div>
  );
}

// ─── Floor Accordion ─────────────────────────────────────────────────────────
function FloorAccordion({ propertyId, floor, canEdit, onDeleteFloor }: any) {
  const [open, setOpen] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({ roomNumber: '', roomType: 'DOUBLE' });
  const { data: rooms = [], isLoading } = useRooms(propertyId, floor._id);
  const createRoom = useCreateRoom(propertyId, floor._id);
  const deleteRoom = useDeleteRoom(propertyId, floor._id);

  const handleAddRoom = async () => {
    if (!roomForm.roomNumber) return;
    await createRoom.mutateAsync({ ...roomForm, propertyId });
    setRoomForm({ roomNumber: '', roomType: 'DOUBLE' });
    setShowAddRoom(false);
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Floor header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-border cursor-pointer hover:bg-surface-dark/30 transition-colors" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4 text-brand-primary" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
          <div>
            <h3 className="text-text-primary font-semibold">{floor.name}</h3>
            <p className="text-text-faint text-xs">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button onClick={e => { e.stopPropagation(); setShowAddRoom(true); }} className="btn-ghost text-xs flex items-center gap-1 py-1.5">
              <Plus className="w-3.5 h-3.5" /> Room
            </button>
          )}
          {canEdit && (
            <button onClick={e => { e.stopPropagation(); onDeleteFloor(floor._id); }} className="text-text-faint hover:text-status-error transition-colors p-1.5">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Rooms list */}
      {open && (
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-text-muted text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading rooms...
            </div>
          ) : rooms.length > 0 ? (
            rooms.map((room: any) => (
              <RoomRow key={room._id} propertyId={propertyId} floorId={floor._id} room={room}
                canEdit={canEdit} onDelete={(id: string) => deleteRoom.mutate(id)} />
            ))
          ) : (
            <div className="text-center py-6 text-text-muted text-sm">
              No rooms on this floor.{canEdit && ' Click "+ Room" to add one.'}
            </div>
          )}
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <Modal title={`Add Room to ${floor.name}`} onClose={() => setShowAddRoom(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Room Number</label>
              <input value={roomForm.roomNumber} onChange={e => setRoomForm(f => ({ ...f, roomNumber: e.target.value }))}
                placeholder="e.g. 101, 201" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Room Type</label>
              <select value={roomForm.roomType} onChange={e => setRoomForm(f => ({ ...f, roomType: e.target.value }))} className="input-field">
                <option value="SINGLE">Single (1 bed)</option>
                <option value="DOUBLE">Double (2 beds)</option>
                <option value="TRIPLE">Triple (3 beds)</option>
                <option value="FOUR_SHARING">4 Sharing (4 beds)</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAddRoom(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleAddRoom} disabled={createRoom.isPending} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {createRoom.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Room
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Main Property Detail Page ────────────────────────────────────────────────
const TABS = ['Overview', 'Floors & Rooms', 'Occupancy', 'Verification'] as const;
type Tab = typeof TABS[number];

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [floorName, setFloorName] = useState('');

  const { data: property, isLoading } = useProperty(id || '');
  const { data: floors = [], isLoading: floorsLoading } = useFloors(id || '');
  const createFloor = useCreateFloor(id || '');
  const deleteFloor = useDeleteFloor(id || '');

  const canEdit = user?.role !== 'STUDENT';
  const canDelete = user?.role === 'PG_OWNER' || user?.role === 'SUPER_ADMIN';

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-text-muted">Property not found</p>
      </div>
    );
  }

  const handleAddFloor = async () => {
    if (!floorName) return;
    await createFloor.mutateAsync({ name: floorName });
    setFloorName('');
    setShowAddFloor(false);
  };

  return (
    <div className="page-container">
      {/* Back */}
      <button onClick={() => navigate('/erp/properties')} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-4 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Properties
      </button>

      {/* Property Header */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-gradient flex items-center justify-center flex-shrink-0 shadow-glow">
              <Home className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-text-primary">{property.name}</h1>
                <StatusBadge status={property.verificationStatus} />
              </div>
              <div className="flex items-center gap-1 text-text-muted text-sm mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{property.address}, {property.city}</span>
              </div>
            </div>
          </div>
          {canEdit && (
            <button onClick={() => navigate(`/erp/properties/${id}/edit`)} className="btn-secondary flex items-center gap-2 text-sm">
              <Edit className="w-4 h-4" /> Edit
            </button>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Rooms', value: property.totalRooms },
            { label: 'Total Beds', value: property.totalBeds },
            { label: 'Occupied', value: property.occupiedBeds },
            { label: 'Occupancy', value: `${property.occupancyRate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-dark rounded-lg p-3 text-center">
              <p className="text-brand-primary font-bold text-lg">{value}</p>
              <p className="text-text-faint text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border mb-5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2',
              activeTab === tab
                ? 'text-brand-primary border-brand-primary'
                : 'text-text-muted border-transparent hover:text-text-primary'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-text-primary font-semibold mb-3">About</h2>
            <p className="text-text-muted text-sm leading-relaxed">{property.description || 'No description added yet.'}</p>
          </div>

          {property.amenities?.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h2 className="text-text-primary font-semibold mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((a: string) => (
                  <div key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-brand-primary" />
                    <span className="text-brand-primary text-sm font-medium">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {property.images?.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h2 className="text-text-primary font-semibold mb-3">Gallery</h2>
              <div className="grid grid-cols-3 gap-3">
                {property.images.map((img: string, i: number) => (
                  <div key={i} className="aspect-video rounded-lg overflow-hidden bg-surface-dark border border-surface-border">
                    <img src={img} alt="" className="w-full h-full object-cover" onError={e => { (e.target as any).style.display = 'none'; }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Floors & Rooms' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold">Floors & Rooms</h2>
            {canEdit && (
              <button onClick={() => setShowAddFloor(true)} className="btn-primary text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Floor
              </button>
            )}
          </div>

          {floorsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
            </div>
          ) : floors.length > 0 ? (
            <div className="space-y-4">
              {floors.map((floor: any) => (
                <FloorAccordion
                  key={floor._id}
                  propertyId={id!}
                  floor={floor}
                  canEdit={canEdit}
                  onDeleteFloor={(fid: string) => deleteFloor.mutate(fid)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Home className="w-10 h-10 text-text-faint mb-3" />
              <p className="text-text-muted">No floors added yet</p>
              {canEdit && <p className="text-text-faint text-xs mt-1">Click "Add Floor" to start building the structure</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Occupancy' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Beds', value: property.totalBeds, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
            { label: 'Occupied Beds', value: property.occupiedBeds, color: 'text-status-error', bg: 'bg-status-error/10' },
            { label: 'Vacant Beds', value: property.vacantBeds, color: 'text-status-success', bg: 'bg-status-success/10' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`glass-card rounded-xl p-5 text-center`}>
              <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center mx-auto mb-3`}>
                <BedDouble className={`w-6 h-6 ${color}`} />
              </div>
              <p className={`text-3xl font-bold ${color}`}>{value ?? 0}</p>
              <p className="text-text-muted text-sm mt-1">{label}</p>
            </div>
          ))}

          <div className="sm:col-span-3 glass-card rounded-xl p-5">
            <h3 className="text-text-primary font-semibold mb-3">Occupancy Rate</h3>
            <div className="h-3 bg-surface-dark rounded-full overflow-hidden">
              <div className="h-full bg-brand-gradient rounded-full transition-all duration-700" style={{ width: `${property.occupancyRate}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-text-muted text-xs">0%</span>
              <span className="text-brand-primary font-bold">{property.occupancyRate}%</span>
              <span className="text-text-muted text-xs">100%</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Verification' && (
        <div className="glass-card rounded-xl p-6 max-w-md">
          <h2 className="text-text-primary font-semibold mb-4">Verification Status</h2>
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={property.verificationStatus} />
            <span className="text-text-muted text-sm">
              {property.verificationStatus === 'APPROVED' && 'Your property is verified and visible to students.'}
              {property.verificationStatus === 'PENDING' && 'Your property is under review by our admin team.'}
              {property.verificationStatus === 'REJECTED' && 'Your property was rejected. Please update the details and resubmit.'}
            </span>
          </div>
          <div className="space-y-2 text-sm text-text-muted">
            <p>✅ Property details submitted</p>
            <p className={property.verificationStatus !== 'PENDING' ? 'text-text-muted' : 'text-status-warning'}>
              {property.verificationStatus === 'PENDING' ? '⏳ Admin review in progress' : property.verificationStatus === 'APPROVED' ? '✅ Admin review complete' : '❌ Admin review: Rejected'}
            </p>
            {property.verificationStatus === 'APPROVED' && <p>✅ Live on platform</p>}
          </div>
        </div>
      )}

      {/* Add Floor Modal */}
      {showAddFloor && (
        <Modal title="Add Floor" onClose={() => setShowAddFloor(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Floor Name</label>
              <input value={floorName} onChange={e => setFloorName(e.target.value)} placeholder="e.g. Ground Floor, 1st Floor"
                className="input-field" onKeyDown={e => e.key === 'Enter' && handleAddFloor()} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAddFloor(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleAddFloor} disabled={createFloor.isPending} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {createFloor.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
