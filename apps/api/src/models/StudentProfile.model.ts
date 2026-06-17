import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentProfileDoc extends Document {
  userId: mongoose.Types.ObjectId;
  guardianName: string;
  guardianPhone: string;
  documents: {
    aadhaar?: string;
    studentId?: string;
    photo?: string;
  };
  currentPropertyId?: mongoose.Types.ObjectId;
  currentRoomId?: mongoose.Types.ObjectId;
  currentBedId?: mongoose.Types.ObjectId;
}

const StudentProfileSchema = new Schema<IStudentProfileDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    guardianName: { type: String, default: '' },
    guardianPhone: { type: String, default: '' },
    documents: {
      aadhaar: { type: String },
      studentId: { type: String },
      photo: { type: String },
    },
    currentPropertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    currentRoomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    currentBedId: { type: Schema.Types.ObjectId, ref: 'Bed' },
  },
  { timestamps: true }
);

export const StudentProfile = mongoose.model<IStudentProfileDoc>('StudentProfile', StudentProfileSchema);
