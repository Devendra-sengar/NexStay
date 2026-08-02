import mongoose, { Document, Schema } from 'mongoose';

export interface IErpPreBookingDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  hostelId?: mongoose.Types.ObjectId | null;
  propertyId: mongoose.Types.ObjectId;
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
  expectedJoiningDate: Date;
  tokenAmount: number;
  tokenPaymentMethod: string;
  preferredRoomType: string;
  status: string; // PENDING, CONVERTED, CANCELLED
  createdBy: mongoose.Types.ObjectId;
  createdByRole: string;
  
  // Registration Form Fields
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

const ErpPreBookingSchema = new Schema<IErpPreBookingDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', default: null, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    college: { type: String, default: '' },
    guardianName: { type: String, default: '' },
    guardianPhone: { type: String, default: '' },
    guardianAddress: { type: String, default: '' },
    aadhaarUrl: { type: String, default: '' },
    aadhaarNumber: { type: String, default: '' },
    studentIdUrl: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    expectedJoiningDate: { type: Date, required: true },
    tokenAmount: { type: Number, required: true },
    tokenPaymentMethod: { type: String, required: true },
    preferredRoomType: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONVERTED', 'CANCELLED'],
      default: 'PENDING',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByRole: { type: String, required: true },

    fatherName: { type: String },
    fatherOccupation: { type: String },
    fatherContact: { type: String },
    motherName: { type: String },
    dateOfBirth: { type: Date },
    bloodGroup: { type: String },
    maritalStatus: { type: String },
    education: { type: String },
    occupation: { type: String },
    organization: { type: String },
    permanentAddress: { type: String },
    vehicleNumber: { type: String },
    medicalHistory: { type: String },
    stayingPeriod: { type: String },
  },
  { timestamps: true }
);

export const ErpPreBooking = mongoose.models.ErpPreBooking || mongoose.model<IErpPreBookingDoc>('ErpPreBooking', ErpPreBookingSchema);
