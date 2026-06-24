import mongoose from 'mongoose';
import { Notification } from '../models/Notification.model';
import { User } from '../models/User.model';
import { sendMockEmail } from './mockEmail.service';

interface NotifyOptions {
  userId: string | mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
}

export async function notify(opts: NotifyOptions): Promise<void> {
  try {
    await Notification.create({
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      channel: 'IN_APP',
      isRead: false,
      linkUrl: opts.linkUrl || '',
    });

    // Mock email
    try {
      const user = await User.findById(opts.userId).select('email name').lean();
      if (user?.email) {
        sendMockEmail(
          (user as any).email,
          opts.title,
          `Hi ${(user as any).name || 'there'},\n\n${opts.message}\n\nRegards,\nNexStay Team`
        );
      }
    } catch { /* non-critical */ }
  } catch (err) {
    console.error('[NotifyService] Failed:', err);
  }
}
