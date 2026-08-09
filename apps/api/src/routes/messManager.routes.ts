import { Router } from 'express';
import { protect, requireRoles, requireHostelAccess, requirePermission } from '../middleware/auth.middleware';
import {
  getMessDashboard,
  getTodayMenu,
  upsertMenu,
  getMenuHistory,
  getMessSalary,
  getStudentCount,
} from '../controllers/messManager.controller';

const router = Router();

// Allow WARDENs to access mess routes (they are protected by specific permissions like canUploadMenu where needed)
router.use(protect, requireRoles('MESS_MANAGER', 'WARDEN'), requireHostelAccess);

router.get('/dashboard',        getMessDashboard);
router.get('/menu',             getTodayMenu);
router.post('/menu',            requirePermission('canUploadMenu'), upsertMenu);
router.get('/menu/history',     getMenuHistory);
router.get('/salary',           requirePermission('canViewSalary'), getMessSalary);
router.get('/students/count',   getStudentCount);

export default router;
