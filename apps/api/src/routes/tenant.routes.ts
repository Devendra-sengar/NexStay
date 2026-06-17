import { Router } from 'express';
import { getTenants, getTenantById, getPendingBookings } from '../controllers/tenant.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);
router.use(requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'));

router.get('/', getTenants);
router.get('/pending-bookings', getPendingBookings);
router.get('/:id', getTenantById);

export default router;
