import { Router } from 'express';
import { getOccupancyReport, getRevenueReport, getBookingReport } from '../controllers/report.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.use(requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'));

router.get('/occupancy', getOccupancyReport);
router.get('/revenue', getRevenueReport);
router.get('/bookings', getBookingReport);

export default router;
