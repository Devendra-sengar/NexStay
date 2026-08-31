import mongoose from 'mongoose';
import { Property } from './src/models/Property.model';
import { Hostel } from './src/models/Hostel.model';
import { Counter } from './src/models/Counter.model';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexstay');
  const props = await Property.find({}).lean();
  for (const p of props) {
    const existingHostel = await Hostel.findOne({ propertyId: p._id });
    if (!existingHostel) {
      let counter = await Counter.findByIdAndUpdate('hostelCode', { $inc: { seq: 1 } }, { new: true });
      if (!counter) {
        counter = await Counter.create({ _id: 'hostelCode', seq: 1 });
      }
      const hostelCode = `NST-${String(counter.seq).padStart(3, '0')}`;
      await Hostel.create({
        hostelCode,
        name: p.name,
        gender: p.gender,
        ownerId: p.tenantId,
        propertyId: p._id,
        isActive: true,
        address: { city: p.city, state: p.state, street: p.address, pincode: p.pincode },
        messEnabled: p.foodIncluded,
      });
      console.log('Created hostel for property:', p.name);
    }
  }
  process.exit(0);
}
fix();
