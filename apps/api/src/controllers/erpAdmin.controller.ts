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
      // ── Extended Registration Form Fields ───────────────────────────────────
      registrationDate: registrationDate ? new Date(registrationDate) : moveIn,
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
      stayingPeriod: stayingPeriod ?? '',
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

    // Generate first rent record
    const dueDate = new Date(moveIn.getFullYear(), moveIn.getMonth() + 1, 5);
    const rentAmount = monthlyRent ?? booking?.monthlyRent ?? 6000;
    const tokenAmount = preBookingDoc?.tokenAmount ?? 0;
    const initialPaidAmount = Math.min(tokenAmount, rentAmount);
    
    await RentRecord.create([{
      tenantId, propertyId: finalPropertyId,
      roomId: (await Bed.findById(finalBedId))?.roomId,
      hostelStudentId: student[0]._id, bookingId: booking._id,
      month: ym(moveIn),
      amount: rentAmount,
      paidAmount: initialPaidAmount, 
      fine: 0, 
      dueDate, 
      status: initialPaidAmount >= rentAmount ? 'PAID' : (initialPaidAmount > 0 ? 'PARTIAL' : 'UNPAID'),
      paidAt: initialPaidAmount >= rentAmount ? new Date() : undefined
    }], { session });

    // If there is a token amount, create a LedgerEntry and PaymentTransaction to record it
    if (tokenAmount > 0) {
      const pTx = await (await import('../models/PaymentTransaction.model')).PaymentTransaction.create([{
        transactionId: `TXN-TOKEN-${Date.now()}`,
        tenantId, propertyId: finalPropertyId,
        residentId: student[0]._id,
        settledAmount: tokenAmount,
        paymentMode: preBookingDoc?.tokenPaymentMethod || 'CASH',
        status: 'SUCCESS'
      }], { session });

      await (await import('../models/LedgerEntry.model')).LedgerEntry.create([{
        tenantId, propertyId: finalPropertyId,
        residentId: student[0]._id,
        transactionId: pTx[0]._id,
        credit: tokenAmount, debit: 0,
        balance: rentAmount - tokenAmount,
        source: preBookingDoc?.tokenPaymentMethod || 'CASH',
        verifiedBy: req.user!.id
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
