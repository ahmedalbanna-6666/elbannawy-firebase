# TEACHER & ADMIN MIGRATION AUDIT REPORT

**Date:** 2026-07-23
**Project:** El-bannawy Platform — Firebase Migration
**Mode:** READ-ONLY AUDIT
**Old Platform:** NestJS + Prisma + PostgreSQL
**New Platform:** Next.js 15 + Firebase Auth + Cloud Firestore

---

## PART 1 — TEACHER DASHBOARD AUDIT

| Feature | Old (NestJS) | New (Firebase) | Status | Notes |
|---|---|---|---|---|
| **Dashboard** | `home/` controller, NestJS API | `_components/teacher-dashboard.tsx` | 🟡 Partial | Uses NestJS API `/teachers/my-grades`, `/profile`. No Firestore. Frontend-only. |
| **Units** | `curriculum/` controller (units CRUD) | `dashboard/units/` — full CRUD UI | 🟡 Partial | Full UI but calls NestJS API `/curriculum/units/:unitId`. Firestore repository exists but not wired to frontend. |
| **Lessons** | `lesson/` controller | `dashboard/units/[unitId]/lessons/[lessonId]/` — content builder | 🟡 Partial | 1465-line `content-blocks.tsx` with videos, vocabulary, documents, homework/quiz settings. Calls NestJS API. |
| **Vocabulary** | `lesson/` vocabulary endpoints | DOCX import + management in lesson builder | 🟡 Partial | Import uses new Firestore lib. Management UI calls NestJS API for existing data. |
| **Activities** | `activity/` controller (execute, submit, grade) | `dashboard/lessons/detail/[lessonId]/activities/` — student player | 🟡 Partial | Student-facing only. Calls NestJS API `/activities`, `/execute`, `/submit`. |
| **Videos** | `video/` + `video-event/` + `video-question/` controllers | Embedded in `content-blocks.tsx` + lesson detail page | 🟡 Partial | Calls NestJS API `/videos/:videoId/progress`. Video question engine not yet migrated. |
| **Homework** | `homework/` controller (CRUD + submit + grade) | `dashboard/homework/[lessonId]/` — student player | 🟡 Partial | Full student flow (start, save, submit, review). Calls NestJS API. No teacher grading UI. |
| **Quizzes** | `quiz/` controller (CRUD + submit + grade) | `dashboard/quiz/[lessonId]/` — student player | 🟡 Partial | Mirrors homework flow. Calls NestJS API. |
| **DOCX Import** | `document-import/` module (mammoth+cheerio, ~3330 test lines) | New: `lib/vocabulary-import/` (Python) + `lib/question-import/` (8 extractors) | ⭐ Firebase Better | New engine is source of truth. Python-based vocabulary + 8-type question importer. Old module disconnected. |
| **Documents** | Document management via Prisma | `content-blocks.tsx` upload section | 🟡 Partial | Uploads `.docx/.doc` via `fetch()` with raw `accessToken`. No dedicated documents page. |
| **Story Management** | `story/` controller (CRUD + chapters) | `dashboard/stories/` — Full management UI + `dashboard/story/` — student player | 🟡 Partial | Full UI but calls NestJS API `/stories/management/:id`. |
| **Final Reviews** | `final-review/` controller | `dashboard/final-reviews/` — management + `dashboard/final-review/` — student player | 🟡 Partial | Calls NestJS API. Missing route: `/dashboard/final-review/:id/questions`. |
| **Live Classes** | `live/` controller (sessions, bookings, availability) | `dashboard/live/` — 4 pages (list, book, availability, session control) | 🟡 Partial | Full UI with teacher + student views. Calls NestJS API via `live-api.ts` hooks. |
| **Student Management** | `teachers/` + `admin/` controllers | `dashboard/students/` — 844-line page with search, detail, progress | 🟡 Partial | Calls NestJS API. 6 backend routes called by frontend do NOT exist. |
| **Teacher Settings** | `teachers/` profile settings | `dashboard/teacher/games/` — only game settings | ❌ Missing | No teacher profile editor, preferences, notification settings, or schedule management. |

### Teacher Features Summary

- **15 features audited**
- ✅ Fully Migrated: 0
- 🟡 Partially Migrated: 14 (all still calling NestJS API)
- ❌ Missing: 1 (Teacher Settings)
- ⭐ Firebase Better: 1 (DOCX Import)
- **Firestore in frontend: 0%** (all pages use `/api/v1` NestJS proxy)

---

## PART 2 — ADMIN DASHBOARD AUDIT

| Feature | Old (NestJS) | New (Firebase) | Status | Notes |
|---|---|---|---|---|
| **Dashboard** | `admin/` controller dashboard endpoint | Role-based router with `AdminDashboard` component | 🟡 Partial | Uses NestJS API `/profile`. Admin stats not migrated. |
| **Users** | Admin user management | No page at `/dashboard/admin/users` | ❌ Missing | Route defined in nav-registry but no page exists. |
| **Teachers** | Teacher management | `dashboard/teachers/` — 1283-line page, full CRUD + permissions + grades | ✅ Complete | Best-implemented admin page. All CRUD for teachers, search, filter, permissions management. |
| **Roles (RBAC)** | NestJS RBAC guards + roles | Permission toggles per teacher. No role definitions page. | ❌ Missing | No UI for creating/editing roles. Only individual permission grant/revoke. |
| **Permissions** | `@el-bannawy/shared` PERMISSIONS enum | Permission management per teacher (grant/revoke API) | 🟡 Partial | Granular permission toggles work but no global permissions dashboard. |
| **Academic Years** | Academic year CRUD | Inside `/dashboard/admin/settings/` — CRUD implemented | ✅ Complete | Creates/edits/deletes academic years + terms. |
| **Terms** | Term CRUD | Inside `/dashboard/admin/settings/` — CRUD implemented | ✅ Complete | Creates/edits/deletes terms. Auto/manual mode toggle. |
| **Stages** | Stage management | No dedicated admin page | ❌ Missing | Referenced by curriculum routes but no management UI. |
| **Grades** | Grade management | No dedicated admin page | ❌ Missing | Referenced by teacher assignments but no management UI. |
| **Curriculum** | Curriculum management | `/dashboard/units/` — unit/lesson management | 🟡 Partial | No centralized admin curriculum overview. Managed per-unit. |
| **Reports** | `reports/` controller (admin + teacher reports) | `/dashboard/reports/` — student-only | ❌ Missing | No admin reports, no teacher reports, no export. |
| **Payments** | `payments/` controller (admin management) | `/dashboard/payments/` — student-only history | ❌ Missing | No admin payment management, no refund, no financial reporting. |
| **Notifications** | `notifications/` controller (send + manage) | `/dashboard/notifications/` — student-only view | ❌ Missing | No admin send capability. No push notification registration. |
| **Coins** | Coin system (packages, wallet, transactions) | `/dashboard/admin/coin-packages/` — package management | 🟡 Partial | Package CRUD works. Student wallet/transactions via NestJS API. |
| **Competitions** | `competition/` controller | `/dashboard/competitions/` — student view | ❌ Missing | Student-facing only. No admin management. |
| **Support Tickets** | `support/` controller | `/dashboard/support/` — full ticket system | 🟡 Partial | Student + agent view. Missing: file attachments, email notifications. |
| **Platform Settings** | System settings | `/dashboard/admin/settings/` — limited | 🟡 Partial | Academic year/term settings only. Missing: maintenance mode, registration toggle, feature flags. |
| **System Settings** | Full system config | `/dashboard/admin/settings/` | 🟡 Partial | Only academic calendar management. |

### Admin Features Summary

- **18 features audited**
- ✅ Fully Migrated: 3 (Teachers, Academic Years, Terms)
- 🟡 Partially Migrated: 7
- ❌ Missing: 8 (Users, Roles, Stages, Grades, Reports, Payments, Notifications, Competitions)
- **Firestore backend routes exist for: 9 of 18 features**

---

## PART 3 — API AUDIT

### 3A — NestJS API Endpoints Called by Frontend (STILL ACTIVE)

| Route | Called From | Status | Firestore Backend? |
|---|---|---|---|
| `GET /curriculum` | lessons, final-review | 🟡 Active | ✅ Exists |
| `GET /curriculum/units/:unitId` | units management | 🟡 Active | ✅ Exists |
| `POST /curriculum/lessons` | units management | 🟡 Active | ✅ Exists |
| `DELETE /curriculum/lessons/:id` | units management | 🟡 Active | ✅ Exists |
| `GET /lessons/:lessonId` | lesson detail | 🟡 Active | ✅ Exists |
| `GET /lessons/:lessonId/vocabulary` | vocabulary page | 🟡 Active | ✅ Exists |
| `POST /lessons/:lessonId/complete` | lesson results | 🟡 Active | ✅ Exists |
| `POST /lessons/:lessonId/upload/document` | content blocks | 🟡 Active | ❌ Not migrated |
| `GET /videos/:videoId/progress` | lesson detail | 🟡 Active | ✅ Exists |
| `GET /activities?lessonId=` | activities page | 🟡 Active | ✅ Exists |
| `POST /activities/:id/execute` | activities page | 🟡 Active | ✅ Exists |
| `POST /activities/:id/submit` | activities page | 🟡 Active | ✅ Exists |
| `GET /homework/:lessonId` | homework player | 🟡 Active | ✅ Exists |
| `GET /homework/:lessonId/questions` | homework player | 🟡 Active | ✅ Exists |
| `GET /homework/:lessonId/result` | homework player | 🟡 Active | ✅ Exists |
| `PATCH /homework/:lessonId/save` | homework auto-save | 🟡 Active | ✅ Exists |
| `POST /homework/:lessonId/start` | homework player | 🟡 Active | ✅ Exists |
| `POST /homework/:lessonId/submit` | homework submit | 🟡 Active | ✅ Exists |
| `GET /homework/:lessonId/review` | homework review | 🟡 Active | ✅ Exists |
| `GET /quizzes/:lessonId` | quiz player | 🟡 Active | ✅ Exists |
| `GET /quizzes/:lessonId/questions` | quiz player | 🟡 Active | ✅ Exists |
| `GET /quizzes/:lessonId/result` | quiz player | 🟡 Active | ✅ Exists |
| `PATCH /quizzes/:lessonId/save` | quiz auto-save | 🟡 Active | ✅ Exists |
| `POST /quizzes/:lessonId/start` | quiz player | 🟡 Active | ✅ Exists |
| `POST /quizzes/:lessonId/submit` | quiz submit | 🟡 Active | ✅ Exists |
| `GET /quizzes/:lessonId/review` | quiz review | 🟡 Active | ✅ Exists |
| `GET /stories` | story player | 🟡 Active | ✅ Exists |
| `GET /stories/management/:storyId` | story management | 🟡 Active | ✅ Exists |
| `DELETE /stories/:storyId/chapters/:id` | story management | 🟡 Active | ✅ Exists |
| `GET /final-reviews` | final review player | 🟡 Active | ✅ Exists |
| `GET /final-reviews/management/:reviewId` | final review mgmt | 🟡 Active | ✅ Exists |
| `DELETE /final-reviews/:reviewId/sections/:id` | final review mgmt | 🟡 Active | ✅ Exists |
| `GET /profile` | dashboard layout | 🟡 Active | ✅ Exists |
| `GET /teachers/my-grades` | teacher dashboard | 🟡 Active | ✅ Exists |
| `GET /admin/students` | students page | 🟡 Active | ✅ Exists |
| `GET /admin/students/:id` | students page | 🟡 Active | ✅ Exists |
| `GET /admin/stages` | students page | 🟡 Active | ✅ Exists |
| `GET /admin/academic-years` | students page | 🟡 Active | ✅ Exists |
| `GET /admin/teachers` | teachers page | 🟡 Active | ✅ Exists |
| `POST /admin/teachers` | teachers page | 🟡 Active | ✅ Exists |
| `GET /admin/teachers/:id` | teachers page | 🟡 Active | ✅ Exists |
| `PATCH /admin/teachers/:id` | teachers page | 🟡 Active | ✅ Exists |
| `POST /admin/teachers/:id/grades` | teachers page | 🟡 Active | ✅ Exists |
| `PATCH /admin/teachers/:id/status` | teachers page | 🟡 Active | ✅ Exists |
| Live session endpoints (7+ routes) | live pages | 🟡 Active | ❌ Not migrated |

### 3B — Firestore Backend Routes (MIGRATED TO NEXT.JS API)

| Route | Methods | Collections | Status |
|---|---|---|---|
| `/admin/settings` | GET, PATCH | `systemSettings` | ✅ Migrated |
| `/admin/academic-years` | GET, POST | `academicYears` | ✅ Migrated |
| `/admin/academic-years/[id]` | PATCH, DELETE | `academicYears` | ✅ Migrated |
| `/admin/academic-years/[id]/terms` | POST | `academicTerms` | ✅ Migrated |
| `/admin/terms/[id]` | PATCH, DELETE | `academicTerms` | ✅ Migrated |
| `/admin/teachers/[id]/permissions` | GET | `userPermissions` | ✅ Migrated |
| `/admin/teachers/[id]/permissions/grant` | POST | `userPermissions` | ✅ Migrated |
| `/admin/teachers/[id]/permissions/revoke` | POST | `userPermissions` | ✅ Migrated |
| `/admin/teachers/[id]/grades` | POST | `teacherAssignments` | ✅ Migrated |
| `/admin/students/[id]/reset-password` | POST | Firebase Auth | ✅ Migrated |
| `/admin/students/[id]/progress` | GET | `lessonProgress` | ✅ Migrated |
| `/admin/students/[id]/phone` | PATCH | `users` | ✅ Migrated |
| `/lessons/[id]/vocabulary/import/preview` | POST | (lib service) | ✅ Migrated |
| `/lessons/[id]/vocabulary/import/commit` | POST | Firestore repos | ✅ Migrated |
| `/lessons/[id]/questions/import/preview` | POST | (lib service) | ✅ Migrated |
| `/lessons/[id]/questions/import/commit` | POST | Firestore repos | ✅ Migrated |
| `/lessons/[id]/complete` | POST | `lessonProgress` | ✅ Migrated |
| `/curriculum` | GET | repos | ✅ Migrated |
| `/curriculum/progress` | GET | repos | ✅ Migrated |
| `/curriculum/continue-learning` | GET | repos | ✅ Migrated |
| `/home` | GET | `educationalSystems` | ✅ Migrated |
| `/profile` | GET, PATCH | `users` | ✅ Migrated |
| `/stories` | GET, POST | `stories`, `storyChapters` | ✅ Migrated |
| `/video-questions/answer` | POST | `videoQuestionAnswers` | ✅ Migrated |

### 3C — MISSING Backend Routes (Called by Frontend, No Route File Exists)

| Route | Called By | Impact |
|---|---|---|
| `/admin/students/{id}/reset-device` | students page | 🔴 Returns 404 |
| `/admin/students/{id}/coins/add` | students page | 🔴 Returns 404 |
| `/admin/students/{id}/coins/remove` | students page | 🔴 Returns 404 |
| `/admin/students/{id}/xp/adjust` | students page | 🔴 Returns 404 |
| `/admin/students/{id}/attendance` | students page | 🔴 Returns 404 |
| `/admin/students/{id}/login-history` | students page | 🔴 Returns 404 |
| `/admin/students/{id}/subscription` | students page | 🔴 Returns 404 |
| `/auth/forgot-password` | forgot-password page | 🔴 Returns 404 |
| `/notifications` | notifications page | 🔴 Returns 404 |
| `/notifications/read-all` | notifications page | 🔴 Returns 404 |
| `/notifications/{id}/read` | notifications page | 🔴 Returns 404 |
| `/notifications/{id}` | notifications page | 🔴 Returns 404 |
| `/reports/my` | reports page | 🔴 Returns 404 |
| `/payments/history` | payments page | 🔴 Returns 404 |
| `/support/tickets` | support page | 🔴 Returns 404 |
| `/support/tickets/{id}` | support page | 🔴 Returns 404 |
| `/support/tickets/{id}/messages` | support page | 🔴 Returns 404 |
| `/support/tickets/{id}/resolve` | support page | 🔴 Returns 404 |
| `/support/tickets/{id}/close` | support page | 🔴 Returns 404 |
| `/grade-support/contacts` | support-contacts page | 🔴 Returns 404 |
| `/grade-support/contacts/{id}` | support-contacts page | 🔴 Returns 404 |
| `/coins/*` (7+ routes) | coins pages | 🔴 Returns 404 |
| Live session endpoints (7+ routes) | live pages | 🔴 Returns 404 |

**Total Missing API Routes: ~30+ endpoints**

### 3D — DOCX Import API Routes (MIGRATED — NEW ENGINE)

| Route | Methods | Status |
|---|---|---|
| `/lessons/[id]/vocabulary/import/preview` | POST | ✅ Fully migrated (lib + Python) |
| `/lessons/[id]/vocabulary/import/commit` | POST | ✅ Fully migrated (Firestore repos) |
| `/lessons/[id]/questions/import/preview` | POST | ✅ Fully migrated (lib + mammoth) |
| `/lessons/[id]/questions/import/commit` | POST | ✅ Fully migrated (Firestore repos) |

### API Summary

- **50+ NestJS API endpoints** still actively called by frontend
- **24+ Firestore API routes** implemented in Next.js route handlers
- **30+ API endpoints called by frontend but missing backend routes** (will 404)
- **4 DOCX import endpoints** fully migrated to new lib + Firestore

---

## PART 4 — FIRESTORE AUDIT

### 4A — Collections Actively Used in Code

| Collection | Accessed Via | Pattern | Status |
|---|---|---|---|
| `users` | Admin SDK + UserRepository | Direct + Repository | ✅ Active |
| `educationalSystems` | CurriculumRepository | Repository | ✅ Active |
| `stages` | CurriculumRepository | Repository | ✅ Active |
| `grades` | CurriculumRepository | Repository | ✅ Active |
| `academicYears` | Admin routes + CurriculumRepository | Both | ✅ Active |
| `academicTerms` | Admin routes + CurriculumRepository | Both | ✅ Active |
| `units` | UnitRepository | Repository | ✅ Active |
| `lessons` | LessonRepository | Repository | ✅ Active |
| `lessonVideos` | LessonVideoRepository + direct | Both | ✅ Active |
| `lessonDocuments` | LessonDocumentRepository | Repository | ✅ Active |
| `lessonProgress` | home route direct | Admin SDK Direct | ⚠️ camelCase |
| `lesson_progress` | LessonProgressRepository | Repository | ✅ Active |
| `quizzes` | QuizRepository + direct | Both | ✅ Active |
| `homework` | HomeworkRepository + direct | Both | ✅ Active |
| `stories` | Admin SDK direct | Direct | ✅ Active |
| `storyChapters` | Admin SDK direct | Direct | ✅ Active |
| `systemSettings` | Admin SDK direct | Direct | ✅ Active |
| `userPermissions` | Admin SDK direct | Direct | ✅ Active |
| `teacherAssignments` | Admin SDK direct | Direct | ✅ Active |
| `videoQuestionAnswers` | Admin SDK direct | Direct | ✅ Active |
| `activities` | ActivityRepository | Repository | ✅ Active |
| `videoProgress` | VideoProgressRepository | Repository | ✅ Active |
| `timelineEvents` | TimelineEventRepository | Repository | ✅ Active |
| `timelineEventProgress` | TimelineEventProgressRepository | Repository | ✅ Active |
| `studentAttempts` | StudentAttemptRepository | Repository | ✅ Active |
| `homeworkQuestions` | HomeworkQuestionRepository | Repository | ✅ Active |
| `homeworkAttempts` | HomeworkAttemptRepository | Repository | ✅ Active |
| `homeworkAnswers` | HomeworkAnswerRepository | Repository | ✅ Active |
| `quizQuestions` | QuizQuestionRepository | Repository | ✅ Active |
| `quizAttempts` | QuizAttemptRepository | Repository | ✅ Active |
| `quizAnswers` | QuizAnswerRepository | Repository | ✅ Active |
| `vocabularyItems` | VocabularyItemRepository | Repository | ✅ Active |
| `vocabularySections` | VocabularySectionRepository | Repository | ✅ Active |
| `vocabularyRelations` | VocabularyRelationRepository | Repository | ✅ Active |
| `xpAccounts` | XpAccountRepository | Repository | ✅ Active |
| `xpTransactions` | XpTransactionRepository | Repository | ✅ Active |
| `achievements` | AchievementRepository | Repository | ✅ Active |
| `userAchievements` | UserAchievementRepository | Repository | ✅ Active |
| `studentStats` | StudentStatsRepository | Repository | ✅ Active |
| `loginEvents` | UserRepository | Repository | ✅ Active |

### 4B — Collections Defined in `firestore.rules` / `COLLECTIONS.md` But NOT Implemented

| Collection | Documented In | Status |
|---|---|---|
| `books` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `answerKeys` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `activityProgress` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `conversations` + sub `messages` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `aiAssessments` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `supportTickets` + sub `messages` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `featureFlags` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `auditLogs` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `referralProfiles` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `referralPolicies` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `notificationPreferences` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `notifications` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `wallets` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `payments` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `invoices` | COLLECTIONS.md, firestore.rules | ❌ No code |
| `finalReviews` + sub-collections | COLLECTIONS.md | ❌ No code |
| `games` / `gameSessions` | COLLECTIONS.md | ❌ No code (settings only) |
| `competitions` + sub-collections | COLLECTIONS.md | ❌ No code |
| `liveClasses` + sub-collections | COLLECTIONS.md | ❌ No code |
| `achievements` (definition) | COLLECTIONS.md | ❌ No code |
| `userAchievements` | COLLECTIONS.md | ❌ No code |
| `gamification` collections | COLLECTIONS.md | ❌ No code |
| `commerce` collections | COLLECTIONS.md | ❌ No code |
| `referral` collections | COLLECTIONS.md | ❌ No code |

### 4C — Critical Issues

1. **Collection naming conflict:** `lessonProgress` (camelCase, used by `home/route.ts`) vs `lesson_progress` (snake_case, used by `LessonProgressRepository`). These are TWO DIFFERENT COLLECTIONS. Data written to one will not be readable by the other.

2. **Client-side Firestore zero usage:** `getClientDb()` exists but is NEVER called. Zero `onSnapshot` listeners. Security rules are decorative (all access bypasses via Admin SDK).

3. **89 collections documented, ~35 implemented, ~54 missing from code.**

4. **Dual access patterns:** Some routes use raw `getAdminDb().collection()` calls, others use the repository layer. The two patterns coexist inconsistently.

---

## PART 5 — DOCX IMPORT ENGINE AUDIT

### 5A — Engine Comparison

| Capability | Old (NestJS Backend) | New (Lib + Firebase) | Status |
|---|---|---|---|
| **Technology** | mammoth + cheerio (JS) | Python `python-docx` (vocab) + mammoth (questions) | ⭐ New is source of truth |
| **Vocabulary Parser** | V1 + V2 table parsers | Python script + TypeScript mapper | ⭐ New |
| **Question Types** | None | 8 extractors (MCQ, Reading, Rewrite, Correct, Dialogue, TF, Drag&Drop, Writing) | ⭐ New only |
| **Section Detection** | Bilingual title matching | Word Heading style detection | ⭐ New |
| **Synonym/Antonym** | Full support (V2) | Full support | Both |
| **POS Extraction** | Regex `(n|v|adj|...)` | `null` always | 🔴 Missing in new |
| **Persistence** | Prisma (PostgreSQL) | Firestore repositories | ✅ New |
| **Validation** | 15+ error codes | 10+ integrity checks | Both |
| **Preview UI** | — (NestJS only) | `VocabularyImportDialog` + `QuestionImportPreviewDialog` | ⭐ New |
| **Editing Before Commit** | — | Inline editing, add/delete items, bulk operations | ⭐ New |
| **Tests** | ~3330 lines (6 spec files) | Minimal | 🔴 Old has far better coverage |
| **Performance** | JS in-process | Python subprocess (cold start) | 🔴 Old better |

### 5B — Assessment

- New import engine is **source of truth** and should NOT be replaced.
- **Missing in new:** Part-of-speech extraction from parenthetical markers (old had it, new always sets `null`).
- **Missing in new:** Tests — old has ~3330 lines of tests, new has minimal coverage.
- **Risk:** Python dependency (`python-docx`) via subprocess — cold start, cross-platform issues, missing Python install.

---

## PART 6 — FRONTEND AUDIT

### 6A — Teacher Pages

| Page | Route | Status | API Source |
|---|---|---|---|
| Dashboard Home | `/dashboard` | 🟡 Exists | NestJS `/profile` |
| Units | `/dashboard/units` | ✅ Exists | NestJS `/curriculum/units` |
| Unit Detail | `/dashboard/units/[unitId]` | ✅ Exists | NestJS `/curriculum/units/:id` |
| Lesson Builder | `/dashboard/units/[unitId]/lessons/[lessonId]` | ✅ Exists | NestJS + Firestore import |
| Lesson Player | `/dashboard/lessons/detail/[lessonId]` | ✅ Exists | NestJS `/lessons/:id` |
| Vocabulary | `/dashboard/lessons/detail/[lessonId]/vocabulary` | ✅ Exists | NestJS |
| Activities | `/dashboard/lessons/detail/[lessonId]/activities` | ✅ Exists | NestJS |
| Lesson Results | `/dashboard/lessons/detail/[lessonId]/results` | ✅ Exists | NestJS |
| Lesson PDF | `/dashboard/lessons/detail/[lessonId]/pdf` | ✅ Exists | NestJS (raw fetch) |
| Homework | `/dashboard/homework/[lessonId]` | ✅ Exists | NestJS |
| Quiz | `/dashboard/quiz/[lessonId]` | ✅ Exists | NestJS |
| Stories | `/dashboard/stories` | ✅ Exists | NestJS |
| Story Player | `/dashboard/story` | ✅ Exists | NestJS |
| Final Reviews | `/dashboard/final-reviews` | ✅ Exists | NestJS |
| Final Review Player | `/dashboard/final-review` | ✅ Exists | NestJS |
| Live Classes | `/dashboard/live` | ✅ Exists | NestJS (via hooks) |
| Live Book | `/dashboard/live/book` | ✅ Exists | NestJS (via hooks) |
| Live Availability | `/dashboard/live/availability` | ✅ Exists | NestJS (via hooks) |
| Live Session Control | `/dashboard/live/sessions/[sessionId]` | ✅ Exists | NestJS (via hooks) |
| Teacher Games | `/dashboard/teacher/games` | ✅ Exists | NestJS (via hooks) |

### 6B — Admin Pages

| Page | Route | Status | API Source |
|---|---|---|---|
| Admin Dashboard | `/dashboard` | 🟡 Role-router | NestJS |
| Settings | `/dashboard/admin/settings` | ✅ Exists | Firestore (migrated) |
| Coin Packages | `/dashboard/admin/coin-packages` | ✅ Exists | Missing backend |
| Unlock Codes | `/dashboard/admin/unlock-codes` | ✅ Exists | Missing backend |
| Unlock Requests | `/dashboard/admin/unlock-requests` | ✅ Exists | Missing backend |
| Support Contacts | `/dashboard/admin/support-contacts` | ✅ Exists | Missing backend |
| Students | `/dashboard/students` | ✅ Exists | NestJS + Missing routes |
| Teachers | `/dashboard/teachers` | ✅ Exists | Firestore (migrated) |
| Reports | `/dashboard/reports` | 🟡 Student-only | Missing backend |
| Support | `/dashboard/support` | 🟡 Exists | Missing backend |
| Notifications | `/dashboard/notifications` | 🟡 Student-only | Missing backend |
| Payments | `/dashboard/payments` | 🟡 Student-only | Missing backend |
| Competitions | `/dashboard/competitions` | 🟡 Exists | Missing backend |
| Achievements | `/dashboard/achievements` | ✅ Exists | NestJS |
| Leaderboard | `/dashboard/leaderboard` | ✅ Exists | NestJS |
| Mistakes | `/dashboard/mistakes` | ✅ Exists | NestJS |
| Shop | `/dashboard/shop` | ✅ Exists | NestJS |

### 6C — MISSING Pages

| Page | Route | Priority |
|---|---|---|
| Users Management | `/dashboard/admin/users` | High |
| Roles Management | `/dashboard/admin/roles` | High |
| Stages Management | `/dashboard/admin/stages` | Medium |
| Grades Management | `/dashboard/admin/grades` | Medium |
| Curriculum Admin | `/dashboard/admin/curriculum` | Medium |
| Admin Reports | `/dashboard/admin/reports` | High |
| Admin Payments | `/dashboard/admin/payments` | High |
| Admin Notifications (Send) | `/dashboard/admin/notifications/send` | Medium |
| Competitions Management | `/dashboard/admin/competitions` | Low |
| Final Review Questions | `/dashboard/final-review/:id/questions` | High |
| Staff Dashboard | `/dashboard` (staff view) | Medium |
| Teacher Settings | `/dashboard/teacher/settings` | Low |

### 6D — Navigation Registry

**26 modules defined** in `nav-registry.ts` with permission-based visibility:
- Content (4): units, story, final-review, live
- Management (9): ai, students, teachers, reports, teacher-games, coin-packages, unlock-codes, unlock-requests, support-contacts
- Student (7): mistakes, games, achievements, leaderboard, competitions, support, shop
- Settings (1): admin/settings

---

## PART 7 — FINAL MIGRATION MATRIX

| Feature | Old | Firebase | Status | Recommended Action |
|---|---|---|---|---|
| **Teacher Dashboard** | ✅ NestJS | 🟡 Frontend-only | 🟡 Partial | Wire Firestore repositories |
| **Units** | ✅ NestJS | 🟡 UI + Firestore repos | 🟡 Partial | Rewire frontend to Firestore |
| **Lessons** | ✅ NestJS | 🟡 UI + Firestore repos | 🟡 Partial | Rewire frontend to Firestore |
| **Vocabulary** | ✅ NestJS | 🟡 Import migrated, UI on NestJS | 🟡 Partial | Complete Firestore wiring |
| **Activities** | ✅ NestJS | 🟡 UI + Firestore repos | 🟡 Partial | Rewire frontend to Firestore |
| **Videos** | ✅ NestJS | 🟡 UI only | 🟡 Partial | Migrate video endpoints |
| **Homework** | ✅ NestJS | 🟡 UI + Firestore repos | 🟡 Partial | Rewire frontend to Firestore |
| **Quizzes** | ✅ NestJS | 🟡 UI + Firestore repos | 🟡 Partial | Rewire frontend to Firestore |
| **DOCX Import** | ✅ NestJS | ⭐ New lib + Firestore | ✅ Complete | Merge POS extraction from old |
| **Documents** | ✅ NestJS | 🟡 Upload only | 🟡 Partial | Migrate document endpoints |
| **Story Management** | ✅ NestJS | 🟡 UI only | 🟡 Partial | Migrate story endpoints |
| **Final Reviews** | ✅ NestJS | 🟡 UI only | 🟡 Partial | Migrate final-review endpoints |
| **Live Classes** | ✅ NestJS | 🟡 UI only | 🟡 Partial | Migrate live endpoints |
| **Student Management** | ✅ NestJS | 🟡 UI + partial routes | 🔄 Merge | Create missing backend routes |
| **Teacher Settings** | ✅ NestJS | ❌ Missing | ❌ Missing | Create teacher settings page |
| **Admin Dashboard** | ✅ NestJS | 🟡 Role-router | 🟡 Partial | Migrate admin stats |
| **Users Management** | ✅ NestJS | ❌ Missing | ❌ Missing | Create admin users page |
| **Teachers Management** | ✅ NestJS | ✅ Firestore | ✅ Complete | Maintain |
| **Roles & Permissions** | ✅ NestJS | 🟡 Partial | 🟡 Partial | Create roles management page |
| **Academic Years** | ✅ NestJS | ✅ Firestore | ✅ Complete | Maintain |
| **Terms** | ✅ NestJS | ✅ Firestore | ✅ Complete | Maintain |
| **Stages** | ✅ NestJS | ❌ Missing | ❌ Missing | Create stages management |
| **Grades** | ✅ NestJS | ❌ Missing | ❌ Missing | Create grades management |
| **Curriculum Admin** | ✅ NestJS | 🟡 Partial | 🟡 Partial | Create admin curriculum view |
| **Reports** | ✅ NestJS | ❌ Missing (student only) | ❌ Missing | Create admin/teacher reports |
| **Payments** | ✅ NestJS | ❌ Missing (student only) | ❌ Missing | Create admin payment management |
| **Notifications** | ✅ NestJS | ❌ Missing (student only) | ❌ Missing | Create admin notification send |
| **Coins** | ✅ NestJS | 🟡 Partial | 🟡 Partial | Migrate coin endpoints |
| **Competitions** | ✅ NestJS | ❌ Missing (student only) | ❌ Missing | Create admin competition mgmt |
| **Support Tickets** | ✅ NestJS | 🟡 Partial | 🟡 Partial | Create missing backend routes |
| **Platform Settings** | ✅ NestJS | 🟡 Partial | 🟡 Partial | Add settings (maintenance, etc.) |

### Status Legend
- ✅ Complete: Fully migrated and working
- 🟡 Partial: Exists but still depends on NestJS or partially implemented
- ❌ Missing: Not implemented in Firebase project
- ⭐ Firebase Better: New implementation is superior
- 🔄 Merge Needed: Old + New should be combined

---

## PART 8 — FINAL SUMMARY

### 1. Total Features Audited
- **Teacher Features:** 15
- **Admin Features:** 18
- **Total:** 33 features

### 2. Migration Status

| Status | Count | Percentage |
|---|---|---|
| ✅ Fully Migrated | 4 (Teachers Management, Academic Years, Terms, DOCX Import) | 12% |
| 🟡 Partially Migrated | 18 | 55% |
| ❌ Not Migrated | 11 (Users, Roles, Stages, Grades, Reports, Payments, Notifications, Competitions, Teacher Settings, Admin Dashboard stats, Admin Curriculum) | 33% |

### 3. Frontend Firestore Usage
- **0%** — No frontend page directly uses Firestore
- **100%** — All frontend pages call NestJS API via `/api/v1` proxy
- **24+** — Next.js API routes use Firestore (backend-only)
- **30+** — API routes called by frontend have NO backend implementation

### 4. Firestore Collections
- **89** — Documented in COLLECTIONS.md
- **35** — Actively used in code
- **~54** — Not yet implemented in code
- **1** — Naming conflict (`lessonProgress` vs `lesson_progress`)

### 5. DOCX Import
- New engine (lib + Python) is **source of truth** — do NOT replace
- Old engine has **~3330 lines of tests** — new has minimal tests
- Missing from new: Part-of-speech extraction, comprehensive tests

### 6. Remaining NestJS Dependencies
- **50+** — API endpoints still calling NestJS backend
- **14+** — NestJS modules still needed for frontend to function
- The NestJS backend is **critical infrastructure** — frontend cannot function without it

### 7. Critical Issues (Must Fix)
1. **30+ missing API backend routes** will return 404 when used
2. **Collection naming conflict** (`lessonProgress` vs `lesson_progress`) causes data fragmentation
3. **Zero client-side Firestore integration** — security rules are decorative
4. **Python dependency** for vocabulary import — fragile, no fallback
5. **Missing POS extraction** in new vocabulary import
6. **No admin reports/payments/users/roles pages** — admin functionality severely incomplete

### 8. Recommended Migration Order

| Priority | Phase | Effort | Impact |
|---|---|---|---|
| P0 | Create missing API routes (30+ endpoints) | Large | Unblocks features, prevents 404s |
| P1 | Fix `lessonProgress` naming conflict | Small | Fixes data fragmentation |
| P2 | Wire frontend to Firestore repositories | XL | Completes migration, removes NestJS dependency |
| P3 | Create missing admin pages (Users, Roles, Stages, Grades, Reports, Payments, Notifications, Competitions) | XL | Completes admin functionality |
| P4 | Add POS extraction + tests to DOCX import | Small | Fills feature gap |
| P5 | Implement client-side Firestore with security rules | Medium | Enables realtime, enforces security |
| P6 | Teacher Settings page | Small | Completes teacher features |
| P7 | Add remaining collection implementations (~54) | XL | Completes architecture compliance |
| P8 | Decommission NestJS backend | XL | Removes old stack |

### 9. Estimated Remaining Work

| Category | Estimated Effort |
|---|---|
| Create 30+ missing API routes | 3-4 weeks |
| Wire frontend to Firestore (18 features) | 6-8 weeks |
| Create 8 missing admin pages | 4-5 weeks |
| Fix DOCX import gaps | 1 week |
| Client-side Firestore integration | 2-3 weeks |
| Remaining collections | 6-8 weeks |
| NestJS decommission | 2-3 weeks |
| **TOTAL** | **24-32 weeks (6-8 months)** |

---

*End of Audit Report — READ-ONLY — No code was modified.*
