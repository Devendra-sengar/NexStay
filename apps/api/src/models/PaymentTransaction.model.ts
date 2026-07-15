import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentTransactionDoc extends Document {
  transactionId: string;
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  submissionId?: mongoose.Types.ObjectId | null; // Null if direct cash payment recorded by owner without submission
  invoiceId: mongoose.Types.ObjectId;
  residentId: mongoose.Types.ObjectId;
  settledAmount: number;
  paymentMode: 'CASH' | 'ONLINE' | 'ADJUSTMENT';
  status: 'SUCCESS' | 'FAILED' | 'REVERSED';
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema = new Schema<IPaymentTransactionDoc>(
  {
    transactionId: { type: String, required: true, unique: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    submissionId: { type: Schema.Types.ObjectId, ref: 'PaymentSubmission', default: null },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'RentRecord', required: true },
    residentId: { type: Schema.Types.ObjectId, ref: 'HostelStudent', required: true },
    settledAmount: { type: Number, required: true },
    paymentMode: { type: String, enum: ['CASH', 'ONLINE', 'ADJUSTMENT'], required: true },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'REVERSED'],
      default: 'SUCCESS',
    },
  },
  { timestamps: true }
);

PaymentTransactionSchema.index({ tenantId: 1, createdAt: -1 });
PaymentTransactionSchema.index({ propertyId: 1, createdAt: -1 });
PaymentTransactionSchema.index({ invoiceId: 1 });
PaymentTransactionSchema.index({ submissionId: 1 });
PaymentTransactionSchema.index({ transactionId: 1 });

export const PaymentTransaction = mongoose.model<IPaymentTransactionDoc>('PaymentTransaction', PaymentTransactionSchema);
