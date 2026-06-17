import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingDoc extends Document {
  studentId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  status: string;
  documents: string[];
  paymentId?: string;
  createdAt: Date;
}

const BookingSchema = new Schema<IBookingDoc>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'],
      default: 'PENDING',
    },
    documents: [{ type: String }],
    paymentId: { type: String },
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBookingDoc>('Booking', BookingSchema);
