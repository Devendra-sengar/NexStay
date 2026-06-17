import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenseDoc extends Document {
  propertyId: mongoose.Types.ObjectId;
  category: string;
  amount: number;
  date: Date;
  notes?: string;
}

const ExpenseSchema = new Schema<IExpenseDoc>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    category: {
      type: String,
      enum: ['ELECTRICITY', 'WATER', 'STAFF_SALARY', 'MAINTENANCE', 'MISC'],
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Expense = mongoose.model<IExpenseDoc>('Expense', ExpenseSchema);
