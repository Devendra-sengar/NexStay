import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ErpPreBooking } from '../models/ErpPreBooking.model';

export const createPreBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.user!;
    
    // For WARDEN, they have a specific hostel. For HOSTEL_ADMIN, they might pass it in.
    let hostelId = req.user?.hostelId || req.body.hostelId;
    let tenantId = req.user?.tenantId || req.user?.id; // Admin is their own tenant

    if (role === 'HOSTEL_ADMIN' && !tenantId) {
      tenantId = req.user?.id;
    }

    let finalPropertyId = req.body.propertyId;
    if (role === 'WARDEN' && req.user?.hostelId) {
      finalPropertyId = req.user.hostelId;
    }

    const {
      name, phone, email, college,
      guardianName, guardianPhone, guardianAddress,
      aadhaarUrl, aadhaarNumber, studentIdUrl, photoUrl,
      expectedJoiningDate, tokenAmount, tokenPaymentMethod, preferredRoomType,
      fatherName, fatherOccupation, fatherContact, motherName,
      dateOfBirth, bloodGroup, maritalStatus, education,
      occupation, organization, permanentAddress, vehicleNumber,
      medicalHistory, stayingPeriod
    } = req.body;

    const Property = (await import('../models/Property.model')).Property;
    const prop = await Property.findById(finalPropertyId).lean();
    if (prop && prop.verificationStatus !== 'APPROVED') {
      res.status(400).json({ success: false, message: 'Property is not approved yet. Cannot create future bookings.' });
      return;
    }

    const newBooking = new ErpPreBooking({
      tenantId,
      hostelId: hostelId || null,
      propertyId: finalPropertyId,
      name,
      phone,
      email,
      college,
      guardianName,
      guardianPhone,
      guardianAddress,
      aadhaarUrl,
      aadhaarNumber,
      studentIdUrl,
      photoUrl,
      expectedJoiningDate,
      tokenAmount,
      tokenPaymentMethod,
      preferredRoomType,
      createdBy: req.user!.id,
      createdByRole: role,

      fatherName, fatherOccupation, fatherContact, motherName,
      dateOfBirth, bloodGroup, maritalStatus, education,
      occupation, organization, permanentAddress, vehicleNumber,
      medicalHistory, stayingPeriod
    });

    await newBooking.save();

    res.status(201).json({ success: true, data: newBooking, message: 'Pre-Booking created successfully' });
  } catch (error: any) {
    console.error('Error creating pre-booking:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getPreBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.user!;
    let query: any = {};

    if (role === 'WARDEN') {
      query.hostelId = req.user?.hostelId;
    } else if (role === 'HOSTEL_ADMIN') {
      query.tenantId = req.user?.id;
    } else {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const bookings = await ErpPreBooking.find(query).populate('propertyId', 'name').sort({ expectedJoiningDate: 1 }).lean();
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    console.error('Error fetching pre-bookings:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getPreBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await ErpPreBooking.findById(req.params.id).lean();
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error: any) {
    console.error('Error fetching pre-booking:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deletePreBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await ErpPreBooking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }
    
    // Check if the user is authorized to delete
    const { role } = req.user!;
    if (role === 'WARDEN' && req.user?.hostelId) {
      if (String(booking.propertyId) !== String(req.user.hostelId)) {
        res.status(403).json({ success: false, message: 'Not authorized to delete this booking' });
        return;
      }
    } else if (role === 'HOSTEL_ADMIN' && req.user?.id) {
      if (String(booking.tenantId) !== String(req.user.id)) {
        res.status(403).json({ success: false, message: 'Not authorized to delete this booking' });
        return;
      }
    }

    if (booking.status === 'CONVERTED') {
      res.status(400).json({ success: false, message: 'Cannot delete a converted booking' });
      return;
    }

    await ErpPreBooking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting pre-booking:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getPreBookingReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawBooking = await ErpPreBooking.findById(req.params.id)
      .populate('propertyId', 'name city address')
      .lean();
    if (!rawBooking) { res.status(404).json({ success: false, message: 'Booking not found' }); return; }
    const booking = rawBooking as any;

    const property = booking.propertyId as any;
    const dateStr = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8" />
<title>Advance Payment Receipt — ${booking.name || 'Student'}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #1a1a1a; }
  .header { background: #1d4ed8; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 20px; } .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }
  .body { border: 1px solid #e2e8f0; padding: 24px; border-top: 0; border-radius: 0 0 8px 8px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  td:first-child { color: #64748b; width: 40%; } td:last-child { font-weight: 600; }
  .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; }
  @media print { body { margin: 0; } }
</style></head>
<body>
  <div class="header"><h1>🏠 NexStay — Advance Payment Receipt</h1><p>Booking ID: ${booking._id}</p></div>
  <div class="body">
    <h3 style="margin:0 0 12px">${property?.name || 'Hostel'} — ${property?.city || ''}</h3>
    <table>
      <tr><td>Name</td><td>${booking.name || '—'}</td></tr>
      <tr><td>Phone</td><td>${booking.phone || '—'}</td></tr>
      <tr><td>Expected Joining</td><td>${booking.expectedJoiningDate ? new Date(booking.expectedJoiningDate).toLocaleDateString('en-IN') : '—'}</td></tr>
      <tr><td>Room Type</td><td>${booking.preferredRoomType || '—'}</td></tr>
      <tr><td>Advance Amount</td><td>₹${(booking.tokenAmount || 0).toLocaleString('en-IN')}</td></tr>
      <tr><td>Payment Method</td><td>${booking.tokenPaymentMethod || '—'}</td></tr>
      <tr><td>Payment Date</td><td>${dateStr}</td></tr>
    </table>
    <div class="footer">Generated by NexStay • ${new Date().toLocaleDateString('en-IN')} • This is a computer-generated receipt.</div>
  </div>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Error generating pre-booking receipt:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

