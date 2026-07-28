import { Router } from 'express';
import { protect, requireRoles, requireHostelAccess, requirePermission } from '../middleware/auth.middleware';
import {
  getWardenDashboard,
  getStudents,
  getStudentDetail,
  getRooms,
  getComplaints,
  updateComplaintStatus,
  getRentRecords,
  getMySalary,
  getWardenTodayMenu,
} from '../controllers/warden.controller';

const router = Router();

// All warden routes require authentication + WARDEN role
router.use(protect, requireRoles('WARDEN'), requireHostelAccess);

import {
  createLead, getLeads, updateLeadStatus
} from '../controllers/lead.controller';

router.get('/dashboard',                    getWardenDashboard);
router.get('/students',                     requirePermission('canViewStudents'),    getStudents);
router.get('/students/:id',                 requirePermission('canViewStudents'),    getStudentDetail);
router.get('/rooms',                        requirePermission('canManageRooms'),     getRooms);
router.get('/complaints',                   requirePermission('canManageComplaints'),getComplaints);
router.patch('/complaints/:id/status',      requirePermission('canManageComplaints'),updateComplaintStatus);
router.get('/rent-records',                 requirePermission('canViewRentRecords'), getRentRecords);
router.get('/salary',                       requirePermission('canViewSalary'),      getMySalary);
router.get('/mess-menu',                    getWardenTodayMenu);

// Leads / Enquiries
router.get('/leads',                        getLeads);
router.post('/leads',                       createLead);
router.patch('/leads/:id/status',           updateLeadStatus);

export default router;
