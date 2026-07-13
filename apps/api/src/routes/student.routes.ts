import { Router } from 'express';
import multer from 'multer';
import { protect, requireRoles } from '../middleware/auth.middleware';
import {
  getStudentDashboard,
  getMyProfile,
  updateMyProfile,
  changeStudentPassword,
  getMyActiveBooking,
  getMyRentHistory,
  getCurrentMonthRent,
  getMyComplaints,
  raiseComplaint,
  getTodayMenuForMyHostel,
  getWeekMenu,
  getHostelNotices,
  getMyRoommates,
  submitPaymentProof,
} from '../controllers/student.controller';

const router = Router();

// Multer for payment proof uploads (memory storage, images only, max 8MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only image files allowed'));
  },
});

// All student routes require auth + STUDENT role
router.use(protect, requireRoles('STUDENT'));

router.get('/dashboard',        getStudentDashboard);
router.get('/profile',          getMyProfile);
router.patch('/profile',        updateMyProfile);
router.patch('/password',       changeStudentPassword);
router.get('/booking',          getMyActiveBooking);
router.get('/rent',             getMyRentHistory);
router.get('/rent/current',     getCurrentMonthRent);
router.post('/rent/:id/payment-proof', upload.single('image'), submitPaymentProof);
router.get('/complaints',       getMyComplaints);
router.post('/complaints',      raiseComplaint);
router.get('/mess/menu',        getTodayMenuForMyHostel);
router.get('/mess/menu/week',   getWeekMenu);
router.get('/notices',          getHostelNotices);
router.get('/roommates',        getMyRoommates);

export default router;
