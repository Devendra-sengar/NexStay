import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Property } from '../models/Property.model';
import { Room } from '../models/Room.model';
import { Bed } from '../models/Bed.model';
import { Booking } from '../models/Booking.model';
import { RentRecord } from '../models/RentRecord.model';
import { Complaint } from '../models/Complaint.model';

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const role = req.user!.role;

    const propertyFilter = role === 'PG_OWNER'
      ? { ownerId: new mongoose.Types.ObjectId(userId) }
      : {};

    const properties = await Property.find(propertyFilter).select('_id');
    const propertyIds = properties.map(p => p._id);

    const [
      totalProperties,
      totalRooms,
      bedStats,
      monthlyRevenue,
      dueRent,
    ] = await Promise.all([
      Property.countDocuments(propertyFilter),
      Room.countDocuments({ propertyId: { $in: propertyIds } }),
      Bed.aggregate([
        { $match: { roomId: { $in: await Room.find({ propertyId: { $in: propertyIds } }).distinct('_id') } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      RentRecord.aggregate([
        {
          $match: {
            status: { $in: ['PAID', 'PARTIAL'] },
            paidAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              $lte: new Date(),
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      RentRecord.aggregate([
        { $match: { status: { $in: ['UNPAID', 'PARTIAL'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } },
      ]),
    ]);

    const bedStatusMap: Record<string, number> = {};
    bedStats.forEach((b: any) => { bedStatusMap[b._id] = b.count; });

    const totalBeds = Object.values(bedStatusMap).reduce((a, b) => a + b, 0);
    const occupiedBeds = (bedStatusMap['OCCUPIED'] || 0) + (bedStatusMap['RESERVED'] || 0);
    const vacantBeds = bedStatusMap['AVAILABLE'] || 0;

    res.json({
      success: true,
      data: {
        totalProperties,
        totalRooms,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        dueRent: dueRent[0]?.total || 0,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Revenue Chart (last 6 months) ──────────────────────────────────────────
export const getRevenueChart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const data = await RentRecord.aggregate([
      { $match: { status: { $in: ['PAID', 'PARTIAL'] }, paidAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          revenue: { $sum: '$paidAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const chart = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const found = data.find((r: any) => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1);
      chart.push({ month: months[d.getMonth()], revenue: found?.revenue || 0 });
    }

    res.json({ success: true, data: chart });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Recent Bookings ─────────────────────────────────────────────────────────
export const getRecentBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('studentId', 'name email')
      .populate('propertyId', 'name city')
      .populate('roomId', 'roomNumber')
      .lean();

    res.json({ success: true, data: bookings });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Recent Complaints ───────────────────────────────────────────────────────
export const getRecentComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('studentId', 'name')
      .populate('propertyId', 'name')
      .lean();

    res.json({ success: true, data: complaints });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
