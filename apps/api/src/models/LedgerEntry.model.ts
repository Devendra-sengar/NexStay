import mongoose, { Document, Schema } from 'mongoose';

export interface ILedgerEntryDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId; // RentRecord
  residentId: mongoose.Types.ObjectId;
  transactionId?: mongoose.Types.ObjectId | null; // PaymentTransaction reference
  credit: number;
  debit: number;
  balance: number; // Balance of this specific invoice after this entry
  source: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'ADJUSTMENT' | 'INVOICE_GENERATION' | 'REFUND';
  verifiedBy?: mongoose.Types.ObjectId | null; // The admin/owner who verified this entry
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntryDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'RentRecord', required: true },
    residentId: { type: Schema.Types.ObjectId, ref: 'HostelStudent', required: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction', default: null },
    credit: { type: Number, default: 0 },
    debit: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    source: {
      type: String,
      enum: ['UPI', 'CASH', 'BANK_TRANSFER', 'ADJUSTMENT', 'INVOICE_GENERATION', 'REFUND'],
      required: true,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

LedgerEntrySchema.index({ tenantId: 1, date: -1 });
LedgerEntrySchema.index({ propertyId: 1, date: -1 });
LedgerEntrySchema.index({ invoiceId: 1, date: 1 });
LedgerEntrySchema.index({ residentId: 1, date: -1 });

export const LedgerEntry = mongoose.model<ILedgerEntryDoc>('LedgerEntry', LedgerEntrySchema);
