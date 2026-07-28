import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Lead } from '../models/Lead.model';
import { Hostel } from '../models/Hostel.model';
import mongoose from 'mongoose';

// ── CREATE LEAD ──────────────────────────────────────────────────────────────
export const createLead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, email, source, notes, propertyId, roomType, messIncluded } = req.body;
    let { hostelId } = req.body;
    let tenantId;

    if (req.user?.role === 'WARDEN') {
      hostelId = req.user.hostelId;
      const hostel = await Hostel.findById(hostelId).lean();
      if (!hostel) {
        res.status(404).json({ success: false, message: 'Hostel not found' });
        return;
      }
      tenantId = hostel.ownerId;
    } else if (req.user?.role === 'HOSTEL_ADMIN') {
      tenantId = req.user.id;
      if (!hostelId) {
        const defaultHostel = await Hostel.findOne({ ownerId: tenantId }).lean();
        if (defaultHostel) hostelId = defaultHostel._id;
      }
    } else {
      res.status(403).json({ success: false, message: 'Unauthorized role for lead creation' });
      return;
    }

    if (!hostelId) {
      res.status(400).json({ success: false, message: 'Hostel ID is required' });
      return;
    }

    const lead = await Lead.create({
      tenantId,
      hostelId,
      propertyId,
      name,
      phone,
      email,
      source: source || 'WALK_IN',
      roomType,
      messIncluded: !!messIncluded,
      notes,
      submittedBy: req.user.id,
      submittedByRole: req.user.role,
    });

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    console.error('[lead] createLead:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET LEADS ────────────────────────────────────────────────────────────────
export const getLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, status, search, hostelId } = req.query;
    const query: any = {};

    if (req.user?.role === 'WARDEN') {
      query.hostelId = req.user.hostelId;
    } else if (req.user?.role === 'HOSTEL_ADMIN') {
      query.tenantId = req.user.id;
      if (hostelId) query.hostelId = hostelId;
    } else {
      res.status(403).json({ success: false, message: 'Unauthorized role' });
      return;
    }

    if (propertyId) query.propertyId = propertyId;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: new RegExp(search as string, 'i') },
        { phone: new RegExp(search as string, 'i') },
        { email: new RegExp(search as string, 'i') }
      ];
    }

    const leads = await Lead.find(query)
      .populate('propertyId', 'name')
      .populate('submittedBy', 'name role')
      .populate('hostelId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: leads });
  } catch (err) {
    console.error('[lead] getLeads:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── UPDATE LEAD STATUS ───────────────────────────────────────────────────────
export const updateLeadStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    // Auth check
    if (req.user?.role === 'WARDEN') {
      if (String(lead.hostelId) !== String(req.user.hostelId)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }
    } else if (req.user?.role === 'HOSTEL_ADMIN') {
      if (String(lead.tenantId) !== String(req.user.id)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }
    }

    lead.status = status;
    await lead.save();

    res.json({ success: true, data: lead });
  } catch (err) {
    console.error('[lead] updateLeadStatus:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE LEAD ──────────────────────────────────────────────────────────────
export const deleteLead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    // Only HOSTEL_ADMIN can delete
    if (req.user?.role !== 'HOSTEL_ADMIN' || String(lead.tenantId) !== String(req.user.id)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    await lead.deleteOne();
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    console.error('[lead] deleteLead:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
