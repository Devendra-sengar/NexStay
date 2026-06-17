import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationDoc extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, enum: ['IN_APP', 'EMAIL'], default: 'IN_APP' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotificationDoc>('Notification', NotificationSchema);
