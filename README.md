# NexStay — Smart PG & Student Housing Management Platform

NexStay is a production-grade, multi-tenant PG and student housing management platform. It delivers:
- A **public marketplace** for students to browse, filter, and book verified PG accommodations
- A **full ERP shell** for PG Owners to manage beds, tenants, rent, staff, inventory, expenses, and complaints
- A **Guest Portal** for students to track bookings, rent history, and raise complaints
- A **Super Admin Panel** for platform-wide oversight, property verification, and user management

---

## 📁 Repository Structure

```
NexStay/                        ← pnpm monorepo root
├── apps/
│   ├── api/                    ← Express + TypeScript + MongoDB REST API
│   │   └── SECURITY.md         ← Multi-tenancy security audit (9 tests)
│   └── web/                    ← React 18 + Vite + TailwindCSS SPA
├── packages/
│   └── shared/                 ← Shared TypeScript types & enums
├── package.json                ← Workspace scripts
└── pnpm-workspace.yaml
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, TailwindCSS |
| State / Data | TanStack Query v5, Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Notifications | In-app + dev email mock |

---

## ✅ Prerequisites

- **Node.js** v18 or higher
- **MongoDB** v6+ running locally (or a MongoDB Atlas connection string)
- **pnpm** v8+ (`npm install -g pnpm`)

---

## ⚙️ Environment Variables

### `apps/api/.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexstay
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
```

### `apps/web/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

A template `.env.example` is provided in each app directory.

---

## 🚀 Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/nexstay.git
cd nexstay

# 2. Install all workspace dependencies
pnpm install

# 3. Configure environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit both files and fill in your values

# 4. Seed the database (creates all test accounts, properties, rooms, beds, etc.)
pnpm --filter api db:seed

# 5. Start development servers (both web:5173 and api:5000 concurrently)
pnpm dev
```

**URLs:**
- Frontend: http://localhost:5173
- API: http://localhost:5000
- API Health: http://localhost:5000/api/health

> ⏱️ From fresh clone to running app: under 10 minutes.

---

## 🔑 Test Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Super Admin** | `superadmin@nexstay.in` | `SuperAdmin@123` | Platform-wide oversight, property verification |
| **Owner 1** | `owner1@nexstay.in` | `Owner@123` | 2 approved properties in Pune |
| **Owner 2** | `owner2@nexstay.in` | `Owner@123` | 1 approved property in Bangalore |
| **Owner 3** | `owner3@nexstay.in` | `Owner@123` | 2 approved properties in Indore |
| **Student 1** | `student1@nexstay.in` | `Student@123` | Active check-in at Sunrise Boys PG, Pune |

> All accounts are fully seeded. No manual setup required.

---

## 📋 Feature Checklist

### Public Marketplace
| Feature | Status |
|---------|--------|
| Property browse (no auth required) | ✅ Built |
| Hero search bar (city/area) | ✅ Built |
| Advanced filters (gender, price, amenities, room type) | ✅ Built |
| Sort options (rating, price, newest, distance) | ✅ Built |
| Map view (Leaflet) | ✅ Built |
| Property detail page | ✅ Built |
| Image gallery with lightbox | ✅ Built |
| Bed availability grid | ✅ Built |
| Review ratings display | ✅ Built |
| Sticky booking card (desktop) + bottom bar (mobile) | ✅ Built |

### Booking Flow (Guest)
| Feature | Status |
|---------|--------|
| 6-step booking wizard | ✅ Built |
| Room & bed selection | ✅ Built |
| Document upload step | ✅ Built |
| Mock payment gateway | ✅ Built |
| Booking confirmation | ✅ Built |
| Cancel booking (PENDING status) | ✅ Built |

### Guest Portal (`/account`)
| Feature | Status |
|---------|--------|
| My Bookings (with status badges) | ✅ Built |
| My Complaints (raise + track) | ✅ Built |
| Profile management | ✅ Built |
| Responsive bottom tab bar | ✅ Built |

### Hostel Admin ERP (`/admin`)
| Feature | Status |
|---------|--------|
| Dashboard (stats, charts, rent overdue) | ✅ Built |
| Property management (add/edit/pause) | ✅ Built |
| 6-step property creation form | ✅ Built |
| Marketplace booking management (accept/reject) | ✅ Built |
| ERP: Student/Tenant management | ✅ Built |
| ERP: Room & Bed management (floor plan) | ✅ Built |
| ERP: Check-In wizard (booking-linked + walk-in) | ✅ Built |
| ERP: Check-Out wizard (dues check + override) | ✅ Built |
| ERP: Rent & Fees (generate, pay, fine, reminders) | ✅ Built |
| ERP: Staff management | ✅ Built |
| ERP: Inventory management | ✅ Built |
| ERP: Expense tracking | ✅ Built |
| ERP: Complaints management (status workflow + timeline) | ✅ Built |
| ERP: Reports (revenue, occupancy, expense breakdown) | ✅ Built |
| Responsive sidebar (icon-only at 768px, drawer at 375px) | ✅ Built |

### Super Admin Panel (`/superadmin`)
| Feature | Status |
|---------|--------|
| Platform dashboard (aggregate KPIs + charts) | ✅ Built |
| Property verification (approve/reject with reason) | ✅ Built |
| Owner verification (KYC approval workflow) | ✅ Built |
| Guest management (search, suspend, reactivate) | ✅ Built |
| Owner management (search, suspend, reactivate) | ✅ Built |
| Platform bookings overview | ✅ Built |
| Platform revenue reports | ✅ Built |

### Infrastructure
| Feature | Status |
|---------|--------|
| JWT auth (access + refresh tokens) | ✅ Built |
| RBAC (role-based access control) | ✅ Built |
| Multi-tenancy (DB-layer tenant isolation) | ✅ Built |
| In-app notifications | ✅ Built |
| Dev email mock (viewable at /admin/dev/emails) | ✅ Built |
| Skeleton loaders on all data-heavy pages | ✅ Built |
| Designed empty states across all shells | ✅ Built |
| Error states with retry buttons | ✅ Built |
| Responsive design (375px–1440px) | ✅ Built |
| Real payment gateway (Razorpay) | 🔜 Coming Soon |
| WhatsApp / SMS notifications | 🔜 Coming Soon |
| Real image upload (Cloudinary) | 🔜 Coming Soon |

---

## 🔜 Coming Soon (Next Version)

- **Real payment gateway** — Razorpay integration with payment verification webhooks
- **WhatsApp and SMS notifications** — Twilio/MSG91 for rent reminders and booking alerts
- **Visitor management module** — Gate entry log, QR code visitor passes
- **Staff attendance and shift tracking** — Biometric-ready shift management
- **Platform subscription/billing (SaaS plans)** — Free / Pro / Enterprise tiers per owner
- **Commission management for Super Admin** — Platform fee deduction and settlement tracking
- **CMS** — Blogs, FAQs, Terms & Privacy Policy management
- **Mobile app (React Native)** — Cross-platform iOS and Android app

---

## 🔒 Security

See [`apps/api/SECURITY.md`](apps/api/SECURITY.md) for the complete multi-tenancy security audit with 9 test cases covering:
- DB-layer tenant isolation (owner data never crosses tenantId boundaries)
- Role-based HTTP 403 guards for cross-role access attempts
- Super Admin platform isolation from owner ERP routes

**All 9 security tests: PASS ✅**
