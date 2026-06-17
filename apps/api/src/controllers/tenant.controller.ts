import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { Booking } from '../models/Booking.model';
import { RentRecord } from '../models/RentRecord.model';
import { Complaint } from '../models/Complaint.model';
import { Property } from '../models/Property.model';

// ─── List Tenants ─────────────────────────────────────────────────────────────
export const getTenants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, propertyId, status, page = 1, limit = 20 } = req.query;

    // Build student user filter
    const userFilter: any = { role: 'STUDENT' };
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(userFilter).select('-passwordHash -otp -otpExpiry').lean();
    const studentIds = students.map(s => s._id);

    // Get student profiles with current stay info
    const profileFilter: any = { userId: { $in: studentIds } };
    if (propertyId) profileFilter.currentPropertyId = new mongoose.Types.ObjectId(propertyId as string);

    const profiles = await StudentProfile.find(profileFilter)
      .populate('userId', 'name email phone status')
      .populate('currentPropertyId', 'name city')
      .populate('currentRoomId', 'roomNumber roomType')
      .populate('currentBedId', 'bedNumber status')
      .lean();

    // Enrich with latest booking & rent
    const enriched = await Promise.all(
      profiles.map(async (profile: any) => {
        const latestBooking = await Booking.findOne({ studentId: profile.userId._id })
          .sort({ createdAt: -1 })
          .populate('propertyId', 'name city')
          .populate('roomId', 'roomNumber')
          .populate('bedId', 'bedNumber')
          .lean();

        const latestRent = await RentRecord.findOne({ studentId: profile.userId._id })
          .sort({ dueDate: -1 })
          .lean();

        // Determine display status
        let displayStatus = 'NO_BOOKING';
        if (latestBooking?.status === 'CHECKED_IN') displayStatus = 'ACTIVE';
        else if (latestBooking?.status === 'CHECKED_OUT') displayStatus = 'CHECKED_OUT';
        else if (latestBooking?.status === 'PENDING') displayStatus = 'PENDING';
        else if (latestBooking?.status === 'CONFIRMED') displayStatus = 'CONFIRMED';

        if (status && displayStatus !== status) return null;

        return {
          ...profile,
          latestBooking,
          latestRent,
          displayStatus,
        };
      })
    );

    const filtered = enriched.filter(Boolean);
    const total = filtered.length;
    const paginated = filtered.slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));

    res.json({ success: true, data: paginated, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get Tenant Detail ────────────────────────────────────────────────────────
export const getTenantById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // studentId (user _id)

    const user = await User.findById(id).select('-passwordHash -otp -otpExpiry').lean();
    if (!user) { res.status(404).json({ success: false, message: 'Student not found' }); return; }

    const profile = await StudentProfile.findOne({ userId: id })
      .populate('currentPropertyId', 'name city address')
      .populate('currentRoomId', 'roomNumber roomType')
      .populate('currentBedId', 'bedNumber bedType status')
      .lean();

    const bookings = await Booking.find({ studentId: id })
      .sort({ createdAt: -1 })
      .populate('propertyId', 'name city')
      .populate('roomId', 'roomNumber roomType')
      .populate('bedId', 'bedNumber')
      .lean();

    const rentRecords = await RentRecord.find({ studentId: id })
      .sort({ dueDate: -1 })
      .lean();

    const complaints = await Complaint.find({ studentId: id })
      .sort({ createdAt: -1 })
      .populate('propertyId', 'name')
      .lean();

    res.json({
      success: true,
      data: { user, profile, bookings, rentRecords, complaints },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── List Pending Bookings (for check-in processing) ─────────────────────────
export const getPendingBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.query;
    const filter: any = { status: 'PENDING' };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId as string);

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .populate('studentId', 'name email phone')
      .populate('propertyId', 'name city')
      .populate('roomId', 'roomNumber roomType capacity')
      .populate('bedId', 'bedNumber status')
      .lean();

    res.json({ success: true, data: bookings });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
