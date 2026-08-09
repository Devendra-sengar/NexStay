const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/nexstay').then(async () => {
  const db = mongoose.connection.db;
  
  // Update all WARDEN users to have canUploadMenu: true
  const res = await db.collection('users').updateMany(
    { role: 'WARDEN' },
    { $set: { 'staffPermissions.canUploadMenu': true } }
  );
  
  console.log('Updated existing Wardens:', res.modifiedCount);
  process.exit(0);
}).catch(console.error);
