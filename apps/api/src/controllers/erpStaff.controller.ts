import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Staff } from '../models/Staff.model';
import { Inventory } from '../models/Inventory.model';
import { Complaint } from '../models/Complaint.model';
import { Booking } from '../models/Booking.model';
import { Property } from '../models/Property.model';
import { User } from '../models/User.model';
import { Hostel } from '../models/Hostel.model';
import bcrypt from 'bcryptjs';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  for (let i = 0; i < length; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

// ═══════════════════════════════════════════════════════════════════
// STAFF
// ═══════════════════════════════════════════════════════════════════

export const getStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, role, status, search } = req.query as Record<string, string>;
    const filter: any = { tenantId };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);
    if (role) filter.role = role;
    if (status === 'ACTIVE') filter.isActive = true;
    if (status === 'INACTIVE') filter.isActive = false;

    let staff = await Staff.find(filter).populate('propertyId', 'name').sort({ createdAt: -1 }).lean();
    if (search) staff = staff.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()));
    res.json({ success: true, data: staff, total: staff.length });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getStaffById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const staff = await Staff.findOne({ _id: req.params.id, tenantId }).populate('propertyId', 'name').lean();
    if (!staff) { res.status(404).json({ success: false, message: 'Staff not found' }); return; }
    res.json({ success: true, data: staff });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, name, phone, email, role, salary, joiningDate, photoUrl, address, notes } = req.body;
    if (!name || !phone || !role || !propertyId) {
      res.status(400).json({ success: false, message: 'name, phone, role, propertyId required' }); return;
    }
    const prop = await Property.findOne({ _id: propertyId, tenantId }).lean();
    if (!prop) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    
    // Find associated hostel (if any) to link staff directly to the hostel
    const hostel = await Hostel.findOne({ ownerId: tenantId }).lean();

    const staff = await Staff.create({
      tenantId, propertyId, hostelId: hostel?._id || null, name, phone, email: email || '', role,
      salary: salary || 0, joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      photoUrl: photoUrl || '', address: address || '', notes: notes || '', isActive: true,
    });
    
    let tempPassword;
    if (['WARDEN', 'MESS_MANAGER'].includes(role)) {
      if (hostel) {
        if (email) {
          const existing = await User.findOne({ email: email.toLowerCase() });
          if (existing) {
            res.status(409).json({ success: false, message: 'Email already registered for login.' });
            return;
          }
        }
        
        tempPassword = generatePassword(10);
        const passwordHash = await bcrypt.hash(tempPassword, 12);
        
        const defaultPermissions = role === 'MESS_MANAGER'
          ? { canUploadMenu: true, canViewSalary: false, canViewStudents: false, canManageComplaints: false, canViewRentRecords: false, canManageRooms: false, canViewAttendance: false }
          : { canViewStudents: true, canManageComplaints: true, canManageRooms: true, canViewSalary: false, canUploadMenu: false, canViewRentRecords: false, canViewAttendance: false };
        
        await User.create({
          name,
          email: email ? email.toLowerCase() : undefined,
          phone,
          passwordHash,
          role,
          hostelId: hostel._id,
          staffPermissions: defaultPermissions,
          status: 'ACTIVE',
        });
      }
    }

    res.status(201).json({ success: true, data: staff, tempPassword });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const staff = await Staff.findOne({ _id: req.params.id, tenantId });
    if (!staff) { res.status(404).json({ success: false, message: 'Staff not found' }); return; }
    const fields = ['name','phone','email','role','salary','joiningDate','photoUrl','address','notes','propertyId','isActive'];
    
    // Check if propertyId is being updated and fetch new hostelId
    if (req.body.propertyId && req.body.propertyId !== staff.propertyId.toString()) {
      const newProp = await Property.findOne({ _id: req.body.propertyId, tenantId }).lean();
      if (newProp) {
        const newHostel = await Hostel.findOne({ propertyId: newProp._id, ownerId: tenantId }).lean();
        staff.hostelId = newHostel?._id || null;
      }
    }

    fields.forEach(f => { if (req.body[f] !== undefined) (staff as any)[f] = req.body[f]; });
    await staff.save();
    res.json({ success: true, data: staff });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const toggleStaffStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const staff = await Staff.findOne({ _id: req.params.id, tenantId });
    if (!staff) { res.status(404).json({ success: false, message: 'Staff not found' }); return; }
    staff.isActive = !staff.isActive;
    await staff.save();

    // If staff was Warden/Manager, toggle their user account too
    if (['WARDEN', 'MESS_MANAGER'].includes(staff.role)) {
      await User.updateOne({ email: staff.email }, { status: staff.isActive ? 'ACTIVE' : 'INACTIVE' });
    }

    res.json({ success: true, data: staff, message: `Staff ${staff.isActive ? 'reactivated' : 'deactivated'}` });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const staff = await Staff.findOne({ _id: req.params.id, tenantId });
    if (!staff) { res.status(404).json({ success: false, message: 'Staff not found' }); return; }
    
    // If they have a user login, delete it
    if (staff.email && ['WARDEN', 'MESS_MANAGER'].includes(staff.role)) {
      await User.deleteOne({ email: staff.email });
    }
    
    await Staff.deleteOne({ _id: staff._id });
    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════

export const getInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId } = req.query as Record<string, string>;
    const filter: any = { tenantId };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);
    const items = await Inventory.find(filter).populate('propertyId', 'name').sort({ updatedAt: -1 }).lean();
    const summary = { totalTypes: items.length, totalUnits: 0, workingUnits: 0, damagedUnits: 0 };
    items.forEach((i: any) => { summary.totalUnits += i.totalCount; summary.workingUnits += i.workingCount; summary.damagedUnits += i.damagedCount; });
    res.json({ success: true, data: items, summary });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, itemName, totalCount, workingCount, damagedCount, notes } = req.body;
    if (!propertyId || !itemName || totalCount === undefined) {
      res.status(400).json({ success: false, message: 'propertyId, itemName, totalCount required' }); return;
    }
    if (Number(damagedCount) > Number(totalCount)) {
      res.status(400).json({ success: false, message: 'Damaged count cannot exceed total count' }); return;
    }
    const prop = await Property.findOne({ _id: propertyId, tenantId }).lean();
    if (!prop) { res.status(404).json({ success: false, message: 'Property not found' }); return; }
    const item = await Inventory.create({
      tenantId, propertyId, itemName,
      totalCount: Number(totalCount), workingCount: Number(workingCount || 0),
      damagedCount: Number(damagedCount || 0), notes: notes || '',
    });
    res.status(201).json({ success: true, data: item });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const item = await Inventory.findOne({ _id: req.params.id, tenantId });
    if (!item) { res.status(404).json({ success: false, message: 'Item not found' }); return; }
    const { totalCount, workingCount, damagedCount, itemName, notes } = req.body;
    const newTotal = totalCount !== undefined ? Number(totalCount) : item.totalCount;
    const newDamaged = damagedCount !== undefined ? Number(damagedCount) : item.damagedCount;
    if (newDamaged > newTotal) {
      res.status(400).json({ success: false, message: 'Damaged count cannot exceed total count' }); return;
    }
    if (itemName !== undefined) item.itemName = itemName;
    if (totalCount !== undefined) item.totalCount = Number(totalCount);
    if (workingCount !== undefined) item.workingCount = Number(workingCount);
    if (damagedCount !== undefined) item.damagedCount = Number(damagedCount);
    if (notes !== undefined) item.notes = notes;
    await item.save();
    res.json({ success: true, data: item });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const deleteInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const item = await Inventory.findOne({ _id: req.params.id, tenantId });
    if (!item) { res.status(404).json({ success: false, message: 'Item not found' }); return; }
    await Inventory.deleteOne({ _id: item._id });
    res.json({ success: true, message: 'Item deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════
// COMPLAINTS — ADMIN
// ═══════════════════════════════════════════════════════════════════

export const getAdminComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, status, category, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const filter: any = { tenantId };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);
    if (status && status !== 'ALL') filter.status = status;
    if (category && category !== 'ALL') filter.category = category;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('propertyId', 'name')
        .populate('guestId', 'name phone email')
        .populate('hostelStudentId', 'name phone email')
        .populate('assignedToStaffId', 'name role')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Complaint.countDocuments(filter),
    ]);
    res.json({ success: true, data: complaints, total, page: pageNum, hasNextPage: pageNum * limitNum < total });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getAdminComplaintById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const complaint = await Complaint.findOne({ _id: req.params.id, tenantId })
      .populate('propertyId', 'name')
      .populate('guestId', 'name phone email')
      .populate('hostelStudentId', 'name phone email')
      .populate('assignedToStaffId', 'name role')
      .lean();
    if (!complaint) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: complaint });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { status, note, assignedToStaffId } = req.body;
    if (!status || !note?.trim()) {
      res.status(400).json({ success: false, message: 'status and note are required' }); return;
    }
    const complaint = await Complaint.findOne({ _id: req.params.id, tenantId });
    if (!complaint) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    complaint.status = status;
    complaint.statusHistory.push({ status, note, changedBy: 'Admin', changedAt: new Date() });
    if (assignedToStaffId !== undefined) complaint.assignedToStaffId = assignedToStaffId || undefined;
    if (status === 'RESOLVED') complaint.resolvedAt = new Date();
    await complaint.save();
    res.json({ success: true, data: complaint });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const addInternalNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { note } = req.body;
    if (!note?.trim()) { res.status(400).json({ success: false, message: 'note required' }); return; }
    const complaint = await Complaint.findOne({ _id: req.params.id, tenantId });
    if (!complaint) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    complaint.internalNotes.push({ note, addedBy: 'Admin', addedAt: new Date() });
    await complaint.save();
    res.json({ success: true, data: complaint });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════
// COMPLAINTS — GUEST
// ═══════════════════════════════════════════════════════════════════

export const getGuestComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guestId = req.user!.id;
    const complaints = await Complaint.find({ guestId })
      .populate('propertyId', 'name')
      .sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: complaints });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const createGuestComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const guestId = req.user!.id;
    const { title, description, category } = req.body;
    if (!title || !description || !category) {
      res.status(400).json({ success: false, message: 'title, description, category required' }); return;
    }
    // Find active booking for this guest
    const booking = await Booking.findOne({
      guestId, status: { $in: ['CONFIRMED', 'CHECKED_IN'] }
    }).lean();
    if (!booking) {
      res.status(403).json({ success: false, message: 'You must have a confirmed or active booking to raise a complaint.' }); return;
    }
    const complaint = await Complaint.create({
      tenantId: booking.tenantId, propertyId: booking.propertyId, guestId,
      title, description, category, status: 'OPEN',
      statusHistory: [{ status: 'OPEN', note: 'Complaint raised by guest', changedBy: 'Guest', changedAt: new Date() }],
      internalNotes: [],
    });
    res.status(201).json({ success: true, data: complaint });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};
