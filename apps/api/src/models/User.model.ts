import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDoc extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: string;
  status: string;
  avatar?: string;
  businessName?: string;
  gstNumber?: string;
  identityProofUrl?: string;
  ownerVerificationStatus?: string;
  ownerRejectionReason?: string;
  otp?: string;
  otpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'HOSTEL_ADMIN', 'GUEST'],
      default: 'GUEST',
    },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    avatar: { type: String, default: '' },
    businessName: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    identityProofUrl: { type: String, default: '' },
    ownerVerificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    ownerRejectionReason: { type: String, default: '' },
    otp: { type: String },
    otpExpiry: { type: Date },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });

export const User = mongoose.model<IUserDoc>('User', UserSchema);
