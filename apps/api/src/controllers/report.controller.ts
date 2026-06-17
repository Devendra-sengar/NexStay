import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Property } from '../models/Property.model';
import { Room } from '../models/Room.model';
import { Bed } from '../models/Bed.model';
import { Booking } from '../models/Booking.model';
import { RentRecord } from '../models/RentRecord.model';
import { Expense } from '../models/Expense.model';

// ─── Occupancy Report ──────────────────────────────────────────────────────────
export const getOccupancyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const role = req.user!.role;
    const { propertyId, date } = req.query;

    const propertyFilter: any = {};
    if (role === 'PG_OWNER') {
      propertyFilter.ownerId = new mongoose.Types.ObjectId(userId);
    }

    const properties = await Property.find(propertyFilter).select('_id name').lean();
    const propertyIds = properties.map(p => p._id);
    const propertyMap = new Map(properties.map(p => [String(p._id), p.name]));

    let targetPropertyIds = propertyIds;
    if (propertyId) {
      const targetId = new mongoose.Types.ObjectId(propertyId as string);
      if (role === 'PG_OWNER' && !propertyIds.some(id => String(id) === String(targetId))) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }
      targetPropertyIds = [targetId];
    }

    // Fetch rooms and beds
    const rooms = await Room.find({ propertyId: { $in: targetPropertyIds } }).lean();
    const roomIds = rooms.map(r => r._id);
    const roomMap = new Map(rooms.map(r => [String(r._id), r]));

    const beds = await Bed.find({ roomId: { $in: roomIds } }).lean();
    const bedIds = beds.map(b => b._id);

    let totalBeds = beds.length;
    let occupiedBeds = 0;
    let reservedBeds = 0;
    let vacantBeds = 0;

    const bedStatusMap = new Map<string, string>(); // bedId -> status string

    if (date) {
      const targetDate = new Date(date as string);
      // Fetch bookings active on targetDate
      const activeBookings = await Booking.find({
        bedId: { $in: bedIds },
        createdAt: { $lte: targetDate },
        status: { $in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'PENDING'] }
      }).lean();

      // Filter out bookings that checked out before targetDate
      const currentActive = activeBookings.filter(b => {
        if (b.status === 'CHECKED_OUT' && b.updatedAt <= targetDate) {
          return false;
        }
        if (b.status === 'CANCELLED' && b.updatedAt <= targetDate) {
          return false;
        }
        return true;
      });

      currentActive.forEach(b => {
        if (b.status === 'CHECKED_IN') {
          bedStatusMap.set(String(b.bedId), 'OCCUPIED');
        } else {
          bedStatusMap.set(String(b.bedId), 'RESERVED');
        }
      });

      beds.forEach(b => {
        const status = bedStatusMap.get(String(b._id)) || 'AVAILABLE';
        if (status === 'OCCUPIED') occupiedBeds++;
        else if (status === 'RESERVED') reservedBeds++;
        else vacantBeds++;
      });
    } else {
      beds.forEach(b => {
        if (b.status === 'OCCUPIED') occupiedBeds++;
        else if (b.status === 'RESERVED') reservedBeds++;
        else vacantBeds++;
      });
    }

    // Property Breakdown
    const propertyStats = new Map<string, { total: number, occupied: number, reserved: number, vacant: number }>();
    targetPropertyIds.forEach(id => {
      propertyStats.set(String(id), { total: 0, occupied: 0, reserved: 0, vacant: 0 });
    });

    beds.forEach(b => {
      const room = roomMap.get(String(b.roomId));
      if (!room) return;
      const propId = String(room.propertyId);
      const stats = propertyStats.get(propId) || { total: 0, occupied: 0, reserved: 0, vacant: 0 };
      stats.total++;
      
      const status = date ? (bedStatusMap.get(String(b._id)) || 'AVAILABLE') : b.status;
      if (status === 'OCCUPIED') stats.occupied++;
      else if (status === 'RESERVED') stats.reserved++;
      else stats.vacant++;
      
      propertyStats.set(propId, stats);
    });

    const propertiesBreakdown = Array.from(propertyStats.entries()).map(([propId, stats]) => {
      const name = propertyMap.get(propId) || 'Unknown';
      const rate = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;
      return {
        propertyId: propId,
        name,
        totalBeds: stats.total,
        occupiedBeds: stats.occupied,
        reservedBeds: stats.reserved,
        vacantBeds: stats.vacant,
        occupancyRate: rate,
      };
    });

    // Room Type Breakdown
    const roomTypeStats = new Map<string, { total: number, occupied: number, reserved: number, vacant: number }>();
    beds.forEach(b => {
      const room = roomMap.get(String(b.roomId));
      if (!room) return;
      const type = room.roomType || 'SINGLE';
      const stats = roomTypeStats.get(type) || { total: 0, occupied: 0, reserved: 0, vacant: 0 };
      stats.total++;
      
      const status = date ? (bedStatusMap.get(String(b._id)) || 'AVAILABLE') : b.status;
      if (status === 'OCCUPIED') stats.occupied++;
      else if (status === 'RESERVED') stats.reserved++;
      else stats.vacant++;
      
      roomTypeStats.set(type, stats);
    });

    const roomTypeBreakdown = Array.from(roomTypeStats.entries()).map(([roomType, stats]) => {
      const rate = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;
      return {
        roomType,
        totalBeds: stats.total,
        occupiedBeds: stats.occupied,
        reservedBeds: stats.reserved,
        vacantBeds: stats.vacant,
        occupancyRate: rate,
      };
    });

    res.json({
      success: true,
      data: {
        totalBeds,
        occupiedBeds,
        reservedBeds,
        vacantBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        propertiesBreakdown,
        roomTypeBreakdown
      }
    });
  } catch (error) {
    console.error('Occupancy report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Revenue Report ───────────────────────────────────────────────────────────
export const getRevenueReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const role = req.user!.role;
    const { propertyId, startDate, endDate } = req.query;

    const propertyFilter: any = {};
    if (role === 'PG_OWNER') {
      propertyFilter.ownerId = new mongoose.Types.ObjectId(userId);
    }

    const properties = await Property.find(propertyFilter).select('_id').lean();
    const propertyIds = properties.map(p => p._id);

    let targetPropertyIds = propertyIds;
    if (propertyId) {
      const targetId = new mongoose.Types.ObjectId(propertyId as string);
      if (role === 'PG_OWNER' && !propertyIds.some(id => String(id) === String(targetId))) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }
      targetPropertyIds = [targetId];
    }

    // Bookings for target properties
    const bookings = await Booking.find({ propertyId: { $in: targetPropertyIds } }).select('_id').lean();
    const bookingIds = bookings.map(b => b._id);

    // Fetch RentRecords
    const rentQuery: any = { bookingId: { $in: bookingIds } };
    if (startDate || endDate) {
      rentQuery.dueDate = {};
      if (startDate) rentQuery.dueDate.$gte = new Date(startDate as string);
      if (endDate) rentQuery.dueDate.$lte = new Date(endDate as string);
    }
    const rentRecords = await RentRecord.find(rentQuery).lean();

    // Fetch Expenses
    const expenseQuery: any = { propertyId: { $in: targetPropertyIds } };
    if (startDate || endDate) {
      expenseQuery.date = {};
      if (startDate) expenseQuery.date.$gte = new Date(startDate as string);
      if (endDate) expenseQuery.date.$lte = new Date(endDate as string);
    }
    const expenses = await Expense.find(expenseQuery).lean();

    // Computations
    const collected = rentRecords.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    const due = rentRecords.reduce((sum, r) => sum + Math.max(0, r.amount - (r.paidAmount || 0)), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const net = collected - totalExpenses;

    // Monthly trends
    const monthlyData = new Map<string, { collected: number, due: number, expenses: number, net: number }>();
    rentRecords.forEach(r => {
      const d = new Date(r.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const stats = monthlyData.get(key) || { collected: 0, due: 0, expenses: 0, net: 0 };
      stats.collected += r.paidAmount || 0;
      stats.due += Math.max(0, r.amount - (r.paidAmount || 0));
      stats.net += r.paidAmount || 0;
      monthlyData.set(key, stats);
    });

    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const stats = monthlyData.get(key) || { collected: 0, due: 0, expenses: 0, net: 0 };
      stats.expenses += e.amount || 0;
      stats.net -= e.amount || 0;
      monthlyData.set(key, stats);
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBreakdown = Array.from(monthlyData.entries())
      .map(([key, val]) => {
        const [year, month] = key.split('-');
        const monthLabel = months[parseInt(month) - 1];
        return {
          period: `${monthLabel} ${year}`,
          key,
          collected: val.collected,
          due: val.due,
          expenses: val.expenses,
          net: val.net,
        };
      })
      .sort((a, b) => a.key.localeCompare(b.key));

    // Yearly trends
    const yearlyData = new Map<string, { collected: number, due: number, expenses: number, net: number }>();
    rentRecords.forEach(r => {
      const key = String(new Date(r.dueDate).getFullYear());
      const stats = yearlyData.get(key) || { collected: 0, due: 0, expenses: 0, net: 0 };
      stats.collected += r.paidAmount || 0;
      stats.due += Math.max(0, r.amount - (r.paidAmount || 0));
      stats.net += r.paidAmount || 0;
      yearlyData.set(key, stats);
    });

    expenses.forEach(e => {
      const key = String(new Date(e.date).getFullYear());
      const stats = yearlyData.get(key) || { collected: 0, due: 0, expenses: 0, net: 0 };
      stats.expenses += e.amount || 0;
      stats.net -= e.amount || 0;
      yearlyData.set(key, stats);
    });

    const yearlyBreakdown = Array.from(yearlyData.entries())
      .map(([key, val]) => ({
        period: key,
        collected: val.collected,
        due: val.due,
        expenses: val.expenses,
        net: val.net,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    res.json({
      success: true,
      data: {
        collected,
        due,
        expenses: totalExpenses,
        net,
        monthlyBreakdown,
        yearlyBreakdown
      }
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Booking Report ───────────────────────────────────────────────────────────
export const getBookingReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const role = req.user!.role;
    const { propertyId, startDate, endDate, status } = req.query;

    const propertyFilter: any = {};
    if (role === 'PG_OWNER') {
      propertyFilter.ownerId = new mongoose.Types.ObjectId(userId);
    }

    const properties = await Property.find(propertyFilter).select('_id').lean();
    const propertyIds = properties.map(p => p._id);

    let targetPropertyIds = propertyIds;
    if (propertyId) {
      const targetId = new mongoose.Types.ObjectId(propertyId as string);
      if (role === 'PG_OWNER' && !propertyIds.some(id => String(id) === String(targetId))) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }
      targetPropertyIds = [targetId];
    }

    const bookingQuery: any = { propertyId: { $in: targetPropertyIds } };
    if (startDate || endDate) {
      bookingQuery.createdAt = {};
      if (startDate) bookingQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) bookingQuery.createdAt.$lte = new Date(endDate as string);
    }

    const allBookingsInPeriod = await Booking.find(bookingQuery).lean();

    const funnel = {
      total: allBookingsInPeriod.length,
      pending: allBookingsInPeriod.filter(b => b.status === 'PENDING').length,
      confirmed: allBookingsInPeriod.filter(b => b.status === 'CONFIRMED').length,
      checkedIn: allBookingsInPeriod.filter(b => b.status === 'CHECKED_IN').length,
      checkedOut: allBookingsInPeriod.filter(b => b.status === 'CHECKED_OUT').length,
      cancelled: allBookingsInPeriod.filter(b => b.status === 'CANCELLED').length,
    };

    const listQuery = { ...bookingQuery };
    if (status) {
      listQuery.status = status;
    }

    const bookingsList = await Booking.find(listQuery)
      .populate('studentId', 'name email phone')
      .populate('propertyId', 'name')
      .populate('roomId', 'roomNumber')
      .populate('bedId', 'bedNumber')
      .sort({ createdAt: -1 })
      .lean();

    const records = bookingsList.map((b: any) => ({
      bookingId: b._id,
      studentName: b.studentId?.name || 'Unknown',
      studentEmail: b.studentId?.email || '',
      studentPhone: b.studentId?.phone || '',
      propertyName: b.propertyId?.name || 'Unknown',
      roomNumber: b.roomId?.roomNumber || '—',
      bedNumber: b.bedId?.bedNumber || '—',
      status: b.status,
      createdAt: b.createdAt,
    }));

    res.json({
      success: true,
      data: {
        funnel,
        records
      }
    });
  } catch (error) {
    console.error('Booking report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
