import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import {
  getSuperDashboard,
  getGuests, getOwners, suspendUser, reactivateUser,
  getAllProperties, getPropertyDetail, approveProperty, rejectProperty,
  getPendingOwnerVerifications, approveOwnerVerification, rejectOwnerVerification,
  getAllBookings, getPlatformRevenue,
} from '../controllers/superAdmin.controller';

const router = Router();
router.use(protect);
router.use(requireRoles('SUPER_ADMIN'));

// Dashboard
router.get('/dashboard', getSuperDashboard);

// Users
router.get('/users/guests', getGuests);
router.get('/users/owners', getOwners);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/reactivate', reactivateUser);

// Properties
router.get('/properties', getAllProperties);
router.get('/properties/:id', getPropertyDetail);
router.patch('/properties/:id/approve', approveProperty);
router.patch('/properties/:id/reject', rejectProperty);

// Owner verification
router.get('/owner-verifications', getPendingOwnerVerifications);
router.patch('/owner-verifications/:id/approve', approveOwnerVerification);
router.patch('/owner-verifications/:id/reject', rejectOwnerVerification);

// Platform monitoring
router.get('/bookings', getAllBookings);
router.get('/revenue', getPlatformRevenue);

export default router;
