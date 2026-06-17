// ─── Enums ────────────────────────────────────────────────────────────────────

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PG_OWNER = 'PG_OWNER',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  STUDENT = 'STUDENT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum RoomType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  TRIPLE = 'TRIPLE',
  FOUR_SHARING = 'FOUR_SHARING',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  FULL = 'FULL',
}

export enum BedStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
}

export enum RentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
}

export enum ExpenseCategory {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  STAFF_SALARY = 'STAFF_SALARY',
  MAINTENANCE = 'MAINTENANCE',
  MISC = 'MISC',
}

export enum ComplaintCategory {
  ELECTRICITY = 'ELECTRICITY',
  FOOD = 'FOOD',
  INTERNET = 'INTERNET',
  WATER = 'WATER',
  CLEANING = 'CLEANING',
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  isVerified: boolean;
  createdAt: string;
}

export interface IProperty {
  _id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  description: string;
  amenities: string[];
  images: string[];
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface IFloor {
  _id: string;
  propertyId: string;
  name: string;
}

export interface IRoom {
  _id: string;
  propertyId: string;
  floorId: string;
  roomNumber: string;
  capacity: number;
  roomType: RoomType;
  status: RoomStatus;
}

export interface IBed {
  _id: string;
  roomId: string;
  bedNumber: string;
  bedType: string;
  status: BedStatus;
}

export interface IBooking {
  _id: string;
  studentId: string;
  propertyId: string;
  roomId: string;
  bedId: string;
  status: BookingStatus;
  documents: string[];
  paymentId?: string;
  createdAt: string;
}

export interface IStudentProfile {
  _id: string;
  userId: string;
  guardianName: string;
  guardianPhone: string;
  documents: {
    aadhaar?: string;
    studentId?: string;
    photo?: string;
  };
  currentPropertyId?: string;
  currentRoomId?: string;
  currentBedId?: string;
}

export interface IRentRecord {
  _id: string;
  studentId: string;
  bookingId: string;
  amount: number;
  dueDate: string;
  status: RentStatus;
  paidAmount: number;
  paidAt?: string;
  receiptUrl?: string;
}

export interface IExpense {
  _id: string;
  propertyId: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
}

export interface IComplaint {
  _id: string;
  studentId: string;
  propertyId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  assignedTo?: string;
  createdAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  isRead: boolean;
  createdAt: string;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  isVerified: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}
