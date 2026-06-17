import { Router } from 'express';
import {
  getRentStats, getRentRecords, getRentRecordById, recordPayment,
  previewRentGeneration, generateMonthlyRent, sendReminder,
} from '../controllers/rent.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);
router.use(requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'));

router.get('/stats', getRentStats);
router.get('/', getRentRecords);
router.get('/generate/preview', previewRentGeneration);
router.post('/generate', generateMonthlyRent);
router.get('/:id', getRentRecordById);
router.post('/:id/pay', recordPayment);
router.post('/:id/remind', sendReminder);

export default router;
