import mongoose, { Document, Schema } from 'mongoose';

export interface IHostelDoc extends Document {
  hostelCode: string;
  name: string;
  ownerId: mongoose.Types.ObjectId;
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  gender: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  propertyId?: mongoose.Types.ObjectId | null;
  isComplaintFeatureEnabled: boolean;
  allowCustomPaymentAmount: boolean;
  showRentInBedPicker: boolean;
  messEnabled: boolean;
  messTimings: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  printTemplate?: string;
  printLogoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HostelSchema = new Schema<IHostelDoc>(
  {
    hostelCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    gender: {
      type: String,
      enum: ['BOYS', 'GIRLS', 'CO_ED'],
      required: true,
    },
    contactPhone: { type: String, default: '', match: [/^(?:\d{10})?$/, 'Contact phone number must be exactly 10 digits'] },
    contactEmail: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
    },
    isComplaintFeatureEnabled: { type: Boolean, default: true },
    allowCustomPaymentAmount: { type: Boolean, default: true },
    showRentInBedPicker: { type: Boolean, default: false },
    messEnabled: { type: Boolean, default: true },
    messTimings: {
      breakfast: { type: String, default: '8:00 AM - 9:30 AM' },
      lunch: { type: String, default: '12:30 PM - 2:00 PM' },
      dinner: { type: String, default: '7:30 PM - 9:00 PM' },
    },
    printTemplate: {
      type: String,
      enum: ['classic', 'modern', 'minimal', 'elegant'],
      default: 'classic',
    },
    printLogoUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

HostelSchema.index({ ownerId: 1 });

export const Hostel = mongoose.model<IHostelDoc>('Hostel', HostelSchema);
