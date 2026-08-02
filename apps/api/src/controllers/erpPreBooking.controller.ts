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

    const {
      propertyId, name, phone, email, college,
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
      propertyId,
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
