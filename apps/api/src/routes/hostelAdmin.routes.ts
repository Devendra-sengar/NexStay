import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import {
  getAdminDashboard,
  getAdminProperties,
  createAdminProperty,
  getAdminPropertyById,
  updateAdminProperty,
  deleteAdminProperty,
  togglePauseProperty,
  getAdminBookings,
  acceptBooking,
  rejectBooking,
} from '../controllers/hostelAdmin.controller';

const router = Router();
router.use(protect);
router.use(requireRoles('HOSTEL_ADMIN'));

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Properties
router.get('/properties', getAdminProperties);
router.post('/properties', createAdminProperty);
router.get('/properties/:id', getAdminPropertyById);
router.put('/properties/:id', updateAdminProperty);
router.delete('/properties/:id', deleteAdminProperty);
router.patch('/properties/:id/pause', togglePauseProperty);

// Marketplace bookings
router.get('/bookings', getAdminBookings);
router.patch('/bookings/:id/accept', acceptBooking);
router.patch('/bookings/:id/reject', rejectBooking);

export default router;
