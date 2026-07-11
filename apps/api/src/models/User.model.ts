import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface StaffPermissions {
  canViewStudents: boolean;
  canManageComplaints: boolean;
  canViewRentRecords: boolean;
  canUploadMenu: boolean;
  canViewSalary: boolean;
  canManageRooms: boolean;
  canViewAttendance: boolean;
}

// SuperAdmin controls which modules a HOSTEL_ADMIN can access
export interface OwnerPermissions {
  canManageERP: boolean;          // Students, check-in, check-out
  canViewReports: boolean;        // Reports & analytics
  canManageMarketplace: boolean;  // Property listings
  canManageRooms: boolean;        // Room/bed management
  canManageMess: boolean;         // Mess menu & timings
  canManageExpenses: boolean;     // Expenses module
  canManageComplaints: boolean;   // Complaints module
  canManageStaff: boolean;        // Staff management
}

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
  // New fields
  hostelId?: mongoose.Types.ObjectId | null;
  staffPermissions?: StaffPermissions;
  ownerPermissions?: OwnerPermissions;  // SuperAdmin-controlled
  studentId?: string;
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const StaffPermissionsSchema = new Schema<StaffPermissions>(
  {
    canViewStudents: { type: Boolean, default: false },
    canManageComplaints: { type: Boolean, default: false },
    canViewRentRecords: { type: Boolean, default: false },
    canUploadMenu: { type: Boolean, default: false },
    canViewSalary: { type: Boolean, default: false },
    canManageRooms: { type: Boolean, default: false },
    canViewAttendance: { type: Boolean, default: false },
  },
  { _id: false }
);

const OwnerPermissionsSchema = new Schema<OwnerPermissions>(
  {
    canManageERP: { type: Boolean, default: true },
    canViewReports: { type: Boolean, default: true },
    canManageMarketplace: { type: Boolean, default: true },
    canManageRooms: { type: Boolean, default: true },
    canManageMess: { type: Boolean, default: true },
    canManageExpenses: { type: Boolean, default: true },
    canManageComplaints: { type: Boolean, default: true },
    canManageStaff: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true,      // allow multiple docs with null/missing email
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true, match: [/^\d{10}$/, 'Phone number must be exactly 10 digits'] },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'HOSTEL_ADMIN', 'STUDENT', 'WARDEN', 'MESS_MANAGER'],
      default: 'STUDENT',
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
    // ── New fields ────────────────────────────────────────────────────────────
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hostel',
      default: null,
    },
    staffPermissions: {
      type: StaffPermissionsSchema,
      default: null,
    },
    ownerPermissions: {
      type: OwnerPermissionsSchema,
      default: null,   // null = full access (backward-compat)
    },
    studentId: {
      // Mobile number used as login username for STUDENT role
      type: String,
      sparse: true,
      unique: true,
    },
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ hostelId: 1, role: 1 });

export const User = mongoose.model<IUserDoc>('User', UserSchema);
