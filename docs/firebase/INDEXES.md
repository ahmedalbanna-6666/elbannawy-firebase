# Firestore Indexes

## El-bannawy Platform - Query and Performance Contract

Version: 2.0.0  
Status: Phase 1 design baseline  
Last Updated: 2026-07-21

## Purpose

This document defines the approved query shapes and the composite indexes required by the collection contract. Single-field indexes are left enabled only for fields used by an approved query. Array and descending indexes are enabled deliberately. Indexes are design artifacts; no Firebase index configuration is created in Phase 1.

## Index Rules

1. Every query must be bounded by tenant/environment, ownership, grade scope, or time. This Version 1 deployment has one business tenant, but `gradeId` and role scope remain mandatory authorization filters.
2. Every list query has a deterministic `orderBy`, a cursor, and a hard page size.
3. The first equality fields in a composite index are the most selective authorization/scope fields; the final field is normally the sort field.
4. Do not create indexes for fields that are never filtered or ordered.
5. Do not query large arrays with `array-contains-any` unless the list is bounded to the Firestore limit and the result is paginated.
6. Use `count()` for counts and materialized summaries for dashboards; do not read every child document to calculate a card.
7. Indexes do not enforce uniqueness. Deterministic IDs or trusted transactions enforce uniqueness.
8. Collection names and field names in this document are canonical. A query that needs a new composite index requires a documentation update first.

## Composite Index Catalog

Each row is an index in equality-field order followed by the order field. `ASC`/`DESC` is part of the query contract.

| Collection | Fields | Query |
|---|---|---|
| `users` | `role ASC, status ASC, createdAt DESC` | Admin users by role/status |
| `users` | `gradeId ASC, status ASC, createdAt DESC` | Students in a grade |
| `teacherAssignments` | `teacherId ASC, status ASC, createdAt DESC` | Teacher grade scope |
| `teacherAssignments` | `gradeId ASC, status ASC, createdAt DESC` | Teachers for a grade |
| `grades` | `stageId ASC, active ASC, displayOrder ASC` | Ordered active grades |
| `terms` | `academicYearId ASC, displayOrder ASC` | Terms in year |
| `books` | `gradeId ASC, termId ASC, displayOrder ASC` | Books for grade/term |
| `units` | `gradeId ASC, published ASC, displayOrder ASC` | Published curriculum |
| `units` | `gradeId ASC, academicYearId ASC, termId ASC, displayOrder ASC` | Scoped unit list |
| `lessons` | `unitId ASC, published ASC, isHidden ASC, displayOrder ASC` | Ordered visible lessons |
| `lessons` | `gradeId ASC, published ASC, displayOrder ASC` | Teacher/student grade lesson feed |
| `lessonVideos` | `lessonId ASC, enabled ASC, displayOrder ASC` | Lesson video list |
| `lessonVideos` | `ownerType ASC, ownerId ASC, enabled ASC, displayOrder ASC` | Story/review video list |
| `timelineEvents` | `videoId ASC, enabled ASC, timestampSeconds ASC` | Timeline playback events |
| `activities` | `videoId ASC, enabled ASC, displayOrder ASC` | Video activity list |
| `activities` | `lessonId ASC, activityType ASC, displayOrder ASC` | Admin/activity reporting |
| `vocabularySections` | `lessonId ASC, displayOrder ASC` | Lesson vocabulary sections |
| `vocabularyItems` | `lessonId ASC, displayOrder ASC` | Ordered vocabulary |
| `vocabularyRelations` | `lessonId ASC, sectionId ASC, displayOrder ASC` | Vocabulary relations |
| `homeworkQuestions` | `homeworkId ASC, displayOrder ASC` | Homework form |
| `quizQuestions` | `quizId ASC, displayOrder ASC` | Quiz form |
| `assessmentQuestions` | `assessmentId ASC, displayOrder ASC` | Assessment form |
| `assessments` | `visibility ASC, gradeId ASC, startAt ASC` | Available assessments |
| `stories` | `gradeId ASC, published ASC, displayOrder ASC` | Published stories |
| `storyChapters` | `storyId ASC, published ASC, displayOrder ASC` | Story chapters |
| `storyLessons` | `chapterId ASC, published ASC, displayOrder ASC` | Chapter lessons |
| `storyFiles` | `storyLessonId ASC, createdAt DESC` | Story lesson files |
| `storyVocabulary` | `storyLessonId ASC, displayOrder ASC` | Story vocabulary |
| `finalReviews` | `gradeId ASC, enabled ASC, opensAt ASC` | Active review periods |
| `finalReviewUnits` | `finalReviewId ASC, published ASC, displayOrder ASC` | Review units |
| `finalReviewLessons` | `finalReviewUnitId ASC, published ASC, displayOrder ASC` | Review lessons |
| `finalReviewQuestions` | `finalReviewUnitId ASC, exam ASC, displayOrder ASC` | Practice/exam questions |
| `lessonProgress` | `studentId ASC, status ASC, updatedAt DESC` | Student active/completed lessons |
| `lessonProgress` | `studentId ASC, gradeId ASC, updatedAt DESC` | Student grade dashboard |
| `videoProgress` | `studentId ASC, lessonId ASC, updatedAt DESC` | Resume lesson |
| `timelineEventProgress` | `studentId ASC, videoId ASC, completed ASC` | Required event gate |
| `activityProgress` | `studentId ASC, lessonId ASC, updatedAt DESC` | Lesson activity state |
| `vocabularyProgress` | `studentId ASC, ownerType ASC, learned ASC` | Learned/not learned filter |
| `vocabularyProgress` | `studentId ASC, favorite ASC, lastReviewedAt DESC` | Favorite/recent vocabulary |
| `homeworkAttempts` | `studentId ASC, homeworkId ASC, submittedAt DESC` | Student homework history |
| `homeworkAttempts` | `homeworkId ASC, status ASC, submittedAt DESC` | Teacher homework review |
| `quizAttempts` | `studentId ASC, quizId ASC, submittedAt DESC` | Student quiz history |
| `quizAttempts` | `quizId ASC, passed ASC, submittedAt DESC` | Teacher quiz statistics |
| `assessmentAttempts` | `studentId ASC, assessmentId ASC, submittedAt DESC` | Assessment history |
| `assessmentAttempts` | `assessmentId ASC, status ASC, submittedAt DESC` | Assessment reporting |
| `homeworkAnswers` | `attemptId ASC, questionId ASC` | Exact answer lookup |
| `quizAnswers` | `attemptId ASC, questionId ASC` | Exact answer lookup |
| `assessmentAnswers` | `attemptId ASC, questionId ASC` | Exact answer lookup |
| `storyProgress` | `studentId ASC, storyId ASC, updatedAt DESC` | Story continue learning |
| `finalReviewProgress` | `studentId ASC, finalReviewId ASC, updatedAt DESC` | Review dashboard |
| `mistakes` | `studentId ASC, status ASC, lastReviewedAt DESC` | Mistake filters |
| `mistakes` | `studentId ASC, lessonId ASC, status ASC` | Mistakes by lesson |
| `mistakeReviews` | `mistakeId ASC, reviewedAt DESC` | Review history |
| `gameAssignments` | `gradeId ASC, enabled ASC, startsAt ASC` | Grade game assignments |
| `gameAssignments` | `studentId ASC, enabled ASC, startsAt ASC` | Student assignments |
| `gameAttempts` | `studentId ASC, gameId ASC, playedAt DESC` | Game history |
| `teacherAvailability` | `teacherId ASC, active ASC, dayOfWeek ASC` | Availability calendar |
| `teacherDateBlocks` | `teacherId ASC, date ASC` | Blocked dates |
| `liveSessions` | `gradeId ASC, published ASC, status ASC, scheduledAt ASC` | Available sessions |
| `liveSessions` | `teacherId ASC, status ASC, scheduledAt ASC` | Teacher calendar |
| `liveSessions` | `status ASC, scheduledAt ASC` | Reminder worker queue |
| `liveSessionSecrets` | `liveSessionId ASC` | Authorized meeting-link lookup |
| `liveBookings` | `liveSessionId ASC, status ASC, bookedAt ASC` | Session roster |
| `liveBookings` | `studentId ASC, status ASC, bookedAt DESC` | Student bookings |
| `liveWaitlistEntries` | `liveSessionId ASC, status ASC, position ASC` | Waitlist promotion |
| `liveAttendance` | `liveSessionId ASC, status ASC` | Attendance report |
| `liveAttendance` | `studentId ASC, joinedAt DESC` | Student attendance |
| `xpTransactions` | `studentId ASC, occurredAt DESC` | XP history |
| `xpTransactions` | `sourceType ASC, occurredAt DESC` | Reward analytics |
| `leaderboardSnapshots` | `periodType ASC, periodKey ASC, scopeType ASC, scopeId ASC, rank ASC` | Leaderboard page |
| `coinTransactions` | `studentId ASC, occurredAt DESC` | Coin history |
| `contentEntitlements` | `studentId ASC, contentType ASC, active ASC` | Access check |
| `contentEntitlements` | `contentType ASC, contentId ASC, active ASC` | Entitlement administration |
| `payments` | `studentId ASC, createdAt DESC` | Student payments |
| `payments` | `status ASC, createdAt DESC` | Payment operations |
| `invoices` | `studentId ASC, issuedAt DESC` | Invoice history |
| `coupons` | `active ASC, expiresAt ASC` | Available coupons |
| `referrals` | `referrerId ASC, status ASC, registeredAt DESC` | Referral dashboard |
| `referrals` | `referralCode ASC, status ASC` | Referral validation |
| `notifications` | `userId ASC, read ASC, createdAt DESC` | Unread notifications |
| `notifications` | `userId ASC, createdAt DESC` | Notification history |
| `notificationDeliveries` | `status ASC, nextAttemptAt ASC` | Delivery retry queue |
| `notificationDeliveries` | `userId ASC, createdAt DESC` | Delivery history |
| `notificationCampaigns` | `status ASC, scheduledAt ASC` | Campaign scheduler |
| `conversations` | `userId ASC, status ASC, updatedAt DESC` | AI conversation list |
| `aiAssessments` | `studentId ASC, createdAt DESC` | AI assessment history |
| `aiUsageEvents` | `provider ASC, occurredAt DESC` | AI operations metrics |
| `knowledgeDocuments` | `approvalStatus ASC, updatedAt DESC` | Approved knowledge source management |
| `reports` | `ownerId ASC, createdAt DESC` | User report history |
| `reportExports` | `requestedBy ASC, requestedAt DESC` | Export history |
| `scheduledReports` | `active ASC, nextRunAt ASC` | Report scheduler |
| `analyticsEvents` | `eventType ASC, occurredAt DESC` | Recent event processing |
| `analyticsDailyMetrics` | `metricName ASC, metricDate DESC` | KPI trend |
| `supportTickets` | `assignedTo ASC, status ASC, updatedAt DESC` | Agent queue |
| `supportTickets` | `status ASC, priority ASC, createdAt ASC` | Escalation queue |
| `auditLogs` | `entity ASC, entityId ASC, occurredAt DESC` | Entity audit history |
| `auditLogs` | `actorId ASC, occurredAt DESC` | Actor audit history |

## Single-Field Index Policy

The following fields require single-field indexes because they are queried without a compound scope or are used as operational lookup keys: `users.mobileNumber`, `users.role`, `users.status`, `educationalSystems.code`, `stages.code`, `grades.code`, `academicYears.isActive`, `answerKeys.itemId`, `referralProfiles.code`, `payments.gatewayTransactionId`, `payments.idempotencyKey`, `invoices.invoiceNumber`, `coupons.code`, `deviceTokens.tokenHash`, and all deterministic ID lookups.

Disable indexing for large `Map` fields, rendered text, provider metadata, answer payloads, gateway payloads, and free-form analytics properties unless a documented query requires them. This reduces index storage and index-entry pressure.

## Query Patterns That Are Prohibited

- Fetching every user to calculate a grade report.
- Fetching every progress document to render a student dashboard.
- Filtering by role or ownership only in application memory.
- Ordering without a cursor on a high-volume collection.
- Querying private `answerKeys` from a client.
- Using a mutable parent array for all child IDs.
- Running unbounded date-range analytics directly over `analyticsEvents`.
- Using `offset` pagination; use document cursors.

## Performance Considerations

- Keep list pages at a documented limit, normally 20-50 documents.
- Prefer one bounded query over many per-row reads; use snapshots only for display fields.
- Cache published lesson summaries and stable academic lookups at the service layer.
- Use `studentStats`, `xpAccounts`, `wallets`, `reports`, and `analyticsDailyMetrics` for dashboard cards.
- Avoid sustained writes to one document. Wallet writes are transactional but low frequency; high-volume counters use per-period/sharded records.
- Treat a Firestore transaction retry as normal and make all transaction commands idempotent.
- Retain raw analytics for a bounded period in Firestore and export older data to the analytics warehouse.
- Measure read count, document size, index storage, transaction retry rate, and p95 latency in staging before production approval.

## Index Review Checklist

Before adding an index, document the exact query, expected cardinality, page size, sort direction, authorization filter, and write/read volume. Remove unused indexes after observing production query metrics; do not remove an index used by a deployed version without a compatibility review.
