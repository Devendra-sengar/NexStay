import { Router } from 'express';
import { getDashboardStats, getRevenueChart, getRecentBookings, getRecentComplaints } from '../controllers/dashboard.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);
router.use(requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'));

router.get('/stats', getDashboardStats);
router.get('/revenue-chart', getRevenueChart);
router.get('/recent-bookings', getRecentBookings);
router.get('/recent-complaints', getRecentComplaints);

export default router;
