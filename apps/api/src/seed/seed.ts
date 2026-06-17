import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import { User } from '../models/User.model';
import { Property } from '../models/Property.model';
import { Floor } from '../models/Floor.model';
import { Room } from '../models/Room.model';
import { Bed } from '../models/Bed.model';
import { Booking } from '../models/Booking.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { RentRecord } from '../models/RentRecord.model';
import { Expense } from '../models/Expense.model';
import { Complaint } from '../models/Complaint.model';
import { Notification } from '../models/Notification.model';
import { Review } from '../models/Review.model';

const hash = (p: string) => bcrypt.hash(p, 12);

const PG_DATA = [
  { name: 'Sunrise Boys PG', address: '14, Koregaon Park', city: 'Pune', amenities: ['WIFI', 'FOOD', 'LAUNDRY', 'CCTV', 'PARKING'], gender: 'BOYS', rentStartingFrom: 7000, rating: 4.5 },
  { name: 'Green Valley Residency', address: '7, Baner Road', city: 'Pune', amenities: ['WIFI', 'AC', 'CCTV', 'WATER'], gender: 'CO_ED', rentStartingFrom: 8500, rating: 4.1 },
  { name: 'Comfort Stay Hostel', address: '22, Koramangala', city: 'Bangalore', amenities: ['WIFI', 'FOOD', 'LAUNDRY', 'CCTV'], gender: 'GIRLS', rentStartingFrom: 9000, rating: 4.7 },
  { name: 'Namma PG', address: '5, HSR Layout', city: 'Bangalore', amenities: ['WIFI', 'LAUNDRY', 'WATER', 'POWER_BACKUP'], gender: 'BOYS', rentStartingFrom: 6500, rating: 3.9 },
  { name: 'Central PG House', address: '3, Vijay Nagar', city: 'Indore', amenities: ['WIFI', 'FOOD', 'CCTV', 'PARKING'], gender: 'CO_ED', rentStartingFrom: 5500, rating: 4.3 },
  { name: 'Shree Sai PG', address: '11, Napier Town', city: 'Jabalpur', amenities: ['WIFI', 'FOOD', 'LAUNDRY'], gender: 'GIRLS', rentStartingFrom: 4500, rating: 4.0 },
];

const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING'] as const;
const BED_STATUSES = ['AVAILABLE', 'OCCUPIED', 'RESERVED'] as const;
const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'] as const;
const RENT_STATUSES = ['PAID', 'UNPAID', 'PARTIAL'] as const;
const EXPENSE_CATS = ['ELECTRICITY', 'WATER', 'STAFF_SALARY', 'MAINTENANCE', 'MISC'] as const;
const COMPLAINT_CATS = ['ELECTRICITY', 'FOOD', 'INTERNET', 'WATER', 'CLEANING'] as const;
const COMPLAINT_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const;

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexstay';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}), Property.deleteMany({}), Floor.deleteMany({}),
    Room.deleteMany({}), Bed.deleteMany({}), Booking.deleteMany({}),
    StudentProfile.deleteMany({}), RentRecord.deleteMany({}),
    Expense.deleteMany({}), Complaint.deleteMany({}), Notification.deleteMany({}),
    Review.deleteMany({}),
  ]);
  console.log('🗑️  Cleared all collections');

  // ── 1. Super Admin ──────────────────────────────────────────────────────────
  const adminPw = await hash('Admin@123');
  const admin = await User.create({
    name: 'Rahul Sharma', email: 'admin@nexstay.in', phone: '9000000001',
    passwordHash: adminPw, role: 'SUPER_ADMIN', status: 'ACTIVE', isVerified: true,
  });
  console.log('👤 Super Admin created');

  // ── 2. PG Owners ────────────────────────────────────────────────────────────
  const ownerPw = await hash('Owner@123');
  const owners = await User.insertMany([
    { name: 'Vikram Patel', email: 'owner1@nexstay.in', phone: '9000000002', passwordHash: ownerPw, role: 'PG_OWNER', status: 'ACTIVE', isVerified: true, ownerVerificationStatus: 'APPROVED' },
    { name: 'Sunita Desai', email: 'owner2@nexstay.in', phone: '9000000003', passwordHash: ownerPw, role: 'PG_OWNER', status: 'ACTIVE', isVerified: true, ownerVerificationStatus: 'APPROVED' },
    { name: 'Ramesh Gupta', email: 'owner3@nexstay.in', phone: '9000000004', passwordHash: ownerPw, role: 'PG_OWNER', status: 'ACTIVE', isVerified: true, ownerVerificationStatus: 'APPROVED' },
    { name: 'Pending Owner', email: 'owner_pending@nexstay.in', phone: '9000000009', passwordHash: ownerPw, role: 'PG_OWNER', status: 'ACTIVE', isVerified: true, ownerVerificationStatus: 'PENDING', businessName: 'NexStay Residences Ltd', gstNumber: '27AAAAA1111A1Z1', panNumber: 'ABCDE1111F' },
  ]);
  console.log('👤 4 PG Owners created (including 1 PENDING verification)');
 
  // ── 3. Property Manager ─────────────────────────────────────────────────────
  const managerPw = await hash('Manager@123');
  const manager = await User.create({
    name: 'Priya Singh', email: 'manager1@nexstay.in', phone: '9000000005',
    passwordHash: managerPw, role: 'PROPERTY_MANAGER', status: 'ACTIVE', isVerified: true,
  });
  console.log('👤 Property Manager created');
 
  // ── 4. Properties ────────────────────────────────────────────────────────────
  const propertiesToInsert = PG_DATA.map((pg, i) => ({
    ...pg,
    ownerId: owners[Math.floor(i / 2)]._id,
    description: `${pg.name} is a well-maintained PG in ${pg.city}, offering modern amenities including high-speed WiFi, hygienic meals, and 24/7 security. Ideal for students and working professionals.`,
    images: [],
    verificationStatus: 'APPROVED',
  }));

  // Add pending properties for admin verification manual testing
  propertiesToInsert.push({
    name: 'Pending Grand Mansion',
    address: '42, Viman Nagar',
    city: 'Pune',
    amenities: ['WIFI', 'AC', 'CCTV'],
    gender: 'CO_ED',
    rentStartingFrom: 12000,
    rating: 0,
    ownerId: owners[0]._id,
    description: 'A luxurious mansion pending approval. Contains premium single and double rooms.',
    images: [],
    verificationStatus: 'PENDING',
    rejectionReason: '',
  } as any);

  propertiesToInsert.push({
    name: 'Pending Cozy Nest',
    address: '10, Koramangala 4th Block',
    city: 'Bangalore',
    amenities: ['WIFI', 'FOOD'],
    gender: 'GIRLS',
    rentStartingFrom: 9500,
    rating: 0,
    ownerId: owners[1]._id,
    description: 'Cozy girls PG pending admin review.',
    images: [],
    verificationStatus: 'PENDING',
    rejectionReason: '',
  } as any);

  const properties = await Property.insertMany(propertiesToInsert);
  console.log('🏠 8 Properties created (6 APPROVED, 2 PENDING)');

  // ── 5. Floors, Rooms, Beds ───────────────────────────────────────────────────
  const allBeds: mongoose.Document[] = [];
  const allRooms: mongoose.Document[] = [];

  for (const property of properties) {
    const floors = await Floor.insertMany([
      { propertyId: property._id, name: 'Ground Floor' },
      { propertyId: property._id, name: 'First Floor' },
    ]);

    for (let fi = 0; fi < floors.length; fi++) {
      const floor = floors[fi];
      const roomType = ROOM_TYPES[(fi) % ROOM_TYPES.length];
      const capacity = roomType === 'SINGLE' ? 1 : roomType === 'DOUBLE' ? 2 : roomType === 'TRIPLE' ? 3 : 4;

      for (let ri = 1; ri <= 3; ri++) {
        const room = await Room.create({
          propertyId: property._id,
          floorId: floor._id,
          roomNumber: `${fi + 1}0${ri}`,
          capacity,
          roomType,
          status: 'AVAILABLE',
          rentPerBed: (property as any).rentStartingFrom || 6000,
        });
        allRooms.push(room);

        for (let bi = 1; bi <= capacity; bi++) {
          const bedStatus = bi === 1 ? 'AVAILABLE' : BED_STATUSES[Math.floor(Math.random() * BED_STATUSES.length)];
          const bed = await Bed.create({
            roomId: room._id,
            bedNumber: `B${bi}`,
            bedType: 'Standard',
            status: bedStatus,
          });
          allBeds.push(bed);
        }
      }
    }
  }
  console.log(`🛏️  Floors, Rooms & Beds created`);

  // ── 6. Students ──────────────────────────────────────────────────────────────
  const studentPw = await hash('Student@123');
  const studentNames = [
    'Arjun Kumar', 'Sneha Joshi', 'Rohan Mehta', 'Pooja Sharma', 'Amit Verma',
    'Kavya Nair', 'Deepak Singh', 'Anjali Gupta', 'Vikas Yadav', 'Priyanka Tiwari',
    'Manish Pandey', 'Richa Dubey', 'Suresh Patel', 'Neha Agarwal', 'Rahul Rao',
  ];

  const students = await User.insertMany(
    studentNames.map((name, i) => ({
      name, email: `student${i + 1}@nexstay.in`, phone: `90${String(i + 1).padStart(8, '0')}`,
      passwordHash: studentPw, role: 'STUDENT', status: 'ACTIVE', isVerified: true,
    }))
  );
  console.log('👨‍🎓 15 Students created');

  // ── 7. Student Profiles + Bookings + Rent Records ────────────────────────────
  const bookings = [];
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const property = properties[i % properties.length];
    const room = allRooms[i % allRooms.length] as any;
    const bed = allBeds[i % allBeds.length] as any;
    const bookingStatus = BOOKING_STATUSES[i % BOOKING_STATUSES.length];

    await StudentProfile.create({
      userId: student._id,
      guardianName: `Guardian of ${student.name}`,
      guardianPhone: `91${String(i).padStart(8, '1')}`,
      documents: { aadhaar: `ADH${i + 100}`, studentId: `STU${i + 200}`, photo: '' },
      currentPropertyId: bookingStatus === 'CHECKED_IN' ? property._id : undefined,
      currentRoomId: bookingStatus === 'CHECKED_IN' ? room._id : undefined,
      currentBedId: bookingStatus === 'CHECKED_IN' ? bed._id : undefined,
    });

    const booking = await Booking.create({
      studentId: student._id,
      propertyId: property._id,
      roomId: room._id,
      bedId: bed._id,
      status: bookingStatus,
      documents: [],
    });
    bookings.push(booking);

    // Rent record
    const rentStatus = RENT_STATUSES[i % RENT_STATUSES.length];
    const amount = 7000 + (i % 5) * 500;
    const paidAmount = rentStatus === 'PAID' ? amount : rentStatus === 'PARTIAL' ? Math.floor(amount / 2) : 0;
    await RentRecord.create({
      studentId: student._id,
      bookingId: booking._id,
      amount,
      dueDate: new Date(Date.now() + (i % 3 === 0 ? -5 : 10) * 24 * 60 * 60 * 1000),
      status: rentStatus,
      paidAmount,
      paidAt: rentStatus !== 'UNPAID' ? new Date() : undefined,
    });
  }
  console.log('📋 Bookings & Rent Records created');

  // ── 8. Complaints ────────────────────────────────────────────────────────────
  const complaintData = [
    { title: 'No electricity in room', description: 'Power outage since morning in room 101.', category: 'ELECTRICITY' },
    { title: 'WiFi not working', description: 'Internet down for 2 days.', category: 'INTERNET' },
    { title: 'Water not coming', description: 'No water supply in morning hours.', category: 'WATER' },
    { title: 'Room not cleaned', description: 'Room was not cleaned for 3 days.', category: 'CLEANING' },
    { title: 'Food quality poor', description: 'Dinner was stale yesterday.', category: 'FOOD' },
    { title: 'AC not working', description: 'Air conditioner stopped working.', category: 'ELECTRICITY' },
  ];

  for (let i = 0; i < complaintData.length; i++) {
    const student = students[i % students.length];
    await Complaint.create({
      studentId: student._id,
      propertyId: properties[i % properties.length]._id,
      ...complaintData[i],
      status: COMPLAINT_STATUSES[i % COMPLAINT_STATUSES.length],
      assignedTo: i % 3 === 0 ? manager._id : undefined,
      timeline: [{
        status: COMPLAINT_STATUSES[0],
        note: 'Complaint raised by student',
        changedBy: student._id,
        changedAt: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      }],
    });
  }
  console.log('📢 Complaints created');

  // ── 9.5 Reviews ──────────────────────────────────────────────────────────────
  const reviewData = [
    { rating: 5, comment: 'Excellent facilities! WiFi is super fast and food quality is outstanding. Very safe locality.' },
    { rating: 4, comment: 'Good hostel overall. Clean rooms and helpful staff. Could use faster maintenance response.' },
    { rating: 5, comment: 'Best PG I have stayed at! The mess food is homely and other tenants are very friendly.' },
    { rating: 3, comment: 'Decent place. Location is convenient for college commute. Maintenance could be faster.' },
    { rating: 4, comment: 'Well maintained and secure. Management is responsive. Recommended for girls.' },
    { rating: 5, comment: 'Premium quality living at affordable prices. Great food and excellent security.' },
  ];
  for (let i = 0; i < properties.length; i++) {
    for (let j = 0; j < 3; j++) {
      await Review.create({
        propertyId: properties[i]._id,
        studentId: students[(i * 3 + j) % students.length]._id,
        rating: reviewData[(i + j) % reviewData.length].rating,
        comment: reviewData[(i + j) % reviewData.length].comment,
        createdAt: new Date(Date.now() - (j * 20 + i * 5) * 24 * 60 * 60 * 1000),
      });
    }
  }
  console.log('⭐ Reviews seeded');

  // ── 9. Expenses ───────────────────────────────────────────────────────────────
  for (const property of properties) {
    for (let i = 0; i < EXPENSE_CATS.length; i++) {
      await Expense.create({
        propertyId: property._id,
        category: EXPENSE_CATS[i],
        amount: 2000 + Math.floor(Math.random() * 8000),
        date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
        notes: `Monthly ${EXPENSE_CATS[i].toLowerCase()} expense`,
      });
    }
  }
  console.log('💰 Expenses created');

  // ── 10. Notifications ─────────────────────────────────────────────────────────
  await Notification.insertMany([
    { userId: admin._id, type: 'SYSTEM', title: 'Welcome to NexStay', message: 'Admin panel is ready.', channel: 'IN_APP', isRead: false },
    { userId: owners[0]._id, type: 'BOOKING', title: 'New Booking Request', message: 'You have a new booking from Arjun Kumar.', channel: 'IN_APP', isRead: false },
    { userId: students[0]._id, type: 'RENT', title: 'Rent Due Reminder', message: 'Your rent of ₹7000 is due in 3 days.', channel: 'IN_APP', isRead: true },
  ]);
  console.log('🔔 Notifications created');

  console.log('\n✅ SEED COMPLETE!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CREDENTIALS (all passwords below):');
  console.log('  Super Admin  → admin@nexstay.in    / Admin@123');
  console.log('  PG Owner 1   → owner1@nexstay.in   / Owner@123');
  console.log('  PG Owner 2   → owner2@nexstay.in   / Owner@123');
  console.log('  PG Owner 3   → owner3@nexstay.in   / Owner@123');
  console.log('  Manager      → manager1@nexstay.in / Manager@123');
  console.log('  Students     → student1..15@nexstay.in / Student@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
