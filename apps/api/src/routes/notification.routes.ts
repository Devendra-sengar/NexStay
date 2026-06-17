import { Router } from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
} from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);

router.get('/', getNotifications);
router.patch('/:id/read', markRead);
router.post('/mark-all-read', markAllRead);

export default router;
