import { Router } from 'express';
import {
  register,
  signup,
  verifyOtp,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/signup', signup); // alias for register
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/password', protect, changePassword);

export default router;

