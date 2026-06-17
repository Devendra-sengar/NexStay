import mongoose, { Document, Schema } from 'mongoose';

export interface IRentRecordDoc extends Document {
  studentId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  amount: number;
  dueDate: Date;
  status: string;
  paidAmount: number;
  paidAt?: Date;
  paymentMethod?: string;
  notes?: string;
  receiptUrl?: string;
}

const RentRecordSchema = new Schema<IRentRecordDoc>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['PAID', 'UNPAID', 'PARTIAL'], default: 'UNPAID' },
    paidAmount: { type: Number, default: 0 },
    paidAt: { type: Date },
    paymentMethod: { type: String, enum: ['UPI', 'CARD', 'NET_BANKING', 'CASH', 'BANK_TRANSFER'] },
    notes: { type: String },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

export const RentRecord = mongoose.model<IRentRecordDoc>('RentRecord', RentRecordSchema);
