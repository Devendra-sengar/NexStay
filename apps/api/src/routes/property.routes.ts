import { Router } from 'express';
import {
  getProperties, getPropertyById, createProperty, updateProperty, deleteProperty
} from '../controllers/property.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';
import floorRouter from './floor.routes';
import { getRoomsByProperty } from '../controllers/room.controller';

const router = Router();
router.use(protect);

router.get('/', getProperties);
router.post('/', requireRoles('SUPER_ADMIN', 'PG_OWNER'), createProperty);
router.get('/:id', getPropertyById);
router.put('/:id', requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'), updateProperty);
router.delete('/:id', requireRoles('SUPER_ADMIN', 'PG_OWNER'), deleteProperty);

// Nested: floors under a property
router.use('/:propertyId/floors', floorRouter);
// All rooms for a property (for overview)
router.get('/:propertyId/rooms', getRoomsByProperty);

export default router;
