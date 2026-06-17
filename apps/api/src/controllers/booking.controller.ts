import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Booking } from '../models/Booking.model';
import { Bed } from '../models/Bed.model';
import { Room } from '../models/Room.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { RentRecord } from '../models/RentRecord.model';
import { Notification } from '../models/Notification.model';
import { User } from '../models/User.model';

// ─── Get Booking Detail ───────────────────────────────────────────────────────
export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('studentId', 'name email phone')
      .populate('propertyId', 'name city address')
      .populate('roomId', 'roomNumber roomType capacity')
      .populate('bedId', 'bedNumber bedType status')
      .lean();

    if (!booking) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }

    const profile = await StudentProfile.findOne({ userId: booking.studentId }).lean();

    res.json({ success: true, data: { ...booking, profile } });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get Available Beds (for bed override in check-in) ───────────────────────
export const getAvailableBedsForProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const { roomType } = req.query;

    const roomFilter: any = { propertyId: new mongoose.Types.ObjectId(propertyId) };
    if (roomType) roomFilter.roomType = roomType;

    const rooms = await Room.find(roomFilter).lean();
    const roomIds = rooms.map(r => r._id);
    const beds = await Bed.find({ roomId: { $in: roomIds }, status: 'AVAILABLE' })
      .populate('roomId', 'roomNumber roomType floorId')
      .lean();

    res.json({ success: true, data: beds });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Process Check-In ─────────────────────────────────────────────────────────
export const processCheckIn = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params; // bookingId
    const { bedId, rentAmount, rentDueDate, documentVerification } = req.body;

    const booking = await Booking.findById(id).session(session);
    if (!booking) { await session.abortTransaction(); res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: `Cannot check-in a booking with status ${booking.status}` });
      return;
    }

    const finalBedId = bedId || booking.bedId;

    // Validate bed is available
    const bed = await Bed.findById(finalBedId).session(session);
    if (!bed) { await session.abortTransaction(); res.status(404).json({ success: false, message: 'Bed not found' }); return; }
    if (bed.status !== 'AVAILABLE' && String(bed._id) !== String(booking.bedId)) {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: 'Selected bed is not available' });
      return;
    }

    // 1. Update booking
    booking.status = 'CHECKED_IN';
    booking.bedId = new mongoose.Types.ObjectId(String(finalBedId));
    await booking.save({ session });

    // 2. Update bed status
    await Bed.findByIdAndUpdate(finalBedId, { status: 'OCCUPIED' }, { session });

    // 3. Update StudentProfile
    await StudentProfile.findOneAndUpdate(
      { userId: booking.studentId },
      {
        currentPropertyId: booking.propertyId,
        currentRoomId: booking.roomId,
        currentBedId: finalBedId,
      },
      { session, upsert: true }
    );

    // 4. Create first RentRecord
    const dueDate = rentDueDate ? new Date(rentDueDate) : (() => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      return d;
    })();

    await RentRecord.create([{
      studentId: booking.studentId,
      bookingId: booking._id,
      amount: rentAmount || 7000,
      dueDate,
      status: 'UNPAID',
      paidAmount: 0,
    }], { session });

    // 5. Stub notification to student
    await Notification.create([{
      userId: booking.studentId,
      type: 'BOOKING',
      title: 'Check-In Confirmed ✅',
      message: `Your check-in has been processed. Welcome to your new home!`,
      channel: 'IN_APP',
      isRead: false,
    }], { session });

    await session.commitTransaction();

    res.json({ success: true, message: 'Check-in processed successfully', bookingId: booking._id });
  } catch (error) {
    await session.abortTransaction();
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    session.endSession();
  }
};

// ─── Process Check-Out ────────────────────────────────────────────────────────
export const processCheckOut = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params; // bookingId
    const { checkoutDate, overrideReason } = req.body;

    const booking = await Booking.findById(id).session(session);
    if (!booking) { await session.abortTransaction(); res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    if (booking.status !== 'CHECKED_IN') {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: 'Only CHECKED_IN bookings can be checked out' });
      return;
    }

    // Check outstanding dues
    const unpaidRent = await RentRecord.find({
      bookingId: booking._id,
      status: { $in: ['UNPAID', 'PARTIAL'] },
    }).session(session);

    const totalDues = unpaidRent.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);

    if (totalDues > 0 && !overrideReason) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: `Outstanding dues of ₹${totalDues}. Provide an override reason to proceed.`,
        dues: totalDues,
        unpaidRecords: unpaidRent,
      });
      return;
    }

    // 1. Update booking
    booking.status = 'CHECKED_OUT';
    await booking.save({ session });

    // 2. Free the bed
    await Bed.findByIdAndUpdate(booking.bedId, { status: 'AVAILABLE' }, { session });

    // 3. Clear StudentProfile current stay
    await StudentProfile.findOneAndUpdate(
      { userId: booking.studentId },
      { currentPropertyId: null, currentRoomId: null, currentBedId: null },
      { session }
    );

    // 4. Notification to student
    await Notification.create([{
      userId: booking.studentId,
      type: 'BOOKING',
      title: 'Check-Out Confirmed',
      message: `Your check-out on ${checkoutDate || new Date().toLocaleDateString()} has been recorded. Thank you for staying with us!`,
      channel: 'IN_APP',
      isRead: false,
    }], { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Check-out processed successfully',
      duesOverridden: totalDues > 0,
      overrideReason: overrideReason || null,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    session.endSession();
  }
};

// ─── Check Outstanding Dues ───────────────────────────────────────────────────
export const checkDues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // bookingId
    const unpaidRent = await RentRecord.find({
      bookingId: id,
      status: { $in: ['UNPAID', 'PARTIAL'] },
    }).lean();

    const totalDues = unpaidRent.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);
    res.json({ success: true, data: { totalDues, unpaidRecords: unpaidRent } });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Create Booking (manual/admin) ───────────────────────────────────────────
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, propertyId, roomId, bedId } = req.body;
    if (!studentId || !propertyId || !roomId || !bedId) {
      res.status(400).json({ success: false, message: 'studentId, propertyId, roomId, bedId required' });
      return;
    }

    // Mark bed as reserved
    await Bed.findByIdAndUpdate(bedId, { status: 'RESERVED' });

    const booking = await Booking.create({
      studentId, propertyId, roomId, bedId, status: 'PENDING', documents: [],
    });

    res.status(201).json({ success: true, data: booking });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
