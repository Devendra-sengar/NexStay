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
