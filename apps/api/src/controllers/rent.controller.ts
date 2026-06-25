import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { RentRecord } from '../models/RentRecord.model';
import { Booking } from '../models/Booking.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { Notification } from '../models/Notification.model';
import { Property } from '../models/Property.model';
import { User } from '../models/User.model';

// ─── helpers ─────────────────────────────────────────────────────────────────
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
const startOfLastMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() - 1, 1);
const endOfLastMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59);

// ─── Rent Dashboard Stats ─────────────────────────────────────────────────────
export const getRentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();

    const [thisMonthColl, lastMonthColl, dueAgg, pendingCount] = await Promise.all([
      // This month collected
      RentRecord.aggregate([
        { $match: { paidAt: { $gte: startOfMonth(now), $lte: endOfMonth(now) }, status: { $in: ['PAID', 'PARTIAL'] } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      // Last month collected
      RentRecord.aggregate([
        { $match: { paidAt: { $gte: startOfLastMonth(now), $lte: endOfLastMonth(now) }, status: { $in: ['PAID', 'PARTIAL'] } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      // Due (unpaid + partial remaining)
      RentRecord.aggregate([
        { $match: { status: { $in: ['UNPAID', 'PARTIAL'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } },
      ]),
      // Pending count
      RentRecord.countDocuments({ status: 'UNPAID' }),
    ]);

    const thisMonth = thisMonthColl[0]?.total || 0;
    const lastMonth = lastMonthColl[0]?.total || 0;
    const trendPct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalCollection: thisMonth,
        lastMonthCollection: lastMonth,
        trendPercent: trendPct,
        dueCollection: dueAgg[0]?.total || 0,
        pendingCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── List Rent Records ────────────────────────────────────────────────────────
export const getRentRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, status, search, from, to, page = 1, limit = 25 } = req.query;

    // Build base filter
    const filter: any = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.dueDate = {};
      if (from) filter.dueDate.$gte = new Date(from as string);
      if (to) filter.dueDate.$lte = new Date(to as string);
    }

    // If searching by student name, resolve studentIds first
    if (search) {
      const users = await User.find({ name: { $regex: search, $options: 'i' }, role: 'STUDENT' }).select('_id');
      filter.hostelStudentId = { $in: users.map(u => u._id) };
    }

    // If filtering by property, resolve bookingIds
    if (propertyId) {
      const bookings = await Booking.find({ propertyId }).select('_id');
      filter.bookingId = { $in: bookings.map(b => b._id) };
    }

    const [records, total] = await Promise.all([
      RentRecord.find(filter)
        .sort({ dueDate: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('hostelStudentId', 'name email phone')
        .populate({
          path: 'bookingId',
          populate: [
            { path: 'propertyId', select: 'name city' },
            { path: 'roomId', select: 'roomNumber' },
            { path: 'bedId', select: 'bedNumber' },
          ],
        })
        .lean(),
      RentRecord.countDocuments(filter),
    ]);

    res.json({ success: true, data: records, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get Single Rent Record (for receipt) ────────────────────────────────────
export const getRentRecordById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const record = await RentRecord.findById(req.params.id)
      .populate('hostelStudentId', 'name email phone')
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'propertyId', select: 'name city address' },
          { path: 'roomId', select: 'roomNumber roomType' },
          { path: 'bedId', select: 'bedNumber' },
        ],
      })
      .lean();

    if (!record) { res.status(404).json({ success: false, message: 'Record not found' }); return; }
    res.json({ success: true, data: record });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Record Payment ───────────────────────────────────────────────────────────
export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentAmount, paymentMethod, paidAt, notes } = req.body;

    if (!paymentAmount || paymentAmount <= 0) {
      res.status(400).json({ success: false, message: 'Payment amount must be > 0' }); return;
    }

    const record = await RentRecord.findById(id);
    if (!record) { res.status(404).json({ success: false, message: 'Rent record not found' }); return; }
    if (record.status === 'PAID') {
      res.status(400).json({ success: false, message: 'This rent is already fully paid' }); return;
    }

    const newPaidAmount = record.paidAmount + Number(paymentAmount);
    const newStatus = newPaidAmount >= record.amount ? 'PAID' : 'PARTIAL';

    record.paidAmount = Math.min(newPaidAmount, record.amount); // cap at amount
    record.status = newStatus;
    record.paidAt = paidAt ? new Date(paidAt) : new Date();
    record.paymentMethod = paymentMethod || 'CASH';
    if (notes) record.notes = notes;
    await record.save();

    res.json({
      success: true,
      data: record,
      remaining: Math.max(0, record.amount - record.paidAmount),
      message: newStatus === 'PAID' ? 'Rent fully paid! ✅' : `Partial payment recorded. ₹${record.amount - record.paidAmount} remaining.`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Preview Monthly Rent Generation ─────────────────────────────────────────
export const previewRentGeneration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activeBookings = await Booking.find({ status: 'CHECKED_IN' })
      .populate('studentId', 'name')
      .populate('propertyId', 'name')
      .lean();

    const now = new Date();
    const dueDateNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Check which students already have a rent record for next month
    const existing = await RentRecord.find({
      dueDate: {
        $gte: startOfMonth(dueDateNext),
        $lte: endOfMonth(dueDateNext),
      },
    }).distinct('hostelStudentId');

    const pendingBookings = activeBookings.filter(
      b => !existing.some(id => String(id) === String(b.guestId))
    );

    const estimatedTotal = pendingBookings.length * 7500; // default rent

    res.json({
      success: true,
      data: {
        totalStudents: pendingBookings.length,
        estimatedTotal,
        targetMonth: dueDateNext.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
        bookings: pendingBookings.slice(0, 10), // preview first 10
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Generate Monthly Rent ────────────────────────────────────────────────────
export const generateMonthlyRent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rentAmount = 7500 } = req.body;
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const activeBookings = await Booking.find({ status: 'CHECKED_IN' }).lean();

    const existing = await RentRecord.find({
      dueDate: { $gte: startOfMonth(dueDate), $lte: endOfMonth(dueDate) },
    }).distinct('hostelStudentId');

    const toCreate = activeBookings.filter(
      b => !existing.some(id => String(id) === String(b.guestId))
    );

    if (toCreate.length === 0) {
      res.json({ success: true, message: 'Rent already generated for all active tenants this month.', created: 0 });
      return;
    }

    const now2 = new Date();
    const monthStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
    const records = toCreate.map(b => ({
      tenantId: b.tenantId,
      propertyId: b.propertyId,
      hostelStudentId: b.guestId,
      bookingId: b._id,
      month: monthStr,
      amount: Number(rentAmount),
      dueDate,
      status: 'UNPAID',
      paidAmount: 0,
      fine: 0,
    }));

    await RentRecord.insertMany(records);

    res.json({
      success: true,
      message: `Rent generated for ${toCreate.length} tenants.`,
      created: toCreate.length,
      totalAmount: toCreate.length * Number(rentAmount),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Send Reminder (stub) ─────────────────────────────────────────────────────
export const sendReminder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const record = await RentRecord.findById(id).populate('hostelStudentId', 'name').lean();
    if (!record) { res.status(404).json({ success: false, message: 'Record not found' }); return; }

    await Notification.create({
      userId: record.hostelStudentId,
      type: 'PAYMENT',
      title: '🔔 Rent Payment Reminder',
      message: `Your rent of ₹${(record.amount - record.paidAmount).toLocaleString('en-IN')} is due. Please pay at the earliest.`,
      channel: 'IN_APP',
      isRead: false,
    });

    res.json({ success: true, message: `Reminder sent to ${(record.hostelStudentId as any)?.name}` });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
