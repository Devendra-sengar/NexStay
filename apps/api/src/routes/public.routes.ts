import { Router } from 'express';
import {
  getPublicProperties,
  getPublicPropertyDetail,
  getPublicCities,
  getPublicPropertyReviews,
  getPublicPropertyBeds,
} from '../controllers/public.controller';
import { createVisitRequest } from '../controllers/guest.controller';

const router = Router();

// No auth — fully public
router.get('/properties', getPublicProperties);
router.get('/cities', getPublicCities);
router.get('/properties/:id', getPublicPropertyDetail);
router.get('/properties/:id/reviews', getPublicPropertyReviews);
router.get('/properties/:id/beds', getPublicPropertyBeds);
router.post('/visit-requests', createVisitRequest);

export default router;
