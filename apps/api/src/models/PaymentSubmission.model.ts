import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentSubmissionDoc extends Document {
  submissionId: string;
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId; // RentRecord
  residentId: mongoose.Types.ObjectId;
  claimedAmount: number;
  paymentMode: 'CASH' | 'ONLINE' | 'ADJUSTMENT';
  referenceNumber?: string;
  proofUrl?: string;
  remark?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PENDING_RESIDENT';
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSubmissionSchema = new Schema<IPaymentSubmissionDoc>(
  {
    submissionId: { type: String, required: true, unique: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'RentRecord', required: true },
    residentId: { type: Schema.Types.ObjectId, ref: 'HostelStudent', required: true },
    claimedAmount: { type: Number, required: true },
    paymentMode: { type: String, enum: ['CASH', 'ONLINE', 'ADJUSTMENT'], required: true },
    referenceNumber: { type: String, default: '' },
    proofUrl: { type: String, default: '' },
    remark: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'PENDING_RESIDENT'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

PaymentSubmissionSchema.index({ tenantId: 1, status: 1 });
PaymentSubmissionSchema.index({ propertyId: 1, status: 1 });
PaymentSubmissionSchema.index({ invoiceId: 1 });
PaymentSubmissionSchema.index({ residentId: 1 });
PaymentSubmissionSchema.index({ submissionId: 1 });

export const PaymentSubmission = mongoose.model<IPaymentSubmissionDoc>('PaymentSubmission', PaymentSubmissionSchema);
