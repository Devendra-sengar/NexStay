import mongoose, { Document, Schema } from 'mongoose';

export interface IGuestProfileDoc extends Document {
  userId: mongoose.Types.ObjectId;
  college?: string;
  guardianName?: string;
  guardianPhone?: string;
  aadhaarUrl?: string;
  studentIdUrl?: string;
  photoUrl?: string;
  currentBookingId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GuestProfileSchema = new Schema<IGuestProfileDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    college: { type: String, default: '' },
    guardianName: { type: String, default: '' },
    guardianPhone: { type: String, default: '' },
    aadhaarUrl: { type: String, default: '' },
    studentIdUrl: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    currentBookingId: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
  },
  { timestamps: true }
);

GuestProfileSchema.index({ userId: 1 });

export const GuestProfile = mongoose.model<IGuestProfileDoc>('GuestProfile', GuestProfileSchema);
