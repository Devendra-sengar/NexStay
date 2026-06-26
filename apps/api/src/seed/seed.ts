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
import { HostelStudent } from '../models/HostelStudent.model';
import { RentRecord } from '../models/RentRecord.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { Expense } from '../models/Expense.model';
import { Complaint } from '../models/Complaint.model';
import { Notification } from '../models/Notification.model';
import { Review } from '../models/Review.model';

const hash = (p: string) => bcrypt.hash(p, 12);

const PG_DATA = [
  { name: 'Sunrise Boys PG', address: '14, Koregaon Park', locality: 'Koregaon Park', city: 'Pune', state: 'Maharashtra', pincode: '411001', amenities: ['WIFI', 'FOOD', 'LAUNDRY', 'CCTV', 'PARKING'], gender: 'BOYS', rentStartingFrom: 7000, rating: 4.5, latitude: 18.5362, longitude: 73.8939 },
  { name: 'Green Valley Residency', address: '7, Baner Road', locality: 'Baner', city: 'Pune', state: 'Maharashtra', pincode: '411045', amenities: ['WIFI', 'AC', 'CCTV', 'WATER'], gender: 'CO_ED', rentStartingFrom: 8500, rating: 4.1, latitude: 18.5590, longitude: 73.7868 },
  { name: 'Comfort Stay Hostel', address: '22, Koramangala', locality: 'Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034', amenities: ['WIFI', 'FOOD', 'LAUNDRY', 'CCTV'], gender: 'GIRLS', rentStartingFrom: 9000, rating: 4.7, latitude: 12.9352, longitude: 77.6245 },
  { name: 'Namma PG', address: '5, HSR Layout', locality: 'HSR Layout', city: 'Bangalore', state: 'Karnataka', pincode: '560102', amenities: ['WIFI', 'LAUNDRY', 'WATER', 'POWER_BACKUP'], gender: 'BOYS', rentStartingFrom: 6500, rating: 3.9, latitude: 12.9116, longitude: 77.6389 },
  { name: 'Central PG House', address: '3, Vijay Nagar', locality: 'Vijay Nagar', city: 'Indore', state: 'Madhya Pradesh', pincode: '452010', amenities: ['WIFI', 'FOOD', 'CCTV', 'PARKING'], gender: 'CO_ED', rentStartingFrom: 5500, rating: 4.3, latitude: 22.7534, longitude: 75.8839 },
  { name: 'Shree Sai PG', address: '11, Napier Town', locality: 'Napier Town', city: 'Jabalpur', state: 'Madhya Pradesh', pincode: '482001', amenities: ['WIFI', 'FOOD', 'LAUNDRY'], gender: 'GIRLS', rentStartingFrom: 4500, rating: 4.0, latitude: 23.1815, longitude: 79.9864 },
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
    Room.deleteMany({}), Bed.deleteMany({}),
    Booking.deleteMany({}), HostelStudent.deleteMany({}), RentRecord.deleteMany({}),
    StudentProfile.deleteMany({}),
    Expense.deleteMany({}), Complaint.deleteMany({}), Notification.deleteMany({}),
    Review.deleteMany({}),
  ]);
  console.log('🗑️  Cleared all collections');

  // ── 1. Super Admin ──────────────────────────────────────────────────────────
  const adminPw = await hash('SuperAdmin@123');
  const admin = await User.create({
    name: 'Rahul Sharma', email: 'superadmin@nexstay.in', phone: '9000000001',
    passwordHash: adminPw, role: 'SUPER_ADMIN', status: 'ACTIVE', isVerified: true,
  });
  console.log('👤 Super Admin created');

  // ── 2. PG Owners ────────────────────────────────────────────────────────────
  const ownerPw = await hash('Owner@123');
  const owners = await User.insertMany([
    { name: 'Vikram Patel', email: 'owner1@nexstay.in', phone: '9000000002', passwordHash: ownerPw, role: 'HOSTEL_ADMIN', status: 'ACTIVE', isVerified: true, ownerVerificationStatus: 'APPROVED' },
    { name: 'Sunita Desai', email: 'owner2@nexstay.in', phone: '9000000003', passwordHash: ownerPw, role: 'HOSTEL_ADMIN', status: 'ACTIVE', isVerified: true, ownerVerificationStatus: 'APPROVED' },
    { name: 'Ramesh Gupta', email: 'owner3@nexstay.in', phone: '9000000004', passwordHash: ownerPw, role: 'HOSTEL_ADMIN', status: 'ACTIVE', isVerified: true, ownerVerificationStatus: 'APPROVED' },
    { name: 'Pending Owner', email: 'owner_pending@nexstay.in', phone: '9000000009', passwordHash: ownerPw, role: 'HOSTEL_ADMIN', status: 'ACTIVE', isVerified: true, ownerVerificationStatus: 'PENDING', businessName: 'NexStay Residences Ltd', gstNumber: '27AAAAA1111A1Z1' },
  ]);
  console.log('👤 4 PG Owners created (including 1 PENDING verification)');
 
  // ── 3. Property Manager ─────────────────────────────────────────────────────
  const managerPw = await hash('Manager@123');
  const manager = await User.create({
    name: 'Priya Singh', email: 'manager1@nexstay.in', phone: '9000000005',
    passwordHash: managerPw, role: 'HOSTEL_ADMIN', status: 'ACTIVE',
  });
  console.log('👤 Property Manager created');
 
  // ── 4. Properties ────────────────────────────────────────────────────────────
  const propertiesToInsert = PG_DATA.map((pg, i) => ({
    ...pg,
    tenantId: owners[Math.floor(i / 2)]._id,
    description: `${pg.name} is a well-maintained PG in ${pg.city}, offering modern amenities including high-speed WiFi, hygienic meals, and 24/7 security. Ideal for students and working professionals.`,
    images: [],
    isActive: true,
    isPaused: false,
    verificationStatus: 'APPROVED',
  }));

  // Add pending properties for admin verification manual testing
  propertiesToInsert.push({
    name: 'Pending Grand Mansion',
    address: '42, Viman Nagar',
    locality: 'Viman Nagar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411014',
    amenities: ['WIFI', 'AC', 'CCTV'],
    gender: 'CO_ED',
    rentStartingFrom: 12000,
    rating: 0,
    tenantId: owners[0]._id,
    description: 'A luxurious mansion pending approval. Contains premium single and double rooms.',
    images: [],
    isActive: true,
    isPaused: false,
    verificationStatus: 'PENDING',
    rejectionReason: '',
  } as any);

  propertiesToInsert.push({
    name: 'Pending Cozy Nest',
    address: '10, Koramangala 4th Block',
    locality: 'Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
    amenities: ['WIFI', 'FOOD'],
    gender: 'GIRLS',
    rentStartingFrom: 9500,
    rating: 0,
    tenantId: owners[1]._id,
    description: 'Cozy girls PG pending admin review.',
    images: [],
    isActive: true,
    isPaused: false,
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
      { tenantId: (property as any).tenantId, propertyId: property._id, name: 'Ground Floor', order: 0 },
      { tenantId: (property as any).tenantId, propertyId: property._id, name: 'First Floor', order: 1 },
    ]);

    for (let fi = 0; fi < floors.length; fi++) {
      const floor = floors[fi];
      const roomType = ROOM_TYPES[(fi) % ROOM_TYPES.length];
      const capacity = roomType === 'SINGLE' ? 1 : roomType === 'DOUBLE' ? 2 : roomType === 'TRIPLE' ? 3 : 4;

      for (let ri = 1; ri <= 3; ri++) {
        const room = await Room.create({
          tenantId: (property as any).tenantId,
          propertyId: property._id,
          floorId: floor._id,
          roomNumber: `${fi + 1}0${ri}`,
          capacity,
          roomType,
          status: 'AVAILABLE',
          pricePerBed: (property as any).rentStartingFrom || 6000,
        });
        allRooms.push(room);

        for (let bi = 1; bi <= capacity; bi++) {
          const bedStatus = bi === 1 ? 'AVAILABLE' : BED_STATUSES[Math.floor(Math.random() * BED_STATUSES.length)];
          const bed = await Bed.create({
            tenantId: (property as any).tenantId,
            propertyId: property._id,
            roomId: room._id,
            bedNumber: `B${bi}`,
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
      passwordHash: studentPw, role: 'GUEST', status: 'ACTIVE',
    }))
  );
  console.log('👨‍🎓 15 Students created');

  // ── 7. Student Profiles (skip Bookings/RentRecords — schema mismatch, not needed for Phase 1) ──
  for (let i = 0; i < students.length; i++) {
    await StudentProfile.create({
      userId: students[i]._id,
      guardianName: `Guardian of ${students[i].name}`,
      guardianPhone: `91${String(i).padStart(8, '1')}`,
      documents: { aadhaar: `ADH${i + 100}`, studentId: `STU${i + 200}`, photo: '' },
    });
  }
  console.log('📋 Student Profiles created (Bookings/RentRecords skipped for Phase 1)');

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
    const property = properties[i % properties.length];
    const student = students[i % students.length];
    await Complaint.create({
      tenantId: (property as any).tenantId,
      guestId: student._id,
      propertyId: property._id,
      ...complaintData[i],
      status: COMPLAINT_STATUSES[i % COMPLAINT_STATUSES.length],
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
        guestId: students[(i * 3 + j) % students.length]._id,
        rating: reviewData[(i + j) % reviewData.length].rating,
        comment: reviewData[(i + j) % reviewData.length].comment,
        createdAt: new Date(Date.now() - (j * 20 + i * 5) * 24 * 60 * 60 * 1000),
      });
    }
  }
  console.log('⭐ Reviews seeded');

  // ── 9. Expenses ───────────────────────────────────────────────────────────────
  const EXPENSE_CATS_VALID = ['ELECTRICITY', 'WATER', 'STAFF_SALARY', 'MAINTENANCE', 'INTERNET'] as const;
  for (const property of properties.filter((p: any) => p.verificationStatus === 'APPROVED')) {
    for (let i = 0; i < EXPENSE_CATS_VALID.length; i++) {
      await Expense.create({
        tenantId: (property as any).tenantId,
        propertyId: property._id,
        category: EXPENSE_CATS_VALID[i],
        amount: 2000 + Math.floor(Math.random() * 8000),
        date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
        description: `Monthly ${EXPENSE_CATS_VALID[i].toLowerCase()} expense`,
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
  console.log('  CREDENTIALS:');
  console.log('  Super Admin  → superadmin@nexstay.in / SuperAdmin@123');
  console.log('  PG Owner 1   → owner1@nexstay.in    / Owner@123  (2 props, Pune)');
  console.log('  PG Owner 2   → owner2@nexstay.in    / Owner@123  (1 prop, Bangalore)');
  console.log('  PG Owner 3   → owner3@nexstay.in    / Owner@123  (2 props, Indore)');
  console.log('  Manager      → manager1@nexstay.in  / Manager@123');
  console.log('  Student 1    → student1@nexstay.in  / Student@123 (CHECKED_IN at Sunrise Boys PG)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');


  // ── PHASE 4: Bookings, HostelStudents, RentRecords ───────────────────────────
  // Pick first approved property owned by owner1
  const p4Prop = properties.find((p: any) => p.tenantId.toString() === owners[0]._id.toString() && p.verificationStatus === 'APPROVED')!;
  const p4Beds = allBeds.filter((b: any) => b.propertyId.toString() === p4Prop._id.toString());
  const p4AvailBeds = p4Beds.filter((b: any) => b.status === 'AVAILABLE');

  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const now = new Date();

  // --- 2 CONFIRMED bookings (ready for check-in)
  const confirmedBookingData = [
    { guestIdx: 0, bedIdx: 0 },
    { guestIdx: 1, bedIdx: 1 },
  ];
  const confirmedBookings: any[] = [];
  for (const { guestIdx, bedIdx } of confirmedBookingData) {
    if (!p4AvailBeds[bedIdx]) continue;
    const bed = p4AvailBeds[bedIdx] as any;
    const room = allRooms.find((r: any) => r._id.toString() === bed.roomId.toString()) as any;
    const b = await Booking.create({
      guestId: students[guestIdx]._id, tenantId: owners[0]._id,
      propertyId: p4Prop._id, roomId: room._id, bedId: bed._id,
      status: 'CONFIRMED', monthlyRent: (p4Prop as any).rentStartingFrom || 7000,
      aadhaarUrl: 'https://placeholder.co/300x200?text=Aadhaar',
      studentIdUrl: 'https://placeholder.co/300x200?text=StudentID',
      photoUrl: 'https://placeholder.co/300x200?text=Photo',
      documentsVerified: false, advancePaid: 2000,
    });
    // Mark bed RESERVED
    await Bed.findByIdAndUpdate(bed._id, { status: 'RESERVED', currentBookingId: b._id });
    confirmedBookings.push(b);
  }
  console.log('📋 2 CONFIRMED bookings created (for check-in testing)');

  // --- 3 CHECKED_IN students (student1=Arjun Kumar at idx 0, student2=Sneha Joshi at idx 1)
  const checkinData = [
    { guestIdx: 0, bedIdx: 2, monthsBack: 3, rentStatus: ['PAID','PAID','UNPAID'] },
    { guestIdx: 1, bedIdx: 3, monthsBack: 2, rentStatus: ['PAID','PARTIAL'] },
    { guestIdx: 4, bedIdx: 4, monthsBack: 1, rentStatus: ['UNPAID'] },
  ];
  for (const { guestIdx, bedIdx, monthsBack, rentStatus } of checkinData) {
    if (!p4AvailBeds[bedIdx]) continue;
    const bed = p4AvailBeds[bedIdx] as any;
    const room = allRooms.find((r: any) => r._id.toString() === bed.roomId.toString()) as any;
    const moveIn = new Date(now);
    moveIn.setMonth(moveIn.getMonth() - monthsBack);

    const booking = await Booking.create({
      guestId: students[guestIdx]._id, tenantId: owners[0]._id,
      propertyId: p4Prop._id, roomId: room._id, bedId: bed._id,
      status: 'CHECKED_IN', checkInDate: moveIn,
      monthlyRent: (p4Prop as any).rentStartingFrom || 7000,
      aadhaarUrl: 'https://placeholder.co/300x200?text=Aadhaar',
      studentIdUrl: 'https://placeholder.co/300x200?text=StudentID',
      photoUrl: 'https://placeholder.co/300x200?text=Photo',
      documentsVerified: true, advancePaid: 5000,
    });

    const student = await HostelStudent.create({
      tenantId: owners[0]._id, propertyId: p4Prop._id,
      bookingId: booking._id, guestId: students[guestIdx]._id, bedId: bed._id,
      name: students[guestIdx].name, phone: students[guestIdx].phone, email: students[guestIdx].email,
      college: 'NexStay University', guardianName: `Guardian of ${students[guestIdx].name}`, guardianPhone: '9000099999',
      aadhaarUrl: 'https://placeholder.co/300x200?text=Aadhaar',
      studentIdUrl: 'https://placeholder.co/300x200?text=StudentID',
      photoUrl: 'https://placeholder.co/300x200?text=Photo',
      admissionDate: moveIn,
      noticePeriodDate: new Date(moveIn.getTime() + 30 * 24 * 60 * 60 * 1000),
      monthlyRent: (p4Prop as any).rentStartingFrom || 7000,
      securityDeposit: 5000, status: 'ACTIVE',
    });

    await Bed.findByIdAndUpdate(bed._id, { status: 'OCCUPIED', currentBookingId: booking._id });
    await Room.findByIdAndUpdate(room._id, { status: 'FULL' });

    // Rent records
    for (let m = 0; m < rentStatus.length; m++) {
      const rDate = new Date(moveIn);
      rDate.setMonth(rDate.getMonth() + m);
      const st = rentStatus[m];
      const amount = (p4Prop as any).rentStartingFrom || 7000;
      const paid = st === 'PAID' ? amount : st === 'PARTIAL' ? Math.round(amount * 0.5) : 0;
      await RentRecord.create({
        tenantId: owners[0]._id, propertyId: p4Prop._id, roomId: room._id,
        hostelStudentId: student._id, bookingId: booking._id,
        month: ym(rDate), amount, paidAmount: paid, fine: 0,
        dueDate: new Date(rDate.getFullYear(), rDate.getMonth() + 1, 5),
        status: st, paidAt: st === 'PAID' ? new Date(rDate.getFullYear(), rDate.getMonth() + 1, 3) : undefined,
      });
    }
  }
  console.log('👥 3 CHECKED_IN HostelStudents created with rent records');

  await mongoose.disconnect();
  process.exit(0);

}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
