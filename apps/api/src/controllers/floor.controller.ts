import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Floor } from '../models/Floor.model';
import { Room } from '../models/Room.model';
import { Bed } from '../models/Bed.model';

// ─── Get Floors for a Property ───────────────────────────────────────────────
export const getFloors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const floors = await Floor.find({ propertyId }).sort({ name: 1 }).lean();
    res.json({ success: true, data: floors });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Create Floor ─────────────────────────────────────────────────────────────
export const createFloor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const { name } = req.body;
    if (!name) { res.status(400).json({ success: false, message: 'Floor name is required' }); return; }
    const floor = await Floor.create({ propertyId, name });
    res.status(201).json({ success: true, data: floor });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Update Floor ─────────────────────────────────────────────────────────────
export const updateFloor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const floor = await Floor.findByIdAndUpdate(id, { name: req.body.name }, { new: true });
    if (!floor) { res.status(404).json({ success: false, message: 'Floor not found' }); return; }
    res.json({ success: true, data: floor });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Delete Floor ─────────────────────────────────────────────────────────────
export const deleteFloor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Check for rooms under this floor
    const roomCount = await Room.countDocuments({ floorId: id });
    if (roomCount > 0) {
      res.status(400).json({ success: false, message: `Cannot delete floor with ${roomCount} room(s). Delete rooms first.` });
      return;
    }
    await Floor.findByIdAndDelete(id);
    res.json({ success: true, message: 'Floor deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
