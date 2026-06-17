import { Router } from 'express';
import { getFloors, createFloor, updateFloor, deleteFloor } from '../controllers/floor.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';
import roomRouter from './room.routes';

const router = Router({ mergeParams: true });
router.use(protect);

router.get('/', getFloors);
router.post('/', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), createFloor);
router.put('/:id', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), updateFloor);
router.delete('/:id', requireRoles('SUPER_ADMIN', 'PG_OWNER'), deleteFloor);

// Nested: rooms under a floor
router.use('/:floorId/rooms', roomRouter);

export default router;
