import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  roomNumber: string;
  capacity: number;
  roomType: string;
  status: string;
  pricePerBed: number;
  createdAt: Date;
}

const RoomSchema = new Schema<IRoomDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    roomNumber: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    roomType: {
      type: String,
      enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING'],
      required: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'FULL'],
      default: 'AVAILABLE',
    },
    pricePerBed: { type: Number, required: true, default: 5000 },
  },
  { timestamps: true }
);

RoomSchema.index({ tenantId: 1 });
RoomSchema.index({ propertyId: 1, status: 1 });

export const Room = mongoose.model<IRoomDoc>('Room', RoomSchema);
