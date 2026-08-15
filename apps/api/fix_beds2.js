const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/nexstay').then(async () => {
  const db = mongoose.connection.db;
  
  // Find the last created student
  const students = await db.collection('hostelstudents').find().sort({ createdAt: -1 }).limit(1).toArray();
  if (students.length > 0) { 
    const student = students[0];
    console.log('Found recent student:', student.name);
    
    // delete student
    await db.collection('hostelstudents').deleteOne({ _id: student._id });
    
    // reset bed
    await db.collection('beds').updateOne({ _id: student.bedId }, { $set: { status: 'AVAILABLE' }, $unset: { currentBookingId: '' } });
    
    // delete booking
    if (student.bookingId) await db.collection('bookings').deleteOne({ _id: student.bookingId });
    
    // delete rent records
    await db.collection('rentrecords').deleteMany({ hostelStudentId: student._id });
    
    // delete payment transactions
    await db.collection('paymenttransactions').deleteMany({ residentId: student._id });
    
    console.log('Cleaned up dirty check-in state.');
  }
  
  process.exit(0);
}).catch(console.error);
