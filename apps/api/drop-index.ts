import mongoose from 'mongoose';

async function checkAndDrop() {
  const uri = 'mongodb://localhost:27017';
  
  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    // @ts-ignore
    const admin = conn.db.admin(); 
    const dbs = await admin.listDatabases();
    console.log('All databases:', dbs.databases.map((d: any) => d.name));
    
    for (const dbInfo of dbs.databases) {
      if (dbInfo.name.toLowerCase() === 'nexstay') {
        console.log(`\nChecking database: ${dbInfo.name}`);
        const db = conn.useDb(dbInfo.name).db;
        if (!db) continue;
        
        const collections = await db.listCollections().toArray();
        const hasHostelStudents = collections.some(c => c.name.toLowerCase() === 'hostelstudents');
        
        if (hasHostelStudents) {
          const colName = collections.find(c => c.name.toLowerCase() === 'hostelstudents')?.name || 'hostelstudents';
          console.log(`Found '${colName}' in ${dbInfo.name}`);
          const collection = db.collection(colName);
          const indexes = await collection.indexes();
          console.log('Current Indexes:', indexes.map(i => i.name));
          
          if (indexes.some(i => i.name === 'bookingId_1')) {
            console.log(`Dropping bookingId_1 from ${dbInfo.name}...`);
            await collection.dropIndex('bookingId_1');
            console.log('Dropped successfully!');
          } else {
            console.log('bookingId_1 not found.');
          }
        }
      }
    }
    
    await conn.close();
  } catch (err) {
    console.error(`Error:`, err);
  }
  process.exit(0);
}

checkAndDrop();
