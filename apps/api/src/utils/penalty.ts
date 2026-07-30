import { IPropertyDoc } from '../models/Property.model';
import { IRentRecordDoc } from '../models/RentRecord.model';

export const calculateDynamicFine = (rent: IRentRecordDoc | any, property: Partial<IPropertyDoc> | any): number => {
  if (rent.status === 'PAID') return rent.fine || 0;
  
  const penaltyType = property?.latePenaltyType || 'NONE';
  if (penaltyType === 'NONE') return rent.fine || 0;

  const penaltyAmount = property?.latePenaltyAmount || 0;
  const gracePeriodDays = property?.gracePeriodDays || 0;

  const now = new Date();
  const dueDate = new Date(rent.dueDate);
  const graceDate = new Date(dueDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);

  if (now <= graceDate) return rent.fine || 0;

  if (penaltyType === 'FIXED') {
    return penaltyAmount;
  }

  if (penaltyType === 'DAILY') {
    const diffTime = Math.abs(now.getTime() - dueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * penaltyAmount;
  }

  return rent.fine || 0;
};
