import mongoose from 'mongoose';
import { connectDB } from './src/config/db';

async function dropIndex() {
  await connectDB();
  try {
    const db = mongoose.connection.db;
    if (db) {
      console.log('Connected to DB:', db.databaseName);
      const collection = db.collection('hostelstudents');
      
      console.log('Dropping bookingId_1 index...');
      await collection.dropIndex('bookingId_1');
      console.log('Index dropped successfully!');
    }
  } catch (err: any) {
    if (err.codeName === 'IndexNotFound') {
      console.log('Index bookingId_1 not found. All good!');
    } else {
      console.error('Error dropping index:', err);
    }
  } finally {
    process.exit(0);
  }
}

dropIndex();
