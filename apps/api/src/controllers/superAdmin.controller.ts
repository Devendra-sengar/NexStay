import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { Property } from '../models/Property.model';
import { Booking } from '../models/Booking.model';
import { RentRecord } from '../models/RentRecord.model';
import { notify } from '../services/notification.service';

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
function lastNMonths(n: number) {
  const list: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    list.push(ym(d));
  }
  return list;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export const getSuperDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalOwners, totalGuests, totalBookings] = await Promise.all([
      User.countDocuments({ role: 'HOSTEL_ADMIN' }),
      User.countDocuments({ role: 'STUDENT' }),
      Booking.countDocuments({}),
    ]);

    const [approved, pending, rejected] = await Promise.all([
      Property.countDocuments({ verificationStatus: 'APPROVED' }),
      Property.countDocuments({ verificationStatus: 'PENDING' }),
      Property.countDocuments({ verificationStatus: 'REJECTED' }),
    ]);

    const cities = await Property.distinct('city', { verificationStatus: 'APPROVED' });

    const allRent = await RentRecord.find({}).lean();
    const platformRevenue = allRent.reduce((s, r) => s + (r.paidAmount || 0), 0);

    // Charts: last 6 months
    const monthList = lastNMonths(6);
    const ownersByMonth = await Promise.all(monthList.map(async (m) => {
      const [yr, mo] = m.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
      const count = await User.countDocuments({ role: 'HOSTEL_ADMIN', createdAt: { $gte: start, $lte: end } });
      return { month: m, count };
    }));
    const bookingsByMonth = await Promise.all(monthList.map(async (m) => {
      const [yr, mo] = m.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
      const count = await Booking.countDocuments({ createdAt: { $gte: start, $lte: end } });
      return { month: m, count };
    }));
    const revenueByMonth = await Promise.all(monthList.map(async (m) => {
      const recs = await RentRecord.find({ month: m }).lean();
      return { month: m, revenue: recs.reduce((s, r) => s + (r.paidAmount || 0), 0) };
    }));

    // Top 5 cities
    const cityAgg = await Property.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 5 },
    ]);

    res.json({
      success: true,
      data: {
        stats: { totalOwners, totalGuests, totalBookings, approved, pending, rejected, citiesCovered: cities.length, platformRevenue },
        ownersByMonth, bookingsByMonth, revenueByMonth, topCities: cityAgg,
      },
    });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
export const getGuests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: any = { role: 'STUDENT' };
    if (status && status !== 'ALL') filter.status = status;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash -otp -otpExpiry').sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
      User.countDocuments(filter),
    ]);
    // Enrich with active bookings count
    const enriched = await Promise.all(users.map(async u => {
      const activeBookings = await Booking.countDocuments({ guestId: u._id, status: { $in: ['CONFIRMED', 'CHECKED_IN'] } });
      return { ...u, activeBookings };
    }));
    res.json({ success: true, data: enriched, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getOwners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, verificationStatus, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: any = { role: 'HOSTEL_ADMIN' };
    if (status && status !== 'ALL') filter.status = status;
    if (verificationStatus && verificationStatus !== 'ALL') filter.ownerVerificationStatus = verificationStatus;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { businessName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash -otp -otpExpiry').sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
      User.countDocuments(filter),
    ]);
    const enriched = await Promise.all(users.map(async u => {
      const [approvedProps, pendingProps] = await Promise.all([
        Property.countDocuments({ tenantId: u._id, verificationStatus: 'APPROVED' }),
        Property.countDocuments({ tenantId: u._id, verificationStatus: 'PENDING' }),
      ]);
      return { ...u, approvedProps, pendingProps };
    }));
    res.json({ success: true, data: enriched, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'SUPER_ADMIN') { res.status(404).json({ success: false, message: 'User not found' }); return; }
    user.status = 'SUSPENDED';
    await user.save();
    res.json({ success: true, message: `${user.name} has been suspended` });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const reactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'SUPER_ADMIN') { res.status(404).json({ success: false, message: 'User not found' }); return; }
    user.status = 'ACTIVE';
    await user.save();
    res.json({ success: true, message: `${user.name} has been reactivated` });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROPERTY VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
export const getAllProperties = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { verificationStatus, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: any = {};
    if (verificationStatus && verificationStatus !== 'ALL') filter.verificationStatus = verificationStatus;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { city: { $regex: search, $options: 'i' } }];
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const [props, total] = await Promise.all([
      Property.find(filter).populate('tenantId', 'name email businessName ownerVerificationStatus').sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
      Property.countDocuments(filter),
    ]);
    res.json({ success: true, data: props, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getPropertyDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prop = await Property.findById(req.params.id).populate('tenantId', 'name email businessName createdAt ownerVerificationStatus').lean();
    if (!prop) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    res.json({ success: true, data: prop });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const approveProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prop = await Property.findById(req.params.id);
    if (!prop) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    prop.verificationStatus = 'APPROVED';
    prop.rejectionReason = '';

    // Backfill rentStartingFrom from rooms if missing
    if (!prop.rentStartingFrom || prop.rentStartingFrom === 0) {
      const { Room } = await import('../models/Room.model');
      const rooms = await Room.find({ propertyId: prop._id }).select('pricePerBed').lean();
      const prices = rooms.map((r: any) => r.pricePerBed).filter((p: number) => p > 0);
      if (prices.length > 0) prop.rentStartingFrom = Math.min(...prices);
    }

    await prop.save();
    notify({
      userId: prop.tenantId.toString(),
      type: 'PROPERTY_APPROVED',
      title: '🎉 Property Approved!',
      message: `Congratulations! "${prop.name}" is now live on NexStay marketplace.`,
      linkUrl: '/admin/properties',
    }).catch(() => { });
    res.json({ success: true, data: prop });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const rejectProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 30) {
      res.status(400).json({ success: false, message: 'Rejection reason must be at least 30 characters.' }); return;
    }
    const prop = await Property.findById(req.params.id);
    if (!prop) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    prop.verificationStatus = 'REJECTED';
    prop.rejectionReason = reason.trim();
    await prop.save();
    notify({
      userId: prop.tenantId.toString(),
      type: 'PROPERTY_REJECTED',
      title: '❌ Property Not Approved',
      message: `Your property "${prop.name}" was not approved. Reason: ${reason.trim()}`,
      linkUrl: '/admin/properties',
    }).catch(() => { });
    res.json({ success: true, data: prop });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// OWNER VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
export const getPendingOwnerVerifications = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const owners = await User.find({ role: 'HOSTEL_ADMIN', ownerVerificationStatus: 'PENDING' })
      .select('-passwordHash -otp -otpExpiry').sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: owners });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const approveOwnerVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const owner = await User.findOne({ _id: req.params.id, role: 'HOSTEL_ADMIN' });
    if (!owner) { res.status(404).json({ success: false, message: 'Owner not found' }); return; }
    owner.ownerVerificationStatus = 'APPROVED';
    owner.ownerRejectionReason = '';
    await owner.save();
    notify({
      userId: owner._id.toString(),
      type: 'OWNER_VERIFIED',
      title: '✅ Owner Verification Approved',
      message: 'Your business verification has been approved! You can now list properties on NexStay.',
      linkUrl: '/admin/properties',
    }).catch(() => { });
    res.json({ success: true, message: 'Owner verified successfully' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const rejectOwnerVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 10) {
      res.status(400).json({ success: false, message: 'Rejection reason required (min 10 chars).' }); return;
    }
    const owner = await User.findOne({ _id: req.params.id, role: 'HOSTEL_ADMIN' });
    if (!owner) { res.status(404).json({ success: false, message: 'Owner not found' }); return; }
    owner.ownerVerificationStatus = 'REJECTED';
    owner.ownerRejectionReason = reason.trim();
    await owner.save();
    notify({
      userId: owner._id.toString(),
      type: 'OWNER_VERIFICATION_REJECTED',
      title: '❌ Verification Not Approved',
      message: `Your business verification was not approved. Reason: ${reason.trim()}`,
    }).catch(() => { });
    res.json({ success: true, message: 'Owner verification rejected' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM MONITORING — Bookings
// ═══════════════════════════════════════════════════════════════════════════════
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, city, page = '1', limit = '20', from, to } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (from || to) filter.createdAt = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(to) }) };

    let query = Booking.find(filter)
      .populate('guestId', 'name email phone')
      .populate({ path: 'propertyId', select: 'name city tenantId', populate: { path: 'tenantId', select: 'name businessName' } })
      .populate('roomId', 'roomNumber')
      .sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim);

    const [bookings, total] = await Promise.all([query.lean(), Booking.countDocuments(filter)]);

    // Filter by city if needed (post-query since city is on populated field)
    const filtered = city ? bookings.filter(b => (b.propertyId as any)?.city?.toLowerCase().includes(city.toLowerCase())) : bookings;

    res.json({ success: true, data: filtered, total, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM MONITORING — Revenue
// ═══════════════════════════════════════════════════════════════════════════════
export const getPlatformRevenue = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const monthList = lastNMonths(12);
    const table = await Promise.all(monthList.map(async (m) => {
      const recs = await RentRecord.find({ month: m }).lean();
      const due = recs.reduce((s, r) => s + r.amount + (r.fine || 0), 0);
      const collected = recs.reduce((s, r) => s + (r.paidAmount || 0), 0);
      const pending = Math.max(0, due - collected);
      const [yr, mo] = m.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
      const activeProps = await Property.countDocuments({ verificationStatus: 'APPROVED', createdAt: { $lte: end } });
      return { month: m, due, collected, pending, activeProps };
    }));
    res.json({ success: true, data: table });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOSTEL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
import { Hostel } from '../models/Hostel.model';
import { HostelStudent } from '../models/HostelStudent.model';
import bcrypt from 'bcryptjs';

export const getAllHostels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, gender, page = '1', limit = '20' } = req.query as any;
    const filter: any = {};
    if (gender && gender !== 'ALL') filter.gender = gender;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { hostelCode: { $regex: search, $options: 'i' } }];

    const skip = (Number(page) - 1) * Number(limit);
    const [hostels, total] = await Promise.all([
      Hostel.find(filter).populate('ownerId', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Hostel.countDocuments(filter),
    ]);

    // Attach student count per hostel
    const withCounts = await Promise.all(hostels.map(async (h: any) => {
      const ownerId = (h.ownerId as any)?._id || h.ownerId;
      const studentCount = await HostelStudent.countDocuments({
        $or: [
          { hostelId: h._id },
          { tenantId: ownerId, hostelId: null },
          { tenantId: ownerId, hostelId: { $exists: false } },
        ],
        status: 'ACTIVE',
      });
      return { ...h, studentCount };
    }));

    res.json({ success: true, data: withCounts, total, page: Number(page) });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getHostelById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostel = await Hostel.findById(req.params.id).populate('ownerId', 'name email phone').lean();
    if (!hostel) { res.status(404).json({ success: false, message: 'Hostel not found' }); return; }
    res.json({ success: true, data: hostel });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, gender, ownerId, address, contactPhone, contactEmail, messEnabled } = req.body;
    if (!name || !ownerId) { res.status(400).json({ success: false, message: 'name and ownerId are required' }); return; }

    const owner = await User.findById(ownerId);
    if (!owner) { res.status(404).json({ success: false, message: 'Owner not found' }); return; }

    const count = await Hostel.countDocuments({});
    const hostelCode = `NST-${String(count + 1).padStart(3, '0')}`;

    const hostel = await Hostel.create({
      hostelCode, name, gender: gender || 'BOYS',
      ownerId, isActive: true,
      address: address || {},
      contactPhone, contactEmail,
      messEnabled: messEnabled ?? false,
    });

    await User.findByIdAndUpdate(ownerId, { hostelId: hostel._id });

    res.status(201).json({ success: true, data: hostel, message: 'Hostel created successfully' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
// ── CREATE HOSTEL WITH NEW OWNER (Combined Flow) ──────────────────────────────
// Super Admin creates both the owner account AND the hostel in one shot.
// All writes (User + Property + Hostel + User.hostelId) run inside a single
// MongoDB transaction — if ANY step fails the entire operation is rolled back.
// Returns the plain-text credentials so Admin can share them with the owner.
export const createHostelWithOwner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      ownerName, ownerEmail, ownerPhone, ownerPassword, businessName,
      hostelName, gender, address, contactPhone, contactEmail, messEnabled,
    } = req.body;

    if (!ownerName || !ownerEmail || !ownerPhone || !ownerPassword || !hostelName) {
      res.status(400).json({ success: false, message: 'ownerName, ownerEmail, ownerPhone, ownerPassword, hostelName are required' });
      return;
    }
    if (ownerPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    // Duplicate-check before opening the transaction (read-only, no rollback needed)
    const existingUser = await User.findOne({ $or: [{ email: ownerEmail.toLowerCase() }, { phone: ownerPhone }] });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email or phone already registered for another account' });
      return;
    }

    // Hash password before the transaction (CPU-bound, outside the DB lock)
    const passwordHash = await bcrypt.hash(ownerPassword, 12);

    // Open a MongoDB session and start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    let owner: any;
    let property: any;
    let hostel: any;
    let hostelCode!: string;

    try {
      // Step 1 — Create owner account
      [owner] = await User.create(
        [{
          name: ownerName,
          email: ownerEmail.toLowerCase(),
          phone: ownerPhone,
          passwordHash,
          role: 'HOSTEL_ADMIN',
          status: 'ACTIVE',
          businessName: businessName || '',
          ownerVerificationStatus: 'APPROVED',
        }],
        { session },
      );

      // Step 2 — Create Marketplace Property
      // Property schema uses a flat String for address; city/state/pincode are top-level fields.
      const addrParts = [address?.street, address?.city, address?.state, address?.pincode].filter(Boolean);
      const addressString = addrParts.length ? (addrParts as string[]).join(', ') : '';

      [property] = await Property.create(
        [{
          name: hostelName,
          tenantId: owner._id,
          address: addressString,
          city: address?.city || '',
          state: address?.state || '',
          pincode: address?.pincode || '',
          locality: address?.street || '',
          verificationStatus: 'APPROVED',
          gender: gender || 'BOYS',
          amenities: ['WiFi', 'CCTV', 'Power Backup'],
          rules: '1. No smoking\n2. Quiet hours after 10 PM',
          rentStartingFrom: 5000,
        }],
        { session },
      );

      // Step 3 — Generate unique hostel code (counted within the session)
      const count = await Hostel.countDocuments({}).session(session);
      hostelCode = `NST-${String(count + 1).padStart(3, '0')}`;

      // Step 4 — Create hostel linked to the new owner and property
      [hostel] = await Hostel.create(
        [{
          hostelCode,
          name: hostelName,
          gender: gender || 'BOYS',
          ownerId: owner._id,
          propertyId: property._id,
          isActive: true,
          address: address || {},
          contactPhone: contactPhone || ownerPhone,
          contactEmail: contactEmail || ownerEmail,
          messEnabled: messEnabled ?? false,
        }],
        { session },
      );

      // Step 5 — Link hostelId back to the owner user document
      await User.findByIdAndUpdate(owner._id, { hostelId: hostel._id }, { session });

      // All writes succeeded — commit atomically
      await session.commitTransaction();
    } catch (txError: any) {
      // Any failure aborts ALL writes above; the DB is left completely unchanged
      await session.abortTransaction();
      console.error('[createHostelWithOwner] Transaction aborted:', txError);
      res.status(500).json({
        success: false,
        message: txError.message || 'Creation failed — all changes have been rolled back',
      });
      return;
    } finally {
      session.endSession();
    }

    // Return everything including plain-text credentials for the admin to share
    res.status(201).json({
      success: true,
      message: 'Hostel and owner account created successfully',
      data: {
        hostel: {
          _id: hostel._id,
          hostelCode: hostel.hostelCode,
          name: hostel.name,
          gender: hostel.gender,
        },
        owner: {
          _id: owner._id,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
        },
        credentials: {
          loginUrl: '/login',
          email: ownerEmail,
          phone: ownerPhone,
          password: ownerPassword, // plain-text — admin must share securely
          hostelCode,
          role: 'HOSTEL_ADMIN',
        },
      },
    });
  } catch (err: any) {
    console.error('[createHostelWithOwner]', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
export const updateHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!hostel) { res.status(404).json({ success: false, message: 'Hostel not found' }); return; }
    res.json({ success: true, data: hostel });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const toggleHostelActive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) { res.status(404).json({ success: false, message: 'Hostel not found' }); return; }
    hostel.isActive = !hostel.isActive;
    await hostel.save();
    res.json({ success: true, data: hostel, message: `Hostel ${hostel.isActive ? 'activated' : 'deactivated'}` });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const students = await HostelStudent.countDocuments({ hostelId: req.params.id, status: 'ACTIVE' });
    if (students > 0) { res.status(400).json({ success: false, message: `Cannot delete: ${students} active student(s)` }); return; }
    await Hostel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Hostel deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ── All Owners (dropdown) ──────────────────────────────────────────────────────
export const getAllOwners = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const owners = await User.find({ role: 'HOSTEL_ADMIN', status: 'ACTIVE' }).select('name email phone').lean();
    res.json({ success: true, data: owners });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createOwner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, businessName } = req.body;
    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, message: 'name, email, phone, password required' }); return;
    }
    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) { res.status(409).json({ success: false, message: 'Email or phone already registered' }); return; }

    const passwordHash = await bcrypt.hash(password, 12);
    const owner = await User.create({
      name, email, phone, passwordHash,
      role: 'HOSTEL_ADMIN', status: 'ACTIVE',
      businessName, ownerVerificationStatus: 'APPROVED',
    });
    res.status(201).json({ success: true, data: { _id: owner._id, name, email, phone }, message: 'Owner created' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ── Staff per hostel ──────────────────────────────────────────────────────────
export const getHostelStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await User.find({ hostelId: req.params.id, role: { $in: ['WARDEN', 'MESS_MANAGER'] } })
      .select('name email phone role status staffPermissions').lean();
    res.json({ success: true, data: staff });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createStaffUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role, hostelId, staffPermissions } = req.body;
    if (!name || !phone || !password || !role || !hostelId) {
      res.status(400).json({ success: false, message: 'name, phone, password, role, hostelId required' }); return;
    }
    const exists = await User.findOne({ phone });
    if (exists) { res.status(409).json({ success: false, message: 'Phone already registered' }); return; }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email, phone, passwordHash,
      role, status: 'ACTIVE', hostelId,
      staffPermissions: staffPermissions || {},
    });
    res.status(201).json({ success: true, data: { _id: user._id, name, phone, role }, message: 'Staff user created' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};



// ── PATCH: Fix students whose guestId User phone doesn't match their own phone ─
// Detects any HostelStudent where the linked User's phone ≠ stu.phone,
// meaning those students cannot log in with their own mobile number.
// Creates individual User accounts (password = last 4 digits of phone).
export const fixStudentOwnerConflict = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bcrypt = await import('bcryptjs');
    let fixed = 0;
    const log: any[] = [];

    // Get all active HostelStudents
    const allStudents = await HostelStudent.find({ status: 'ACTIVE' }).lean();

    for (const stu of allStudents) {
      const linkedUser = await User.findById(stu.guestId).lean();

      // Case 1: No linked user at all
      if (!linkedUser) {
        await createStudentUser(stu, bcrypt, log);
        await HostelStudent.findByIdAndUpdate(stu._id, { guestId: log[log.length - 1]?.newUserId });
        fixed++;
        continue;
      }

      // Case 2: Linked user phone MATCHES student phone — ensure they can login with last-4 password
      if (linkedUser.phone === stu.phone) {
        const newHash = await bcrypt.hash(stu.phone.slice(-4), 10);
        const updates: any = {
          passwordHash: newHash,
          hostelId: stu.hostelId,   // always force-set correct hostel scope
        };
        if (linkedUser.role !== 'STUDENT') updates.role = 'STUDENT';
        await User.findByIdAndUpdate(linkedUser._id, updates);
        log.push({
          action: 'RESET_PASSWORD',
          studentName: stu.name,
          phone: stu.phone,
          hostelId: String(stu.hostelId),
          loginPhone: stu.phone,
          loginPassword: stu.phone.slice(-4),
        });
        continue;
      }

      // Case 3: Linked user phone DOESN'T match student phone → student can't log in
      // Create or link an individual account by student's phone
      const existingByPhone = await User.findOne({ phone: stu.phone }).lean();
      if (existingByPhone) {
        // Link existing user with this phone
        const updates: any = {};
        if (existingByPhone.role !== 'STUDENT') updates.role = 'STUDENT';
        if (!existingByPhone.hostelId && stu.hostelId) updates.hostelId = stu.hostelId;
        if (Object.keys(updates).length > 0) {
          await User.findByIdAndUpdate(existingByPhone._id, updates);
        }
        await HostelStudent.findByIdAndUpdate(stu._id, { guestId: existingByPhone._id });
        fixed++;
        log.push({
          action: 'LINKED_EXISTING_BY_PHONE',
          studentName: stu.name,
          studentPhone: stu.phone,
          userId: String(existingByPhone._id),
          loginPhone: stu.phone,
          loginPassword: stu.phone.slice(-4),
        });
      } else {
        // Create brand new user for this student
        const hash = await bcrypt.hash(stu.phone.slice(-4), 10);
        try {
          const newUser = await User.create({
            name: stu.name,
            phone: stu.phone,
            email: `student_${stu.phone}@nexstay.app`,
            passwordHash: hash,
            role: 'STUDENT',
            status: 'ACTIVE',
            hostelId: stu.hostelId,
          });
          await HostelStudent.findByIdAndUpdate(stu._id, { guestId: newUser._id });
          fixed++;
          log.push({
            action: 'CREATED_NEW_STUDENT_USER',
            studentName: stu.name,
            studentPhone: stu.phone,
            newUserId: String(newUser._id),
            loginPhone: stu.phone,
            loginPassword: stu.phone.slice(-4),
          });
        } catch (err: any) {
          log.push({ action: 'ERROR', studentName: stu.name, phone: stu.phone, error: err.message });
        }
      }
    }

    res.json({ success: true, fixed, log });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

async function createStudentUser(stu: any, bcrypt: any, log: any[]) {
  const hash = await bcrypt.hash(stu.phone.slice(-4), 10);
  try {
    const u = await User.create({
      name: stu.name, phone: stu.phone,
      email: `student_${stu.phone}@nexstay.app`,
      passwordHash: hash, role: 'STUDENT', status: 'ACTIVE', hostelId: stu.hostelId,
    });
    log.push({ action: 'CREATED_ORPHAN_USER', phone: stu.phone, newUserId: String(u._id) });
  } catch { }
}


// ── MIGRATION: Fix existing students (hostelId backfill + GUEST→STUDENT upgrade) ────────
// Safe to run multiple times — only fixes records that still need it.
export const migrateStudentHostelIds = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bcrypt = await import('bcryptjs');

    // Scan ALL active HostelStudent records
    const allStudents = await HostelStudent.find({ status: 'ACTIVE' }).lean();

    let hostelStudentFixed = 0;
    let userFixed = 0;
    const debugInfo: any[] = [];

    for (const stu of allStudents) {
      // Find the owner's hostel
      const ownerHostel = await Hostel.findOne({ ownerId: stu.tenantId }).select('_id hostelCode').lean();
      if (!ownerHostel) continue;

      // Fix HostelStudent hostelId if missing
      if (!stu.hostelId) {
        await HostelStudent.findByIdAndUpdate(stu._id, { hostelId: ownerHostel._id });
        hostelStudentFixed++;
      }

      // Fix linked User account
      const linkedUser = await User.findById(stu.guestId);
      if (linkedUser) {
        // If the guestId points to a HOSTEL_ADMIN or SUPER_ADMIN, we need to create
        // a separate User account for the student
        if (linkedUser.role === 'HOSTEL_ADMIN' || linkedUser.role === 'SUPER_ADMIN' || linkedUser.role === 'WARDEN' || linkedUser.role === 'MESS_MANAGER') {
          // Check if a user with this student's phone already exists
          const existingByPhone = await User.findOne({ phone: stu.phone }).lean();
          if (!existingByPhone) {
            try {
              const newHash = await bcrypt.hash(stu.phone.slice(-4), 10);
              const newUser = await User.create({
                name: stu.name,
                phone: stu.phone,
                email: `student_${stu.phone}@nexstay.app`,  // placeholder email
                passwordHash: newHash,
                role: 'STUDENT',
                status: 'ACTIVE',
                hostelId: ownerHostel._id,
              });
              await HostelStudent.findByIdAndUpdate(stu._id, { guestId: newUser._id });
              userFixed++;
              debugInfo.push({
                studentName: stu.name,
                studentPhone: stu.phone,
                hostelCode: (ownerHostel as any).hostelCode,
                action: 'CREATED_NEW_USER_FROM_ADMIN_GUESTID',
                newUserId: String(newUser._id),
                loginPhone: stu.phone,
                loginPassword: stu.phone.slice(-4),
              });
            } catch (createErr: any) {
              debugInfo.push({
                studentName: stu.name,
                studentPhone: stu.phone,
                action: 'CREATE_FAILED',
                error: createErr.message,
              });
            }
          } else {
            // User with this phone already exists — just link it and ensure role/hostelId
            const updates: any = {};
            if (existingByPhone.role !== 'STUDENT') updates.role = 'STUDENT';
            if (!existingByPhone.hostelId) updates.hostelId = ownerHostel._id;
            if (Object.keys(updates).length > 0) {
              await User.findByIdAndUpdate(existingByPhone._id, updates);
            }
            await HostelStudent.findByIdAndUpdate(stu._id, { guestId: existingByPhone._id });
            userFixed++;
            debugInfo.push({
              studentName: stu.name,
              studentPhone: stu.phone,
              hostelCode: (ownerHostel as any).hostelCode,
              action: 'LINKED_EXISTING_USER',
              userId: String(existingByPhone._id),
            });
          }
          continue;
        }

        const updates: any = {};

        // Upgrade GUEST → STUDENT
        if ((linkedUser as any).role === 'GUEST') {
          updates.role = 'STUDENT';
        }
        // Link hostelId if missing
        if (!linkedUser.hostelId) {
          updates.hostelId = ownerHostel._id;
        }
        // Fix broken password (random Math.random() hash doesn't start with $2)
        if (!linkedUser.passwordHash || !linkedUser.passwordHash.startsWith('$2')) {
          updates.passwordHash = await bcrypt.hash(stu.phone.slice(-4), 10);
        }

        debugInfo.push({
          studentName: stu.name,
          studentPhone: stu.phone,
          hostelCode: (ownerHostel as any).hostelCode,
          guestId: String(stu.guestId),
          linkedUserPhone: linkedUser.phone,
          linkedUserRole: linkedUser.role,
          linkedUserHasHostelId: !!linkedUser.hostelId,
          passwordHashValid: !!(linkedUser.passwordHash && linkedUser.passwordHash.startsWith('$2')),
          updatesApplied: Object.keys(updates),
        });

        if (Object.keys(updates).length > 0) {
          await User.findByIdAndUpdate(linkedUser._id, updates);
          userFixed++;
        }
      } else {
        // guestId doesn't point to any user — create one
        const newHash = await bcrypt.hash(stu.phone.slice(-4), 10);
        try {
          const newUser = await User.create({
            name: stu.name,
            phone: stu.phone,
            email: `student_${stu.phone}@nexstay.app`,
            passwordHash: newHash,
            role: 'STUDENT',
            status: 'ACTIVE',
            hostelId: ownerHostel._id,
          });
          // Update HostelStudent guestId
          await HostelStudent.findByIdAndUpdate(stu._id, { guestId: newUser._id });
          userFixed++;
          debugInfo.push({
            studentName: stu.name,
            studentPhone: stu.phone,
            hostelCode: (ownerHostel as any).hostelCode,
            action: 'CREATED_NEW_USER',
            newUserId: String(newUser._id),
          });
        } catch (createErr: any) {
          debugInfo.push({ studentName: stu.name, action: 'CREATE_FAILED', error: createErr.message });
        }
      }
    }

    res.json({
      success: true,
      message: `Migration complete. Fixed ${hostelStudentFixed} HostelStudent records and ${userFixed} User accounts.`,
      hostelStudentFixed,
      userFixed,
      debug: debugInfo,
    });
  } catch (err: any) {
    console.error('[migrateStudentHostelIds]', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
