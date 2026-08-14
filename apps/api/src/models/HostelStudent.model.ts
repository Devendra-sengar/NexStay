import mongoose, { Document, Schema } from 'mongoose';

export interface IHostelStudentDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  hostelId?: mongoose.Types.ObjectId | null;
  propertyId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  guestId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  college?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianAddress?: string;
  aadhaarUrl?: string;
  aadhaarNumber?: string;
  studentIdUrl?: string;
  photoUrl?: string;
  admissionDate: Date;
  exitDate?: Date;
  noticePeriodDate?: Date;
  monthlyRent: number;
  securityDeposit: number;
  status: string;
  // ── Registration Form Fields ───────────────────────────────────────────────
  registrationDate?: Date;
  fatherName?: string;
  fatherOccupation?: string;
  fatherContact?: string;
  motherName?: string;
  dateOfBirth?: Date;
  bloodGroup?: string;
  maritalStatus?: string;
  education?: string;
  occupation?: string;
  organization?: string;
  permanentAddress?: string;
  vehicleNumber?: string;
  medicalHistory?: string;
  stayingPeriod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HostelStudentSchema = new Schema<IHostelStudentDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', default: null },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: false, unique: true, sparse: true },
    guestId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, match: [/^\d{10}$/, 'Phone number must be exactly 10 digits'] },
    email: { type: String, required: true, lowercase: true, trim: true },
    college: { type: String, default: '' },
    guardianName: { type: String, default: '' },
    guardianPhone: { type: String, default: '', match: [/^(?:\d{10})?$/, 'Guardian phone number must be exactly 10 digits'] },
    guardianAddress: { type: String, default: '' },
    aadhaarUrl: { type: String, default: '' },
    aadhaarNumber: { type: String, default: '' },
    studentIdUrl: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    admissionDate: { type: Date, required: true },
    exitDate: { type: Date },
    noticePeriodDate: { type: Date },
    monthlyRent: { type: Number, required: true },
    securityDeposit: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'CHECKED_OUT', 'DRAFT'],
      default: 'ACTIVE',
    },
    // ── Registration Form Fields ─────────────────────────────────────────────
    registrationDate: { type: Date },
    fatherName: { type: String, default: '' },
    fatherOccupation: { type: String, default: '' },
    fatherContact: { type: String, default: '' },
    motherName: { type: String, default: '' },
    dateOfBirth: { type: Date },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', ''],
      default: '',
    },
    maritalStatus: {
      type: String,
      enum: ['Single', 'Married', 'Divorced', 'Widowed', ''],
      default: '',
    },
    education: { type: String, default: '' },
    occupation: { type: String, default: '' },
    organization: { type: String, default: '' },
    permanentAddress: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    medicalHistory: { type: String, default: '' },
    stayingPeriod: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

HostelStudentSchema.index({ tenantId: 1, status: 1 });
HostelStudentSchema.index({ propertyId: 1, status: 1 });
HostelStudentSchema.index({ guestId: 1 });
HostelStudentSchema.index({ phone: 1 });
// Enforce: same phone cannot be ACTIVE twice in the same property under same hostel owner
HostelStudentSchema.index({ tenantId: 1, propertyId: 1, phone: 1, status: 1 });

export const HostelStudent = mongoose.model<IHostelStudentDoc>('HostelStudent', HostelStudentSchema);
