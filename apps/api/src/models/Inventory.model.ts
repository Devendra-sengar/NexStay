import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  itemName: string;
  totalCount: number;
  workingCount: number;
  damagedCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventoryDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    itemName: { type: String, required: true, trim: true },
    totalCount: { type: Number, required: true, default: 0, min: 0 },
    workingCount: { type: Number, required: true, default: 0, min: 0 },
    damagedCount: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

InventorySchema.index({ tenantId: 1 });
InventorySchema.index({ propertyId: 1 });

export const Inventory = mongoose.model<IInventoryDoc>('Inventory', InventorySchema);
