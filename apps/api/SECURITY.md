# NexStay — Multi-Tenancy Security Audit

**Audit Date:** June 2026  
**API Base URL:** `http://localhost:5000`  
**API Version:** v2.0.0

---

## Architecture

NexStay uses **JWT-based Role-Based Access Control (RBAC)** with **database-layer tenant isolation**:

- Every protected route passes through `protect` middleware (JWT verification)
- Role gating is enforced via `requireRoles(...roles)` middleware
- `HOSTEL_ADMIN` routes scope all DB queries to `{ tenantId: req.user.id }` — data from other owners is **structurally invisible**, not just hidden in the response

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | superadmin@nexstay.in | SuperAdmin@123 |
| HOSTEL_ADMIN (owner1) | owner1@nexstay.in | Owner@123 |
| HOSTEL_ADMIN (owner2) | owner2@nexstay.in | Owner@123 |
| GUEST (student1) | student1@nexstay.in | Student@123 |

---

## How to Run Tests

### Step 1: Get tokens

```bash
# Get owner2 token
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner2@nexstay.in","password":"Owner@123"}' | jq .data.accessToken

# Get guest token
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@nexstay.in","password":"Student@123"}' | jq .data.accessToken

# Get superadmin token
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@nexstay.in","password":"SuperAdmin@123"}' | jq .data.accessToken
```

### Step 2: Get owner1's property ID

```bash
# Login as owner1 and get their property ID
OWNER1_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner1@nexstay.in","password":"Owner@123"}' | jq -r .data.accessToken)

curl -s http://localhost:5000/api/hostel-admin/properties \
  -H "Authorization: Bearer $OWNER1_TOKEN" | jq '.[0]._id'
```

---

## Security Test Results

### Test 1 — Owner2 sees only their own properties
```bash
OWNER2_TOKEN=<owner2_token>
curl http://localhost:5000/api/hostel-admin/properties \
  -H "Authorization: Bearer $OWNER2_TOKEN"
```
**Expected:** Only owner2's property (Comfort Stay Hostel, Bangalore) — owner1's 2 Pune properties absent  
**Mechanism:** Controller queries `Property.find({ tenantId: req.user.id })`  
**Result:** ✅ PASS — Data Isolation (DB layer)

---

### Test 2 — Owner2 cannot access owner1's students by propertyId
```bash
OWNER2_TOKEN=<owner2_token>
OWNER1_PROP_ID=<owner1_property_id>
curl "http://localhost:5000/api/hostel-admin/erp/students?propertyId=$OWNER1_PROP_ID" \
  -H "Authorization: Bearer $OWNER2_TOKEN"
```
**Expected:** 404 "Property not found" (tenantId mismatch — `Property.findOne({_id, tenantId: owner2})` fails)  
**Mechanism:** Controller validates `Property.findOne({ _id: propertyId, tenantId: req.user.id })` first  
**Result:** ✅ PASS — Data Isolation (DB layer, 404 guard)

---

### Test 3 — Owner2 cannot access owner1's student by ID
```bash
OWNER2_TOKEN=<owner2_token>
OWNER1_STUDENT_ID=<owner1_student_id>
curl "http://localhost:5000/api/hostel-admin/erp/students/$OWNER1_STUDENT_ID" \
  -H "Authorization: Bearer $OWNER2_TOKEN"
```
**Expected:** 404 "Student not found" — `HostelStudent.findOne({ _id, tenantId: owner2 })` returns null  
**Mechanism:** All student lookups include `tenantId: req.user.id` in the query  
**Result:** ✅ PASS — Data Isolation (DB layer, 404 guard)

---

### Test 4 — Owner2 cannot access owner1's rent records
```bash
OWNER2_TOKEN=<owner2_token>
OWNER1_PROP_ID=<owner1_property_id>
curl "http://localhost:5000/api/hostel-admin/erp/rent/records?propertyId=$OWNER1_PROP_ID" \
  -H "Authorization: Bearer $OWNER2_TOKEN"
```
**Expected:** Empty array `{ data: [], total: 0 }` — records exist but filtered out by `{ tenantId: owner2_id }`  
**Mechanism:** `RentRecord.find({ tenantId: req.user.id, propertyId: ... })` returns nothing for cross-tenant queries  
**Result:** ✅ PASS — Data Isolation (DB layer)

---

### Test 5 — Guest cannot access admin properties endpoint
```bash
GUEST_TOKEN=<guest_token>
curl http://localhost:5000/api/hostel-admin/properties \
  -H "Authorization: Bearer $GUEST_TOKEN"
```
**Expected:** `HTTP 403 — {"success":false,"message":"Insufficient permissions"}`  
**Mechanism:** `requireRoles('HOSTEL_ADMIN')` — GUEST role not in allowed list  
**Result:** ✅ PASS — HTTP 403 Forbidden

---

### Test 6 — Guest cannot access Super Admin dashboard
```bash
GUEST_TOKEN=<guest_token>
curl http://localhost:5000/api/superadmin/dashboard \
  -H "Authorization: Bearer $GUEST_TOKEN"
```
**Expected:** `HTTP 403 — {"success":false,"message":"Insufficient permissions"}`  
**Mechanism:** `requireRoles('SUPER_ADMIN')` — GUEST role not in allowed list  
**Result:** ✅ PASS — HTTP 403 Forbidden

---

### Test 7 — Owner cannot access Super Admin dashboard
```bash
OWNER2_TOKEN=<owner2_token>
curl http://localhost:5000/api/superadmin/dashboard \
  -H "Authorization: Bearer $OWNER2_TOKEN"
```
**Expected:** `HTTP 403 — {"success":false,"message":"Insufficient permissions"}`  
**Mechanism:** `requireRoles('SUPER_ADMIN')` — HOSTEL_ADMIN role not in allowed list  
**Result:** ✅ PASS — HTTP 403 Forbidden

---

### Test 8 — Super Admin sees ALL properties across all owners
```bash
SUPER_TOKEN=<superadmin_token>
curl http://localhost:5000/api/superadmin/properties \
  -H "Authorization: Bearer $SUPER_TOKEN"
```
**Expected:** All 8 seeded properties (6 APPROVED + 2 PENDING) from all 3 owners  
**Mechanism:** No `tenantId` filter — Super Admin has platform-wide read access  
**Result:** ✅ PASS — Cross-tenant visibility for Super Admin

---

### Test 9 — Super Admin blocked from HOSTEL_ADMIN ERP routes
```bash
SUPER_TOKEN=<superadmin_token>
curl http://localhost:5000/api/hostel-admin/erp/students \
  -H "Authorization: Bearer $SUPER_TOKEN"
```
**Expected:** `HTTP 403 — {"success":false,"message":"Insufficient permissions"}`  
**Mechanism:** `/api/hostel-admin/erp/*` uses `requireRoles('HOSTEL_ADMIN')` — SUPER_ADMIN not included  
**Design Intent:** Super Admin uses `/api/superadmin/*` endpoints; ERP shell is owner-only  
**Result:** ✅ PASS — HTTP 403 Forbidden

---

## Summary

| Test | Description | Expected | Mechanism | Status |
|------|-------------|----------|-----------|--------|
| 1 | owner2 → GET /api/hostel-admin/properties | Only owner2's props | DB tenantId scoping | ✅ PASS |
| 2 | owner2 → GET /erp/students?propertyId=owner1_prop | 404 Property not found | DB guard before query | ✅ PASS |
| 3 | owner2 → GET /erp/students/owner1_student_id | 404 Student not found | DB tenantId in lookup | ✅ PASS |
| 4 | owner2 → GET /erp/rent/records?propertyId=owner1_prop | Empty array | DB tenantId filter | ✅ PASS |
| 5 | guest → GET /api/hostel-admin/properties | 403 Forbidden | RBAC role check | ✅ PASS |
| 6 | guest → GET /api/superadmin/dashboard | 403 Forbidden | RBAC role check | ✅ PASS |
| 7 | owner → GET /api/superadmin/dashboard | 403 Forbidden | RBAC role check | ✅ PASS |
| 8 | superadmin → GET /api/superadmin/properties | All 8 properties | No tenantId filter | ✅ PASS |
| 9 | superadmin → GET /api/hostel-admin/erp/students | 403 Forbidden | RBAC role check | ✅ PASS |

**All 9 tests: PASS ✅**

---

## Notes

- Tests 1–4 use **DB-layer isolation** rather than HTTP 403. This is the intentional design: multi-tenancy is enforced at the data layer, not just the HTTP layer, providing defense-in-depth.
- Tests 5–7 and 9 use **HTTP 403** via the `requireRoles()` middleware, immediately blocking unauthorized access before any DB query executes.
- No raw MongoDB queries exist that do not include `tenantId` scoping on admin routes.
