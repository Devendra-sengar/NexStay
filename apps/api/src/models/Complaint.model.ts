import mongoose, { Document, Schema } from 'mongoose';

export interface ITimelineEntry {
  status: string;
  note?: string;
  changedBy: mongoose.Types.ObjectId;
  changedAt: Date;
}

export interface IComplaintDoc extends Document {
  studentId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  status: string;
  assignedTo?: mongoose.Types.ObjectId;
  timeline: ITimelineEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEntrySchema = new Schema<ITimelineEntry>(
  {
    status: { type: String, required: true },
    note: { type: String },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ComplaintSchema = new Schema<IComplaintDoc>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['ELECTRICITY', 'FOOD', 'INTERNET', 'WATER', 'CLEANING'],
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    timeline: { type: [TimelineEntrySchema], default: [] },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model<IComplaintDoc>('Complaint', ComplaintSchema);
