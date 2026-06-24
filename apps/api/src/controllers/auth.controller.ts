import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { GuestProfile } from '../models/GuestProfile.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOTP } from '../utils/otp';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatUser = (user: InstanceType<typeof User>) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  avatar: user.avatar,
  businessName: user.businessName,
  ownerVerificationStatus: user.ownerVerificationStatus,
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role, businessName } = req.body;
    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    // Public registration: only GUEST or HOSTEL_ADMIN allowed
    const allowedRoles = ['GUEST', 'HOSTEL_ADMIN'];
    const userRole = allowedRoles.includes(role) ? role : 'GUEST';

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await User.create({
      name, email, phone, passwordHash, role: userRole,
      businessName: businessName || '',
      ownerVerificationStatus: userRole === 'HOSTEL_ADMIN' ? 'PENDING' : undefined,
      otp, otpExpiry,
    });

    // Create guest profile for GUEST role
    if (userRole === 'GUEST') {
      await GuestProfile.create({ userId: user._id });
    }

    console.log(`[DEV] OTP for ${email}: 123456 (hardcoded in dev)`);

    res.status(201).json({
      success: true,
      message: 'Account created. Verify with OTP 123456 (dev mode).',
      otp: '123456', // hardcoded in dev
      userId: user._id,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    // Dev mode: always accept "123456"
    const isDev = process.env.NODE_ENV === 'development';
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ success: false, message: 'User not found' });
      return;
    }

    const isDevOtp = isDev && otp === '123456';
    const isRealOtp = user.otp === otp && user.otpExpiry && user.otpExpiry > new Date();

    if (!isDevOtp && !isRealOtp) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const payload = { id: user._id, role: user.role, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      success: true,
      message: 'Account verified',
      user: formatUser(user),
      accessToken,
      refreshToken,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
      });
      return;
    }

    const payload = { id: user._id, role: user.role, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      success: true,
      user: formatUser(user),
      accessToken,
      refreshToken,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    const payload = { id: user._id, role: user.role, email: user.email };
    const accessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    res.json({ success: true, accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// Stateless JWT: client must discard tokens. Server-side token blacklist is future work.
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
      return;
    }

    // Dev mode: hardcode OTP
    user.otp = '123456';
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`[DEV] Password reset OTP for ${email}: 123456`);

    res.json({
      success: true,
      message: 'OTP sent. Use 123456 in dev mode.',
      otp: '123456', // returned in dev
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST /api/auth/reset-password ────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    const isDev = process.env.NODE_ENV === 'development';
    const isDevOtp = isDev && otp === '123456';
    const isRealOtp = user?.otp === otp && user?.otpExpiry && user.otpExpiry > new Date();

    if (!user || (!isDevOtp && !isRealOtp)) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash -otp -otpExpiry');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, user: formatUser(user) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PATCH /api/auth/profile ──────────────────────────────────────────────────
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();
    res.json({ success: true, user: formatUser(user) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── PATCH /api/auth/password ─────────────────────────────────────────────────
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' }); return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters' }); return;
    }
    const user = await User.findById(req.user?.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) { res.status(400).json({ success: false, message: 'Current password is incorrect' }); return; }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Legacy alias: signup = register ─────────────────────────────────────────
export const signup = register;

