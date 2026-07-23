# PHASE 1 — ADMIN CORE BASELINE

**Date:** 2026-07-23
**Mode:** READ-ONLY (No code was modified)
**Source:** Deep inspection of all pages, API routes, repositories, permissions, and navigation

---

## STEP 1 — ADMIN CORE FEATURE INVENTORY

### 1.1 Dashboard

| Aspect | Status | Details |
|--------|--------|---------|
| **Existing Pages** | ✅ | `/dashboard` → `admin-dashboard.tsx` (125 lines) |
| **Existing Components** | ✅ | `AdminDashboard` — greeting + date + module grid from `getDashboardModules(can)` |
| **Existing API Routes** | 🟡 | Calls NestJS `/profile` for sidebar. No admin stats endpoint exists. |
| **Existing Firestore Repositories** | ❌ | No admin dashboard repository |
| **Existing Firestore Collections** | ❌ | No analytics/aggregations collection used |
| **Existing Permissions** | ✅ | Uses `getDashboardModules(can)` — permission-filtered module cards |
| **Existing Navigation Entries** | ✅ | Nav: `home` (id), sidebar: true, dashboard: false |

**Dependencies:** Depends on `/profile` route (NestJS proxy) + `nav-registry.ts`

---

### 1.2 Users (Admin Users Management)

| Aspect | Status | Details |
|--------|--------|---------|
| **Existing Pages** | ❌ | No `/dashboard/admin/users` page. Route defined in old nav-registry? NOT in current nav-registry. |
| **Existing Components** | ❌ | None |
| **Existing API Routes** | ❌ | No admin/users endpoints exist |
| **Existing Firestore Repositories** | ✅ | `UserRepository` in `@el-bannawy/lib` with full CRUD |
| **Existing Firestore Collections** | ✅ | `users`, `loginEvents` |
| **Existing Permissions** | ✅ | `PERMISSIONS.USERS_VIEW`, `.USERS_CREATE`, `.USERS_EDIT`, `.USERS_DELETE` defined in shared package |
| **Existing Navigation Entries** | ❌ | Not in current nav-registry |

**Dependencies:** UserRepository, permissions defined but no frontend page or API routes

---

### 1.3 Teachers

| Aspect | Status | Details |
|--------|--------|---------|
| **Existing Pages** | ✅ | `/dashboard/teachers` — 1283 lines, full CRUD |
| **Existing Components** | ✅ | `TeacherProfileTab`, `TeacherGradesTab`, `TeacherPermissionsTab`, `CreateTeacherDialog`, `GradeSelector`, `GradeSummaryCard` |
| **Existing API Routes** | ✅ | 7 routes: list, get, create, update, status, grades, permissions (all Firestore) |
| **Existing Firestore Repositories** | ✅ | `UserRepository`, `ITutorRepository` interface defined |
| **Existing Firestore Collections** | ✅ | `users`, `teacherAssignments`, `userPermissions` |
| **Existing Permissions** | ✅ | `PERMISSIONS.USERS_VIEW`, `.USERS_CREATE`, `.USERS_EDIT`, `.USERS_DELETE` |
| **Existing Navigation Entries** | ✅ | Nav: `teachers` (id), route: `/dashboard/teachers`, permission: `USERS_VIEW` |

**Dependencies:** UserRepository, Admin SDK, `admin/stages` route

---

### 1.4 Roles & Permissions (RBAC)

| Aspect | Status | Details |
|--------|--------|---------|
| **Existing Pages** | 🟡 | Permission management embedded in teacher detail page (permissions tab) |
| **Existing Components** | 🟡 | Permission toggle buttons (grant/revoke) in teacher page |
| **Existing API Routes** | 🟡 | `/admin/teachers/:id/permissions` GET, `/grant` POST, `/revoke` POST |
| **Existing Firestore Repositories** | ❌ | No PermissionRepository. Uses raw `getAdminDb().collection('userPermissions')` |
| **Existing Firestore Collections** | ✅ | `userPermissions` collection |
| **Existing Permissions** | ✅ | Full RBAC in `@el-bannawy/shared`: 40+ permissions, 4 roles (ADMINISTRATOR, TEACHER, STAFF, STUDENT) |
| **Existing Navigation Entries** | ❌ | No roles management page in nav-registry |

**Dependencies:** `packages/shared/src/permissions/`

---

### 1.5 Academic Years

| Aspect | Status | Details |
|--------|--------|---------|
| **Existing Pages** | ✅ | Inside `/dashboard/admin/settings` — CRUD with dialogs |
| **Existing Components** | ✅ | Create/Edit Year Dialog, Year list with term nesting |
| **Existing API Routes** | ✅ | 3 routes: list+create `/admin/academic-years`, update+delete `/admin/academic-years/:id` |
| **Existing Firestore Repositories** | 🟡 | `ICurriculumRepository` interface has `createAcademicYear`, `listAcademicYears`, etc. But API routes use raw `getAdminDb()` |
| **Existing Firestore Collections** | ✅ | `academicYears` collection |
| **Existing Permissions** | ✅ | `PERMISSIONS.SETTINGS_MANAGE` |
| **Existing Navigation Entries** | ✅ | Nav: `settings` (id), route: `/dashboard/admin/settings`, permission: `SETTINGS_MANAGE` |

**Dependencies:** Admin SDK, `academicYears` collection

---

### 1.6 Academic Terms

| Aspect | Status | Details |
|--------|--------|---------|
| **Existing Pages** | ✅ | Inside `/dashboard/admin/settings` — CRUD with dialogs |
| **Existing Components** | ✅ | Create/Edit Term Dialog |
| **Existing API Routes** | ✅ | 3 routes: create term under year, update term, delete term |
| **Existing Firestore Repositories** | 🟡 | Interface defined but API routes use raw `getAdminDb()` |
| **Existing Firestore Collections** | ✅ | `academicTerms` collection |
| **Existing Permissions** | ✅ | `PERMISSIONS.SETTINGS_MANAGE` |
| **Existing Navigation Entries** | ✅ | Same as Academic Years (settings page) |

**Dependencies:** Admin SDK, `academicTerms` collection, academic year parent

---

### 1.7 Stages

| Aspect | Status | Details |
|--------|--------|---------|
| **Existing Pages** | ❌ | No dedicated management page |
| **Existing Components** | ❌ | None for management |
| **Existing API Routes** | ✅ | `GET /admin/stages` — returns stages list from `CurriculumService` |
| **Existing Firestore Repositories** | ✅ | `CurriculumRepository` has `createStage`, `listStages`, `getStageById`, `updateStage` |
| **Existing Firestore Collections** | ✅ | `stages` collection (in repository layer) |
| **Existing Permissions** | ❌ | No dedicated permission for stage management |
| **Existing Navigation Entries** | ❌ | Not in nav-registry |

**Dependencies:** `CurriculumService`, `stages` collection, educational system parent

---

### 1.8 Grades

| Aspect | Status | Details |
|--------|--------|---------|
| **Existing Pages** | ❌ | No dedicated management page |
| **Existing Components** | ❌ | None for management |
| **Existing API Routes** | ❌ | No grades CRUD endpoints exist |
| **Existing Firestore Repositories** | ✅ | `CurriculumRepository` has `createGrade`, `listGrades`, `getGradeById`, `updateGrade` |
| **Existing Firestore Collections** | ✅ | `grades` collection (in repository layer) |
| **Existing Permissions** | ❌ | No dedicated permission for grade management |
| **Existing Navigation Entries** | ❌ | Not in nav-registry |

**Dependencies:** `CurriculumService`, `grades` collection, stage parent, educational system

---

### 1.9 Educational Systems

| Aspect | Status | Details |
|--------|--------|---------|
| **Existing Pages** | ❌ | No management page |
| **Existing Components** | ❌ | None |
| **Existing API Routes** | ❌ | No CRUD endpoints |
| **Existing Firestore Repositories** | ✅ | `CurriculumRepository` has `createEducationalSystem`, `listEducationalSystems`, etc. |
| **Existing Firestore Collections** | ✅ | `educationalSystems` collection |
| **Existing Permissions** | ❌ | No dedicated permission |
| **Existing Navigation Entries** | ❌ | Not in nav-registry |

---

### 1.10 Platform Settings

| Aspect | Status | Details |
|--------|--------|---------|
| **Existing Pages** | ✅ | `/dashboard/admin/settings` — settings card + academic calendar management |
| **Existing Components** | 🟡 | Settings card: term management mode (AUTO/MANUAL toggle), active context display |
| **Existing API Routes** | ✅ | `GET/PATCH /admin/settings` — reads/writes `systemSettings/system-settings` |
| **Existing Firestore Repositories** | ❌ | Raw `getAdminDb()` access |
| **Existing Firestore Collections** | ✅ | `systemSettings` collection |
| **Existing Permissions** | ✅ | `PERMISSIONS.SETTINGS_MANAGE` |
| **Existing Navigation Entries** | ✅ | Nav: `settings` (id), route: `/dashboard/admin/settings`, permission: `SETTINGS_MANAGE` |

**Missing features:** maintenance mode toggle, registration toggle, feature flags, system-wide configuration

---

## STEP 2 — RUNTIME DEPENDENCY VERIFICATION

### Feature → API Route → Implementation → Status

| Page | API Endpoint Called | Route Exists? | Next.js Handler? | NestJS Proxy? | Firestore? |
|------|-------------------|---------------|------------------|---------------|------------|
| Dashboard | `GET /profile` | ✅ | ✅ `profile/route.ts` | No | ✅ `users` |
| Settings | `GET/PATCH /admin/settings` | ✅ | ✅ `admin/settings/route.ts` | No | ✅ `systemSettings` |
| Settings | `GET/POST /admin/academic-years` | ✅ | ✅ `admin/academic-years/route.ts` | No | ✅ `academicYears` |
| Settings | `PATCH/DELETE /admin/academic-years/:id` | ✅ | ✅ `admin/academic-years/[id]/route.ts` | No | ✅ `academicYears` |
| Settings | `POST /admin/academic-years/:id/terms` | ✅ | ✅ `admin/academic-years/[id]/terms/route.ts` | No | ✅ `academicTerms` |
| Settings | `PATCH/DELETE /admin/terms/:id` | ✅ | ✅ `admin/terms/[id]/route.ts` | No | ✅ `academicTerms` |
| Students | `GET /admin/students` | ✅ | ✅ `admin/students/route.ts` | No | ✅ `users` (via UserRepository) |
| Students | `GET /admin/students/:id` | ✅ | ✅ `admin/students/[id]/route.ts` | No | ✅ (via UserRepository) |
| Students | `PATCH /admin/students/:id` | ✅ | ✅ `admin/students/[id]/route.ts` | No | ✅ (via UserRepository) |
| Students | `PATCH /admin/students/:id/phone` | ✅ | ✅ `admin/students/[id]/phone/route.ts` | No | ✅ (via UserRepository) |
| Students | `POST /admin/students/:id/reset-password` | ✅ | ✅ `admin/students/[id]/reset-password/route.ts` | No | ✅ Firebase Auth |
| Students | `PATCH /admin/students/:id/status` | ✅ | ✅ `admin/students/[id]/status/route.ts` | No | ✅ (via UserRepository) |
| Students | `GET /admin/students/:id/progress` | ✅ | ✅ `admin/students/[id]/progress/route.ts` | No | ✅ `lesson_progress` |
| Students | `POST /admin/students/:id/reset-device` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Students | `POST /admin/students/:id/coins/add` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Students | `POST /admin/students/:id/coins/remove` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Students | `POST /admin/students/:id/xp/adjust` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Students | `GET /admin/students/:id/attendance` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Students | `GET /admin/students/:id/login-history` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Students | `GET /admin/students/:id/subscription` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Teachers | `GET /admin/teachers` | ✅ | ✅ `admin/teachers/route.ts` | No | ✅ (via UserRepository) |
| Teachers | `GET /admin/teachers/:id` | ✅ | ✅ `admin/teachers/[id]/route.ts` | No | ✅ (via UserRepository) |
| Teachers | `POST /admin/teachers` | ✅ | ✅ `admin/teachers/route.ts` | No | ✅ (via UserRepository) |
| Teachers | `PATCH /admin/teachers/:id` | ✅ | ✅ `admin/teachers/[id]/route.ts` | No | ✅ (via UserRepository) |
| Teachers | `PATCH /admin/teachers/:id/status` | ✅ | ✅ `admin/teachers/[id]/status/route.ts` | No | ✅ (via UserRepository) |
| Teachers | `POST /admin/teachers/:id/grades` | ✅ | ✅ `admin/teachers/[id]/grades/route.ts` | No | ✅ `teacherAssignments` |
| Teachers | `GET /admin/teachers/:id/permissions` | ✅ | ✅ `admin/teachers/[id]/permissions/route.ts` | No | ✅ `userPermissions` |
| Teachers | `POST .../permissions/grant` | ✅ | ✅ `admin/teachers/[id]/permissions/grant/route.ts` | No | ✅ `userPermissions` |
| Teachers | `POST .../permissions/revoke` | ✅ | ✅ `admin/teachers/[id]/permissions/revoke/route.ts` | No | ✅ `userPermissions` |
| Teachers | `GET /admin/stages` | ✅ | ✅ `admin/stages/route.ts` | No | ✅ `CurriculumService` |
| Coin Packages | `GET /coins/packages/all` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Coin Packages | `POST /coins/packages` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Coin Packages | `PATCH /coins/packages/:id` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Coin Packages | `DELETE /coins/packages/:id` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Unlock Codes | `GET /coins/codes` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Unlock Codes | `POST /coins/codes` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Unlock Codes | `POST /coins/codes/:id/toggle` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Unlock Requests | `GET /coins/requests` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Unlock Requests | `POST /coins/requests/:id/resolve` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Support Contacts | `GET /grade-support/contacts` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Support Contacts | `PATCH /grade-support/contacts/:id` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Reports | `GET /reports/my` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Notifications | `GET /notifications` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Notifications | `PATCH /notifications/read-all` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Notifications | `PATCH /notifications/:id/read` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Notifications | `DELETE /notifications/:id` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Payments | `GET /payments/history` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Support | `GET /support/tickets` | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Support | All ticket endpoints (5 more) | ❌ | ❌ | ❌ | ❌ **MISSING** |
| Live | All live endpoints (7+) | ❌ | ❌ | ❌ | ❌ **MISSING** |

### Summary of Route Status

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Firestore route exists | 30 | 40% |
| ❌ Route missing (called by frontend) | 43 | 60% |

---

## STEP 3 — CRUD VERIFICATION

### 3.1 Users CRUD

| Operation | Status | Implementation |
|-----------|--------|----------------|
| **Create** | 🟡 | ❌ No admin create user page. `UserRepository.createUser()` exists. Auth registration works via `/auth/register`. |
| **Read (single)** | ✅ | `/admin/students/:id` GET — uses `UserRepository.getUserById()` |
| **Read (list)** | ✅ | `/admin/students` GET — uses `UserRepository.listUsers()` |
| **Update** | ✅ | `/admin/students/:id` PATCH — uses `UserRepository.updateProfile()` |
| **Delete** | ✅ | `/admin/students/:id/status` PATCH — uses `UserRepository.softDeleteUser()` |
| **Search** | ✅ | Search by name/phone in list endpoint |
| **Pagination** | ✅ | Cursor-based pagination via `PageQuery` |
| **Filters** | ✅ | Filter by status, search, gradeId |
| **Bulk Actions** | ❌ | No bulk operations (delete, status change, etc.) |

### 3.2 Teachers CRUD

| Operation | Status | Implementation |
|-----------|--------|----------------|
| **Create** | ✅ | `/admin/teachers` POST — creates Firebase Auth user + Firestore user doc |
| **Read (single)** | ✅ | `/admin/teachers/:id` GET — `UserRepository.getUserById()` |
| **Read (list)** | ✅ | `/admin/teachers` GET — `UserRepository.listUsers()` with role filter |
| **Update** | ✅ | `/admin/teachers/:id` PATCH — `UserRepository.updateProfile()` |
| **Soft Delete** | ✅ | `/admin/teachers/:id/status` PATCH — `UserRepository.softDeleteUser()` |
| **Search** | ✅ | Name/phone search |
| **Pagination** | ✅ | Cursor-based |
| **Filters** | ✅ | Status filter |
| **Grade Assignment** | ✅ | `/admin/teachers/:id/grades` POST — writes to `teacherAssignments` |
| **Permission Grant** | ✅ | `/admin/teachers/:id/permissions/grant` POST |
| **Permission Revoke** | ✅ | `/admin/teachers/:id/permissions/revoke` POST |
| **Bulk Actions** | ❌ | No bulk teacher operations |

### 3.3 Educational Systems CRUD

| Operation | Status | Implementation |
|-----------|--------|----------------|
| **Create** | ❌ | No page, no API route (repository exists) |
| **Read (single)** | 🟡 | Via `CurriculumService` in `/curriculum` route |
| **Read (list)** | 🟡 | Via `CurriculumService` in `/curriculum` route |
| **Update** | ❌ | Repository exists, no route, no page |
| **Delete** | ❌ | Repository exists, no route, no page |
| **Search** | ❌ | Not implemented |

### 3.4 Stages CRUD

| Operation | Status | Implementation |
|-----------|--------|----------------|
| **Create** | ❌ | No page, no route (repository exists) |
| **Read (single)** | 🟡 | Via `CurriculumService` |
| **Read (list)** | ✅ | `GET /admin/stages` — returns all stages |
| **Update** | ❌ | Repository exists, no route, no page |
| **Delete** | ❌ | Repository exists, no route, no page |
| **Search** | ❌ | Not implemented |

### 3.5 Grades CRUD

| Operation | Status | Implementation |
|-----------|--------|----------------|
| **Create** | ❌ | No page, no route (repository exists) |
| **Read (single)** | 🟡 | Via `CurriculumService` in profile resolution |
| **Read (list)** | 🟡 | Via `CurriculumService` |
| **Update** | ❌ | Repository exists, no route, no page |
| **Delete** | ❌ | Repository exists, no route, no page |
| **Search** | ❌ | Not implemented |

### 3.6 Academic Years CRUD

| Operation | Status | Implementation |
|-----------|--------|----------------|
| **Create** | ✅ | `/admin/academic-years` POST — works |
| **Read (single)** | 🟡 | Returns all years with terms (no single-get route) |
| **Read (list)** | ✅ | `GET /admin/academic-years` — ordered by startDate desc |
| **Update** | ✅ | `PATCH /admin/academic-years/:id` — works |
| **Delete** | ✅ | `DELETE /admin/academic-years/:id` — works (cascade issue: terms orphaned) |
| **Search** | ❌ | No search |
| **Pagination** | ❌ | Returns all years (no limit/cursor) |
| **Bulk Actions** | ❌ | No bulk operations |

### 3.7 Academic Terms CRUD

| Operation | Status | Implementation |
|-----------|--------|----------------|
| **Create** | ✅ | `/admin/academic-years/:id/terms` POST — creates under year |
| **Read (single)** | 🟡 | Stale data pulled with academic years (no single-get route) |
| **Read (list)** | 🟡 | Returns all terms nested in year response |
| **Update** | ✅ | `PATCH /admin/terms/:id` — works |
| **Delete** | ✅ | `DELETE /admin/terms/:id` — works |
| **Search** | ❌ | No search |
| **Pagination** | ❌ | Returns all terms |

---

## STEP 4 — DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────┐
│                    DEPENDENCY GRAPH                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Firebase Auth (Identity)                              │
│    └── Users                                          │
│          ├── Teachers (role: teacher)                  │
│          │     ├── Grades (teacherAssignments)         │
│          │     └── Permissions (userPermissions)       │
│          │           └── RBAC System                   │
│          │                 ├── Nav Registry            │
│          │                 └── API Guards              │
│          └── Students (role: student)                  │
│                ├── Progress (lesson_progress)          │
│                ├── Coins (xpAccounts, xpTransactions)  │
│                ├── Attendance (future)                 │
│                └── Login History (loginEvents)        │
│                                                       │
│  Educational Systems                                  │
│    └── Stages                                         │
│          └── Grades                                   │
│                └── Teacher Assignments                 │
│                └── Student Enrollments                 │
│                └── Units                              │
│                      └── Lessons                      │
│                            └── Content + Progress     │
│                                                       │
│  Academic Years                                       │
│    └── Academic Terms                                 │
│          └── Units (curriculum context)               │
│                                                       │
│  System Settings (platform-wide config)               │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Correct Implementation Order

```
PHASE 1A: Educational Systems (root of academic hierarchy)
PHASE 1B: Stages (child of Educational System)
PHASE 1C: Grades (child of Stage)

PHASE 2A: Academic Years (time-based context)
PHASE 2B: Academic Terms (child of Academic Year)

PHASE 3A: Users - Students (list, detail, progress)
PHASE 3B: Users - Teachers (list, detail, grades, permissions)

PHASE 4:  Roles & Permissions Management (RBAC admin page)

PHASE 5:  Platform Settings (remaining settings)
```

### Key Insight

The current codebase has a **dependency inversion**: Teachers/Students pages exist and work, but the Educational Systems/Stages/Grades hierarchy they depend on has no management UI. The stages and grades data must come from somewhere — currently it appears to be seeded or empty.

---

## STEP 5 — GAP ANALYSIS

| Feature | Readiness | Reason |
|---------|-----------|--------|
| **Dashboard** | 🟡 Partial | No Firestore stats. Uses NestJS `/profile`. AdminDashboard is purely navigational. |
| **Users Management** | ❌ Missing | No page, no API routes. Repository layer ready. Permissions defined. |
| **Teachers Management** | ✅ Ready | Full CRUD, all API routes on Firestore, repository layer. Best-in-class. |
| **Roles & Permissions** | 🟡 Partial | RBAC defined in shared package. Permission grant/revoke works per-teacher. No role management page. |
| **Academic Years** | ✅ Ready | CRUD fully working via API routes. Repository interface defined. UI in settings page. |
| **Academic Terms** | ✅ Ready | CRUD fully working. Same as Academic Years. |
| **Stages** | 🟡 Partial | Read-only (list) via API route. Repository has full CRUD. No management page or CRUD routes. |
| **Grades** | ❌ Missing | No API routes, no management page. Repository layer ready. |
| **Educational Systems** | ❌ Missing | No API routes, no management page. Repository layer ready. |
| **Platform Settings** | 🟡 Partial | Settings page exists. Academic calendar management works. Missing: maintenance mode, registration toggle, feature flags. |

### Legend

- ✅ Ready — Fully implemented, no gaps
- 🟡 Partial — Some functionality exists, gaps remain
- ❌ Missing — Not implemented at all
- 🔄 Needs Refactor — Exists but has issues
- ⭐ Already Better — Better than NestJS original

---

## STEP 6 — FINAL EXECUTION PLAN

### Implementation Order

| Order | Feature | Estimated Files | Estimated API Routes | Firestore Collections | Risks |
|-------|---------|----------------|---------------------|----------------------|-------|
| 1 | **Educational Systems CRUD** | 6 (page + 1 API route) | 5 (GET list, GET by id, POST, PATCH, DELETE) | `educationalSystems` | Must be seeded first; no data exists |
| 2 | **Stages CRUD** | 6 (page + 1 API route) | 5 (GET list, GET by id, POST, PATCH, DELETE) | `stages` | Depends on educational system |
| 3 | **Grades CRUD** | 6 (page + 1 API route) | 5 (GET list, GET by id, POST, PATCH, DELETE) | `grades` | Depends on stage |
| 4 | **Missing Student Routes** | 7 API routes | 7 (reset-device, coins add/remove, xp adjust, attendance, login-history, subscription) | `loginEvents`, `xpTransactions`, `xpAccounts` | Some collections may not exist yet |
| 5 | **Admin Users Page** | 1 (page) | 0 (reuses existing student/teacher routes) | — | Low risk, UI-only |
| 6 | **Roles Management Page** | 2 (page + API route) | 3 (list roles, create role, delete role) | (could be config-based) | RBAC system already comprehensive |
| 7 | **Missing Coin Routes** | 4 API routes | 4 (packages CRUD) | `coinPackages` | Collection not defined yet |
| 8 | **Platform Settings Enhancement** | 1 (update page) | 0 (reuses existing settings route) | `systemSettings` | Extend existing settings schema |

### Estimated Totals

| Metric | Count |
|--------|-------|
| **New Pages** | 5 (Educational Systems, Stages, Grades, Admin Users, Roles) |
| **New/Updated API Routes** | 29 (17 new CRUD + 7 missing student + 4 coin + 1 roles) |
| **New Firestore Collections** | 1 (coinPackages) |
| **Existing Repositories to Wire** | 3 (EducationalSystem, Stage, Grade from CurriculumRepository) |
| **Total Implementation Effort** | ~3-4 weeks |

### Risks

1. **Empty Data** — `educationalSystems`, `stages`, `grades` collections may be empty. The entire curriculum hierarchy depends on seed data.
2. **Naming Conflict** — `lessonProgress` (camelCase) vs `lesson_progress` (snake_case) in student progress tracking must be resolved.
3. **No Client-Side Firestore** — All admin pages use Admin SDK via API routes. This is fine for admin but prevents real-time updates.
4. **Missing Collections** — Several collections used by missing routes (`coinPackages`, `attendance`, etc.) have no Firestore presence yet.
5. **Auth Token Bug** — `getAccessToken()` in `auth-store.ts` returns `firebaseUser.uid` instead of an actual token — this could break raw `fetch()` calls (like those in lesson content blocks).

### Safe Starting Point

The **safest starting point** for Phase 1 implementation is:

**Educational Systems → Stages → Grades** (in that order)

Rationale:
1. These are the **root of the academic hierarchy** — everything depends on them
2. The `CurriculumRepository` already has **full CRUD interfaces** for all three
3. The `CurriculumService` is already instantiated in `/admin/stages` route — proven pattern
4. No breaking changes to existing pages
5. Can be verified immediately (create system → create stage → create grade → see in teacher/student pages)

---

*End of Phase 1 Admin Core Baseline Report — READ-ONLY — No code was modified.*
