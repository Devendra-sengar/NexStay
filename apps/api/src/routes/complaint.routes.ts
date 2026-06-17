import { Router } from 'express';
import {
  getComplaints, getMyComplaints, getComplaintById,
  createComplaint, updateComplaintStatus, assignComplaint, getPropertyManagers,
} from '../controllers/complaint.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);

// Student routes
router.get('/my', requireRoles('STUDENT'), getMyComplaints);
router.post('/', requireRoles('STUDENT'), createComplaint);

// Shared detail (both student and owner can view their own)
router.get('/:id', getComplaintById);

// Owner/Manager routes
router.get('/', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), getComplaints);
router.put('/:id/status', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), updateComplaintStatus);
router.put('/:id/assign', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), assignComplaint);
router.get('/meta/managers', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), getPropertyManagers);

export default router;
