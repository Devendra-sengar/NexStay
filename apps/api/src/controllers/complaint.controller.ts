import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Complaint } from '../models/Complaint.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { User } from '../models/User.model';
import { Notification } from '../models/Notification.model';

const STATUS_ORDER = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

// ─── List Complaints (Owner/Manager) ─────────────────────────────────────────
export const getComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category, propertyId, page = 1, limit = 25 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId as string);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('studentId', 'name email phone')
        .populate('propertyId', 'name city')
        .populate('assignedTo', 'name role')
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    res.json({ success: true, data: complaints, total });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get My Complaints (Student/Guest) ──────────────────────────────────────
export const getMyComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const complaints = await Complaint.find({ guestId: req.user!.id })
      .sort({ createdAt: -1 })
      .populate('propertyId', 'name city')
      .lean();

    res.json({ success: true, data: complaints });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get Single Complaint ─────────────────────────────────────────────────────
export const getComplaintById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('propertyId', 'name city address')
      .lean();

    if (!complaint) { res.status(404).json({ success: false, message: 'Complaint not found' }); return; }
    res.json({ success: true, data: complaint });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Create Complaint (Guest/Student) ────────────────────────────────────────
export const createComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, propertyId } = req.body;
    if (!title || !description || !category || !propertyId) {
      res.status(400).json({ success: false, message: 'title, description, category and propertyId are required' }); return;
    }

    const complaint = await Complaint.create({
      tenantId: req.user!.id,
      guestId: req.user!.id,
      propertyId,
      title,
      description,
      category,
      status: 'OPEN',
      statusHistory: [{
        status: 'OPEN',
        note: 'Complaint raised',
        changedBy: req.user!.id,
        changedAt: new Date(),
      }],
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Update Complaint Status (Owner/Manager) ──────────────────────────────────
export const updateComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!STATUS_ORDER.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Valid: ${STATUS_ORDER.join(', ')}` }); return;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) { res.status(404).json({ success: false, message: 'Complaint not found' }); return; }

    const currentIdx = STATUS_ORDER.indexOf(complaint.status);
    const newIdx = STATUS_ORDER.indexOf(status);
    if (newIdx < currentIdx) {
      res.status(400).json({ success: false, message: 'Cannot move status backwards' }); return;
    }

    complaint.status = status;
    complaint.statusHistory.push({
      status,
      note: note || `Status changed to ${status}`,
      changedBy: req.user!.id,
      changedAt: new Date(),
    });
    await complaint.save();

    // Notify the guest
    await Notification.create({
      userId: complaint.guestId,
      type: 'COMPLAINT',
      title: `Complaint Update: ${status.replace('_', ' ')}`,
      message: note || `Your complaint "${complaint.title}" has been updated to ${status.replace('_', ' ')}.`,
      channel: 'IN_APP',
      isRead: false,
    });

    const updated = await Complaint.findById(id)
      .populate('propertyId', 'name city')
      .lean();

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Assign Complaint (Owner/Manager) ────────────────────────────────────────
export const assignComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const existing = await Complaint.findById(id);
    if (!existing) { res.status(404).json({ success: false, message: 'Complaint not found' }); return; }

    existing.assignedToStaffId = assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined;
    existing.statusHistory.push({
      status: existing.status,
      note: assignedTo ? 'Assigned to staff' : 'Unassigned',
      changedBy: req.user!.id,
      changedAt: new Date(),
    });
    await existing.save();

    const updated = await Complaint.findById(id)
      .populate('propertyId', 'name city');

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Get Managers for a Property (for assign dropdown) ───────────────────────
export const getPropertyManagers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const managers = await User.find({ role: { $in: ['PROPERTY_MANAGER', 'PG_OWNER'] } })
      .select('name email role')
      .lean();
    res.json({ success: true, data: managers });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
