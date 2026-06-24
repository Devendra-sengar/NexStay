import { Router } from 'express';
import { protect, requireRoles } from '../middleware/auth.middleware';
import {
  getOccupancyReport, exportOccupancyCsv,
  getRevenueReport, exportRevenueCsv,
  getCollectionReport, exportCollectionCsv,
  getExpenseReport, exportExpenseCsv,
  getProfitReport, exportProfitCsv,
} from '../controllers/reports.controller';

const router = Router();
router.use(protect);
router.use(requireRoles('HOSTEL_ADMIN'));

router.get('/occupancy', getOccupancyReport);
router.get('/occupancy/export', exportOccupancyCsv);
router.get('/revenue', getRevenueReport);
router.get('/revenue/export', exportRevenueCsv);
router.get('/collection', getCollectionReport);
router.get('/collection/export', exportCollectionCsv);
router.get('/expenses', getExpenseReport);
router.get('/expenses/export', exportExpenseCsv);
router.get('/profit', getProfitReport);
router.get('/profit/export', exportProfitCsv);

export default router;
