import { useState, useRef, useEffect } from 'react';
import {
  BedDouble, Plus, Edit2, Trash2, ChevronDown, ChevronRight,
  User, Phone, Calendar, Building2, AlertTriangle, X, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminProperties } from '@/lib/adminApi';
import {
  useErpRooms, useRoomBeds,
  useCreateFloor, useUpdateFloor, useDeleteFloor,
  useCreateRoom, useUpdateRoom, useDeleteRoom,
} from '@/lib/adminApi';
import { cn } from '@/lib/utils';

// ─── BedGrid ─────────────────────────────────────────────────────────────────
function BedTile({ bed, onClick }: { bed: any; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void }) {
  const color =
    bed.status === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' :
    bed.status === 'OCCUPIED'  ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' :
                                  'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100';
  return (
    <button
      onClick={onClick}
      className={cn('relative border-2 rounded-xl p-3 text-center transition-all duration-150 cursor-pointer group', color)}
    >
      <BedDouble className="w-5 h-5 mx-auto mb-1" />
      <p className="text-xs font-bold">{bed.bedNumber}</p>
      <p className="text-[10px] opacity-70 capitalize">{bed.status.toLowerCase()}</p>
    </button>
  );
}

function BedPopover({ bed, onClose, anchorRect }: { bed: any; onClose: () => void; anchorRect: DOMRect }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Smart positioning: prefer below, but flip above if not enough space
  const POPOVER_W = 256; // w-64
  const POPOVER_H = 160;
  const GAP = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = anchorRect.bottom + GAP;
  if (top + POPOVER_H > vh - 8) top = anchorRect.top - POPOVER_H - GAP;

  let left = anchorRect.left + anchorRect.width / 2 - POPOVER_W / 2;
  if (left < 8) left = 8;
  if (left + POPOVER_W > vw - 8) left = vw - POPOVER_W - 8;

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top, left, width: POPOVER_W, zIndex: 9999 }}
      className="bg-white rounded-xl shadow-xl border border-surface-border p-4 text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn('badge text-xs', bed.status === 'OCCUPIED' ? 'badge-danger' : 'badge-warning')}>
          {bed.status}
        </span>
        <button onClick={onClose}><X className="w-4 h-4 text-text-muted hover:text-text-primary" /></button>
      </div>
      {bed.status === 'OCCUPIED' && bed.occupantData && (
        <div className="space-y-1.5">
          <p className="font-semibold text-text-primary text-sm">{bed.occupantData.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Phone className="w-3 h-3" />{bed.occupantData.phone}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Calendar className="w-3 h-3" />
            Move-in: {new Date(bed.occupantData.admissionDate).toLocaleDateString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            Rent: ₹{bed.occupantData.monthlyRent?.toLocaleString('en-IN')}/mo
          </div>
        </div>
      )}
      {bed.status === 'RESERVED' && bed.bookingData && (
        <div className="space-y-1.5">
          <p className="font-semibold text-text-primary text-sm">{(bed.bookingData.guestId as any)?.name || 'Guest'}</p>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Phone className="w-3 h-3" />{(bed.bookingData.guestId as any)?.phone}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Calendar className="w-3 h-3" />Booked: {new Date(bed.bookingData.createdAt).toLocaleDateString('en-IN')}
          </div>
        </div>
      )}
      {bed.status === 'AVAILABLE' && (
        <p className="text-sm text-text-secondary">This bed is available.</p>
      )}
    </div>
  );
}

function BedGrid({ roomId }: { roomId: string }) {
  const { data: beds, isLoading } = useRoomBeds(roomId);
  const [activeBed, setActiveBed] = useState<any>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  if (isLoading) return <div className="flex gap-2 flex-wrap py-4"><div className="skeleton w-20 h-20 rounded-xl" /><div className="skeleton w-20 h-20 rounded-xl" /></div>;
  if (!beds?.length) return <p className="text-sm text-text-muted py-3">No beds found.</p>;

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-3 py-3">
        {beds.map((bed: any) => (
          <div key={bed._id} className="relative">
            <BedTile
              bed={bed}
              onClick={(e) => {
                if (activeBed?._id === bed._id) {
                  setActiveBed(null);
                  setAnchorRect(null);
                } else {
                  setActiveBed(bed);
                  setAnchorRect((e.currentTarget as HTMLButtonElement).getBoundingClientRect());
                }
              }}
            />
          </div>
        ))}
      </div>
      {activeBed && anchorRect && (
        <BedPopover
          bed={activeBed}
          anchorRect={anchorRect}
          onClose={() => { setActiveBed(null); setAnchorRect(null); }}
        />
      )}
    </div>
  );
}


// ─── Modals ──────────────────────────────────────────────────────────────────
function FloorModal({ propertyId, floor, onClose }: { propertyId: string; floor?: any; onClose: () => void }) {
  const [name, setName] = useState(floor?.name ?? '');
  const [order, setOrder] = useState(floor?.order ?? 0);
  const create = useCreateFloor();
  const update = useUpdateFloor();

  const submit = async () => {
    if (!name.trim()) { toast.error('Name required'); return; }
    try {
      if (floor) { await update.mutateAsync({ id: floor._id, name, order }); toast.success('Floor updated'); }
      else { await create.mutateAsync({ propertyId, name, order }); toast.success('Floor created'); }
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{floor ? 'Edit Floor' : 'Add Floor'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-text-muted" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="form-label">Floor Name</label><input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ground Floor" /></div>
          <div><label className="form-label">Order (0 = first)</label><input type="number" className="input-field" value={order} onChange={e => setOrder(+e.target.value)} /></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? 'Saving…' : floor ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING'];
const CAPACITY_MAP: Record<string, number> = { SINGLE: 1, DOUBLE: 2, TRIPLE: 3, FOUR_SHARING: 4 };

function RoomModal({ propertyId, floors, room, onClose }: { propertyId: string; floors: any[]; room?: any; onClose: () => void }) {
  const [roomNumber, setRoomNumber] = useState(room?.roomNumber ?? '');
  const [floorId, setFloorId] = useState(room?.floorId?._id ?? room?.floorId ?? floors[0]?._id ?? '');
  const [roomType, setRoomType] = useState(room?.roomType ?? 'DOUBLE');
  const [pricePerBed, setPricePerBed] = useState(room?.pricePerBed ?? 6000);
  const create = useCreateRoom();
  const update = useUpdateRoom();

  const capacity = CAPACITY_MAP[roomType] ?? 1;

  const submit = async () => {
    if (!roomNumber.trim()) { toast.error('Room number required'); return; }
    try {
      if (room) { await update.mutateAsync({ id: room._id, roomNumber, floorId, roomType, pricePerBed }); toast.success('Room updated'); }
      else { await create.mutateAsync({ propertyId, floorId, roomNumber, roomType, capacity, pricePerBed }); toast.success(`Room created with ${capacity} bed(s)`); }
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{room ? 'Edit Room' : 'Add Room'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-text-muted" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="form-label">Room Number</label><input className="input-field" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. 101" /></div>
          <div><label className="form-label">Floor</label>
            <select className="input-field" value={floorId} onChange={e => setFloorId(e.target.value)}>
              {floors.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Room Type</label>
            <select className="input-field" value={roomType} onChange={e => setRoomType(e.target.value)} disabled={!!room}>
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          {!room && <p className="text-xs text-text-muted">Capacity: {capacity} bed(s) will be auto-generated (B1–B{capacity})</p>}
          <div><label className="form-label">Price per Bed (₹/month)</label><input type="number" className="input-field" value={pricePerBed} onChange={e => setPricePerBed(+e.target.value)} /></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? 'Saving…' : room ? 'Update' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel, isPending }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-danger" />
        </div>
        <h3 className="text-base font-bold mb-1">{title}</h3>
        <p className="text-sm text-text-secondary mb-5">{message}</p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>
          <button className="btn-danger flex-1" onClick={onConfirm} disabled={isPending}>{isPending ? 'Deleting…' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Room Row ─────────────────────────────────────────────────────────────────
function RoomRow({ room, floors, onEdit, onDelete }: { room: any; floors: any[]; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const avail = room.availableBeds ?? 0;
  const total = room.totalBeds ?? room.capacity;
  const statusColor = avail > 0 ? 'badge-success' : 'badge-danger';

  return (
    <>
      <tr className="hover:bg-surface-input/40 transition-colors">
        <td className="py-3 px-4 border-b border-surface-border">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-text-primary font-medium hover:text-primary">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {room.roomNumber}
          </button>
        </td>
        <td className="py-3 px-4 border-b border-surface-border text-sm">{room.roomType?.replace('_', ' ')}</td>
        <td className="py-3 px-4 border-b border-surface-border text-sm">{room.capacity}</td>
        <td className="py-3 px-4 border-b border-surface-border text-sm">
          <span className="font-semibold text-emerald-600">{avail}</span>
          <span className="text-text-muted"> / {total}</span>
        </td>
        <td className="py-3 px-4 border-b border-surface-border text-sm">₹{room.pricePerBed?.toLocaleString('en-IN')}</td>
        <td className="py-3 px-4 border-b border-surface-border">
          <span className={cn('badge', statusColor)}>{avail > 0 ? 'AVAILABLE' : 'FULL'}</span>
        </td>
        <td className="py-3 px-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-surface-input/30 border-b border-surface-border px-8 pb-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mt-3 mb-2">Bed Grid — Room {room.roomNumber}</p>
            <BedGrid roomId={room._id} />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RoomsBedsPage() {
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data ?? [];

  const [selectedProp, setSelectedProp] = useState<string>('');
  const [activeFloor, setActiveFloor] = useState<number>(0);

  // Set default property once loaded
  useEffect(() => {
    if (properties.length && !selectedProp) setSelectedProp(properties[0]._id);
  }, [properties, selectedProp]);

  const { data: floors, isLoading } = useErpRooms(selectedProp);
  const deleteFloor = useDeleteFloor();
  const deleteRoom  = useDeleteRoom();

  const [floorModal, setFloorModal] = useState<{ open: boolean; floor?: any }>({ open: false });
  const [roomModal, setRoomModal] = useState<{ open: boolean; room?: any }>({ open: false });
  const [deleteFloorConfirm, setDeleteFloorConfirm] = useState<any>(null);
  const [deleteRoomConfirm, setDeleteRoomConfirm] = useState<any>(null);

  const currentFloors = floors ?? [];
  const currentFloorData = currentFloors[activeFloor];

  const handleDeleteFloor = async () => {
    if (!deleteFloorConfirm) return;
    try {
      await deleteFloor.mutateAsync(deleteFloorConfirm._id);
      toast.success('Floor deleted');
      setDeleteFloorConfirm(null);
      setActiveFloor(0);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomConfirm) return;
    try {
      await deleteRoom.mutateAsync(deleteRoomConfirm._id);
      toast.success('Room deleted');
      setDeleteRoomConfirm(null);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Rooms & Beds</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage your floor, room and bed layout</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={() => setFloorModal({ open: true })}>
            <Plus className="w-4 h-4" />Add Floor
          </button>
          {currentFloors.length > 0 && (
            <button className="btn-primary flex items-center gap-2" onClick={() => setRoomModal({ open: true })}>
              <Plus className="w-4 h-4" />Add Room
            </button>
          )}
        </div>
      </div>

      {/* Property Selector */}
      {properties.length > 1 && (
        <div className="card p-4 mb-5 flex items-center gap-3">
          <Building2 className="w-4 h-4 text-text-muted" />
          <select className="input-field max-w-xs" value={selectedProp} onChange={e => { setSelectedProp(e.target.value); setActiveFloor(0); }}>
            {properties.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5">
        {[['bg-emerald-400', 'Available'], ['bg-red-400', 'Occupied'], ['bg-amber-400', 'Reserved']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-full', color)} />
            <span className="text-xs text-text-secondary">{label}</span>
          </div>
        ))}
      </div>

      {/* Floor Tabs */}
      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
      ) : !selectedProp ? (
        <div className="card p-10 text-center text-text-muted">Select a property to view rooms.</div>
      ) : currentFloors.length === 0 ? (
        <div className="card p-10 text-center">
          <BedDouble className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="font-medium text-text-primary mb-1">No floors yet</p>
          <p className="text-sm text-text-muted mb-4">Add a floor to start creating rooms.</p>
          <button className="btn-primary" onClick={() => setFloorModal({ open: true })}>Add First Floor</button>
        </div>
      ) : (
        <div className="card">
          {/* Floor Tab Bar */}
          <div className="flex items-center gap-0 border-b border-surface-border overflow-x-auto no-scrollbar">
            {currentFloors.map((floor: any, idx: number) => (
              <button
                key={floor._id}
                onClick={() => setActiveFloor(idx)}
                className={cn(
                  'px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
                  activeFloor === idx
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-input'
                )}
              >
                {floor.name}
                <span className="text-xs bg-surface-border px-1.5 py-0.5 rounded-full">{floor.rooms?.length ?? 0}</span>
              </button>
            ))}
            <div className="ml-auto pr-3 flex items-center gap-1.5">
              <button onClick={() => setFloorModal({ open: true, floor: currentFloorData })} className="p-1.5 hover:bg-surface-input rounded-lg text-text-muted hover:text-primary transition-colors" title="Edit Floor"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => setDeleteFloorConfirm(currentFloorData)} className="p-1.5 hover:bg-danger/10 rounded-lg text-text-muted hover:text-danger transition-colors" title="Delete Floor"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Room Table */}
          <div className="overflow-x-auto">
            {!currentFloorData?.rooms?.length ? (
              <div className="p-10 text-center">
                <p className="text-text-muted text-sm mb-3">No rooms on this floor.</p>
                <button className="btn-primary text-sm" onClick={() => setRoomModal({ open: true })}>Add Room</button>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    {['Room No', 'Type', 'Capacity', 'Available / Total', 'Price/Bed', 'Status', 'Actions'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentFloorData.rooms.map((room: any) => (
                    <RoomRow
                      key={room._id}
                      room={room}
                      floors={currentFloors}
                      onEdit={() => setRoomModal({ open: true, room })}
                      onDelete={() => setDeleteRoomConfirm(room)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {floorModal.open && (
        <FloorModal
          propertyId={selectedProp}
          floor={floorModal.floor}
          onClose={() => setFloorModal({ open: false })}
        />
      )}
      {roomModal.open && (
        <RoomModal
          propertyId={selectedProp}
          floors={currentFloors}
          room={roomModal.room}
          onClose={() => setRoomModal({ open: false })}
        />
      )}
      {deleteFloorConfirm && (
        <ConfirmDialog
          title="Delete Floor?"
          message={`Delete "${deleteFloorConfirm.name}"? This is blocked if rooms exist on it.`}
          onConfirm={handleDeleteFloor}
          onCancel={() => setDeleteFloorConfirm(null)}
          isPending={deleteFloor.isPending}
        />
      )}
      {deleteRoomConfirm && (
        <ConfirmDialog
          title="Delete Room?"
          message={`Delete room "${deleteRoomConfirm.roomNumber}"? Blocked if any bed has an active tenant.`}
          onConfirm={handleDeleteRoom}
          onCancel={() => setDeleteRoomConfirm(null)}
          isPending={deleteRoom.isPending}
        />
      )}
    </div>
  );
}
