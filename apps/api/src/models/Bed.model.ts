import mongoose, { Document, Schema } from 'mongoose';

export interface IBedDoc extends Document {
  roomId: mongoose.Types.ObjectId;
  bedNumber: string;
  bedType: string;
  status: string;
}

const BedSchema = new Schema<IBedDoc>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    bedNumber: { type: String, required: true },
    bedType: { type: String, default: 'Standard' },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'],
      default: 'AVAILABLE',
    },
  },
  { timestamps: true }
);

export const Bed = mongoose.model<IBedDoc>('Bed', BedSchema);
