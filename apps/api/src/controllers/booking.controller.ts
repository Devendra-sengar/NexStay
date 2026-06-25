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
import { Property } from '../models/Property.model';

// ─── DB Session Helper ───────────────────────────────────────────────────────
const startDbSession = async () => {
  try {
    if (!mongoose.connection.db) return null;
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (hello && hello.setName) {
      const session = await mongoose.startSession();
      session.startTransaction();
      return session;
    }
  } catch (error: any) {
    console.warn('MongoDB transaction initialization skipped (standalone/no replica set):', error.message);
  }
  return null;
};

// ─── Get Booking Detail ───────────────────────────────────────────────────────
export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('guestId', 'name email phone')
      .populate('propertyId', 'name city address')
      .populate('roomId', 'roomNumber roomType capacity')
      .populate('bedId', 'bedNumber bedType status')
      .lean();

    if (!booking) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }

    const profile = await StudentProfile.findOne({ userId: booking.guestId }).lean();

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
  const session = await startDbSession();
  try {
    const { id } = req.params; // bookingId
    const { bedId, rentAmount, rentDueDate, documentVerification } = req.body;

    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      if (session) await session.abortTransaction();
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      if (session) await session.abortTransaction();
      res.status(400).json({ success: false, message: `Cannot check-in a booking with status ${booking.status}` });
      return;
    }

    const finalBedId = bedId || booking.bedId;

    // Validate bed is available
    const bed = await Bed.findById(finalBedId).session(session);
    if (!bed) {
      if (session) await session.abortTransaction();
      res.status(404).json({ success: false, message: 'Bed not found' });
      return;
    }
    if (bed.status !== 'AVAILABLE' && String(bed._id) !== String(booking.bedId)) {
      if (session) await session.abortTransaction();
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
      { userId: booking.guestId },
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

    const monthStr2 = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
    await RentRecord.create([{
      tenantId: booking.tenantId,
      propertyId: booking.propertyId,
      hostelStudentId: booking.guestId,
      bookingId: booking._id,
      month: monthStr2,
      amount: rentAmount || 7000,
      dueDate,
      status: 'UNPAID',
      paidAmount: 0,
      fine: 0,
    }], { session });

    // 5. Stub notification to guest
    await Notification.create([{
      userId: booking.guestId,
      type: 'BOOKING',
      title: 'Check-In Confirmed ✅',
      message: `Your check-in has been processed. Welcome to your new home!`,
      channel: 'IN_APP',
      isRead: false,
    }], { session });

    if (session) await session.commitTransaction();

    res.json({ success: true, message: 'Check-in processed successfully', bookingId: booking._id });
  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (session) session.endSession();
  }
};

// ─── Process Check-Out ────────────────────────────────────────────────────────
export const processCheckOut = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await startDbSession();
  try {
    const { id } = req.params; // bookingId
    const { checkoutDate, overrideReason } = req.body;

    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      if (session) await session.abortTransaction();
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }
    if (booking.status !== 'CHECKED_IN') {
      if (session) await session.abortTransaction();
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
      if (session) await session.abortTransaction();
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
      { userId: booking.guestId },
      { currentPropertyId: null, currentRoomId: null, currentBedId: null },
      { session }
    );

    // 4. Notification to guest
    await Notification.create([{
      userId: booking.guestId,
      type: 'BOOKING',
      title: 'Check-Out Confirmed',
      message: `Your check-out on ${checkoutDate || new Date().toLocaleDateString()} has been recorded. Thank you for staying with us!`,
      channel: 'IN_APP',
      isRead: false,
    }], { session });

    if (session) await session.commitTransaction();

    res.json({
      success: true,
      message: 'Check-out processed successfully',
      duesOverridden: totalDues > 0,
      overrideReason: overrideReason || null,
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (session) session.endSession();
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
      guestId: studentId, tenantId: studentId, propertyId, roomId, bedId, status: 'PENDING',
      monthlyRent: 0,
    });

    res.status(201).json({ success: true, data: booking });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Create Booking (Student Flow) ──────────────────────────────────────────
export const createStudentBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await startDbSession();
  try {
    const { propertyId, roomId, bedId, guardianName, guardianPhone, documents } = req.body;
    const guestId = req.user!.id;

    if (!propertyId || !roomId || !bedId) {
      if (session) await session.abortTransaction();
      res.status(400).json({ success: false, message: 'propertyId, roomId, bedId are required' });
      return;
    }

    // Check if bed is available
    const bed = await Bed.findById(bedId).session(session);
    if (!bed) {
      if (session) await session.abortTransaction();
      res.status(404).json({ success: false, message: 'Bed not found' });
      return;
    }
    if (bed.status !== 'AVAILABLE') {
      if (session) await session.abortTransaction();
      res.status(400).json({ success: false, message: 'Selected bed is not available' });
      return;
    }

    // Mark bed as RESERVED
    bed.status = 'RESERVED';
    await bed.save({ session });

    // Upsert student profile with documents and guardian details
    await StudentProfile.findOneAndUpdate(
      { userId: guestId },
      {
        guardianName: guardianName || '',
        guardianPhone: guardianPhone || '',
        documents: {
          aadhaar: documents?.aadhaar || '',
          studentId: documents?.studentId || '',
          photo: documents?.photo || '',
        }
      },
      { session, upsert: true }
    );

    const property = await Property.findById(propertyId).session(session);
    // Create booking
    const booking = await Booking.create([{
      guestId,
      tenantId: property?.tenantId || guestId,
      propertyId,
      roomId,
      bedId,
      status: 'PENDING',
      monthlyRent: 0,
      paymentId: 'MOCK_PAY_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    }], { session });

    // Notify the guest
    await Notification.create([{
      userId: guestId,
      type: 'BOOKING',
      title: 'Booking Placed 📋',
      message: 'Your booking has been placed and is pending approval/check-in.',
      channel: 'IN_APP',
      isRead: false,
    }], { session });

    // Notify the property owner/manager
    if (property) {
      const guestUser = await User.findById(guestId).session(session);
      const guestName = guestUser ? guestUser.name : req.user!.email;
      await Notification.create([{
        userId: property.tenantId,
        type: 'BOOKING',
        title: 'New Booking Request 🔔',
        message: `A new booking request has been placed for ${property.name} by ${guestName}.`,
        channel: 'IN_APP',
        isRead: false,
      }], { session });
    }

    if (session) await session.commitTransaction();
    res.status(201).json({ success: true, data: booking[0] });
  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Create student booking error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (session) session.endSession();
  }
};

// ─── Get Student Bookings ───────────────────────────────────────────────────
export const getStudentBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guestId2 = req.user!.id;
    const bookings = await Booking.find({ guestId: guestId2 })
      .populate('propertyId', 'name city address images')
      .populate('roomId', 'roomNumber roomType rentPerBed')
      .populate('bedId', 'bedNumber bedType')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get student bookings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

