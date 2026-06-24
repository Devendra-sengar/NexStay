import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

// ─── Authenticate: verify JWT, attach req.user ────────────────────────────────
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash -otp -otpExpiry');
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }
    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
      });
      return;
    }
    req.user = { id: String(user._id), role: user.role, email: user.email };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ─── Optional auth: attach user if token present, continue if not ─────────────
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash -otp -otpExpiry');
    if (user && user.status === 'ACTIVE') {
      req.user = { id: String(user._id), role: user.role, email: user.email };
    }
  } catch {
    // ignore — public route still continues
  }
  next();
};

// ─── requireRoles: check role is in allowed list ─────────────────────────────
export const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

// ─── requireTenantAccess: auto-scope queries to tenantId = req.user.id ────────
// Use this on all HOSTEL_ADMIN routes. SUPER_ADMIN bypasses automatically.
export const requireTenantAccess = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  if (req.user.role === 'SUPER_ADMIN') {
    // Super admin can see everything — no tenantId scoping
    next();
    return;
  }
  if (req.user.role !== 'HOSTEL_ADMIN') {
    res.status(403).json({ success: false, message: 'Hostel admin access required' });
    return;
  }
  // The tenantId is available as req.user.id — controllers apply it in queries
  next();
};
