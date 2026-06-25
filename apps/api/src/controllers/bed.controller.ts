import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Bed } from '../models/Bed.model';
import { Booking } from '../models/Booking.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { User } from '../models/User.model';

// ─── Get Beds for a Room ──────────────────────────────────────────────────────
export const getBeds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const beds = await Bed.find({ roomId }).sort({ bedNumber: 1 }).lean();

    // Enrich occupied/reserved beds with tenant info
    const enriched = await Promise.all(
      beds.map(async (bed) => {
        if (bed.status === 'AVAILABLE') return bed;
        const booking = await Booking.findOne({ bedId: bed._id, status: { $in: ['CONFIRMED', 'CHECKED_IN'] } })
          .populate('guestId', 'name email phone').lean();
        return { ...bed, tenant: booking ? booking.guestId : null, bookingId: booking?._id };
      })
    );

    res.json({ success: true, data: enriched });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Create Bed ───────────────────────────────────────────────────────────────
export const createBed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { bedNumber, bedType } = req.body;
    if (!bedNumber) { res.status(400).json({ success: false, message: 'Bed number is required' }); return; }
    const bed = await Bed.create({ roomId, bedNumber, bedType: bedType || 'Standard', status: 'AVAILABLE' });
    res.status(201).json({ success: true, data: bed });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Update Bed ───────────────────────────────────────────────────────────────
export const updateBed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { bedNumber, bedType, status } = req.body;

    // Validate: cannot manually set status to OCCUPIED without a booking
    if (status === 'OCCUPIED') {
      const booking = await Booking.findOne({ bedId: id, status: { $in: ['CONFIRMED', 'CHECKED_IN'] } });
      if (!booking) {
        res.status(400).json({ success: false, message: 'Cannot set status to OCCUPIED without an active booking' });
        return;
      }
    }

    const bed = await Bed.findByIdAndUpdate(id, { bedNumber, bedType, status }, { new: true });
    if (!bed) { res.status(404).json({ success: false, message: 'Bed not found' }); return; }
    res.json({ success: true, data: bed });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Delete Bed ───────────────────────────────────────────────────────────────
export const deleteBed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bed = await Bed.findById(id);
    if (!bed) { res.status(404).json({ success: false, message: 'Bed not found' }); return; }
    if (bed.status !== 'AVAILABLE') {
      res.status(400).json({ success: false, message: 'Cannot delete an occupied or reserved bed' });
      return;
    }
    await Bed.findByIdAndDelete(id);
    res.json({ success: true, message: 'Bed deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
