import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { Property } from '../models/Property.model';
import { Booking } from '../models/Booking.model';
import { RentRecord } from '../models/RentRecord.model';
import { Notification } from '../models/Notification.model';

// Helper to create notifications
const createNotification = async (userId: mongoose.Types.ObjectId, title: string, message: string) => {
  try {
    await Notification.create({
      userId,
      type: 'SYSTEM',
      title,
      message,
      channel: 'IN_APP',
      isRead: false
    });
  } catch (error) {
    console.error('Notification creation failed:', error);
  }
};

// ─── Platform Stats ───────────────────────────────────────────────────────────
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalOwners = await User.countDocuments({ role: 'PG_OWNER' });
    const totalProperties = await Property.countDocuments({});
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const totalBookings = await Booking.countDocuments({});
    const activeBookings = await Booking.countDocuments({ status: { $in: ['CONFIRMED', 'CHECKED_IN'] } });

    const payments = await RentRecord.find({ status: { $in: ['PAID', 'PARTIAL'] } }).select('paidAmount').lean();
    const platformRevenue = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    // Signups and bookings trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const users = await User.find({ createdAt: { $gte: sixMonthsAgo } }).select('createdAt').lean();
    const bookings = await Booking.find({ createdAt: { $gte: sixMonthsAgo } }).select('createdAt').lean();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendDataMap = new Map<string, { period: string; signups: number; bookings: number; key: string }>();

    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trendDataMap.set(key, {
        period: `${months[d.getMonth()]} ${d.getFullYear()}`,
        signups: 0,
        bookings: 0,
        key
      });
    }

    users.forEach(u => {
      const d = new Date(u.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (trendDataMap.has(key)) {
        trendDataMap.get(key)!.signups++;
      }
    });

    bookings.forEach(b => {
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (trendDataMap.has(key)) {
        trendDataMap.get(key)!.bookings++;
      }
    });

    const trends = Array.from(trendDataMap.values()).sort((a, b) => a.key.localeCompare(b.key));

    res.json({
      success: true,
      data: {
        stats: {
          totalOwners,
          totalProperties,
          totalStudents,
          totalBookings,
          activeBookings,
          platformRevenue
        },
        trends
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── User Management ──────────────────────────────────────────────────────────
export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    const query: any = { role: 'STUDENT' };
    if (q) {
      query.$or = [
        { name: { $regex: q as string, $options: 'i' } },
        { email: { $regex: q as string, $options: 'i' } },
        { phone: { $regex: q as string, $options: 'i' } },
      ];
    }
    const list = await User.find(query).select('-passwordHash -otp -otpExpiry').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getOwners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    const query: any = { role: 'PG_OWNER' };
    if (q) {
      query.$or = [
        { name: { $regex: q as string, $options: 'i' } },
        { email: { $regex: q as string, $options: 'i' } },
        { phone: { $regex: q as string, $options: 'i' } },
      ];
    }
    const list = await User.find(query).select('-passwordHash -otp -otpExpiry').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getManagers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    const query: any = { role: 'PROPERTY_MANAGER' };
    if (q) {
      query.$or = [
        { name: { $regex: q as string, $options: 'i' } },
        { email: { $regex: q as string, $options: 'i' } },
        { phone: { $regex: q as string, $options: 'i' } },
      ];
    }
    const list = await User.find(query).select('-passwordHash -otp -otpExpiry').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, message: `User account is now ${status.toLowerCase()}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Owner Verification ───────────────────────────────────────────────────────
export const verifyOwner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid verification status' });
      return;
    }

    const user = await User.findById(id);
    if (!user || user.role !== 'PG_OWNER') {
      res.status(404).json({ success: false, message: 'PG Owner not found' });
      return;
    }

    user.ownerVerificationStatus = status;
    if (status === 'APPROVED') {
      user.ownerRejectionReason = '';
      await createNotification(user._id, 'Business Verification Approved', 'Congratulations! Your PG Owner business credentials have been approved.');
    } else {
      user.ownerRejectionReason = reason || '';
      await createNotification(user._id, 'Business Verification Rejected', `Your business verification was rejected. Reason: ${reason}`);
    }

    await user.save();
    res.json({ success: true, message: `Owner verification completed: ${status.toLowerCase()}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Property Verification ────────────────────────────────────────────────────
export const getPendingProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await Property.find({ verificationStatus: 'PENDING' })
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const verifyProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid verification status' });
      return;
    }

    const prop = await Property.findById(id);
    if (!prop) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }

    prop.verificationStatus = status;
    if (status === 'APPROVED') {
      prop.rejectionReason = '';
      await createNotification(prop.ownerId, 'Property Approved', `Your property "${prop.name}" has been approved and is now live in the marketplace.`);
    } else {
      prop.rejectionReason = reason || '';
      await createNotification(prop.ownerId, 'Property Verification Rejected', `Your property "${prop.name}" was rejected. Reason: ${reason}`);
    }

    await prop.save();
    res.json({ success: true, message: `Property verification completed: ${status.toLowerCase()}`, data: prop });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Booking & Payment Monitoring ─────────────────────────────────────────────
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q, status } = req.query;
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const list = await Booking.find(query)
      .populate('studentId', 'name email phone')
      .populate('propertyId', 'name city')
      .populate('roomId', 'roomNumber')
      .populate('bedId', 'bedNumber')
      .sort({ createdAt: -1 })
      .lean();

    let records = list;
    if (q) {
      const searchStr = (q as string).toLowerCase();
      records = list.filter((b: any) =>
        b.studentId?.name?.toLowerCase().includes(searchStr) ||
        b.studentId?.email?.toLowerCase().includes(searchStr) ||
        b.propertyId?.name?.toLowerCase().includes(searchStr)
      );
    }

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAllPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q, status } = req.query;
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const list = await RentRecord.find(query)
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'propertyId', select: 'name city gender' },
          { path: 'roomId', select: 'roomNumber roomType' }
        ]
      })
      .populate('studentId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    let records = list;
    if (q) {
      const searchStr = (q as string).toLowerCase();
      records = list.filter((p: any) =>
        p.studentId?.name?.toLowerCase().includes(searchStr) ||
        p.studentId?.email?.toLowerCase().includes(searchStr) ||
        p.bookingId?.propertyId?.name?.toLowerCase().includes(searchStr)
      );
    }

    // Analytics: Revenue by city & Revenue by room sharing type
    const cityRev: Record<string, number> = {};
    const typeRev: Record<string, number> = {};

    list.forEach((p: any) => {
      if (p.status !== 'PAID' && p.status !== 'PARTIAL') return;
      const city = p.bookingId?.propertyId?.city || 'Pune';
      const type = p.bookingId?.roomId?.roomType || 'DOUBLE';
      cityRev[city] = (cityRev[city] || 0) + (p.paidAmount || 0);
      typeRev[type] = (typeRev[type] || 0) + (p.paidAmount || 0);
    });

    const revenueByCity = Object.entries(cityRev).map(([city, revenue]) => ({ name: city, value: revenue }));
    const revenueBySharingType = Object.entries(typeRev).map(([sharingType, revenue]) => ({ name: sharingType.replace('_', ' '), value: revenue }));

    res.json({
      success: true,
      data: {
        records,
        analytics: {
          revenueByCity,
          revenueBySharingType
        }
      }
    });
  } catch (error) {
    console.error('All payments error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
