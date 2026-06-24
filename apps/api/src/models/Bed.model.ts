import mongoose, { Document, Schema } from 'mongoose';

export interface IBedDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedNumber: string;
  status: string;
  currentBookingId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BedSchema = new Schema<IBedDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    bedNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'],
      default: 'AVAILABLE',
    },
    currentBookingId: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
  },
  { timestamps: true }
);

BedSchema.index({ tenantId: 1 });
BedSchema.index({ roomId: 1, status: 1 });
BedSchema.index({ propertyId: 1, status: 1 });

export const Bed = mongoose.model<IBedDoc>('Bed', BedSchema);
