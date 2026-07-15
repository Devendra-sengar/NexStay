import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { HostelStudent } from '../models/HostelStudent.model';
import { RentRecord } from '../models/RentRecord.model';
import { Complaint } from '../models/Complaint.model';
import { MessMenu } from '../models/MessMenu.model';
import { Notification } from '../models/Notification.model';
import { Hostel } from '../models/Hostel.model';
import { Expense } from '../models/Expense.model';
import { PaymentSubmission } from '../models/PaymentSubmission.model';
import { PaymentTransaction } from '../models/PaymentTransaction.model';
import { LedgerEntry } from '../models/LedgerEntry.model';
import { AuditLog } from '../models/AuditLog.model';
import { Bed } from '../models/Bed.model';
import { Room } from '../models/Room.model';
import { User } from '../models/User.model';
import bcrypt from 'bcryptjs';
import cloudinary from '../config/cloudinary';

const todayDate = () => new Date().toISOString().split('T')[0];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ─── GET /api/student/dashboard ───────────────────────────────────────────────
export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select('name studentId hostelId').lean();

    // Find active hostel student record
    const studentRecord = await HostelStudent.findOne({ guestId: userId, status: 'ACTIVE' })
      .populate('bedId', 'bedNumber')
      .lean();

    let hostel: any = null;
    let room: any = null;
    let currentRent: any = null;
    let todayMenu: any = null;

    if (studentRecord) {
      hostel = await Hostel.findById(studentRecord.hostelId || (user as any)?.hostelId)
        .select('name hostelCode messEnabled messTimings').lean();

      // Get room info
      const bed = await Bed.findById(studentRecord.bedId).populate('roomId', 'roomNumber').lean();
      if (bed) room = (bed as any).roomId;

      // Current month rent
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      currentRent = await RentRecord.findOne({
        hostelStudentId: studentRecord._id,
        month: thisMonth,
      }).lean();

      // Today's mess menu
      const hostelId = studentRecord.hostelId || (user as any)?.hostelId;
      if (hostel?.messEnabled) {
        todayMenu = await MessMenu.findOne({ hostelId, date: todayDate() }).lean();
      }
    }

    // Recent notices
    const recentNotices = await Notification.find({ userId })
      .sort({ createdAt: -1 }).limit(5).lean();

    // Pending complaints count
    const pendingComplaints = await Complaint.countDocuments({
      guestId: userId,
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
    });

    // Stay duration
    const stayDays = studentRecord?.admissionDate
      ? Math.floor((Date.now() - new Date(studentRecord.admissionDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      success: true,
      data: {
        greeting: greeting(),
        student: {
          name: (user as any)?.name,
          studentId: (user as any)?.studentId,
          hostelName: (hostel as any)?.name || '',
          hostelCode: (hostel as any)?.hostelCode || '',
          roomNumber: (room as any)?.roomNumber || '',
          bedNumber: (studentRecord?.bedId as any)?.bedNumber || '',
          admissionDate: studentRecord?.admissionDate || null,
          stayDays,
        },
        currentRent: currentRent || null,
        pendingComplaints,
        todayMenu: todayMenu || null,
        recentNotices,
      },
    });
  } catch (err) {
    console.error('getStudentDashboard:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/student/profile ─────────────────────────────────────────────────
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash -otp -otpExpiry -refreshToken').lean();
    const studentRecord = await HostelStudent.findOne({ guestId: req.user?.id, status: 'ACTIVE' })
      .populate('bedId', 'bedNumber').lean();
    res.json({ success: true, data: { user, studentRecord } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── PATCH /api/student/profile ───────────────────────────────────────────────
export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    await user.save();
    res.json({ success: true, message: 'Profile updated' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── PATCH /api/student/password ─────────────────────────────────────────────
export const changeStudentPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 4) {
      res.status(400).json({ success: false, message: 'Valid passwords required (min 4 chars)' }); return;
    }
    const user = await User.findById(req.user?.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) { res.status(400).json({ success: false, message: 'Current password incorrect' }); return; }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/student/booking ─────────────────────────────────────────────────
export const getMyActiveBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const record = await HostelStudent.findOne({ guestId: req.user?.id, status: 'ACTIVE' })
      .populate('bedId', 'bedNumber status')
      .lean();
    res.json({ success: true, data: record || null });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/student/rent ────────────────────────────────────────────────────
export const getMyRentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentRecord = await HostelStudent.findOne({ guestId: req.user?.id, status: 'ACTIVE' }).lean();
    if (!studentRecord) { res.json({ success: true, data: [] }); return; }
    const records = await RentRecord.find({ hostelStudentId: studentRecord._id })
      .sort({ month: -1 }).lean();
    res.json({ success: true, data: records, securityDeposit: studentRecord.securityDeposit });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/student/transactions ───────────────────────────────────────────
export const getMyTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentRecord = await HostelStudent.findOne({ guestId: req.user?.id, status: 'ACTIVE' }).lean();
    if (!studentRecord) { res.json({ success: true, data: [] }); return; }
    const txs = await PaymentSubmission.find({ residentId: studentRecord._id })
      .populate('invoiceId', 'month amount paidAmount fine status')
      .sort({ createdAt: -1 }).lean();
    
    // Map to old frontend fields temporarily until frontend is updated
    const mappedTxs = txs.map(tx => ({
      ...tx,
      amountSubmitted: tx.claimedAmount,
      paymentProof: { screenshotUrl: tx.proofUrl },
      rejectionReason: tx.remark
    }));
    res.json({ success: true, data: mappedTxs });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/student/rent/current ───────────────────────────────────────────
export const getCurrentMonthRent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentRecord = await HostelStudent.findOne({ guestId: req.user?.id, status: 'ACTIVE' }).lean();
    if (!studentRecord) { res.json({ success: true, data: null }); return; }
    const thisMonth = new Date().toISOString().slice(0, 7);
    const rent = await RentRecord.findOne({ hostelStudentId: studentRecord._id, month: thisMonth }).lean();
    res.json({ success: true, data: rent || null });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/student/complaints ─────────────────────────────────────────────
export const getMyComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const complaints = await Complaint.find({ guestId: req.user?.id })
      .sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: complaints });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── POST /api/student/complaints ────────────────────────────────────────────
export const raiseComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, category, description } = req.body;
    if (!title || !category || !description) {
      res.status(400).json({ success: false, message: 'title, category, description are required' }); return;
    }

    const studentRecord = await HostelStudent.findOne({ guestId: req.user?.id, status: 'ACTIVE' }).lean();
    if (!studentRecord) {
      res.status(400).json({ success: false, message: 'No active hostel record found' }); return;
    }

    const complaint = await Complaint.create({
      tenantId: studentRecord.tenantId,
      hostelId: studentRecord.hostelId,
      propertyId: studentRecord.propertyId,
      guestId: req.user?.id,
      hostelStudentId: studentRecord._id,
      title,
      category,
      description,
      status: 'OPEN',
      statusHistory: [{ status: 'OPEN', note: 'Complaint raised by student', changedBy: 'Student', changedAt: new Date() }],
    });

    res.status(201).json({ success: true, data: complaint });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/student/mess/menu ───────────────────────────────────────────────
export const getTodayMenuForMyHostel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('hostelId').lean();
    const hostelId = (user as any)?.hostelId;
    if (!hostelId) { res.json({ success: true, data: null }); return; }
    const menu = await MessMenu.findOne({ hostelId, date: todayDate() })
      .populate('uploadedBy', 'name').lean();
    res.json({ success: true, data: menu || null });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/student/mess/menu/week ─────────────────────────────────────────
export const getWeekMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('hostelId').lean();
    const hostelId = (user as any)?.hostelId;
    if (!hostelId) { res.json({ success: true, data: [] }); return; }

    const dates: string[] = [];
    for (let i = -1; i < 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const menus = await MessMenu.find({ hostelId, date: { $in: dates } })
      .sort({ date: 1 }).lean();
    res.json({ success: true, data: menus });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/student/notices ────────────────────────────────────────────────
export const getHostelNotices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), lim = parseInt(limit);
    const [notices, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user?.id })
        .sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
      Notification.countDocuments({ userId: req.user?.id }),
      Notification.countDocuments({ userId: req.user?.id, isRead: false }),
    ]);
    res.json({ success: true, data: notices, total, unreadCount, hasNextPage: p * lim < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GET /api/student/roommates ──────────────────────────────────────────────
export const getMyRoommates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Find student's bed → room
    const myRecord = await HostelStudent.findOne({ guestId: req.user?.id, status: 'ACTIVE' })
      .populate('bedId', 'roomId bedNumber').lean();
    if (!myRecord) { res.json({ success: true, data: [] }); return; }

    const myBed = myRecord.bedId as any;
    const roomId = myBed?.roomId;
    if (!roomId) { res.json({ success: true, data: [] }); return; }

    // Find all beds in same room
    const bedsInRoom = await Bed.find({ roomId }).select('_id bedNumber').lean();
    const bedIds = bedsInRoom.map(b => b._id);

    // Find all other active students in those beds
    const roommates = await HostelStudent.find({
      bedId: { $in: bedIds },
      guestId: { $ne: req.user?.id },
      status: 'ACTIVE',
    }).select('name bedId').populate('bedId', 'bedNumber').lean();

    // Return only name + bed number (privacy)
    const safeRoommates = roommates.map(r => ({
      name: r.name,
      bedNumber: (r.bedId as any)?.bedNumber || '',
    }));

    res.json({ success: true, data: safeRoommates });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── POST /api/student/rent/:id/payment-proof ─────────────────────────────────
// Student uploads a payment screenshot; sets paymentProofStatus = PENDING
export const submitPaymentProof = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const studentRecord = await HostelStudent.findOne({ guestId: req.user?.id, status: 'ACTIVE' }).lean();
    if (!studentRecord) {
      res.status(403).json({ success: false, message: 'No active student record found' }); return;
    }

    const record = await RentRecord.findOne({ _id: id, hostelStudentId: studentRecord._id });
    if (!record) {
      res.status(404).json({ success: false, message: 'Rent record not found' }); return;
    }
    if (record.status === 'PAID') {
      res.status(400).json({ success: false, message: 'This record is already marked as PAID' }); return;
    }
    const { amount, paymentMode, transactionId } = req.body;
    
    if (!amount || isNaN(Number(amount))) {
      res.status(400).json({ success: false, message: 'Valid amount is required' }); return;
    }
    const amountSubmitted = Number(amount);

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' }); return;
    }

    // Upload to Cloudinary
    const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(b64, {
      folder: 'nexstay/payment-proofs',
      overwrite: false,
    });

    const submission = await PaymentSubmission.create({
      submissionId: `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: record.tenantId,
      propertyId: record.propertyId,
      invoiceId: record._id,
      residentId: studentRecord._id,
      claimedAmount: amountSubmitted,
      paymentMode: (paymentMode === 'CASH' ? 'CASH' : 'ONLINE') as 'CASH' | 'ONLINE' | 'ADJUSTMENT',
      referenceNumber: transactionId || '',
      proofUrl: result.secure_url,
      status: 'PENDING'
    });

    await AuditLog.create({
      tenantId: record.tenantId,
      propertyId: record.propertyId,
      action: 'PAYMENT_SUBMITTED',
      actorId: studentRecord._id,
      actorType: 'Resident',
      entityId: submission._id,
      entityType: 'PaymentSubmission',
      details: `Resident submitted payment proof for ₹${amountSubmitted} via ${paymentMode || 'ONLINE'}`
    });

    // Move old proof to previousProofs if it exists
    if (record.paymentProofUrl) {
      if (!record.previousProofs) record.previousProofs = [];
      record.previousProofs.push(record.paymentProofUrl);
    }

    record.paymentProofUrl = result.secure_url;
    record.paymentProofStatus = 'PENDING';
    record.paymentProofNote = '';
    await record.save();

    res.json({ success: true, message: 'Payment proof submitted. Admin will verify shortly.', data: submission });
  } catch (err: any) {
    console.error('submitPaymentProof:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
};

// ─── POST /api/student/rent/cash/:id/confirm ─────────────────────────────────
export const confirmCashReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentRecord = await HostelStudent.findOne({ guestId: req.user?.id, status: 'ACTIVE' }).lean();
    if (!studentRecord) {
      res.status(403).json({ success: false, message: 'No active student record found' }); return;
    }

    const submission = await PaymentSubmission.findOne({ _id: req.params.id, residentId: studentRecord._id, status: 'PENDING_RESIDENT' });
    if (!submission) {
      res.status(404).json({ success: false, message: 'Draft receipt not found or already processed' }); return;
    }

    const record = await RentRecord.findById(submission.invoiceId);
    if (!record) { res.status(404).json({ success: false, message: 'Rent record not found' }); return; }

    submission.status = 'VERIFIED';
    await submission.save();

    const pTx = await PaymentTransaction.create({
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: submission.tenantId,
      propertyId: submission.propertyId,
      submissionId: submission._id,
      invoiceId: record._id,
      residentId: submission.residentId,
      settledAmount: submission.claimedAmount,
      paymentMode: submission.paymentMode,
      status: 'SUCCESS'
    });

    const paid = (record.paidAmount || 0) + submission.claimedAmount;
    const total = record.amount + (record.fine || 0);

    await LedgerEntry.create({
      tenantId: submission.tenantId,
      propertyId: submission.propertyId,
      invoiceId: record._id,
      residentId: submission.residentId,
      transactionId: pTx._id,
      credit: submission.claimedAmount,
      debit: 0,
      balance: total - paid,
      source: (submission.paymentMode === 'CASH') ? 'CASH' : (submission.paymentMode === 'ADJUSTMENT' ? 'ADJUSTMENT' : 'UPI'),
      verifiedBy: null // Confirmed by resident
    });

    record.paidAmount = paid;
    record.status = paid >= total ? 'PAID' : 'PARTIAL';
    if (paid >= total) record.paidAt = new Date();
    
    if (record.status === 'PARTIAL') {
      record.paymentProofStatus = 'NONE';
      record.paymentProofUrl = '';
      record.paymentProofNote = '';
    } else {
      record.paymentProofStatus = 'APPROVED';
    }
    await record.save();

    await AuditLog.create({
      tenantId: submission.tenantId,
      propertyId: submission.propertyId,
      action: 'PAYMENT_CONFIRMED_BY_RESIDENT',
      actorId: studentRecord._id,
      actorType: 'Resident',
      entityId: submission._id,
      entityType: 'PaymentSubmission',
      details: `Resident confirmed owner's cash entry of ₹${submission.claimedAmount}.`
    });

    res.json({ success: true, message: 'Payment confirmed successfully.', data: submission });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── POST /api/student/rent/cash/:id/reject ──────────────────────────────────
export const rejectCashReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentRecord = await HostelStudent.findOne({ guestId: req.user?.id, status: 'ACTIVE' }).lean();
    if (!studentRecord) {
      res.status(403).json({ success: false, message: 'No active student record found' }); return;
    }

    const submission = await PaymentSubmission.findOne({ _id: req.params.id, residentId: studentRecord._id, status: 'PENDING_RESIDENT' });
    if (!submission) {
      res.status(404).json({ success: false, message: 'Draft receipt not found or already processed' }); return;
    }

    submission.status = 'REJECTED';
    submission.remark = 'Rejected by resident: Did not pay this amount.';
    await submission.save();

    await AuditLog.create({
      tenantId: submission.tenantId,
      propertyId: submission.propertyId,
      action: 'PAYMENT_REJECTED_BY_RESIDENT',
      actorId: studentRecord._id,
      actorType: 'Resident',
      entityId: submission._id,
      entityType: 'PaymentSubmission',
      details: `Resident rejected owner's cash entry of ₹${submission.claimedAmount}.`
    });

    res.json({ success: true, message: 'Draft receipt rejected.', data: submission });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
