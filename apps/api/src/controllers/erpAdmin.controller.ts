import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Property } from '../models/Property.model';
import { Room } from '../models/Room.model';
import { Bed } from '../models/Bed.model';
import { Floor } from '../models/Floor.model';
import { Booking } from '../models/Booking.model';
import { HostelStudent } from '../models/HostelStudent.model';
import { RentRecord } from '../models/RentRecord.model';
import { Complaint } from '../models/Complaint.model';
import { Notification } from '../models/Notification.model';
import { User } from '../models/User.model';
import { GuestProfile } from '../models/GuestProfile.model';
import { PaymentSubmission } from '../models/PaymentSubmission.model';
import { PaymentTransaction } from '../models/PaymentTransaction.model';
import { LedgerEntry } from '../models/LedgerEntry.model';
import { AuditLog } from '../models/AuditLog.model';
import { notify } from '../services/notification.service';

// ─── Helper ───────────────────────────────────────────────────────────────────
const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// ─── GET /api/hostel-admin/erp/rooms?propertyId=... ──────────────────────────
export const getErpRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { propertyId } = req.query as Record<string, string>;
    if (!propertyId) { res.status(400).json({ success: false, message: 'propertyId required' }); return; }

    const prop = await Property.findOne({ _id: propertyId, tenantId }).lean();
    if (!prop) { res.status(404).json({ success: false, message: 'Property not found' }); return; }

    const floors = await Floor.find({ propertyId, tenantId }).sort({ order: 1 }).lean();
    const rooms  = await Room.find({ propertyId, tenantId }).lean();
    const beds   = await Bed.find({ propertyId, tenantId }).lean();

    const floorData = floors.map(f => {
      const fRooms = rooms.filter(r => String(r.floorId) === String(f._id));
      const roomData = fRooms.map(r => {
        const rBeds = beds.filter(b => String(b.roomId) === String(r._id));
        const available = rBeds.filter(b => b.status === 'AVAILABLE').length;
        return { ...r, beds: rBeds, availableBeds: available, totalBeds: rBeds.length };
      });
      return { ...f, rooms: roomData };
    });

    res.json({ success: true, data: floorData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/hostel-admin/erp/rooms/:roomId/beds ────────────────────────────
export const getRoomBeds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { roomId } = req.params;

    const room = await Room.findOne({ _id: roomId, tenantId }).lean();
    if (!room) { res.status(404).json({ success: false, message: 'Room not found' }); return; }

    const beds = await Bed.find({ roomId, tenantId }).lean();

    // Enrich occupied/reserved beds
    const enriched = await Promise.all(beds.map(async (bed) => {
      if (bed.status === 'OCCUPIED') {
        const student = await HostelStudent.findOne({ bedId: bed._id, status: 'ACTIVE', tenantId }).lean();
        return { ...bed, occupantData: student || null };
      }
      if (bed.status === 'RESERVED') {
        const booking = await Booking.findOne({ bedId: bed._id, status: 'CONFIRMED', tenantId })
          .populate('guestId', 'name phone email').lean();
        return { ...bed, bookingData: booking || null };
      }
      return { ...bed, occupantData: null, bookingData: null };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/hostel-admin/erp/floors ───────────────────────────────────────
export const createFloor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { propertyId, name, order } = req.body;
    if (!propertyId || !name) { res.status(400).json({ success: false, message: 'propertyId and name required' }); return; }
    const prop = await Property.findOne({ _id: propertyId, tenantId }).lean();
    if (!prop) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    const floor = await Floor.create({ tenantId, propertyId, name, order: order ?? 0 });
    
    // Notify Super Admins
    const superAdmins = await User.find({ role: 'SUPER_ADMIN' }).select('_id').lean();
    for (const admin of superAdmins) {
      notify({
        userId: String(admin._id),
        type: 'PROPERTY_EXPANSION',
        title: '📈 Property Expansion',
        message: `A new floor "${name}" was added to property "${prop.name}".`,
        linkUrl: '/admin/properties',
      }).catch(() => {});
    }

    res.status(201).json({ success: true, data: floor });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PUT /api/hostel-admin/erp/floors/:id ────────────────────────────────────
export const updateFloor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const floor = await Floor.findOne({ _id: req.params.id, tenantId });
    if (!floor) { res.status(404).json({ success: false, message: 'Floor not found' }); return; }
    const { name, order } = req.body;
    if (name) floor.name = name;
    if (order !== undefined) floor.order = order;
    await floor.save();
    res.json({ success: true, data: floor });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── DELETE /api/hostel-admin/erp/floors/:id ─────────────────────────────────
export const deleteFloor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const floor = await Floor.findOne({ _id: req.params.id, tenantId });
    if (!floor) { res.status(404).json({ success: false, message: 'Floor not found' }); return; }
    const hasRooms = await Room.countDocuments({ floorId: floor._id });
    if (hasRooms > 0) { res.status(400).json({ success: false, message: `Cannot delete — ${hasRooms} room(s) exist on this floor.` }); return; }
    await Floor.deleteOne({ _id: floor._id });
    res.json({ success: true, message: 'Floor deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/hostel-admin/erp/rooms ────────────────────────────────────────
export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { propertyId, floorId, roomNumber, roomType, capacity, pricePerBed, bedPrices } = req.body;
    if (!propertyId || !floorId || !roomNumber || !roomType || !capacity) {
      res.status(400).json({ success: false, message: 'propertyId, floorId, roomNumber, roomType, capacity required' }); return;
    }
    // ── Duplicate room number check within the same property ──────────────────
    const existing = await Room.findOne({ tenantId, propertyId, roomNumber: roomNumber.trim() }).lean();
    if (existing) {
      res.status(409).json({ success: false, message: `Room number "${roomNumber}" already exists in this property. Please use a different number.` }); return;
    }
    const room = await Room.create({ tenantId, propertyId, floorId, roomNumber, roomType, capacity, pricePerBed: pricePerBed ?? 6000, status: 'AVAILABLE' });
    // Auto-generate beds
    for (let i = 1; i <= capacity; i++) {
      const price = bedPrices && Array.isArray(bedPrices) && bedPrices.length >= i ? bedPrices[i - 1] : (pricePerBed ?? 6000);
      await Bed.create({ tenantId, propertyId, roomId: room._id, bedNumber: `B${i}`, status: 'AVAILABLE', price });
    }

    // Notify Super Admins
    const superAdmins = await User.find({ role: 'SUPER_ADMIN' }).select('_id').lean();
    const prop = await Property.findById(propertyId).select('name').lean();
    for (const admin of superAdmins) {
      notify({
        userId: String(admin._id),
        type: 'PROPERTY_EXPANSION',
        title: '📈 Property Expansion',
        message: `A new room "${roomNumber}" (${capacity} beds) was added to property "${prop?.name || 'Unknown'}".`,
        linkUrl: '/admin/properties',
      }).catch(() => {});
    }

    res.status(201).json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PUT /api/hostel-admin/erp/rooms/:id ─────────────────────────────────────
export const updateRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const room = await Room.findOne({ _id: req.params.id, tenantId });
    if (!room) { res.status(404).json({ success: false, message: 'Room not found' }); return; }
    const { roomNumber, roomType, capacity, pricePerBed, floorId, bedPrices } = req.body;
    if (roomNumber) room.roomNumber = roomNumber;
    if (roomType) room.roomType = roomType;
    if (pricePerBed !== undefined) room.pricePerBed = pricePerBed;
    if (floorId) room.floorId = floorId;
    
    // Handle capacity change (add/remove beds)
    if (capacity !== undefined && capacity !== room.capacity) {
      const beds = await Bed.find({ roomId: room._id }).sort({ bedNumber: 1 });
      const currentCapacity = beds.length;

      if (capacity > currentCapacity) {
        // Add beds
        for (let i = currentCapacity + 1; i <= capacity; i++) {
          const price = bedPrices && Array.isArray(bedPrices) && bedPrices.length >= i ? bedPrices[i - 1] : (pricePerBed ?? 6000);
          await Bed.create({ tenantId, propertyId: room.propertyId, roomId: room._id, bedNumber: `B${i}`, status: 'AVAILABLE', price });
        }
      } else if (capacity < currentCapacity) {
        // Remove beds
        const bedsToRemove = beds.slice(capacity);
        const occupied = bedsToRemove.filter(b => b.status !== 'AVAILABLE');
        if (occupied.length > 0) {
          res.status(400).json({ success: false, message: 'Cannot reduce room capacity. Some beds that would be removed are currently occupied or reserved.' });
          return;
        }
        await Bed.deleteMany({ _id: { $in: bedsToRemove.map(b => b._id) } });
      }
      room.capacity = capacity;
    }

    await room.save();

    // Update remaining bed prices
    if (bedPrices && Array.isArray(bedPrices)) {
      const beds = await Bed.find({ roomId: room._id }).sort({ bedNumber: 1 });
      for (let i = 0; i < beds.length; i++) {
        if (bedPrices[i] !== undefined) {
          beds[i].price = bedPrices[i];
          await beds[i].save();
        }
      }
    }

    res.json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── DELETE /api/hostel-admin/erp/rooms/:id ──────────────────────────────────
export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const room = await Room.findOne({ _id: req.params.id, tenantId });
    if (!room) { res.status(404).json({ success: false, message: 'Room not found' }); return; }
    const activeBed = await Bed.findOne({ roomId: room._id, status: { $in: ['OCCUPIED', 'RESERVED'] } });
    if (activeBed) { res.status(400).json({ success: false, message: 'Cannot delete — room has occupied or reserved beds.' }); return; }
    await Bed.deleteMany({ roomId: room._id });
    await Room.deleteOne({ _id: room._id });
    res.json({ success: true, message: 'Room and beds deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/hostel-admin/erp/students ──────────────────────────────────────
export const getErpStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { propertyId, status, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const filter: any = { tenantId };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);
    if (status && status !== 'ALL') filter.status = status;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];

    const [students, total] = await Promise.all([
      HostelStudent.find(filter)
        .populate('propertyId', 'name')
        .populate('bedId', 'bedNumber roomId')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      HostelStudent.countDocuments(filter),
    ]);

    // Enrich with room/floor info
    const enriched = await Promise.all(students.map(async (s) => {
      const bed = s.bedId as any;
      const room = bed?.roomId ? await Room.findById(bed.roomId).lean() : null;
      const floor = room?.floorId ? await Floor.findById(room.floorId).lean() : null;
      return { ...s, room, floor };
    }));

    res.json({ success: true, data: enriched, total, page: pageNum, hasNextPage: pageNum * limitNum < total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/hostel-admin/erp/students/:id ──────────────────────────────────
export const getErpStudentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const student = await HostelStudent.findOne({ _id: req.params.id, tenantId })
      .populate('propertyId', 'name city address')
      .populate('bedId', 'bedNumber roomId')
      .lean();
    if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }

    const bed = student.bedId as any;
    const room = bed?.roomId ? await Room.findById(bed.roomId).lean() : null;
    const floor = room?.floorId ? await Floor.findById(room.floorId).lean() : null;

    const rentRecords = await RentRecord.find({ hostelStudentId: student._id }).sort({ month: -1 }).lean();
    const complaints = await Complaint.find({ tenantId, guestId: student.guestId }).sort({ createdAt: -1 }).lean();

    res.json({ success: true, data: { ...student, room, floor, rentRecords, complaints } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const resetStudentPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      return;
    }

    const student = await HostelStudent.findOne({ _id: req.params.id, tenantId });
    if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }

    const user = await User.findOne({ _id: student.guestId });
    if (!user) { res.status(404).json({ success: false, message: 'Login account not found for this student.' }); return; }

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    await user.save();

    res.json({ success: true, message: 'Student password reset successfully' });
  } catch (err) {
    console.error('[resetStudentPassword]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/hostel-admin/erp/students/:id/rent ─────────────────────────────
export const getStudentRent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const records = await RentRecord.find({ tenantId, hostelStudentId: req.params.id }).sort({ month: -1 }).lean();
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/hostel-admin/erp/rent/:id/pay ─────────────────────────────────
export const recordRentPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { amount, paymentMethod, notes } = req.body;
    const record = await RentRecord.findOne({ _id: req.params.id, tenantId }).populate('hostelStudentId', 'guestId name');
    if (!record) { res.status(404).json({ success: false, message: 'Rent record not found' }); return; }

    const numAmount = Number(amount);
    
    // ── Payment Layer (Admin Direct Payment) ──
    const submissionId = `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const submission = await PaymentSubmission.create({
      submissionId,
      tenantId,
      propertyId: record.propertyId,
      invoiceId: record._id,
      residentId: record.hostelStudentId._id,
      claimedAmount: numAmount,
      paymentMode: (paymentMethod === 'CASH' ? 'CASH' : 'ONLINE') as 'CASH' | 'ONLINE' | 'ADJUSTMENT',
      remark: notes || 'Manually added and verified by Admin',
      status: 'VERIFIED'
    });

    const pTx = await PaymentTransaction.create({
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      propertyId: record.propertyId,
      submissionId: submission._id,
      invoiceId: record._id,
      residentId: record.hostelStudentId._id,
      settledAmount: numAmount,
      paymentMode: submission.paymentMode,
      status: 'SUCCESS'
    });

    const oldPaidAmount = record.paidAmount || 0;
    const totalAmount = record.amount + (record.fine || 0);
    const newPaidAmount = oldPaidAmount + numAmount;

    await LedgerEntry.create({
      tenantId,
      propertyId: record.propertyId,
      invoiceId: record._id,
      residentId: record.hostelStudentId._id,
      transactionId: pTx._id,
      credit: numAmount,
      debit: 0,
      balance: totalAmount - newPaidAmount,
      source: submission.paymentMode === 'CASH' ? 'CASH' : (submission.paymentMode === 'ADJUSTMENT' ? 'ADJUSTMENT' : 'UPI'),
      verifiedBy: req.user!.id
    });

    // Update Rent Record immediately
    record.paidAmount = newPaidAmount;
    record.status = record.paidAmount >= totalAmount ? 'PAID' : 'PARTIAL';
    if (record.status === 'PAID') record.paidAt = new Date();
    await record.save();

    await AuditLog.create({
      tenantId,
      propertyId: record.propertyId,
      action: 'PAYMENT_VERIFIED_ACCEPT',
      actorId: req.user!.id,
      actorType: 'Admin',
      entityId: submission._id,
      entityType: 'PaymentSubmission',
      details: `Admin directly recorded and verified payment of ₹${numAmount} via ${paymentMethod || 'CASH'}.`
    });

    const student = record.hostelStudentId as any;
    if (student?.guestId) {
      notify({
        userId: student.guestId,
        type: 'RENT',
        title: '✅ Payment Confirmed',
        message: `Admin recorded your payment of ₹${numAmount.toLocaleString('en-IN')} via ${paymentMethod || 'CASH'}.`,
        linkUrl: '/student/rent',
      }).catch(() => {});
    }

    res.json({ success: true, message: 'Payment recorded and verified successfully.', data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/hostel-admin/erp/checkin ──────────────────────────────────────
export const processCheckIn = async (req: AuthRequest, res: Response): Promise<void> => {
  const supportsTx = (mongoose.connection.getClient() as any)?.topology?.description?.type !== 'Single';
  const session = supportsTx ? await mongoose.startSession() : null;
  if (session) session.startTransaction();
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const {
      bookingId,          // for booking-linked flow
      preBookingId,       // for converting an ErpPreBooking
      // Walk-in fields
      name, phone, email, college, guardianName, guardianPhone,
      aadhaarUrl, aadhaarNumber, studentIdUrl, photoUrl,
      // Common
      propertyId, bedId,
      moveInDate, monthlyRent, securityDeposit, noticePeriodDays,
      internalNote,
      // ── Extended Registration Form Fields ────────────────────────────────────
      registrationDate, fatherName, fatherOccupation, fatherContact,
      motherName, dateOfBirth, bloodGroup, maritalStatus,
      education, occupation, organization,
      permanentAddress, guardianAddress, vehicleNumber,
      medicalHistory, stayingPeriod,
      registrationAmount,
      initialRentAmount, initialExtraCharges, initialPaidAmount,
      // ── Old Tenant Fields ────────────────────────────────────────────────────
      isOldTenant, lockInPeriod, currentMonthStartDate
    } = req.body;

    let booking: any;
    let guestUser: any;
    let finalBedId = bedId;
    let finalPropertyId = propertyId;

    // ── Look up the owner's hostel so we can link it on the student/user ──────
    const ownerHostel = await (await import('../models/Hostel.model')).Hostel
      .findOne({ ownerId: new mongoose.Types.ObjectId(tenantId) })
      .select('_id hostelCode name')
      .lean();
    const ownerHostelId = req.user?.role === 'WARDEN' || req.user?.role === 'MESS_MANAGER' ? req.user.hostelId : (ownerHostel?._id ?? null);

    if (bookingId) {
      // ── Booking-linked flow ──
      booking = await Booking.findOne({ _id: bookingId, tenantId, status: 'CONFIRMED' });
      if (!booking) { if (session) await session.abortTransaction(); res.status(404).json({ success: false, message: 'Confirmed booking not found' }); return; }
      finalBedId = finalBedId || String(booking.bedId);
      finalPropertyId = finalPropertyId || String(booking.propertyId);
      guestUser = await User.findById(booking.guestId).lean();
    } else {
      // ── Walk-in flow: lookup or create guest user ──
      if (!name || !phone || !email || !finalBedId || !finalPropertyId) {
        if (session) await session.abortTransaction();
        res.status(400).json({ success: false, message: 'name, phone, email, propertyId, bedId required for walk-in' });
        return;
      }

      // ── Duplicate check: one phone → one active student per property (this hostel owner) ──
      const existingStudent = await HostelStudent.findOne({
        tenantId,
        phone,
        propertyId: new mongoose.Types.ObjectId(finalPropertyId),
        status: 'ACTIVE',
      }).lean();
      if (existingStudent) {
        if (session) await session.abortTransaction();
        res.status(409).json({
          success: false,
          message: `Phone number ${phone} is already registered as an active student in this property. Each phone number can only be registered once per property.`,
        });
        return;
      }

      // ── Lookup or create a User account for the walk-in student ──
      // IMPORTANT: We always trust the FORM-SUBMITTED name/phone/email for HostelStudent.
      // The User record is only used for authentication linkage (guestId).
      // Default password = last 4 digits of phone (easy to share with student).
      const defaultPassword = phone.slice(-4);
      const existingUser = await User.findOne({ phone }).lean();
      if (!existingUser) {
        // Also check by email to avoid duplicate email accounts
        const existingByEmail = await User.findOne({ email: email.toLowerCase() }).lean();
        if (existingByEmail) {
          if (session) await session.abortTransaction();
          res.status(409).json({
            success: false,
            message: `The email ${email} is already registered with another account. Please use a different email address.`,
          });
          return;
        } else {
          // Brand new student — create proper STUDENT account with login credentials
          const bcrypt = await import('bcryptjs');
          const passwordHash = await bcrypt.hash(defaultPassword, 10);
          const created = await User.create([{
            name, phone, email: email.toLowerCase(),
            passwordHash,
            role: 'STUDENT',
            status: 'ACTIVE',
            hostelId: ownerHostelId,
            studentId: phone,
          }], { session });
          guestUser = created[0];
        }
      } else {
        // Prevent using a staff or admin account phone number for a student
        if (['SUPER_ADMIN', 'HOSTEL_ADMIN', 'WARDEN', 'MESS_MANAGER'].includes(existingUser.role)) {
          if (session) await session.abortTransaction();
          res.status(409).json({
            success: false,
            message: `Phone number ${phone} is already registered to a staff or admin account. Please use a different phone number for the student.`,
          });
          return;
        }

        // Existing user — ensure role and hostelId are set correctly
        const upgrades: any = {};
        if (existingUser.role === 'GUEST') upgrades.role = 'STUDENT';
        if (!existingUser.hostelId && ownerHostelId) upgrades.hostelId = ownerHostelId;
        if (!existingUser.studentId) upgrades.studentId = phone;
        if (existingUser.status === 'PENDING') upgrades.status = 'ACTIVE';
        
        // If they were just a GUEST or PENDING, reset their password to default so the generated credentials work
        if (existingUser.role === 'GUEST' || existingUser.status === 'PENDING') {
          const bcrypt = await import('bcryptjs');
          upgrades.passwordHash = await bcrypt.hash(defaultPassword, 10);
        }

        if (Object.keys(upgrades).length > 0) {
          await User.findByIdAndUpdate(existingUser._id, upgrades, { session });
        }
        guestUser = { ...existingUser, ...upgrades };
      }
    }

    // Verify bed is available (or was RESERVED for this booking)
    const bed = await Bed.findOne({ _id: finalBedId, tenantId });
    if (!bed) { if (session) await session.abortTransaction(); res.status(404).json({ success: false, message: 'Bed not found' }); return; }
    if (bed.status === 'OCCUPIED') { if (session) await session.abortTransaction(); res.status(400).json({ success: false, message: 'Bed is already occupied' }); return; }

    const moveIn = moveInDate ? new Date(moveInDate) : new Date();
    const noticeDays = noticePeriodDays ?? 30;
    const noticePeriodDate = new Date(moveIn);
    noticePeriodDate.setDate(noticePeriodDate.getDate() + noticeDays);

    // If no booking, create one
    if (!bookingId) {
      const room = await Room.findOne({ _id: (await Bed.findById(finalBedId))?.roomId });
      booking = await Booking.create([{
        guestId: guestUser._id, tenantId, propertyId: finalPropertyId,
        roomId: room?._id, bedId: finalBedId,
        status: 'CHECKED_IN',
        checkInDate: moveIn,
        monthlyRent: monthlyRent ?? 6000,
        aadhaarUrl: aadhaarUrl ?? '', studentIdUrl: studentIdUrl ?? '', photoUrl: photoUrl ?? '',
        documentsVerified: true, advancePaid: securityDeposit ?? 0,
        notes: internalNote ?? '',
      }], { session });
      booking = booking[0];
    } else {
      booking.status = 'CHECKED_IN';
      booking.checkInDate = moveIn;
      if (internalNote) booking.notes = internalNote;
      await booking.save({ session });
    }

    // Create HostelStudent
    // CRITICAL: For walk-in, always use form-submitted name/phone/email — never the stored guestUser values.
    // guestUser is only used for the guestId (auth linkage). The student record must reflect what was entered.
    const studentName  = bookingId ? (guestUser.name  ?? name)  : name;
    const studentPhone = bookingId ? (guestUser.phone ?? phone) : phone;
    const studentEmail = bookingId ? (guestUser.email ?? email) : email;

    const student = await HostelStudent.create([{
      tenantId, propertyId: finalPropertyId,
      hostelId: ownerHostelId,  // ← Link to hostel so super admin count works
      bookingId: booking._id, guestId: guestUser._id, bedId: finalBedId,
      name: studentName,
      phone: studentPhone,
      email: studentEmail,
      college: college ?? booking?.college ?? '',
      guardianName: guardianName ?? '', guardianPhone: guardianPhone ?? '',
      guardianAddress: guardianAddress ?? '',
      aadhaarUrl: aadhaarUrl ?? booking?.aadhaarUrl ?? '',
      aadhaarNumber: aadhaarNumber ?? '',
      studentIdUrl: studentIdUrl ?? booking?.studentIdUrl ?? '',
      photoUrl: photoUrl ?? booking?.photoUrl ?? '',
      admissionDate: moveIn,
      noticePeriodDate,
      monthlyRent: monthlyRent ?? booking?.monthlyRent ?? 6000,
      securityDeposit: securityDeposit ?? booking?.advancePaid ?? 0,
      status: 'ACTIVE',
      stayingPeriod: isOldTenant && lockInPeriod ? `${lockInPeriod} Months` : stayingPeriod,
      // ── Extended Fields ──
      registrationAmount: registrationAmount ? Number(registrationAmount) : 0,
      registrationDate: registrationDate ? new Date(registrationDate) : undefined,
      fatherName: fatherName ?? '',
      fatherOccupation: fatherOccupation ?? '',
      fatherContact: fatherContact ?? '',
      motherName: motherName ?? '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      bloodGroup: bloodGroup ?? '',
      maritalStatus: maritalStatus ?? '',
      education: education ?? '',
      occupation: occupation ?? '',
      organization: organization ?? '',
      permanentAddress: permanentAddress ?? '',
      vehicleNumber: vehicleNumber ?? '',
      medicalHistory: medicalHistory ?? '',
    }], { session });

    let preBookingDoc: any = null;
    if (preBookingId) {
      const ErpPreBooking = (await import('../models/ErpPreBooking.model')).ErpPreBooking;
      preBookingDoc = await ErpPreBooking.findByIdAndUpdate(preBookingId, { status: 'CONVERTED' }, { session, new: true }).lean();
    }

    // Set bed OCCUPIED
    bed.status = 'OCCUPIED';
    bed.currentBookingId = booking._id;
    await bed.save({ session });

    // Update room status
    const allBeds = await Bed.find({ roomId: bed.roomId });
    const anyAvail = allBeds.some(b => String(b._id) !== String(bed._id) && b.status === 'AVAILABLE');
    await Room.findByIdAndUpdate(bed.roomId, { status: anyAvail ? 'AVAILABLE' : 'FULL' }, { session });

    // Initial Invoice calculations
    const baseRentAmount = initialRentAmount !== undefined ? initialRentAmount : (monthlyRent ?? booking?.monthlyRent ?? 6000);
    const extraCharges = initialExtraCharges ?? 0;
    const totalAmount = baseRentAmount + extraCharges;
    const dueDate = new Date(moveIn.getFullYear(), moveIn.getMonth() + 1, 5);
    const tokenAmount = preBookingDoc?.tokenAmount ?? 0;
    
    // If Old Tenant, we skip standard check-in billing and just generate the pending dues + current month
    if (isOldTenant) {
      const pMode = preBookingDoc?.tokenPaymentMethod || 'CASH';
      const validMode = ['CASH', 'ONLINE', 'ADJUSTMENT'].includes(pMode) ? pMode : 'CASH';
      
      // 1. Create Past Dues Invoice (if there's old rent total > 0)
      if (totalAmount > 0) {
        const oldRentTotalNum = totalAmount;
        const oldRentPaidNum = initialPaidAmount !== undefined ? initialPaidAmount : 0;
        const pastDuesRecord = await RentRecord.create([{
          tenantId, propertyId: finalPropertyId,
          roomId: (await Bed.findById(finalBedId))?.roomId,
          hostelStudentId: student[0]._id, bookingId: booking._id,
          month: 'Past Dues',
          amount: oldRentTotalNum,
          paidAmount: oldRentPaidNum, 
          fine: 0, 
          dueDate: moveIn, 
          status: oldRentPaidNum >= oldRentTotalNum ? 'PAID' : (oldRentPaidNum > 0 ? 'PARTIAL' : 'UNPAID'),
          paidAt: oldRentPaidNum >= oldRentTotalNum ? new Date() : undefined
        }], { session });

        if (oldRentPaidNum > 0) {
          const pTx = await (await import('../models/PaymentTransaction.model')).PaymentTransaction.create([{
            transactionId: `TXN-OLD-${Date.now()}`,
            tenantId, propertyId: finalPropertyId,
            invoiceId: pastDuesRecord[0]._id,
            residentId: student[0]._id,
            settledAmount: oldRentPaidNum,
            paymentMode: validMode,
            status: 'SUCCESS'
          }], { session });

          await (await import('../models/LedgerEntry.model')).LedgerEntry.create([{
            tenantId, propertyId: finalPropertyId,
            residentId: student[0]._id,
            invoiceId: pastDuesRecord[0]._id,
            transactionId: pTx[0]._id,
            credit: oldRentPaidNum, debit: 0,
            balance: oldRentTotalNum - oldRentPaidNum,
            source: validMode,
            verifiedBy: req.user!.id,
            notes: 'Old paid amount during registration'
          }], { session });
        }
      }

    } else {
      // ── Normal Flow ──
      const firstMonthPaid = initialPaidAmount !== undefined ? initialPaidAmount : Math.min(tokenAmount, totalAmount);
      
      const rentRecord = await RentRecord.create([{
        tenantId, propertyId: finalPropertyId,
        roomId: (await Bed.findById(finalBedId))?.roomId,
        hostelStudentId: student[0]._id, bookingId: booking._id,
        month: ym(moveIn),
        amount: totalAmount,
        paidAmount: firstMonthPaid, 
        fine: 0, 
        dueDate, 
        status: firstMonthPaid >= totalAmount ? 'PAID' : (firstMonthPaid > 0 ? 'PARTIAL' : 'UNPAID'),
        paidAt: firstMonthPaid >= totalAmount ? new Date() : undefined
      }], { session });

      if (firstMonthPaid > 0 || tokenAmount > 0) {
        const amountToRecord = firstMonthPaid > 0 ? firstMonthPaid : tokenAmount;
        const pMode = preBookingDoc?.tokenPaymentMethod || 'CASH';
        const validMode = ['CASH', 'ONLINE', 'ADJUSTMENT'].includes(pMode) ? pMode : 'CASH';
        
        const pTx = await (await import('../models/PaymentTransaction.model')).PaymentTransaction.create([{
          transactionId: `TXN-INITIAL-${Date.now()}`,
          tenantId, propertyId: finalPropertyId,
          invoiceId: rentRecord[0]._id,
          residentId: student[0]._id,
          settledAmount: amountToRecord,
          paymentMode: validMode,
          status: 'SUCCESS'
        }], { session });

        await (await import('../models/LedgerEntry.model')).LedgerEntry.create([{
          tenantId, propertyId: finalPropertyId,
          residentId: student[0]._id,
          invoiceId: rentRecord[0]._id,
          transactionId: pTx[0]._id,
          credit: amountToRecord, debit: 0,
          balance: totalAmount - amountToRecord,
          source: validMode,
          verifiedBy: req.user!.id,
          notes: preBookingId ? 'Token adjusted for first month rent' : 'Initial payment during registration'
        }], { session });
      }

      // Backfill missing subsequent invoices up to the current month if backdated
      const currentMonthStr = ym(new Date());
      let iterDate = new Date(moveIn.getFullYear(), moveIn.getMonth() + 1, 1);
      const invoicesToCreate: any[] = [];
      while (ym(iterDate) <= currentMonthStr) {
        invoicesToCreate.push({
          tenantId, propertyId: finalPropertyId,
          roomId: (await Bed.findById(finalBedId))?.roomId,
          hostelStudentId: student[0]._id, bookingId: booking._id,
          month: ym(iterDate),
          amount: monthlyRent ?? booking?.monthlyRent ?? 6000,
          paidAmount: 0,
          fine: 0,
          dueDate: new Date(iterDate.getFullYear(), iterDate.getMonth() + 1, 5),
          status: 'UNPAID'
        });
        iterDate = new Date(iterDate.getFullYear(), iterDate.getMonth() + 1, 1);
      }
      if (invoicesToCreate.length > 0) {
        await RentRecord.insertMany(invoicesToCreate, { session });
      }
    }

    // Process Registration Amount (Separate Invoice & Transaction)
    const regAmountNum = registrationAmount ? Number(registrationAmount) : 0;
    if (regAmountNum > 0) {
      const regRecord = await RentRecord.create([{
        tenantId, propertyId: finalPropertyId,
        roomId: (await Bed.findById(finalBedId))?.roomId,
        hostelStudentId: student[0]._id, bookingId: booking._id,
        month: 'Registration Fee',
        amount: regAmountNum,
        paidAmount: regAmountNum,
        fine: 0,
        dueDate: moveIn,
        status: 'PAID',
        paidAt: new Date(),
        feeBreakdown: [{ description: 'Registration Fee (Non-Refundable)', amount: regAmountNum }]
      }], { session });

      const pTxReg = await (await import('../models/PaymentTransaction.model')).PaymentTransaction.create([{
        transactionId: `TXN-REG-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        tenantId, propertyId: finalPropertyId,
        invoiceId: regRecord[0]._id,
        residentId: student[0]._id,
        settledAmount: regAmountNum,
        paymentMode: preBookingDoc?.tokenPaymentMethod || 'CASH',
        status: 'SUCCESS'
      }], { session });

      await (await import('../models/LedgerEntry.model')).LedgerEntry.create([{
        tenantId, propertyId: finalPropertyId,
        residentId: student[0]._id,
        invoiceId: regRecord[0]._id,
        transactionId: pTxReg[0]._id,
        credit: regAmountNum, debit: 0,
        balance: 0,
        source: preBookingDoc?.tokenPaymentMethod || 'CASH',
        verifiedBy: req.user!.id,
        notes: 'Non-refundable registration amount'
      }], { session });
    }

    if (session) await session.commitTransaction();
    // Notify after commit (non-critical, mock-email included)
    notify({ userId: guestUser._id.toString(), type: 'CHECKIN_CONFIRMED', title: '🏠 Check-In Confirmed!', message: `Welcome! Your check-in at bed ${bed.bedNumber} is complete.`, linkUrl: '/account/bookings' }).catch(() => {});
    res.status(201).json({ success: true, data: { student: student[0], booking, hostelCode: ownerHostel?.hostelCode, hostelName: ownerHostel?.name, message: `Check-In complete for ${guestUser.name ?? name}` } });
  } catch (err) {
    if (session) await session.abortTransaction();
    console.error('[erp] checkIn:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (session) session.endSession();
  }
};

// ─── POST /api/hostel-admin/erp/checkout/:studentId ──────────────────────────
export const processCheckOut = async (req: AuthRequest, res: Response): Promise<void> => {
  const supportsTx = (mongoose.connection.getClient() as any)?.topology?.description?.type !== 'Single';
  const session = supportsTx ? await mongoose.startSession() : null;
  if (session) session.startTransaction();
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { checkoutDate, depositReturn, notes, overrideReason } = req.body;

    const student = await HostelStudent.findOne({ _id: req.params.studentId, tenantId, status: 'ACTIVE' });
    if (!student) { if (session) await session.abortTransaction(); res.status(404).json({ success: false, message: 'Active student not found' }); return; }

    // Check dues
    const unpaidRecords = await RentRecord.find({
      hostelStudentId: student._id, status: { $in: ['UNPAID', 'PARTIAL'] },
    }).lean();

    const totalDue = unpaidRecords.reduce((s, r) => s + Math.max(0, (r.amount + (r.fine ?? 0)) - (r.paidAmount ?? 0)), 0);

    if (totalDue > 0 && !overrideReason) {
      if (session) await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: `Student has ₹${totalDue.toLocaleString('en-IN')} in unpaid dues. Provide overrideReason to proceed.`,
        totalDue, unpaidRecords,
      });
      return;
    }

    if (overrideReason && overrideReason.trim().length < 5) {
      if (session) await session.abortTransaction();
      res.status(400).json({ success: false, message: 'Override reason must be at least 5 characters.' });
      return;
    }

    const exitDate = checkoutDate ? new Date(checkoutDate) : new Date();

    // Update student
    student.status = 'CHECKED_OUT';
    student.exitDate = exitDate;
    if (notes) student.guardianName = student.guardianName; // just to mark dirty, no schema field for notes
    await student.save({ session });

    // Update booking
    await Booking.findByIdAndUpdate(student.bookingId, { status: 'CHECKED_OUT', checkOutDate: exitDate }, { session });

    // Free bed
    await Bed.findByIdAndUpdate(student.bedId, { status: 'AVAILABLE', currentBookingId: null }, { session });

    // Update room status
    const bed = await Bed.findById(student.bedId);
    if (bed) {
      await Room.findOneAndUpdate(
        { _id: (await Bed.findById(student.bedId).lean())?.roomId },
        { status: 'AVAILABLE' },
        { session }
      );
    }

    if (session) await session.commitTransaction();
    notify({ userId: student.guestId.toString(), type: 'CHECKOUT_CONFIRMED', title: '👋 Check-Out Confirmed', message: `Your check-out has been processed. Deposit return: ₹${depositReturn ?? 0}. Thank you for staying with us!`, linkUrl: '/account/bookings' }).catch(() => {});
    res.json({ success: true, message: 'Check-Out complete. Bed is now available.' });
  } catch (err) {
    if (session) await session.abortTransaction();
    console.error('[erp] checkOut:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (session) session.endSession();
  }
};

// ─── GET /api/hostel-admin/erp/dues/:studentId ───────────────────────────────
export const getStudentDues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const records = await RentRecord.find({
      tenantId, hostelStudentId: req.params.studentId,
      status: { $in: ['UNPAID', 'PARTIAL'] },
    }).sort({ month: 1 }).lean();
    const total = records.reduce((s, r) => s + Math.max(0, (r.amount + (r.fine ?? 0)) - (r.paidAmount ?? 0)), 0);
    res.json({ success: true, data: { records, totalDue: total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
export const bulkCreateStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { students } = req.body;
    if (!students || !Array.isArray(students)) {
      res.status(400).json({ success: false, message: 'Invalid data format' });
      return;
    }

    const ownerHostel = await (await import('../models/Hostel.model')).Hostel
      .findOne({ ownerId: new mongoose.Types.ObjectId(tenantId) })
      .select('_id hostelCode name')
      .lean();
    const ownerHostelId = req.user?.role === 'WARDEN' || req.user?.role === 'MESS_MANAGER' ? req.user.hostelId : (ownerHostel?._id ?? null);

    const results: any[] = [];
    
    const parseCsvDate = (dateStr: any) => {
      if (!dateStr) return undefined;
      const str = String(dateStr).trim();
      
      // First, prioritize MM/DD/YYYY (Standard US Format / Default JS Format)
      const nativeDate = new Date(str);
      if (!isNaN(nativeDate.getTime())) {
        return nativeDate;
      }
      
      // If native fails (e.g. they typed DD/MM/YYYY like 25/12/2026 where month > 12)
      // fallback to DD/MM/YYYY parsing
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          
          if (year.length === 4) {
            // YYYY-MM-DD
            const parsed = new Date(`${year}-${month}-${day}`);
            if (!isNaN(parsed.getTime()) && Number(month) <= 12 && Number(day) <= 31) {
              return parsed;
            }
          }
        }
      }
      
      return undefined;
    };

    for (const student of students) {
      const {
        name, phone, email, propertyId, admissionDate,
        dateOfBirth, aadhaarNumber, occupation, fatherName, motherName,
        fatherContact, permanentAddress, organization, bloodGroup, maritalStatus,
        registrationAmount, registrationDate, monthlyRent, securityDeposit,
        stayingPeriod, education, medicalHistory, vehicleNumber, college,
        guardianName, guardianPhone, guardianAddress, fatherOccupation
      } = student;

      try {
        if (!name || !phone || !email || !propertyId) {
          throw new Error('Missing required fields (name, phone, email, propertyId)');
        }

        const existingStudent = await HostelStudent.findOne({
          tenantId, phone, propertyId, status: { $in: ['ACTIVE', 'DRAFT'] }
        }).lean();
        if (existingStudent) throw new Error('Phone number already active or in drafts');

        const defaultPassword = String(phone).slice(-4);
        let existingUser: any = await User.findOne({ phone }).lean();
        if (!existingUser) {
          const existingByEmail = await User.findOne({ email: email.toLowerCase() }).lean();
          if (existingByEmail) throw new Error('Email already in use by another account');
          
          const bcrypt = require('bcryptjs');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(defaultPassword, salt);
          existingUser = await User.create({
            name, phone, email: email.toLowerCase(), passwordHash: hashedPassword, role: 'STUDENT', hostelId: ownerHostelId, studentId: phone
          });
          await GuestProfile.create({ userId: existingUser._id, tenantId });
        }

        const parsedAdmissionDate = parseCsvDate(admissionDate) || new Date();
        const parsedDob = parseCsvDate(dateOfBirth);
        const parsedRegDate = parseCsvDate(registrationDate);

        const newStudent = await HostelStudent.create({
          tenantId, hostelId: ownerHostelId, propertyId, guestId: existingUser._id,
          name, phone, email: email.toLowerCase(),
          admissionDate: parsedAdmissionDate,
          monthlyRent: Number(monthlyRent) || 0,
          securityDeposit: Number(securityDeposit) || 0,
          status: 'DRAFT', feeBreakdown: [],
          dateOfBirth: parsedDob,
          aadhaarNumber, occupation, fatherName, motherName, fatherContact, permanentAddress, organization, bloodGroup, maritalStatus,
          registrationAmount: Number(registrationAmount) || 0,
          registrationDate: parsedRegDate,
          stayingPeriod, education, medicalHistory, vehicleNumber, college,
          guardianName, guardianPhone, guardianAddress, fatherOccupation
        });

        results.push({ success: true, phone, name, id: newStudent._id });
      } catch (err: any) {
        results.push({ success: false, phone, name, error: err.message });
      }
    }

    res.json({ success: true, data: results });
  } catch (err: any) {
    console.error('Bulk Upload Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const deleteDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { id } = req.params;
    
    const HostelStudent = (await import('../models/HostelStudent.model')).HostelStudent;
    const student = await HostelStudent.findOne({ _id: id, tenantId });
    if (!student) {
      res.status(404).json({ success: false, message: 'Draft not found' });
      return;
    }
    
    if (student.status !== 'DRAFT') {
      res.status(400).json({ success: false, message: 'Only drafts can be deleted' });
      return;
    }

    await HostelStudent.deleteOne({ _id: id });
    res.json({ success: true, message: 'Draft deleted successfully' });
  } catch (err: any) {
    console.error('Delete Draft Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const bulkDeleteDrafts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'No drafts selected for deletion' });
      return;
    }

    const HostelStudent = (await import('../models/HostelStudent.model')).HostelStudent;
    
    // Only delete documents that belong to this tenant AND are in DRAFT status
    const result = await HostelStudent.deleteMany({
      tenantId,
      _id: { $in: ids },
      status: 'DRAFT'
    });

    res.json({ success: true, message: `Successfully deleted ${result.deletedCount} drafts` });
  } catch (err: any) {
    console.error('Bulk Delete Drafts Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
export const finalizeDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  const supportsTx = (mongoose.connection.getClient() as any)?.topology?.description?.type !== 'Single';
  const session = supportsTx ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const student = await HostelStudent.findOne({ _id: req.params.id, tenantId }).session(session);
    if (!student) throw new Error('Student not found');
    if (student.status !== 'DRAFT') throw new Error('Student is not in draft state');

    const {
      roomId, bedId,
      admissionDate, stayingPeriod, monthlyRent, securityDeposit,
      fatherName, motherName, dateOfBirth, bloodGroup, maritalStatus,
      education, occupation, organization, permanentAddress,
      vehicleNumber, medicalHistory, college, guardianName,
      guardianPhone, guardianAddress, fatherOccupation, aadhaarNumber,
      registrationAmount, registrationDate, fatherContact,
      initialPaidAmount
    } = req.body;

    if (!roomId || !bedId) {
      throw new Error('Room and Bed selection is required to finalize draft');
    }

    const bed = await (await import('../models/Bed.model')).Bed.findOne({ _id: bedId, roomId, propertyId: student.propertyId, tenantId }).session(session);
    if (!bed) throw new Error('Bed not found');
    if (bed.status !== 'AVAILABLE') throw new Error('Selected bed is not available');

    // update student
    student.status = 'ACTIVE';
    if (admissionDate) student.admissionDate = new Date(admissionDate);
    if (stayingPeriod) student.stayingPeriod = stayingPeriod;
    
    // Monthly Rent Fallback
    if (monthlyRent && Number(monthlyRent) > 0) {
      student.monthlyRent = Number(monthlyRent);
    } else {
      const room = await (await import('../models/Room.model')).Room.findById(roomId).lean();
      student.monthlyRent = bed.price || (room as any)?.pricePerBed || 0;
    }

    if (securityDeposit !== undefined) student.securityDeposit = Number(securityDeposit);
    if (registrationAmount !== undefined) student.registrationAmount = Number(registrationAmount);
    if (registrationDate) student.registrationDate = new Date(registrationDate);
    if (fatherContact) student.fatherContact = fatherContact;
    
    if (fatherName) student.fatherName = fatherName;
    if (motherName) student.motherName = motherName;
    if (dateOfBirth) student.dateOfBirth = new Date(dateOfBirth);
    if (bloodGroup) student.bloodGroup = bloodGroup;
    if (maritalStatus) student.maritalStatus = maritalStatus;
    if (education) student.education = education;
    if (occupation) student.occupation = occupation;
    if (organization) student.organization = organization;
    if (permanentAddress) student.permanentAddress = permanentAddress;
    if (vehicleNumber) student.vehicleNumber = vehicleNumber;
    if (medicalHistory) student.medicalHistory = medicalHistory;
    if (college) student.college = college;
    if (guardianName) student.guardianName = guardianName;
    if (guardianPhone) student.guardianPhone = guardianPhone;
    if (guardianAddress) student.guardianAddress = guardianAddress;
    if (fatherOccupation) student.fatherOccupation = fatherOccupation;
    if (aadhaarNumber) student.aadhaarNumber = aadhaarNumber;

    // create booking
    const Booking = (await import('../models/Booking.model')).Booking;
    const booking = await Booking.create([{
      guestId: student.guestId, tenantId, hostelId: student.hostelId, propertyId: student.propertyId, roomId, bedId,
      status: 'CONFIRMED', checkInDate: student.admissionDate,
      advancePaid: 0, monthlyRent: student.monthlyRent, documentsVerified: false
    }], { session });

    student.bookingId = booking[0]._id;
    student.bedId = bed._id;
    
    bed.status = 'OCCUPIED';
    await bed.save({ session });

    // generate first rent record
    const totalAmount = student.monthlyRent + (student.securityDeposit || 0);
    const moveIn = student.admissionDate;
    const paidNum = Number(initialPaidAmount) || 0;
    const firstMonthPaid = Math.min(paidNum, totalAmount);
    
    // Set booking advancePaid if applicable
    booking[0].advancePaid = firstMonthPaid;
    await booking[0].save({ session });

    const rentRecord = await RentRecord.create([{
      tenantId: student.tenantId,
      propertyId: student.propertyId,
      hostelId: student.hostelId,
      roomId: bed?.roomId,
      hostelStudentId: student._id,
      bookingId: student.bookingId,
      month: ym(moveIn),
      amount: totalAmount,
      paidAmount: firstMonthPaid,
      fine: 0,
      dueDate: new Date(moveIn),
      status: firstMonthPaid >= totalAmount ? 'PAID' : (firstMonthPaid > 0 ? 'PARTIAL' : 'UNPAID'),
      paidAt: firstMonthPaid >= totalAmount ? new Date() : undefined,
      feeBreakdown: [
        { description: `Monthly Rent (${ym(moveIn)})`, amount: student.monthlyRent },
        ...(student.securityDeposit > 0 ? [{ description: 'Security Deposit', amount: student.securityDeposit }] : [])
      ]
    }], { session });

    if (firstMonthPaid > 0) {
      const pTx = await (await import('../models/PaymentTransaction.model')).PaymentTransaction.create([{
        transactionId: `TXN-DRAFT-${Date.now()}`,
        tenantId, propertyId: student.propertyId,
        invoiceId: rentRecord[0]._id,
        residentId: student._id,
        settledAmount: firstMonthPaid,
        paymentMode: 'CASH', // default to CASH since no payment gateway configured here yet
        status: 'SUCCESS'
      }], { session });

      await (await import('../models/LedgerEntry.model')).LedgerEntry.create([{
        tenantId, propertyId: student.propertyId,
        residentId: student._id,
        invoiceId: rentRecord[0]._id,
        transactionId: pTx[0]._id,
        credit: firstMonthPaid, debit: 0,
        balance: totalAmount - firstMonthPaid,
        source: 'CASH',
        verifiedBy: req.user!.id,
        notes: 'Initial payment during draft finalization'
      }], { session });
    }

    // Process Registration Amount (Separate Invoice & Transaction)
    const regAmountNum = registrationAmount ? Number(registrationAmount) : 0;
    if (regAmountNum > 0) {
      const regRecord = await RentRecord.create([{
        tenantId: student.tenantId, propertyId: student.propertyId,
        roomId: bed?.roomId,
        hostelStudentId: student._id, bookingId: student.bookingId,
        month: 'Registration Fee',
        amount: regAmountNum,
        paidAmount: regAmountNum,
        fine: 0,
        dueDate: moveIn,
        status: 'PAID',
        paidAt: new Date(),
        feeBreakdown: [{ description: 'Registration Fee (Non-Refundable)', amount: regAmountNum }]
      }], { session });

      const pTxReg = await (await import('../models/PaymentTransaction.model')).PaymentTransaction.create([{
        transactionId: `TXN-REG-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        tenantId, propertyId: student.propertyId,
        invoiceId: regRecord[0]._id,
        residentId: student._id,
        settledAmount: regAmountNum,
        paymentMode: 'CASH',
        status: 'SUCCESS'
      }], { session });

      await (await import('../models/LedgerEntry.model')).LedgerEntry.create([{
        tenantId, propertyId: student.propertyId,
        residentId: student._id,
        invoiceId: regRecord[0]._id,
        transactionId: pTxReg[0]._id,
        credit: regAmountNum, debit: 0,
        balance: 0,
        source: 'CASH',
        verifiedBy: req.user!.id,
        notes: 'Non-refundable registration amount'
      }], { session });
    }

    await student.save({ session });

    if (session) { await session.commitTransaction(); session.endSession(); }
    res.json({ success: true, message: 'Draft finalized and rent history created' });
  } catch (err: any) {
    if (session) { await session.abortTransaction(); session.endSession(); }
    console.error('Finalize Draft Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

export const updateStudentProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { id } = req.params;
    
    const HostelStudent = (await import('../models/HostelStudent.model')).HostelStudent;
    const student = await HostelStudent.findOne({ _id: id, tenantId });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const {
      name, phone, email, registrationAmount, fatherName, motherName,
      dateOfBirth, bloodGroup, maritalStatus, education, occupation,
      organization, permanentAddress, vehicleNumber, medicalHistory,
      college, guardianName, guardianPhone, guardianAddress, fatherOccupation,
      aadhaarNumber, fatherContact, stayingPeriod, monthlyRent, securityDeposit,
      admissionDate, aadhaarUrl, studentIdUrl, photoUrl
    } = req.body;

    if (name) student.name = name;
    if (phone) student.phone = phone;
    if (email) student.email = email;
    if (registrationAmount !== undefined) student.registrationAmount = Number(registrationAmount);
    
    if (fatherName !== undefined) student.fatherName = fatherName;
    if (motherName !== undefined) student.motherName = motherName;
    if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    if (bloodGroup !== undefined) student.bloodGroup = bloodGroup;
    if (maritalStatus !== undefined) student.maritalStatus = maritalStatus;
    if (education !== undefined) student.education = education;
    if (occupation !== undefined) student.occupation = occupation;
    if (organization !== undefined) student.organization = organization;
    if (permanentAddress !== undefined) student.permanentAddress = permanentAddress;
    if (vehicleNumber !== undefined) student.vehicleNumber = vehicleNumber;
    if (medicalHistory !== undefined) student.medicalHistory = medicalHistory;
    if (college !== undefined) student.college = college;
    if (guardianName !== undefined) student.guardianName = guardianName;
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;
    if (guardianAddress !== undefined) student.guardianAddress = guardianAddress;
    if (fatherOccupation !== undefined) student.fatherOccupation = fatherOccupation;
    if (aadhaarNumber !== undefined) student.aadhaarNumber = aadhaarNumber;
    if (fatherContact !== undefined) student.fatherContact = fatherContact;
    if (stayingPeriod !== undefined) student.stayingPeriod = stayingPeriod;
    if (monthlyRent !== undefined) student.monthlyRent = Number(monthlyRent);
    if (securityDeposit !== undefined) student.securityDeposit = Number(securityDeposit);
    if (admissionDate !== undefined) student.admissionDate = admissionDate ? new Date(admissionDate) : student.admissionDate;

    if (aadhaarUrl !== undefined) student.aadhaarUrl = aadhaarUrl;
    if (studentIdUrl !== undefined) student.studentIdUrl = studentIdUrl;
    if (photoUrl !== undefined) student.photoUrl = photoUrl;

    await student.save();
    res.json({ success: true, message: 'Student profile updated successfully', data: student });
  } catch (err: any) {
    console.error('Update Student Profile Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PUT /api/hostel-admin/erp/students/:id/verify-document ──────────────────
export const verifyStudentDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { id } = req.params;
    const { docType, verified } = req.body;

    const student = await HostelStudent.findOne({ _id: id, propertyId: { $in: await Property.find({ tenantId }).distinct('_id') } });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    if (docType === 'aadhaar') {
      student.isAadhaarVerified = verified;
    } else if (docType === 'studentId') {
      student.isStudentIdVerified = verified;
    } else if (docType === 'photo') {
      student.isPhotoVerified = verified;
    } else {
      res.status(400).json({ success: false, message: 'Invalid document type' });
      return;
    }

    await student.save();
    res.json({ success: true, message: `Document verification status updated to ${verified}` });
  } catch (err) {
    console.error('Verify Document Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const relocateTenant = async (req: AuthRequest, res: Response): Promise<void> => {
  const mongoose = require('mongoose');
  const supportsTx = (mongoose.connection.getClient() as any)?.topology?.description?.type !== 'Single';
  const session = supportsTx ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const tenantId = req.user!.tenantId || req.user!.id;
    const { id } = req.params;
    const { newPropertyId, newRoomId, newBedId } = req.body;

    if (!newPropertyId || !newRoomId || !newBedId) {
      if (session) await session.abortTransaction();
      res.status(400).json({ success: false, message: 'Missing required fields: newPropertyId, newRoomId, newBedId' });
      return;
    }

    const HostelStudent = (await import('../models/HostelStudent.model')).HostelStudent;
    const Bed = (await import('../models/Bed.model')).Bed;
    const Booking = (await import('../models/Booking.model')).Booking;

    const student = await HostelStudent.findOne({ _id: id, tenantId }).session(session);
    if (!student) throw new Error('Student not found');

    const newBed = await Bed.findOne({ _id: newBedId, roomId: newRoomId, propertyId: newPropertyId, tenantId }).session(session);
    if (!newBed) throw new Error('Selected bed not found');
    if (newBed.status !== 'AVAILABLE') throw new Error('Selected bed is not available');

    const oldBedId = student.bedId;
    if (String(oldBedId) === String(newBedId)) {
      throw new Error('Tenant is already in this bed');
    }

    // Free old bed
    if (oldBedId) {
      await Bed.updateOne({ _id: oldBedId }, { status: 'AVAILABLE' }, { session });
    }

    // Occupy new bed
    newBed.status = 'OCCUPIED';
    await newBed.save({ session });

    // Update student
    student.propertyId = newPropertyId;
    student.bedId = newBedId;
    await student.save({ session });

    // Update active booking if exists
    const activeBooking = await Booking.findOne({ guestId: student.guestId, status: 'CHECKED_IN', tenantId }).session(session);
    if (activeBooking) {
      activeBooking.propertyId = newPropertyId;
      activeBooking.roomId = newRoomId;
      activeBooking.bedId = newBedId;
      await activeBooking.save({ session });
    }

    if (session) await session.commitTransaction();
    if (session) session.endSession();

    res.json({ success: true, message: 'Tenant relocated successfully' });
  } catch (err: any) {
    if (session) await session.abortTransaction();
    if (session) session.endSession();
    console.error('Relocate Tenant Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
