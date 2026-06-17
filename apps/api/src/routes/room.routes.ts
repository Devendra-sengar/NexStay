import { Router } from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/room.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';
import bedRouter from './bed.routes';

const router = Router({ mergeParams: true });
router.use(protect);

router.get('/', getRooms);
router.post('/', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), createRoom);
router.put('/:id', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), updateRoom);
router.delete('/:id', requireRoles('SUPER_ADMIN', 'PG_OWNER'), deleteRoom);

// Nested: beds under a room
router.use('/:roomId/beds', bedRouter);

export default router;
