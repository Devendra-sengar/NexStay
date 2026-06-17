import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomDoc extends Document {
  propertyId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  roomNumber: string;
  capacity: number;
  roomType: string;
  status: string;
  rentPerBed: number;
}

const RoomSchema = new Schema<IRoomDoc>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    roomNumber: { type: String, required: true },
    capacity: { type: Number, required: true },
    roomType: {
      type: String,
      enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING'],
      required: true,
    },
    status: { type: String, enum: ['AVAILABLE', 'FULL'], default: 'AVAILABLE' },
    rentPerBed: { type: Number, default: 6000 },
  },
  { timestamps: true }
);

export const Room = mongoose.model<IRoomDoc>('Room', RoomSchema);
