import mongoose, { Document, Schema } from 'mongoose';

export interface IFloorDoc extends Document {
  propertyId: mongoose.Types.ObjectId;
  name: string;
}

const FloorSchema = new Schema<IFloorDoc>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export const Floor = mongoose.model<IFloorDoc>('Floor', FloorSchema);
