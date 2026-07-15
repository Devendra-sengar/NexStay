import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLogDoc extends Document {
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  action: string;
  actorId: mongoose.Types.ObjectId; // The user who performed the action (Admin/Student/System)
  actorType: 'Admin' | 'Resident' | 'System';
  entityId: mongoose.Types.ObjectId; // The ID of the affected entity
  entityType: 'PaymentSubmission' | 'PaymentTransaction' | 'LedgerEntry' | 'RentRecord';
  details: string; // JSON string or text description of what happened
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    action: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, required: true },
    actorType: { type: String, enum: ['Admin', 'Resident', 'System'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityType: {
      type: String,
      enum: ['PaymentSubmission', 'PaymentTransaction', 'LedgerEntry', 'RentRecord'],
      required: true,
    },
    details: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ propertyId: 1, createdAt: -1 });
AuditLogSchema.index({ entityId: 1 });
AuditLogSchema.index({ actorId: 1 });

export const AuditLog = mongoose.model<IAuditLogDoc>('AuditLog', AuditLogSchema);
