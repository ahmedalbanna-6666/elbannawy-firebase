# Domain Model

## El-bannawy Platform - Firebase Domain Model

Version: 2.0.0  
Status: Phase 1 design baseline  
Last Updated: 2026-07-21

## Purpose

This document defines the business domains, entities, relationships, aggregate boundaries, and invariants used by the Firebase design. It is a logical model, not application code and not a migration script.

The model follows the documented business rules: a lesson is a complete learning unit, videos own their timelines and activities, homework does not unlock lessons, and the optional End Lesson Assessment may control progression.

## Domain Map

```text
Identity
  User -> role, academic assignment, authentication audit

Academic Structure
  Educational System -> Stage -> Grade -> Unit -> Lesson
  Academic Year -> Term; Book groups units

Learning Content
  Lesson -> Videos -> Timeline Events -> Activities
  Lesson -> Word Document -> Vocabulary
  Lesson -> optional Homework -> optional End Lesson Assessment

Independent Learning Paths
  Story -> Chapter -> Story Lesson -> Story content
  Final Review -> Review Unit -> Review Lesson -> Exam
  Games -> Game Assignment -> Game Attempt

Student State
  Progress, attempts, mistakes, vocabulary mastery, attendance

Value Systems
  XP and achievements are learning rewards; coins and payments are commerce

Operations
  Live classes, notifications, AI, support, reports, analytics, administration
```

## Bounded Contexts

| Context | Aggregate roots | Owns | Does not own |
|---|---|---|---|
| Identity and Access | User | Profile, role, account status, assignments | Passwords, refresh tokens, API secrets |
| Academic Structure | AcademicYear, Term, Stage, Grade, Book, Unit | Curriculum hierarchy and ordering | Student progress |
| Lesson Content | Lesson | Videos, Word document metadata, vocabulary, activities, completion policy | Attempts and rewards |
| Assessment | Homework, Quiz, Assessment | Questions, publication and grading policy | Student identity and wallet |
| Learning Progress | LessonProgress, VideoProgress, Attempts | Student state and completion projections | Content authoring |
| Story | Story | Chapters and story lessons | Main curriculum units |
| Final Review | FinalReview | Review periods, review units, exams | Normal lesson unlocking |
| Games | Game | Game catalog, assignments, attempts | Core lesson completion |
| Live Classes | LiveSession | Availability, bookings, attendance | User authentication |
| Gamification | XPAccount, Wallet | Immutable XP/coin ledgers and current balances | Payment gateway verification |
| Commerce | Payment | Payments, invoices, coupons, entitlements | Educational content definitions |
| Referral | ReferralProfile | Referrals, policies, rewards | Wallet mutation rules |
| Communication | Notification | Preferences, campaigns, delivery history | Authentication and payment truth |
| AI | Conversation, AIAssessment | Messages, educational assessment, usage metadata | Provider prompts and API keys |
| Support | SupportTicket | Ticket lifecycle and messages | Financial and educational mutation |
| Reporting and Analytics | Report, AnalyticsEvent | Read models, exports, event facts | Source-of-truth business state |
| Administration | SystemSetting, AuditLog | Configuration, feature flags, immutable audit | Domain-specific business decisions |

## Entity Catalog

### Identity and Access

- `User`: Firebase Auth UID plus profile, one primary role, account status, and current academic assignment.
- `TeacherAssignment`: explicit teacher-to-grade scope used for authorization; it is not a user permission override.
- `LoginEvent`: immutable authentication audit record. Firebase Auth remains authoritative for credentials and sessions.

Roles are exactly `STUDENT`, `TEACHER`, `SECRETARY`, `SUPPORT`, and `ADMINISTRATOR` for Version 1. Parent is a documented future role and has no Version 1 aggregate.

### Academic Structure

- `EducationalSystem`: selectable educational system.
- `Stage`: educational stage; has many grades.
- `Grade`: student-facing academic grade; belongs to one stage.
- `AcademicYear`: school year; has many terms.
- `Term`: teacher-assigned term; belongs to one academic year.
- `Book`: optional textbook grouping for one grade and term.
- `Unit`: ordered curriculum group for one grade, optionally book/year/term scoped.
- `Lesson`: ordered learning unit for exactly one unit.

Students select educational system, stage, and grade. Teachers or administrators assign academic year and term.

### Lesson Content

- `LessonVideo`: provider-neutral reference to a YouTube unlisted video in Version 1.
- `LessonDocument`: metadata for the uploaded Microsoft Word document; the file is stored in Cloud Storage.
- `TimelineEvent`: timestamp on exactly one video and links to exactly one activity.
- `Activity`: dynamically rendered activity owned by exactly one video.
- `VocabularySection`, `VocabularyItem`, `VocabularyRelation`: generated vocabulary owned by one lesson.
- `Homework`: optional one-to-one learning assignment for a lesson or story lesson.
- `Quiz`: optional one-to-one End Lesson Assessment for a lesson or story lesson.
- `Assessment`: reusable or standalone assessment aggregate for explicitly documented assessment flows.
- `AnswerKey`: server-only grading data for an activity, homework question, quiz question, or assessment question.

Activity configuration is a discriminated union by `activityType`. No untyped JSON or manual activity authoring is allowed for generated lesson activities.

### Independent Learning Paths

- `Story`, `StoryChapter`, `StoryLesson`, `StoryFile`, and `StoryVocabulary` form an independent path with separate progress.
- `FinalReview`, `FinalReviewUnit`, `FinalReviewLesson`, and `FinalReviewQuestion` form a teacher-activated revision path.
- `GameCategory`, `Game`, `GameAssignment`, and `GameAttempt` provide supplementary practice. Games never unlock lessons.

Shared assessment mechanics may be reused by these paths, but their aggregate roots and progress records remain separate.

### Student State

- `LessonProgress`, `VideoProgress`, `TimelineEventProgress`, and `ActivityProgress` are per-student projections.
- `HomeworkAttempt`, `QuizAttempt`, and `AssessmentAttempt` own submitted answers and grading results.
- `VocabularyProgress` tracks learned/favorite state per student and word.
- `Mistake` records every incorrect answer; `MistakeReview` records retries.
- `StudentStats` is a rebuildable dashboard projection, never the only source of truth.

Progress records reference a content version. Historical results must remain interpretable after content is edited.

### Value Systems and Commerce

- `XPAccount` is the current XP summary; `XPTransaction` is immutable history.
- `Achievement` defines an achievement; `UserAchievement` records it for a student.
- `LeaderboardSnapshot` is a period read model calculated only from XP.
- `Wallet` is the current coin summary; `CoinTransaction` is immutable history.
- `CoinPackage`, `Payment`, `Invoice`, `Coupon`, and `ContentEntitlement` model commerce and activation.
- Coins never affect XP, ranking, or lesson assessment scores.

All balance changes are server-authorized, idempotent, and transactionally coupled to their ledger entry.

### Operations, AI, and Communication

- `TeacherAvailability`, `TeacherDateBlock`, `TeacherLiveSettings`, `LiveSession`, `LiveBooking`, `LiveWaitlistEntry`, `LiveAttendance`, and `LiveAnnouncement` model live learning.
- `NotificationPreference`, `NotificationTemplate`, `NotificationCampaign`, `Notification`, `NotificationDelivery`, and `DeviceToken` model channel-independent communication.
- `Conversation` owns nested `messages`; `AIAssessment`, `AIRecommendation`, and `AIUsageEvent` are separate AI records.
- `SupportTicket` owns nested `messages` so ticket conversations have parent-scoped access.
- `KnowledgeDocument` stores AI source metadata. Embeddings remain in the documented vector store, not Firestore.

## Relationship Rules

| Relationship | Cardinality | Enforced by |
|---|---:|---|
| Stage -> Grade | 1:N | `grades.stageId`, server validation |
| Grade -> Unit | 1:N | `units.gradeId`, server validation |
| Unit -> Lesson | 1:N | `lessons.unitId`, server validation |
| AcademicYear -> Term | 1:N | `terms.academicYearId` |
| Lesson/StoryLesson -> LessonVideo | 1:N | `lessonVideos.ownerType`, `lessonVideos.ownerId` |
| LessonVideo -> TimelineEvent | 1:N | `timelineEvents.videoId` |
| TimelineEvent -> Activity | N:1 | `timelineEvents.activityId`; activity must share `videoId` |
| Lesson -> Homework | 1:0..1 | `homework.ownerId` plus unique owner key |
| Lesson -> Quiz | 1:0..1 | `quizzes.ownerId` plus unique owner key |
| User -> Progress | 1:N | `studentId` and deterministic content key |
| User -> Wallet/XPAccount | 1:1 | document ID equals `studentId` |
| User -> ReferralProfile | 1:1 | document ID equals `studentId` |
| LiveSession -> Booking | 1:N | `liveBookings.liveSessionId` |
| Payment -> Invoice | 1:0..1 | `invoices.paymentId` |
| Payment -> Entitlement | 1:N | `contentEntitlements.paymentId` |

Cross-domain references are IDs, not embedded mutable copies. Denormalized display fields are projections and never authoritative.

## Aggregate Boundaries

1. A Lesson aggregate transaction may create/update its lesson, video metadata, completion policy, and document metadata. It must not mutate student progress, XP, coins, or payment state.
2. A Video aggregate owns timeline events and activities. An event cannot reference an activity belonging to another video.
3. An Assessment aggregate owns its questions and grading policy. Answer keys are server-only and are never returned to students.
4. A student attempt owns its answers and final result. A submitted attempt is immutable except for a documented teacher review transition.
5. Wallet and XP ledgers are append-only. Current balances are projections maintained with the ledger in a transaction.
6. Payment verification owns activation of entitlements; clients cannot activate content by writing an entitlement.
7. A LiveSession owns booking capacity and attendance transitions. Booking and waitlist changes use transactions.
8. Notification delivery is asynchronous and cannot change educational or financial state.
9. Reports and analytics are read models. Rebuilding them must not change source aggregates.
10. Audit logs are append-only and cannot be edited or deleted by application roles.

## Global Invariants

1. Every mutable document has `id`, `createdAt`, `updatedAt`, and `schemaVersion`; soft-deletable documents also have `deletedAt`.
2. Every reference ID must point to a document in the same environment and correct domain.
3. A student may access only published content assigned to the student's grade and any active entitlement.
4. Sequential lesson mode requires the previous required video/lesson completion projection before access.
5. A lesson is complete only after all configured requirements pass; homework alone never unlocks a lesson.
6. Final Review is inaccessible unless its activation window and grade scope permit access.
7. Every incorrect answer creates or updates a mistake record; students cannot delete mistakes.
8. XP cannot be purchased or transferred. Coins cannot affect ranking and cannot be transferred between students.
9. Financial, ledger, audit, and submitted-attempt records are never hard-deleted.
10. All external input is validated with a strict Zod schema at the boundary before persistence.

## Versioning and Lifecycle

Content edits create a new `contentVersion` when they can change grading or historical interpretation. Existing progress keeps the version it was evaluated against. User-facing content is soft-deleted; immutable facts are retained. A migration must never silently rewrite submitted answers, ledger entries, payment facts, or audit history.
