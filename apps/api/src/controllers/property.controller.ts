import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Property } from '../models/Property.model';
import { Room } from '../models/Room.model';
import { Bed } from '../models/Bed.model';

// ─── List Properties ──────────────────────────────────────────────────────────
export const getProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, verificationStatus, page = 1, limit = 20 } = req.query;
    const role = req.user!.role;
    const userId = req.user!._id;

    const filter: any = {};
    if (role === 'PG_OWNER') filter.ownerId = new mongoose.Types.ObjectId(userId);
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const properties = await Property.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('ownerId', 'name email')
      .lean();

    // Enrich with room/bed stats
    const enriched = await Promise.all(
      properties.map(async (prop) => {
        const rooms = await Room.find({ propertyId: prop._id }).lean();
        const roomIds = rooms.map(r => r._id);
        const beds = await Bed.find({ roomId: { $in: roomIds } }).lean();
        const occupied = beds.filter(b => b.status === 'OCCUPIED' || b.status === 'RESERVED').length;
        return {
          ...prop,
          totalRooms: rooms.length,
          totalBeds: beds.length,
          occupiedBeds: occupied,
          occupancyRate: beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0,
        };
      })
    );

    const total = await Property.countDocuments(filter);
    res.json({ success: true, data: enriched, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get Single Property ──────────────────────────────────────────────────────
export const getPropertyById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id).populate('ownerId', 'name email phone').lean();
    if (!property) { res.status(404).json({ success: false, message: 'Property not found' }); return; }

    const rooms = await Room.find({ propertyId: id }).lean();
    const roomIds = rooms.map(r => r._id);
    const beds = await Bed.find({ roomId: { $in: roomIds } }).lean();
    const occupied = beds.filter(b => b.status === 'OCCUPIED' || b.status === 'RESERVED').length;

    res.json({
      success: true,
      data: {
        ...property,
        totalRooms: rooms.length,
        totalBeds: beds.length,
        occupiedBeds: occupied,
        vacantBeds: beds.filter(b => b.status === 'AVAILABLE').length,
        occupancyRate: beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Create Property ──────────────────────────────────────────────────────────
export const createProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, address, city, description, amenities, images } = req.body;
    if (!name || !address || !city) {
      res.status(400).json({ success: false, message: 'Name, address and city are required' });
      return;
    }

    const property = await Property.create({
      name, address, city,
      description: description || '',
      amenities: amenities || [],
      images: images || [],
      ownerId: req.user!._id,
      verificationStatus: 'PENDING',
    });

    res.status(201).json({ success: true, data: property });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Update Property ──────────────────────────────────────────────────────────
export const updateProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) { res.status(404).json({ success: false, message: 'Property not found' }); return; }

    const role = req.user!.role;
    if (role === 'PG_OWNER' && String(property.ownerId) !== req.user!._id) {
      res.status(403).json({ success: false, message: 'Forbidden' }); return;
    }

    const { name, address, city, description, amenities, images } = req.body;
    const updated = await Property.findByIdAndUpdate(
      id, { name, address, city, description, amenities, images }, { new: true, runValidators: true }
    );

    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Delete Property ──────────────────────────────────────────────────────────
export const deleteProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) { res.status(404).json({ success: false, message: 'Property not found' }); return; }

    if (req.user!.role === 'PROPERTY_MANAGER') {
      res.status(403).json({ success: false, message: 'Managers cannot delete properties' }); return;
    }
    if (req.user!.role === 'PG_OWNER' && String(property.ownerId) !== req.user!._id) {
      res.status(403).json({ success: false, message: 'Forbidden' }); return;
    }

    await Property.findByIdAndDelete(id);
    res.json({ success: true, message: 'Property deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
