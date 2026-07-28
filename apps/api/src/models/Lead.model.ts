import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  tenantId: mongoose.Types.ObjectId;   // Owner's user ID
  hostelId: mongoose.Types.ObjectId;   // Hostel ID this lead belongs to
  propertyId?: mongoose.Types.ObjectId; // Specific property, if selected
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: string; // NEW, CONTACTED, VISITED, CONVERTED, CLOSED
  roomType?: string;
  messIncluded: boolean;
  notes?: string;
  submittedBy: mongoose.Types.ObjectId;
  submittedByRole: string; // WARDEN or HOSTEL_ADMIN
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    source: { type: String, default: 'WALK_IN' },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'VISITED', 'CONVERTED', 'CLOSED'],
      default: 'NEW'
    },
    roomType: { type: String },
    messIncluded: { type: Boolean, default: false },
    notes: { type: String },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedByRole: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

export const Lead = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
