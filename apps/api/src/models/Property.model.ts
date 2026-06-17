import mongoose, { Document, Schema } from 'mongoose';

export interface IPropertyDoc extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  address: string;
  city: string;
  description: string;
  amenities: string[];
  images: string[];
  verificationStatus: string;
  gender: string;
  rentStartingFrom: number;
  rating: number;
  totalRatings: number;
  createdAt: Date;
}

const PropertySchema = new Schema<IPropertyDoc>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    description: { type: String, default: '' },
    amenities: [{ type: String }],
    images: [{ type: String }],
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    gender: { type: String, enum: ['BOYS', 'GIRLS', 'CO_ED'], default: 'CO_ED' },
    rentStartingFrom: { type: Number, default: 5000 },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PropertySchema.index({ city: 'text', name: 'text' });

export const Property = mongoose.model<IPropertyDoc>('Property', PropertySchema);
