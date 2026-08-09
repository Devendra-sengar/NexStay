const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/nexstay').then(async () => {
  const db = mongoose.connection.db;
  
  // Find beds that are OCCUPIED but don't have a matching Booking
  const occupiedBeds = await db.collection('beds').find({ status: 'OCCUPIED' }).toArray();
  let fixedCount = 0;
  
  for (const bed of occupiedBeds) {
    if (bed.currentBookingId) {
      const booking = await db.collection('bookings').findOne({ _id: bed.currentBookingId });
      if (!booking) {
        await db.collection('beds').updateOne(
          { _id: bed._id },
          { $set: { status: 'AVAILABLE' }, $unset: { currentBookingId: '' } }
        );
        fixedCount++;
      }
    }
  }
  
  console.log('Fixed orphaned beds:', fixedCount);
  process.exit(0);
}).catch(console.error);
