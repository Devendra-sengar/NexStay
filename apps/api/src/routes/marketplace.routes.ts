import { Router } from 'express';
import { getHomeData, searchProperties, getPropertyPublicDetail } from '../controllers/marketplace.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
router.use(protect); // student must be logged in

router.get('/home', getHomeData);
router.get('/search', searchProperties);
router.get('/properties/:id', getPropertyPublicDetail);

export default router;
