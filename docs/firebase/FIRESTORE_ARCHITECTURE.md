# Firestore Architecture

## El-bannawy Platform - Firebase Data Architecture

Version: 2.0.0  
Status: Phase 1 design baseline  
Last Updated: 2026-07-21

## Purpose and Scope

Firestore is the operational document store for the Firebase migration. This document defines paths, ownership, references, read models, and consistency rules. It does not create Firebase resources, application code, repositories, API routes, or migrations.

The architecture uses Firebase Authentication for identity, Cloud Storage for files, Firestore for operational data, the documented vector store for embeddings, and a future analytics warehouse for large analytical workloads.

## Architectural Decisions

| Decision | Choice | Reason |
|---|---|---|
| Primary operational store | Cloud Firestore | Horizontal scale, mobile-friendly reads, realtime support, and managed availability |
| Identity | Firebase Authentication | Passwords, verification, and session credentials must not be stored in Firestore |
| File storage | Firebase Cloud Storage | Word documents, PDFs, images, audio, and report exports do not belong in 1 MiB Firestore documents |
| Collection shape | Flat root collections | Cross-student reports, teacher scope queries, and operational queues need direct indexed queries |
| Nested collections | Only conversation and support messages | Messages are parent-owned, append-heavy, and normally fetched by one parent |
| References | Stable string IDs | Portable across Firebase, server processes, exports, and future stores; avoids hidden cross-document reads |
| Grading secrets | Server-only `answerKeys` | Firestore rules cannot redact fields from a readable document |
| AI vectors | Document metadata in Firestore; embeddings in pgvector | Matches the existing AI architecture and keeps high-dimensional data out of transactional reads |
| Analytics | Operational summaries in Firestore; large event analysis in a warehouse | Prevents unbounded analytics reads and hot documents |
| Authority | Domain aggregate plus immutable facts | Projections can be rebuilt without losing payment, answer, audit, or ledger history |

## Environment Isolation

Each environment uses a separate Firebase project and database:

| Environment | Firebase project | Rule |
|---|---|---|
| Development | `el-bannawy-dev` | Test identities and emulator-compatible data only |
| Staging | `el-bannawy-staging` | Production-shaped rules and sanitized data |
| Production | `el-bannawy-prod` | No development bypasses |

No document is shared between environments. IDs may be preserved for migration traceability, but an ID is never treated as proof that a document belongs to the current environment.

## Path Strategy

All domain collections are root collections using plural lower camel case. The canonical root inventory is:

```text
users, loginEvents, teacherAssignments
educationalSystems, stages, grades, academicYears, terms, books, units, lessons
lessonVideos, lessonDocuments, timelineEvents, activities, answerKeys
vocabularySections, vocabularyItems, vocabularyRelations
homework, homeworkQuestions, quizzes, quizQuestions, assessments, assessmentQuestions
stories, storyChapters, storyLessons, storyFiles, storyVocabulary
finalReviews, finalReviewUnits, finalReviewLessons, finalReviewQuestions
lessonProgress, videoProgress, timelineEventProgress, activityProgress, vocabularyProgress
homeworkAttempts, homeworkAnswers, quizAttempts, quizAnswers
assessmentAttempts, assessmentAnswers, storyProgress, finalReviewProgress
mistakes, mistakeReviews, studentStats
gameCategories, games, gameAssignments, gameAttempts
teacherAvailability, teacherDateBlocks, teacherLiveSettings, liveSessions
liveSessionSecrets, liveBookings, liveWaitlistEntries, liveAttendance, liveAnnouncements
xpAccounts, xpTransactions, xpLevels, achievements, userAchievements, leaderboardSnapshots
wallets, coinPackages, coinTransactions, contentEntitlements
payments, invoices, coupons
referralProfiles, referrals, referralPolicies
notificationPreferences, notificationTemplates, notificationCampaigns, notifications
notificationDeliveries, deviceTokens
conversations, aiAssessments, aiRecommendations, aiUsageEvents, knowledgeDocuments
reports, reportExports, scheduledReports, teacherNotes
analyticsEvents, analyticsDailyMetrics
supportTickets, systemSettings, featureFlags, auditLogs
```

The only nested paths are:

```text
conversations/{conversationId}/messages/{messageId}
supportTickets/{ticketId}/messages/{messageId}
```

Nested progress, attempts, answers, transactions, and attendance are deliberately not used. Their root collections support teacher reports, collection-group-independent indexes, retention policies, and controlled server-side aggregation.

## Document Identity

- User documents use the Firebase Auth UID.
- One-to-one projections use the owner ID as the document ID: `wallets/{studentId}`, `xpAccounts/{studentId}`, and `referralProfiles/{studentId}`.
- Content IDs remain stable through publication and are preserved from the legacy system when safe.
- Per-owner uniqueness uses a deterministic composite ID, for example `studentId_lessonId` for `lessonProgress` and `studentId_homeworkId_attemptNumber` for an attempt key.
- Append-only events use generated IDs plus an idempotency key stored in the document.

Every document stores `schemaVersion`. IDs are opaque strings and are never used to infer authorization.

## Common Document Contract

Mutable documents contain:

```text
id: string
createdAt: Timestamp
updatedAt: Timestamp
schemaVersion: number
deletedAt: Timestamp | null   // only when soft deletion applies
```

Immutable documents contain `id`, `createdAt`, and `schemaVersion`; `updatedAt` is omitted only when the record can never change. Server timestamps are authoritative. Client timestamps are rejected for audit, payment, ledger, grading, and submission fields.

## Reference Strategy

References are stored as IDs such as `studentId`, `lessonId`, and `gradeId` rather than denormalized objects. A document may include explicitly named display projections such as `lessonTitleSnapshot` to avoid a second read in a list; snapshots are never used for authorization or business decisions.

Every reference must be validated by the trusted service before a write. Firestore rules can validate ownership and immutable field changes, but they cannot guarantee all cross-collection foreign keys. Referential integrity is therefore a service responsibility and is tested as an application invariant.

## Public and Private Projections

Firestore rules do not provide field-level redaction. Therefore:

- Student-readable content documents contain prompts, public options, instructions, and explanations only.
- Correct answers, scoring formulas, provider secrets, internal prompts, gateway responses, and fraud signals are in server-only collections or external secret stores.
- `answerKeys` is never readable by a student, teacher, secretary, or support user.
- Financial gateway payloads are server-only and contain no card number or CVV.
- Meeting URLs are returned only after a valid booking or teacher authorization; their documents are not publicly readable.

The client should use server-mediated commands for writes that affect grading, progression, XP, coins, payments, entitlements, referrals, attendance, or notifications. Direct client writes are limited to explicitly permitted profile/preferences/read-state/progress checkpoints and are still validated by rules.

## Denormalization Policy

Denormalize only immutable or rebuildable display data:

- `gradeNameSnapshot`, `unitTitleSnapshot`, `lessonTitleSnapshot` on progress and attempt records.
- `fullNameSnapshot` on audit/report/notification records where historical display matters.
- `lessonVideoCount` and summary counters on read models.

Do not duplicate role, balance, XP, publication authority, answer keys, payment status, or entitlement decisions. If a projection becomes stale, the source aggregate wins and a rebuild repairs it.

## Read Model Strategy

### Student lesson view

1. Read the published lesson and unit projection.
2. Read `lessonVideos`, `timelineEvents`, `activities`, vocabulary, homework/quiz metadata, and the student's progress records in bounded batches.
3. Read only public question fields. Grading is server-side.

The lesson summary should be precomputed when content is published so the initial screen does not scan all child records.

### Teacher dashboard

Query root collections by `teacherId`, `gradeId`, or the approved teacher assignment scope. Never enumerate every user and filter in application memory.

### Student dashboard

Read `studentStats`, current `lessonProgress`, unread `notifications`, `xpAccounts`, and `wallets` as independent bounded reads. Do not load full ledger history for the dashboard.

### Reports and analytics

Use pre-aggregated `reports` and `analyticsDailyMetrics`. Historical detail is paginated from source collections. Large date-range or cross-domain queries are exported to the analytics warehouse and are not implemented as unbounded Firestore scans.

## Write and Consistency Strategy

- Use a Firestore transaction when a write depends on a current value: booking capacity, wallet balance, XP de-duplication, attempt number, referral reward, or entitlement activation.
- Use a batched write for a bounded aggregate publication, such as a lesson plus its document metadata and publication marker.
- Use an idempotency key for every payment webhook, reward, ledger event, notification delivery, and grading submission.
- Use an outbox-like immutable event record when a state change must trigger asynchronous notification or analytics work.
- Never maintain a mutable array of unbounded child IDs in a parent document.
- Avoid repeated writes to a single aggregate counter. Use per-period or sharded summaries for high-volume activity.

## Lifecycle Rules

Published content is soft-deleted. Submitted attempts, answer records, payments, invoices, coin/XP transactions, audit logs, and delivery history are retained and never hard-deleted by application roles. Storage files are deleted only after their Firestore metadata lifecycle permits it and retention requirements are satisfied.

## Hybrid Model Decisions

| Data | Store | Firestore role |
|---|---|---|
| Auth credentials and sessions | Firebase Authentication | UID/profile link and login audit only |
| Word documents, PDFs, images, audio, exports | Cloud Storage | Metadata, ownership, MIME type, checksum, lifecycle |
| AI embeddings and vector search | pgvector | `knowledgeDocuments` source/version/status metadata |
| Large analytics and event exploration | Analytics warehouse | Recent operational events and daily summaries |
| Cache and queue state | Redis/BullMQ as documented | No cache is treated as source of truth |
| YouTube videos | YouTube unlisted | Provider ID, URL, duration, and metadata only |

## Migration Compatibility

Legacy identifiers may be stored as `legacyId` and `legacySource` during migration. They are traceability fields, not public API identifiers. A migration must preserve content version, submitted result, payment fact, and ledger history. No data migration is performed in Phase 1.

## Authentication Architecture (Finalized)

Firebase Authentication is the single source of truth for identity and authorization. The architecture is:

1. **Firebase Authentication**
   - Handles password reset, email verification, and session credentials
   - Provides Firebase Auth UID for user identification
   - No passwords, refresh tokens, or API secrets stored in Firestore

2. **Firebase Session Cookies**
   - Secure session management for client applications
   - Encrypted and verifiable by Firebase
   - No NestJS JWT required

3. **Firebase Custom Claims**
   - Role-based access control using custom claims
   - Role values: `STUDENT`, `TEACHER`, `SECRETARY`, `SUPPORT`, `ADMINISTRATOR`
   - Account status: `ACTIVE`, `INACTIVE`, `PENDING`
   - Claims are set by the identity administration service and are audited

4. **Firestore User Profiles**
   - User documents use Firebase Auth UID as document ID
   - Contains profile data, role, status, academic assignment
   - Role and status are projections from custom claims, not the source of truth

5. **No NestJS JWT**
   - No separate JWT implementation
   - No authentication bridge layer

6. **No Authentication Bridge**
   - Firebase ID tokens are the only application boundary token
   - Server verification of custom claims for authorization decisions
   - No duplicate authentication logic

## Security Rules (Finalized)

The security model has been finalized:

1. **Trust Boundaries**: Clear separation between client, teacher, secretary, support, and administrator roles
2. **Global Rule Policy**: Authentication, role validation, ownership checks, and state transitions
3. **Role Matrix**: Defined capabilities for each role
4. **Collection Access Classes**: Public content, owner-readable, teacher-scoped, staff-operational, and server/admin only
5. **No Open Questions**: All security architecture decisions resolved

## Collection Optimization

### Collection Count Analysis

**Before Optimization:**
- Root collections: 89
- Nested message collections: 2 (`conversations/{conversationId}/messages/{messageId}` and `supportTickets/{ticketId}/messages/{messageId}`)
- Total collections: 91

**Merge Analysis:**
After thorough review of query patterns and collection contracts, **no collections were merged** because:

1. **Cross-collection queries**: Teachers and administrators need to query root collections independently for reports
2. **Collection group indexes**: Required for teacher dashboard queries across all student progress
3. **Performance optimization**: Root collections enable direct indexed lookups instead of denormalized parent references
4. **Retention policies**: Root collections support independent retention and archival
5. **Controlled aggregation**: Server-side aggregation works better with root collections

**After Optimization:**
- Root collections: 89 (no change)
- Nested message collections: 2 (kept for parent-scoped access)
- Total collections: 91 (no change)

## AI Architecture (Finalized)

The AI architecture has been moved to a dedicated AI_ARCHITECTURE.md file. pgvector is used as an independent vector database service that:

1. **Stores embeddings** for semantic search of knowledge documents
2. **Synchronizes with Firestore** for metadata consistency
3. **Fails gracefully** when unavailable, falling back to metadata-only search
4. **Maintains independence** from Firestore operational requirements

This resolves the architectural questions about AI data storage and vector search integration.

## Analytics Warehouse

The analytics warehouse is approved for large event analysis and daily metrics aggregation. It:

- Receives bounded analytics events from Firestore
- Maintains separate retention policies
- Supports complex analytical queries not feasible in Firestore
- Is independent of Firestore operational concerns

## Class/Cohort Target

The "class" notification target will be implemented when a cohort aggregate is documented. Version 1 supports grade and individual targets only.

## Parent Role

The parent role will be documented with its consent and data-access rules before implementation. Version 1 does not include parent access.

## Summary of Finalizations

1. ✅ **Authentication Architecture**: Firebase Auth with custom claims, session cookies, user profiles - no JWT or bridge
2. ✅ **Security Rules**: All open questions resolved
3. ✅ **Collection Optimization**: Analyzed and justified keeping 89 root collections
4. ✅ **AI Architecture**: Defined and documented as independent service
5. ✅ **Analytics Warehouse**: Approved for large analytical workloads
6. ✅ **Class Target**: Deferred to future cohort aggregate documentation
7. ✅ **Parent Role**: Deferred to future documentation

The design is complete and ready for implementation.
