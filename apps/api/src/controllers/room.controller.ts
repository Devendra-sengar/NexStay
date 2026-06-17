import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Room } from '../models/Room.model';
import { Bed } from '../models/Bed.model';

const CAPACITY_MAP: Record<string, number> = {
  SINGLE: 1, DOUBLE: 2, TRIPLE: 3, FOUR_SHARING: 4,
};

// ─── Get Rooms for a Floor ────────────────────────────────────────────────────
export const getRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { floorId } = req.params;
    const rooms = await Room.find({ floorId }).sort({ roomNumber: 1 }).lean();

    const enriched = await Promise.all(
      rooms.map(async (room) => {
        const beds = await Bed.find({ roomId: room._id }).lean();
        const occupied = beds.filter(b => b.status !== 'AVAILABLE').length;
        return { ...room, beds, occupiedBeds: occupied, totalBeds: beds.length };
      })
    );

    res.json({ success: true, data: enriched });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get All Rooms for a Property ─────────────────────────────────────────────
export const getRoomsByProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const rooms = await Room.find({ propertyId }).populate('floorId', 'name').sort({ roomNumber: 1 }).lean();

    const enriched = await Promise.all(
      rooms.map(async (room) => {
        const beds = await Bed.find({ roomId: room._id }).lean();
        const occupied = beds.filter(b => b.status !== 'AVAILABLE').length;
        return { ...room, beds, occupiedBeds: occupied, totalBeds: beds.length };
      })
    );

    res.json({ success: true, data: enriched });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Create Room ──────────────────────────────────────────────────────────────
export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { floorId } = req.params;
    const { propertyId, roomNumber, roomType } = req.body;
    if (!roomNumber || !roomType || !propertyId) {
      res.status(400).json({ success: false, message: 'roomNumber, roomType, and propertyId are required' });
      return;
    }
    const capacity = CAPACITY_MAP[roomType] || 1;
    const room = await Room.create({ floorId, propertyId, roomNumber, roomType, capacity, status: 'AVAILABLE' });
    res.status(201).json({ success: true, data: room });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Update Room ──────────────────────────────────────────────────────────────
export const updateRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { roomNumber, roomType } = req.body;
    const capacity = roomType ? (CAPACITY_MAP[roomType] || 1) : undefined;
    const update: any = { roomNumber };
    if (roomType) { update.roomType = roomType; update.capacity = capacity; }

    const room = await Room.findByIdAndUpdate(id, update, { new: true });
    if (!room) { res.status(404).json({ success: false, message: 'Room not found' }); return; }
    res.json({ success: true, data: room });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Delete Room ──────────────────────────────────────────────────────────────
export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const beds = await Bed.find({ roomId: id });
    const hasOccupied = beds.some(b => b.status !== 'AVAILABLE');
    if (hasOccupied) {
      res.status(400).json({ success: false, message: 'Cannot delete room with occupied/reserved beds' });
      return;
    }
    await Bed.deleteMany({ roomId: id });
    await Room.findByIdAndDelete(id);
    res.json({ success: true, message: 'Room deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
