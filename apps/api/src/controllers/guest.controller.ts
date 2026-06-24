import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Booking } from '../models/Booking.model';
import { Bed } from '../models/Bed.model';
import { Room } from '../models/Room.model';
import { Property } from '../models/Property.model';
import { Complaint } from '../models/Complaint.model';
import { Notification } from '../models/Notification.model';
import { StudentProfile } from '../models/StudentProfile.model';

// ─── Helper: generate booking reference ──────────────────────────────────────
function genRef() {
  return 'NSB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── POST /api/guest/bookings ─────────────────────────────────────────────────
export const createGuestBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guestId = req.user!.id;
    const { propertyId, roomId, bedId, checkInDate, monthlyRent, paymentMethod } = req.body;

    if (!propertyId || !roomId || !bedId) {
      res.status(400).json({ success: false, message: 'propertyId, roomId, bedId are required' });
      return;
    }

    // Validate property exists and is approved
    const property = await Property.findOne({ _id: propertyId, verificationStatus: 'APPROVED', isActive: true }).lean();
    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found or not available' });
      return;
    }

    // Validate bed is available
    const bed = await Bed.findById(bedId);
    if (!bed) {
      res.status(404).json({ success: false, message: 'Bed not found' });
      return;
    }
    if (bed.status !== 'AVAILABLE') {
      res.status(400).json({ success: false, message: 'Selected bed is no longer available. Please choose another.' });
      return;
    }

    // Get room for price info
    const room = await Room.findById(roomId).lean();
    const rent = monthlyRent ?? room?.pricePerBed ?? 6000;

    const referenceId = genRef();

    // Mark bed as RESERVED
    bed.status = 'RESERVED';
    await bed.save();

    // Create booking
    const booking = await Booking.create({
      guestId: new mongoose.Types.ObjectId(guestId),
      tenantId: (property as any).tenantId,
      propertyId: new mongoose.Types.ObjectId(propertyId),
      roomId: new mongoose.Types.ObjectId(roomId),
      bedId: new mongoose.Types.ObjectId(bedId),
      status: 'PENDING',
      checkInDate: checkInDate ? new Date(checkInDate) : undefined,
      monthlyRent: rent,
      paymentMethod: paymentMethod ?? 'UPI',
      paymentId: referenceId,
      notes: referenceId,
    });

    // Notify guest
    await Notification.create({
      userId: new mongoose.Types.ObjectId(guestId),
      type: 'BOOKING',
      title: 'Booking Confirmed! 🎉',
      message: `Your booking at ${(property as any).name} has been placed. Reference: ${referenceId}`,
      channel: 'IN_APP',
      isRead: false,
    });

    // Notify property owner
    await Notification.create({
      userId: (property as any).tenantId,
      type: 'BOOKING',
      title: 'New Booking Request 🔔',
      message: `A new booking request has been placed for ${(property as any).name}. Ref: ${referenceId}`,
      channel: 'IN_APP',
      isRead: false,
    }).catch(() => {}); // non-critical

    res.status(201).json({ success: true, data: booking, referenceId });
  } catch (err) {
    console.error('[guest] createGuestBooking:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/guest/bookings ──────────────────────────────────────────────────
export const getGuestBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guestId = req.user!.id;
    const bookings = await Booking.find({ guestId })
      .populate('propertyId', 'name city locality address images')
      .populate('roomId', 'roomNumber roomType pricePerBed')
      .populate('bedId', 'bedNumber status')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('[guest] getGuestBookings:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/guest/bookings/:id ─────────────────────────────────────────────
export const getGuestBookingDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guestId = req.user!.id;
    const booking = await Booking.findOne({ _id: req.params.id, guestId })
      .populate('propertyId', 'name city locality address images latitude longitude')
      .populate('roomId', 'roomNumber roomType pricePerBed')
      .populate('bedId', 'bedNumber status')
      .lean();

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (err) {
    console.error('[guest] getGuestBookingDetail:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── DELETE /api/guest/bookings/:id ──────────────────────────────────────────
export const cancelGuestBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guestId = req.user!.id;
    const booking = await Booking.findOne({ _id: req.params.id, guestId });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }
    if (booking.status !== 'PENDING') {
      res.status(400).json({ success: false, message: 'Only PENDING bookings can be cancelled' });
      return;
    }

    // Revert bed to AVAILABLE
    await Bed.findByIdAndUpdate(booking.bedId, { status: 'AVAILABLE' });

    booking.status = 'CANCELLED';
    await booking.save();

    await Notification.create({
      userId: new mongoose.Types.ObjectId(guestId),
      type: 'BOOKING',
      title: 'Booking Cancelled',
      message: `Your booking (Ref: ${booking.paymentId ?? booking._id}) has been cancelled.`,
      channel: 'IN_APP',
      isRead: false,
    });

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('[guest] cancelGuestBooking:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/guest/complaints ───────────────────────────────────────────────
export const createGuestComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guestId = req.user!.id;
    const { title, description, category, propertyId } = req.body;

    if (!title || !description || !category) {
      res.status(400).json({ success: false, message: 'title, description, category required' });
      return;
    }

    // Find an active/confirmed booking to get tenantId
    let targetPropertyId = propertyId;
    let tenantId: any;

    if (targetPropertyId) {
      const prop = await Property.findById(targetPropertyId).lean();
      tenantId = prop ? (prop as any).tenantId : undefined;
    } else {
      const activeBooking = await Booking.findOne({
        guestId,
        status: { $in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      }).sort({ createdAt: -1 }).lean();

      if (!activeBooking) {
        res.status(400).json({ success: false, message: 'No active booking found to raise a complaint against' });
        return;
      }
      targetPropertyId = activeBooking.propertyId;
      const prop = await Property.findById(targetPropertyId).lean();
      tenantId = prop ? (prop as any).tenantId : undefined;
    }

    if (!tenantId) {
      res.status(400).json({ success: false, message: 'Could not resolve property owner' });
      return;
    }

    const complaint = await Complaint.create({
      tenantId,
      guestId: new mongoose.Types.ObjectId(guestId),
      propertyId: new mongoose.Types.ObjectId(String(targetPropertyId)),
      title, description, category, status: 'OPEN',
      statusHistory: [{ status: 'OPEN', note: 'Complaint raised by guest', changedBy: 'Guest', changedAt: new Date() }],
      internalNotes: [],
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    console.error('[guest] createGuestComplaint:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/guest/complaints ────────────────────────────────────────────────
export const getGuestComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guestId = req.user!.id;
    const complaints = await Complaint.find({ guestId })
      .populate('propertyId', 'name city')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: complaints });
  } catch (err) {
    console.error('[guest] getGuestComplaints:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/public/visit-requests (no auth needed) ────────────────────────
export const createVisitRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, propertyId, preferredDate, preferredTime } = req.body;
    if (!name || !phone || !propertyId) {
      res.status(400).json({ success: false, message: 'name, phone, propertyId required' });
      return;
    }
    // Stub — just log it (no VisitRequest model yet)
    console.log('[visit-request]', { name, phone, propertyId, preferredDate, preferredTime });
    res.json({ success: true, message: "We'll contact you shortly to confirm your visit!" });
  } catch (err) {
    console.error('[guest] createVisitRequest:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
