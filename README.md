# NexStay — Smart PG & Student Housing Management Platform

NexStay is a premium, next-generation PG and student housing management platform. It offers an end-to-end marketplace for students to find accommodation, a robust ERP shell for PG Owners & Managers to manage their daily operations (beds, billing, issues, tenants), and a secure administrative panel for Super Admin oversight and verification pipelines.

## 📁 Repository Architecture

The project is structured as a **pnpm Monorepo**:

```
NexStay/
├── apps/
│   ├── api/            # Node.js + Express + MongoDB REST API backend
│   └── web/            # React + Vite + TailwindCSS SPA frontend
├── packages/
│   └── shared/         # Shared TypeScript interfaces and utility types
├── package.json        # Workspace definition and run scripts
└── pnpm-workspace.yaml # Monorepo configuration
```

---

## 🛠️ Technology Stack

### Frontend (`apps/web`)
*   **Core**: React 18, Vite (for ultra-fast bundling)
*   **Routing**: React Router v6
*   **State & Fetching**: Axios, React Context API
*   **Design & Theme**: TailwindCSS, Vanilla CSS, Lucide React (icons), Recharts (data visualization)
*   **User Feedback**: React Hot Toast

### Backend (`apps/api`)
*   **Runtime**: Node.js
*   **Framework**: Express.js with TypeScript
*   **Database**: MongoDB (object modeling via Mongoose)
*   **Security**: JSON Web Tokens (JWT) for session auth, bcryptjs for password hashing

---

## 🚀 Developer Quickstart

Follow these steps to run the complete stack locally:

### 1. Prerequisite Installations
*   Ensure **Node.js (v18+)** and **pnpm** are installed on your machine.
*   Ensure a local instance of **MongoDB** is running on your system (default: `mongodb://localhost:27017/nexstay`).

### 2. Install Dependencies
Run the install command from the monorepo root:
```bash
pnpm install
```

### 3. Setup Environment Variables

Create a `.env` file in **`apps/api/`**:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexstay
JWT_SECRET=super_secret_jwt_key_nexstay
```

Create a `.env` file in **`apps/web/`**:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed the Database
Seed the database with pre-configured properties, room layouts, mock invoices, complaints, and roles:
```bash
pnpm --filter api db:seed
```

### 5. Start Development Servers
Spin up both the Express backend and Vite frontend concurrently:
```bash
pnpm dev
```
*   **Frontend Web App**: http://localhost:5173
*   **Backend API Service**: http://localhost:5000

---

## 🔑 Seeded Test Credentials

Use these seeded credentials to test user experiences across all roles. All accounts use standard passwords:

| Role | Email Address | Plaintext Password | Description / Action Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@nexstay.in` | `Admin@123` | Can approve new owners/properties, suspend users, and view platform metrics. |
| **PG Owner (Approved)** | `owner1@nexstay.in` | `Owner@123` | Fully verified. Accesses billing, property forms, reports, and tenant onboarding. |
| **PG Owner (Pending)** | `owner_pending@nexstay.in` | `Owner@123` | Restricted access. Needs approval from the Admin panel before listings go live. |
| **Property Manager** | `manager1@nexstay.in` | `Manager@123` | Staff access. Onboards tenants, manages rent, handles complaints. Billing restricted. |
| **Student Tenant** | `student1@nexstay.in` | `Student@123` | Browses properties, books rooms, views rent invoices, registers support complaints. |
| **Student Tenant** | `student2@nexstay.in` | `Student@123` | Standard student account. |

---

## 📋 Implemented Features Checklist

### Phase 1 & 2: Platform Foundation & Marketplace
- [x] Complete Monorepo Workspace configuration with TypeScript.
- [x] Student Marketplace interface showing verified PG accommodations.
- [x] Advanced filters (sharing type, pricing range, city, amenities, gender).
- [x] Detailed property page showing rooms, occupancy statuses, pricing, and maps.

### Phase 3 & 4: Room Booking & Owner ERP Shell
- [x] Student booking flow with instant slot reservation and booking status tracking.
- [x] Full PG Owner dashboard with visual statistics (occupancy, rent, active complaints).
- [x] Interactive property builder (add/edit floor maps, rooms, custom bed capacities).

### Phase 5 & 6: Tenant Operations & Automated Billing
- [x] Owner check-in workflow matching approved bookings to specific floor beds.
- [x] Check-out wizard releasing occupied beds and closing active contracts.
- [x] Automatic rent invoice generation on the 1st of every month.
- [x] Tenant payment UI showing pending dues, rent histories, and partial transaction support.

### Phase 7 & 8: Helpdesk & Super Admin Panel
- [x] Student complaint registration with category tags (food, water, Wi-Fi, etc.).
- [x] Owner/Manager ticketing workflow with real-time status transitions.
- [x] Super Admin Panel for user suspension, business document reviews, and listings approval.
- [x] Live admin oversight hook sending immediate email/in-app alert triggers on audit approvals.

### Phase 9: Quality Assurance & Responsiveness
- [x] Visual consistency audit aligning button controls, typography, and premium Indigo themes.
- [x] Safe loader skeletons (`Skeleton`) and empty state placeholders (`EmptyState`) across all dashboards.
- [x] Responsive layout styling ensuring smooth collapsing navigation drawers for tablet/mobile viewports.
