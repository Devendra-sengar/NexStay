import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import {
  getDashboardStats,
  getStudents,
  getOwners,
  getManagers,
  updateUserStatus,
  verifyOwner,
  getPendingProperties,
  verifyProperty,
  getAllBookings,
  getAllPayments
} from '../controllers/admin.controller';

const router = Router();

router.use(protect);
router.use(requireRoles('SUPER_ADMIN'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/users/students', getStudents);
router.get('/users/owners', getOwners);
router.get('/users/managers', getManagers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/verify', verifyOwner);

router.get('/properties/pending', getPendingProperties);
router.put('/properties/:id/verify', verifyProperty);

router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);

export default router;
