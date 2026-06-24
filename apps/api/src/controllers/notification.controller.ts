import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Notification } from '../models/Notification.model';
import { getMockEmails } from '../services/mockEmail.service';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.min(20, parseInt((req.query.limit as string) || '10'));
    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments({ userId, isRead: false }),
      Notification.countDocuments({ userId }),
    ]);
    res.json({ success: true, data: notifications, unreadCount, total, hasNextPage: page * limit < total });
  } catch { res.status(500).json({ success: false, message: 'Internal server error' }); }
};

export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const notification = await Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });
    if (!notification) { res.status(404).json({ success: false, message: 'Notification not found' }); return; }
    res.json({ success: true, data: notification });
  } catch { res.status(500).json({ success: false, message: 'Internal server error' }); }
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch { res.status(500).json({ success: false, message: 'Internal server error' }); }
};

// Dev-only: return mock email log
export const getDevEmails = async (_req: Request, res: Response): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'production') { res.status(403).json({ message: 'Disabled in production' }); return; }
    res.json({ success: true, data: getMockEmails() });
  } catch { res.status(500).json({ success: false, message: 'Internal server error' }); }
};

