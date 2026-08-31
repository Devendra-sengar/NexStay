import mongoose from 'mongoose';
import { User } from './src/models/User.model';
import { Staff } from './src/models/Staff.model';
import { Hostel } from './src/models/Hostel.model';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexstay');
  const staff = await Staff.find({ role: { $in: ['WARDEN', 'MESS_MANAGER'] } });
  for (const s of staff) {
    const correctHostel = await Hostel.findOne({ propertyId: s.propertyId });
    if (correctHostel) {
      if (String(s.hostelId) !== String(correctHostel._id)) {
        s.hostelId = correctHostel._id;
        await s.save();
        console.log('Fixed staff', s.email);
      }
      if (s.email) {
        const user = await User.findOne({ email: s.email });
        if (user && String(user.hostelId) !== String(correctHostel._id)) {
          user.hostelId = correctHostel._id;
          await user.save();
          console.log('Fixed user', user.email);
        }
      }
    }
  }
  process.exit(0);
}
fix();
