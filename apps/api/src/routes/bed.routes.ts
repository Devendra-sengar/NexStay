import { Router } from 'express';
import { getBeds, createBed, updateBed, deleteBed } from '../controllers/bed.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });
router.use(protect);

router.get('/', getBeds);
router.post('/', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), createBed);
router.put('/:id', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), updateBed);
router.delete('/:id', requireRoles('SUPER_ADMIN', 'PG_OWNER'), deleteBed);

export default router;
