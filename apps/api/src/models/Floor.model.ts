import mongoose, { Document, Schema } from 'mongoose';

export interface IFloorDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  name: string;
  order: number;
  createdAt: Date;
}

const FloorSchema = new Schema<IFloorDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FloorSchema.index({ tenantId: 1 });
FloorSchema.index({ propertyId: 1, order: 1 });

export const Floor = mongoose.model<IFloorDoc>('Floor', FloorSchema);
