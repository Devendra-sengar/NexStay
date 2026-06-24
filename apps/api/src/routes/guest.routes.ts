import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import {
  createGuestBooking,
  getGuestBookings,
  getGuestBookingDetail,
  cancelGuestBooking,
  createGuestComplaint,
  getGuestComplaints,
} from '../controllers/guest.controller';

const router = Router();
router.use(protect);
router.use(requireRoles('GUEST'));

// Bookings
router.post('/bookings', createGuestBooking);
router.get('/bookings', getGuestBookings);
router.get('/bookings/:id', getGuestBookingDetail);
router.delete('/bookings/:id', cancelGuestBooking);

// Complaints
router.post('/complaints', createGuestComplaint);
router.get('/complaints', getGuestComplaints);

export default router;
