import mongoose, { Document, Schema } from 'mongoose';

export interface IMessMenuDoc extends Document {
  hostelId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  uploadedBy: mongoose.Types.ObjectId;
  breakfast: {
    items: { name: string; photoUrl: string | null }[];
    photoType: 'NONE' | 'THALI' | 'ITEMS';
    thaliPhotoUrl: string | null;
    photosUploadedAt: Date | null;
  };
  lunch: {
    items: { name: string; photoUrl: string | null }[];
    photoType: 'NONE' | 'THALI' | 'ITEMS';
    thaliPhotoUrl: string | null;
    photosUploadedAt: Date | null;
  };
  dinner: {
    items: { name: string; photoUrl: string | null }[];
    photoType: 'NONE' | 'THALI' | 'ITEMS';
    thaliPhotoUrl: string | null;
    photosUploadedAt: Date | null;
  };
  specialNote: string;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema(
  {
    name: { type: String, required: true },
    photoUrl: { type: String, default: null }
  },
  { _id: false }
);

const MealSchema = new Schema(
  {
    items: { type: [MenuItemSchema], default: [] },
    photoType: { type: String, enum: ['NONE', 'THALI', 'ITEMS'], default: 'NONE' },
    thaliPhotoUrl: { type: String, default: null },
    photosUploadedAt: { type: Date, default: null }
  },
  { _id: false }
);

const MessMenuSchema = new Schema<IMessMenuDoc>(
  {
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    breakfast: { type: MealSchema, default: () => ({ items: [], photoType: 'NONE', thaliPhotoUrl: null, photosUploadedAt: null }) },
    lunch:     { type: MealSchema, default: () => ({ items: [], photoType: 'NONE', thaliPhotoUrl: null, photosUploadedAt: null }) },
    dinner:    { type: MealSchema, default: () => ({ items: [], photoType: 'NONE', thaliPhotoUrl: null, photosUploadedAt: null }) },
    specialNote: { type: String, default: '' },
  },
  { timestamps: true }
);

MessMenuSchema.index({ hostelId: 1, date: 1 }, { unique: true });
MessMenuSchema.index({ tenantId: 1 });

export const MessMenu = mongoose.model<IMessMenuDoc>('MessMenu', MessMenuSchema);
