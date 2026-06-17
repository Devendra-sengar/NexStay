import { Router } from 'express';
import {
  getBookingById,
  getAvailableBedsForProperty,
  processCheckIn,
  processCheckOut,
  checkDues,
  createBooking,
} from '../controllers/booking.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);

// Available beds for a property (used in check-in override)
router.get('/available-beds/:propertyId', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), getAvailableBedsForProperty);

// Booking CRUD
router.post('/', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), createBooking);
router.get('/:id', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), getBookingById);

// Workflow
router.get('/:id/dues', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), checkDues);
router.post('/:id/checkin', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), processCheckIn);
router.post('/:id/checkout', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), processCheckOut);

export default router;
