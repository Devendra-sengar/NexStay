import mongoose, { Document, Schema } from 'mongoose';

export interface IReviewDoc extends Document {
  propertyId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReviewDoc>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

export const Review = mongoose.model<IReviewDoc>('Review', ReviewSchema);
