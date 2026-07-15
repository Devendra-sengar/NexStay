import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { HostelStudent } from '../models/HostelStudent.model';
import { RentRecord } from '../models/RentRecord.model';
import { Expense } from '../models/Expense.model';
import { Property } from '../models/Property.model';
import { Room } from '../models/Room.model';

import { PaymentSubmission } from '../models/PaymentSubmission.model';
import { PaymentTransaction } from '../models/PaymentTransaction.model';
import { LedgerEntry } from '../models/LedgerEntry.model';
import { AuditLog } from '../models/AuditLog.model';
import { Notification } from '../models/Notification.model';
import { notify } from '../services/notification.service';

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// ─── GET /api/hostel-admin/erp/rent/dashboard ─────────────────────────────────
export const getRentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId } = req.query as Record<string, string>;

    const filter: any = { tenantId };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);

    const now = new Date();
    const monthStr = ym(now);

    const [allThis, paid, partial, overdue] = await Promise.all([
      RentRecord.find({ ...filter, month: monthStr }).lean(),
      RentRecord.find({ ...filter, month: monthStr, status: 'PAID' }).lean(),
      RentRecord.find({ ...filter, month: monthStr, status: 'PARTIAL' }).lean(),
      RentRecord.find({ ...filter, status: { $in: ['UNPAID', 'PARTIAL'] }, dueDate: { $lt: now } }).lean(),
    ]);

    const totalDue = allThis.reduce((s, r) => s + (r.amount + (r.fine || 0)), 0);
    const totalCollected = [...paid, ...partial].reduce((s, r) => s + (r.paidAmount || 0), 0);
    const partialCount = partial.length;
    const overdueAmt = overdue.reduce((s, r) => s + Math.max(0, r.amount + (r.fine || 0) - (r.paidAmount || 0)), 0);

    // 6-month trend
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const trend: { month: string; due: number; collected: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const mStr = ym(d);
      const recs = await RentRecord.find({ ...filter, month: mStr }).lean();
      const due = recs.reduce((s, r) => s + r.amount + (r.fine || 0), 0);
      const collected = recs.reduce((s, r) => s + (r.paidAmount || 0), 0);
      trend.push({ month: months[d.getMonth()], due, collected });
    }

    // ── Security Deposit summary ──────────────────────────────────────────────
    const studFilter: any = { tenantId };
    if (propertyId) studFilter.propertyId = new mongoose.Types.ObjectId(propertyId);

    const allStudents = await HostelStudent.find(studFilter).lean();
    const studentsWithDeposit = allStudents.filter(s => (s.securityDeposit ?? 0) > 0);
    const totalSecurityDeposit = studentsWithDeposit.reduce((s, st) => s + (st.securityDeposit ?? 0), 0);
    const securityDepositCount = studentsWithDeposit.length;

    res.json({ success: true, data: { totalDue, totalCollected, partialCount, overdueAmt, trend, totalSecurityDeposit, securityDepositCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/hostel-admin/erp/rent/security-deposits ─────────────────────────
export const getSecurityDeposits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId } = req.query as Record<string, string>;

    const filter: any = { tenantId, securityDeposit: { $gt: 0 } };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);

    const students = await HostelStudent
      .find(filter)
      .populate('propertyId', 'name')
      .populate('bedId', 'bedNumber')
      .sort({ admissionDate: -1 })
      .lean();

    const result = students.map(s => ({
      _id: s._id,
      name: s.name,
      phone: s.phone,
      email: s.email,
      status: s.status,
      securityDeposit: s.securityDeposit ?? 0,
      // For now remaining = full deposit (we don't track partial refunds separately).
      // When a student checks out you can extend this with a depositReturned field.
      depositReturned: s.status === 'CHECKED_OUT' ? (s.securityDeposit ?? 0) : 0,
      remainingDeposit: s.status === 'CHECKED_OUT' ? 0 : (s.securityDeposit ?? 0),
      propertyId: s.propertyId,
      bedId: s.bedId,
      admissionDate: s.admissionDate,
      exitDate: s.exitDate ?? null,
      monthlyRent: s.monthlyRent,
    }));

    const totalDeposit = result.reduce((s, r) => s + r.securityDeposit, 0);
    const totalReturned = result.reduce((s, r) => s + r.depositReturned, 0);
    const totalHolding = result.reduce((s, r) => s + r.remainingDeposit, 0);

    res.json({ success: true, data: result, summary: { totalDeposit, totalReturned, totalHolding, count: result.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/hostel-admin/erp/rent/records ───────────────────────────────────
export const getRentRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, status, month, search, page = '1', limit = '20', type } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const filter: any = { tenantId };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);
    if (status && status !== 'ALL') filter.status = status;
    if (month) filter.month = month;
    if (type === 'FEE') filter.isFee = true;
    else if (type === 'RENT') filter.isFee = { $ne: true };

    let records = await RentRecord.find(filter)
      .populate('hostelStudentId', 'name phone')
      .populate('propertyId', 'name')
      .populate('roomId', 'roomNumber')
      .sort({ dueDate: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    if (search) {
      records = records.filter((r: any) =>
        (r.hostelStudentId as any)?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await RentRecord.countDocuments(filter);
    res.json({ success: true, data: records, total, page: pageNum, hasNextPage: pageNum * limitNum < total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/hostel-admin/erp/rent/generate ────────────────────────────────
export const generateMonthlyRent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { month, dueDate } = req.body; // month = YYYY-MM
    if (!month) { res.status(400).json({ success: false, message: 'month required (YYYY-MM)' }); return; }

    // Check if already generated
    const existing = await RentRecord.countDocuments({ tenantId, month, isFee: { $ne: true } });
    if (existing > 0) {
      res.status(400).json({ success: false, message: `Rent for ${month} is already generated. ${existing} records exist.`, existing });
      return;
    }

    const students = await HostelStudent.find({ tenantId, status: 'ACTIVE' }).lean();
    if (students.length === 0) {
      res.status(400).json({ success: false, message: 'No active students found.' }); return;
    }

    const due = dueDate ? new Date(dueDate) : new Date(`${month}-05`);
    let totalAmt = 0;
    const created: any[] = [];

    for (const s of students) {
      const exists = await RentRecord.findOne({ hostelStudentId: s._id, month });
      if (exists) continue;
      const rec = await RentRecord.create({
        tenantId, propertyId: s.propertyId, roomId: null,
        hostelStudentId: s._id, bookingId: s.bookingId,
        month, amount: s.monthlyRent, paidAmount: 0, fine: 0,
        dueDate: due, status: 'UNPAID',
      });
      totalAmt += s.monthlyRent;
      created.push(rec);
    }

    res.json({ success: true, message: `Generated ${created.length} rent records totaling ₹${totalAmt.toLocaleString('en-IN')}.`, count: created.length, totalAmt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/hostel-admin/erp/rent/preview-generate ─────────────────────────
export const previewGenerateRent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { month } = req.query as Record<string, string>;
    const targetMonth = month || ym(new Date());
    const existing = await RentRecord.countDocuments({ tenantId, month: targetMonth, isFee: { $ne: true } });
    const students = await HostelStudent.find({ tenantId, status: 'ACTIVE' }).lean();
    const totalExpected = students.reduce((s, st) => s + st.monthlyRent, 0);
    res.json({ success: true, data: { month: targetMonth, studentCount: students.length, totalExpected, existingCount: existing, alreadyGenerated: existing > 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PATCH /api/hostel-admin/erp/rent/:id/fine ───────────────────────────────
export const addFine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { amount, reason } = req.body;
    if (!amount || !reason) { res.status(400).json({ success: false, message: 'amount and reason required' }); return; }
    const record = await RentRecord.findOne({ _id: req.params.id, tenantId });
    if (!record) { res.status(404).json({ success: false, message: 'Record not found' }); return; }
    record.fine = (record.fine || 0) + Number(amount);
    if (!record.notes) record.notes = '';
    record.notes = `${record.notes} | Fine: ₹${amount} — ${reason}`.trim().replace(/^\|/, '').trim();
    const total = record.amount + record.fine;
    record.status = record.paidAmount >= total ? 'PAID' : record.paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
    await record.save();
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/hostel-admin/erp/rent/send-reminder ───────────────────────────
export const sendReminders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { recordIds } = req.body as { recordIds: string[] };
    if (!Array.isArray(recordIds) || !recordIds.length) {
      res.status(400).json({ success: false, message: 'recordIds array required' }); return;
    }
    const records = await RentRecord.find({ _id: { $in: recordIds }, tenantId })
      .populate('hostelStudentId', 'name guestId')
      .populate('propertyId', 'name')
      .lean();

    let sent = 0;
    for (const r of records) {
      const student = r.hostelStudentId as any;
      if (!student?.guestId) continue;
      await Notification.create({
        userId: student.guestId,
        type: 'RENT',
        title: '💸 Rent Reminder',
        message: `Your rent of ₹${r.amount.toLocaleString('en-IN')} is due for ${r.month} at ${(r.propertyId as any)?.name}.`,
        channel: 'IN_APP', isRead: false,
      });
      console.log(`[MOCK EMAIL] Reminder sent to student ${student.name} for month ${r.month}`);
      sent++;
    }

    res.json({ success: true, message: `Reminders sent to ${sent} student(s).`, sent });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/hostel-admin/erp/fees ─────────────────────────────────────────
export const createFee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { hostelStudentId, feeType, amount, dueDate, notes } = req.body;
    if (!hostelStudentId || !feeType || !amount) {
      res.status(400).json({ success: false, message: 'hostelStudentId, feeType, amount required' }); return;
    }
    const student = await HostelStudent.findOne({ _id: hostelStudentId, tenantId }).lean();
    if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }

    const fee = await RentRecord.create({
      tenantId, propertyId: student.propertyId,
      hostelStudentId: student._id, bookingId: student.bookingId,
      month: `FEE-${feeType.toUpperCase().replace(/\s+/g, '_')}`,
      amount: Number(amount), paidAmount: 0, fine: 0,
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      status: 'UNPAID', notes: notes || '',
      isFee: true, feeType,
    });
    res.status(201).json({ success: true, data: fee });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/hostel-admin/erp/expenses ──────────────────────────────────────
export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, month, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const filter: any = { tenantId };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);
    if (month) {
      const [yr, mo] = month.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1);
      const end = new Date(yr, mo, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter).populate('propertyId', 'name').sort({ date: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Expense.countDocuments(filter),
    ]);

    // Category breakdown
    const allForMonth = await Expense.find(filter).lean();
    const byCategory: Record<string, number> = {};
    allForMonth.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    const totalExpense = allForMonth.reduce((s, e) => s + e.amount, 0);

    // Rent collected for the same month
    const rentFilter: any = { tenantId };
    if (propertyId) rentFilter.propertyId = new mongoose.Types.ObjectId(propertyId);
    if (month) rentFilter.month = month;
    const rentRecs = await RentRecord.find(rentFilter).lean();
    const rentCollected = rentRecs.reduce((s, r) => s + (r.paidAmount || 0), 0);
    const net = rentCollected - totalExpense;

    res.json({ success: true, data: expenses, total, page: pageNum, hasNextPage: pageNum * limitNum < total, summary: { byCategory, totalExpense, rentCollected, net } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/hostel-admin/erp/expenses ─────────────────────────────────────
export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, category, amount, date, description, receiptUrl } = req.body;
    if (!propertyId || !category || !amount || !date) {
      res.status(400).json({ success: false, message: 'propertyId, category, amount, date required' }); return;
    }
    const prop = await Property.findOne({ _id: propertyId, tenantId }).lean();
    if (!prop) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    const expense = await Expense.create({ tenantId, propertyId, category, amount: Number(amount), date: new Date(date), description: description || '', receiptUrl: receiptUrl || '' });
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PUT /api/hostel-admin/erp/expenses/:id ───────────────────────────────────
export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const expense = await Expense.findOne({ _id: req.params.id, tenantId });
    if (!expense) { res.status(404).json({ success: false, message: 'Expense not found' }); return; }
    const { category, amount, date, description, receiptUrl } = req.body;
    if (category) expense.category = category;
    if (amount !== undefined) expense.amount = Number(amount);
    if (date) expense.date = new Date(date);
    if (description !== undefined) expense.description = description;
    if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl;
    await expense.save();
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── DELETE /api/hostel-admin/erp/expenses/:id ───────────────────────────────
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const expense = await Expense.findOne({ _id: req.params.id, tenantId });
    if (!expense) { res.status(404).json({ success: false, message: 'Expense not found' }); return; }
    await Expense.deleteOne({ _id: expense._id });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PATCH /api/hostel-admin/erp/rent/:id/proof-action ───────────────────────────
// Admin APPROVE/REJECT a student’s uploaded payment proof
export const proofAction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { action, amount, paymentMethod, note } = req.body as {
      action: 'APPROVE' | 'REJECT';
      amount?: number;
      paymentMethod?: string;
      note?: string;
    };

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      res.status(400).json({ success: false, message: 'action must be APPROVE or REJECT' }); return;
    }

    const record = await RentRecord.findOne({ _id: req.params.id, tenantId })
      .populate<{ hostelStudentId: any }>('hostelStudentId', 'name guestId');
    if (!record) { res.status(404).json({ success: false, message: 'Record not found' }); return; }
    if (!record.paymentProofUrl) {
      res.status(400).json({ success: false, message: 'No payment proof uploaded for this record' }); return;
    }
    if (record.paymentProofStatus !== 'PENDING') {
      res.status(400).json({ success: false, message: `Proof is already ${record.paymentProofStatus}` }); return;
    }

    const student = record.hostelStudentId as any;
    const guestUserId: string | undefined = student?.guestId?.toString();

    if (action === 'APPROVE') {
      const paidAmt = typeof amount === 'number' ? amount : record.amount + (record.fine || 0);
      record.paidAmount = (record.paidAmount || 0) + paidAmt;
      const total = record.amount + (record.fine || 0);
      record.status = record.paidAmount >= total ? 'PAID' : 'PARTIAL';
      record.paidAt = new Date();
      record.paymentMethod = paymentMethod || record.paymentMethod || 'UPI';
      
      if (record.status === 'PARTIAL') {
        record.paymentProofStatus = 'NONE';
        if (record.paymentProofUrl) {
          if (!record.previousProofs) record.previousProofs = [];
          record.previousProofs.push(record.paymentProofUrl);
          record.paymentProofUrl = '';
        }
        record.paymentProofNote = '';
      } else {
        record.paymentProofStatus = 'APPROVED';
      }
      await record.save();

      // Find and process pending PaymentSubmission for this record to sync Ledger
      const pendingSub = await PaymentSubmission.findOne({ invoiceId: record._id, tenantId, status: 'PENDING' });
      if (pendingSub) {
        pendingSub.status = 'VERIFIED';
        pendingSub.claimedAmount = paidAmt;
        pendingSub.paymentMode = (record.paymentMethod === 'CASH' ? 'CASH' : 'ONLINE') as 'CASH' | 'ONLINE' | 'ADJUSTMENT';
        await pendingSub.save();

        const pTx = await PaymentTransaction.create({
          transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId,
          propertyId: pendingSub.propertyId,
          submissionId: pendingSub._id,
          invoiceId: record._id,
          residentId: record.hostelStudentId,
          settledAmount: paidAmt,
          paymentMode: (record.paymentMethod === 'CASH' ? 'CASH' : 'ONLINE') as 'CASH' | 'ONLINE' | 'ADJUSTMENT',
          status: 'SUCCESS'
        });

        await LedgerEntry.create({
          tenantId,
          propertyId: pendingSub.propertyId,
          invoiceId: record._id,
          residentId: record.hostelStudentId,
          transactionId: pTx._id,
          credit: paidAmt,
          debit: 0,
          balance: total - record.paidAmount,
          source: (record.paymentMethod === 'CASH') ? 'CASH' : (record.paymentMethod === 'ADJUSTMENT' ? 'ADJUSTMENT' : 'UPI'),
          verifiedBy: req.user!.id
        });
      }

      if (guestUserId) {
        notify({
          userId: guestUserId,
          type: 'RENT',
          title: '✅ Payment Confirmed!',
          message: `Your payment of ₹${paidAmt.toLocaleString('en-IN')} for ${record.month} has been confirmed by the admin.`,
          linkUrl: '/student/rent',
        }).catch(() => {});
      }
    } else {
      // REJECT
      record.paymentProofStatus = 'REJECTED';
      record.paymentProofNote = note || 'Payment proof was rejected by admin.';
      await record.save();

      const pendingSub = await PaymentSubmission.findOne({ invoiceId: record._id, tenantId, status: 'PENDING' });
      if (pendingSub) {
        pendingSub.status = 'REJECTED';
        pendingSub.remark = record.paymentProofNote;
        await pendingSub.save();
      }

      if (guestUserId) {
        notify({
          userId: guestUserId,
          type: 'RENT',
          title: '❌ Payment Proof Rejected',
          message: note
            ? `Your payment proof for ${record.month} was rejected. Reason: ${note}. Please re-upload.`
            : `Your payment proof for ${record.month} was rejected. Please re-upload a valid screenshot.`,
          linkUrl: '/student/rent',
        }).catch(() => {});
      }
    }

    res.json({ success: true, data: record, message: action === 'APPROVE' ? 'Payment confirmed successfully.' : 'Proof rejected. Student has been notified.' });
  } catch (err) {
    console.error('[proofAction]', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── TRANSACTIONS (LEDGER) ──────────────────────────────────────────────────

// GET /api/erp/transactions
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, status } = req.query as Record<string, string>;

    const filter: any = { tenantId };
    if (status) filter.status = status;

    let invoiceIds: any[] = [];
    if (propertyId) {
      const records = await RentRecord.find({ propertyId, tenantId }).select('_id').lean();
      invoiceIds = records.map(r => r._id);
      filter.invoiceId = { $in: invoiceIds };
    }

    const txs = await PaymentSubmission.find(filter)
      .populate('invoiceId', 'month amount paidAmount fine status')
      .populate('residentId', 'name roomNumber guestId')
      .sort({ createdAt: -1 })
      .lean();

    // Temporarily map to old frontend fields to avoid breaking the frontend until it's refactored
    const mappedTxs = txs.map(tx => ({
      ...tx,
      amountSubmitted: tx.claimedAmount,
      paymentProof: { screenshotUrl: tx.proofUrl, transactionId: tx.referenceNumber },
      rejectionReason: tx.remark,
      status: tx.status === 'PENDING' ? 'PENDING_VERIFICATION' : tx.status === 'VERIFIED' ? 'APPROVED' : tx.status === 'PENDING_RESIDENT' ? 'PENDING_RESIDENT' : 'REJECTED'
    }));

    res.json({ success: true, data: mappedTxs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/erp/transactions/:id/verify (Verify Payment Submission)
export const verifyTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { id } = req.params;
    const { action, note } = req.body as { action: 'APPROVE' | 'REJECT'; note?: string };

    if (!['APPROVE', 'REJECT'].includes(action)) {
      res.status(400).json({ success: false, message: 'Action must be APPROVE or REJECT' }); return;
    }

    const submission = await PaymentSubmission.findOneAndUpdate(
      { _id: id, tenantId, status: 'PENDING' },
      { 
        $set: { 
          status: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
          remark: action === 'REJECT' ? (note || 'Rejected by admin') : ''
        } 
      },
      { new: true }
    );

    if (!submission) {
      res.status(400).json({ success: false, message: 'Submission not found or already processed.' }); return;
    }

    const record = await RentRecord.findById(submission.invoiceId);
    if (!record) { res.status(404).json({ success: false, message: 'Invoice not found' }); return; }

    const student = await HostelStudent.findById(submission.residentId);
    const guestUserId = student?.guestId?.toString();

    if (action === 'APPROVE') {
      // 1. Create Payment Transaction
      const pTx = await PaymentTransaction.create({
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId,
        propertyId: submission.propertyId,
        submissionId: submission._id,
        invoiceId: record._id,
        residentId: student!._id,
        settledAmount: submission.claimedAmount,
        paymentMode: submission.paymentMode,
        status: 'SUCCESS'
      });

      // 2. Create Ledger Entry
      const oldPaidAmount = record.paidAmount || 0;
      const totalAmount = record.amount + (record.fine || 0);
      const newPaidAmount = oldPaidAmount + submission.claimedAmount;
      
      await LedgerEntry.create({
        tenantId,
        propertyId: submission.propertyId,
        invoiceId: record._id,
        residentId: student!._id,
        transactionId: pTx._id,
        credit: submission.claimedAmount,
        debit: 0,
        balance: totalAmount - newPaidAmount,
        source: submission.paymentMode === 'CASH' ? 'CASH' : (submission.paymentMode === 'ADJUSTMENT' ? 'ADJUSTMENT' : 'UPI'),
        verifiedBy: req.user!.id
      });

      // 3. Update Invoice (derived from ledger conceptually, but cached here)
      record.paidAmount = newPaidAmount;
      record.status = record.paidAmount >= totalAmount ? 'PAID' : 'PARTIAL';
      if (record.status === 'PARTIAL') {
        record.paymentProofStatus = 'NONE';
        if (record.paymentProofUrl) {
          if (!record.previousProofs) record.previousProofs = [];
          record.previousProofs.push(record.paymentProofUrl);
          record.paymentProofUrl = '';
        }
        record.paymentProofNote = '';
      } else {
        record.paymentProofStatus = 'APPROVED';
      }
      if (record.status === 'PAID') record.paidAt = new Date();
      await record.save();

      // 4. Audit Log
      await AuditLog.create({
        tenantId,
        propertyId: submission.propertyId,
        action: 'PAYMENT_VERIFIED_ACCEPT',
        actorId: req.user!.id,
        actorType: 'Admin',
        entityId: submission._id,
        entityType: 'PaymentSubmission',
        details: `Admin accepted payment of ₹${submission.claimedAmount}`
      });

      if (guestUserId) {
        notify({
          userId: guestUserId,
          type: 'RENT',
          title: '✅ Payment Confirmed!',
          message: `Your payment of ₹${submission.claimedAmount.toLocaleString('en-IN')} has been confirmed.`,
          linkUrl: '/student/rent',
        }).catch(() => {});
      }
    } else {
      record.paymentProofStatus = 'REJECTED';
      record.paymentProofNote = submission.remark;
      await record.save();

      await AuditLog.create({
        tenantId,
        propertyId: submission.propertyId,
        action: 'PAYMENT_VERIFIED_REJECT',
        actorId: req.user!.id,
        actorType: 'Admin',
        entityId: submission._id,
        entityType: 'PaymentSubmission',
        details: `Admin rejected payment. Reason: ${submission.remark}`
      });

      if (guestUserId) {
        notify({
          userId: guestUserId,
          type: 'RENT',
          title: '❌ Payment Rejected',
          message: `Your payment proof was rejected. Reason: ${submission.remark}`,
          linkUrl: '/student/rent',
        }).catch(() => {});
      }
    }

    res.json({ success: true, message: `Payment ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`, data: submission });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/erp/ledger
export const getLedgerEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, invoiceId } = req.query as Record<string, string>;

    const filter: any = { tenantId };
    if (propertyId) filter.propertyId = propertyId;
    if (invoiceId) filter.invoiceId = invoiceId;

    const entries = await LedgerEntry.find(filter)
      .populate('invoiceId', 'month amount fine')
      .populate('residentId', 'name guestId roomNumber')
      .populate('verifiedBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: entries });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/erp/audit-logs
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, entityId } = req.query as Record<string, string>;

    const filter: any = { tenantId };
    if (propertyId) filter.propertyId = propertyId;
    if (entityId) filter.entityId = entityId;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


