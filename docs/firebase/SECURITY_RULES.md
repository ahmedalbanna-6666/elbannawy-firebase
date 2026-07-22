# Firestore Security Rules

## El-bannawy Platform - Security Rules Strategy

Version: 2.0.0  
Status: Phase 1 design baseline  
Last Updated: 2026-07-21

## Purpose

This document defines the authorization model to be implemented in Firestore Security Rules and in the trusted service layer. It is a design contract only. No rules file is created in Phase 1.

Firestore rules are a second enforcement layer, not a replacement for server authorization. A request must satisfy authentication, role, scope, ownership, field allowlist, state-transition, and data-validation checks.

## Trust Boundaries

| Actor | Trust level | Allowed authority |
|---|---|---|
| Unauthenticated client | None | Public Firebase Auth flows only |
| Authenticated student | Restricted | Own profile/preferences/progress/read state and authorized published content |
| Authenticated teacher | Scoped | Assigned grades/students and teacher-owned content |
| Secretary | Operational | Registration, subscription/payment operations, reports allowed by policy; no content authoring |
| Support | Technical | Tickets, troubleshooting metadata, limited user support view; no financial/content/progress mutation |
| Administrator | Full application authority | All documented domains, with audit logging |
| Admin SDK / trusted worker | Bypasses Firestore rules | Only backend services; must enforce domain authorization and audit writes |

Firebase Auth custom claims provide the authoritative role and account status for rules. The `users/{uid}` document is profile data, not a self-service permission source. Claim changes are performed only by the identity administration service and are audited.

## Global Rule Policy

Every rule evaluation follows this order:

1. Require a valid Firebase Auth token.
2. Require account status `ACTIVE` for protected reads and writes.
3. Read role from trusted custom claims; never trust a client-supplied role field.
4. Apply ownership or teacher grade scope.
5. Apply document state, publication, date-window, and entitlement checks.
6. Enforce immutable fields and permitted field changes.
7. Deny by default when a collection or field is not explicitly documented.

Rules must not rely on a client-provided `isAdmin`, `isTeacher`, `ownerId`, `gradeId`, `passed`, `score`, `balance`, `xp`, `status`, or `createdBy` value. Those values are either compared to `request.auth.uid`, checked against existing data, or written only by a trusted service.

## Role Matrix

| Capability | Student | Teacher | Secretary | Support | Administrator |
|---|---:|---:|---:|---:|---:|
| Read own profile | Yes | Yes | Yes | Yes | Yes |
| Change own display profile | Limited | Limited | Limited | Limited | Yes |
| Read published assigned content | Yes | Yes | No by default | No by default | Yes |
| Create/edit lesson content | No | Assigned grade only | No | No | Yes |
| Publish or archive content | No | Assigned grade only | No | No | Yes |
| Read own progress/attempts | Yes | No, aggregate or explicitly scoped | No | No | Yes |
| Submit own answers | Own active attempt | No | No | No | Trusted service only for grading |
| Read scoped student progress | No | Assigned grade/student scope | Operational policy | No | Yes |
| Write XP/coins/entitlements | No | No | No | No | Trusted service/admin workflow |
| Read financial records | Own limited view | Status only | Operational scope | No | Yes |
| Manage live sessions | Book own | Assigned sessions | Scheduling scope | No | Yes |
| Send notifications | No | Assigned targets | Approved operational targets | No | System-wide and all scopes |
| Read AI conversations | Own | No | No | No | Audited support/admin exception |
| Manage support tickets | Own ticket | Own ticket if opened | Operational policy | Assigned tickets | Yes |
| Read audit logs | No | No | No | Limited technical logs | Yes |

## Collection Access Classes

### Public-to-authenticated, published-only content

`educationalSystems`, `stages`, `grades`, `academicYears`, `terms`, `books`, `units`, `lessons`, `lessonVideos`, `timelineEvents`, `activities`, `vocabularySections`, `vocabularyItems`, `vocabularyRelations`, `homework`, `homeworkQuestions`, `quizzes`, `quizQuestions`, `assessments`, `assessmentQuestions`, `stories`, `storyChapters`, `storyLessons`, `storyFiles`, `storyVocabulary`, `finalReviews`, `finalReviewUnits`, `finalReviewLessons`, `finalReviewQuestions`, `gameCategories`, and published `games`.

Reads require authentication and the content's publication and grade/stage scope. `answerKeys` is never included in this class.

### Owner-readable

`users`, `notificationPreferences`, `notifications`, `deviceTokens`, `lessonProgress`, `videoProgress`, `timelineEventProgress`, `activityProgress`, `vocabularyProgress`, `homeworkAttempts`, `homeworkAnswers`, `quizAttempts`, `quizAnswers`, `assessmentAttempts`, `assessmentAnswers`, `storyProgress`, `finalReviewProgress`, `mistakes`, `mistakeReviews`, `studentStats`, `xpAccounts`, `xpTransactions`, `wallets`, `coinTransactions`, `contentEntitlements`, `payments`, `invoices`, `referralProfiles`, `referrals`, `conversations`, and `reports`.

The owner is determined by the document's `studentId`/`userId` or by the parent path for nested messages. Owner writes are limited to the specific fields listed in the collection contract. Submitted, graded, ledger, and payment fields cannot be changed by the owner.

### Teacher-scoped

`teacherAssignments`, `units`, `lessons`, lesson content, assessments, `gameAssignments`, `liveSessions`, `liveAnnouncements`, `teacherNotes`, and scoped reports.

A teacher may access a document only when a trusted assignment grants the teacher the document's `gradeId` scope, or when the teacher is the recorded owner of the session/content. A teacher cannot expand their own assignment by writing an assignment document.

### Staff-operational

`liveBookings` and `liveAttendance` are readable by the session teacher, authorized secretary, and administrator. `payments` are readable by authorized secretaries and administrators; support has no financial access. `supportTickets` and their messages are readable by the ticket owner, assigned support agent, and administrator.

### Server/admin only

`loginEvents`, `answerKeys`, `aiAssessments`, `aiUsageEvents`, `knowledgeDocuments`, `notificationDeliveries`, `liveSessionSecrets`, `xpTransactions` writes, `coinTransactions` writes, `payments` writes, `invoices` writes, `contentEntitlements`, `analyticsEvents`, `analyticsDailyMetrics`, `auditLogs`, `systemSettings`, `featureFlags`, `referralPolicies`, and all grading/reward transitions.

## Student Permissions

Students may:

- Read and update their own allowed profile fields, notification preferences, device registrations, and privacy/read-state fields.
- Read published content for their assigned grade/stage and active premium entitlements.
- Create/update their own in-progress progress checkpoints within bounded numeric ranges.
- Create an active attempt and write answers only for that attempt before submission.
- Submit an attempt exactly once; grading and pass/fail values are trusted-service fields.
- Read their own reports, notifications, XP, coin balance, entitlements, mistakes, and AI conversations.
- Create a support ticket and messages on their own ticket.
- Book/cancel eligible live sessions for themselves.

Students may not:

- Read answer keys, unpublished content, other users' records, private meeting links outside an eligible booking, or internal AI data.
- Modify lesson completion, score, XP, coins, entitlements, referral rewards, attendance, notification history, mistakes, invoices, or audit logs.
- Delete mistakes, submitted attempts, financial facts, or support history.

## Teacher Permissions

Teachers may:

- Create and edit curriculum content only within assigned grade scope.
- Upload lesson document metadata and YouTube references; no video file upload is permitted by this model.
- Configure video order, timelines, generated activity availability, homework, quizzes, completion policy, and review periods within scope.
- Read aggregated and explicitly authorized student progress for assigned grades.
- Manage assigned live sessions, attendance views, scoped announcements, and notification targets.
- Add visible teacher notes to authorized student reports.

Teachers may not:

- Write answer keys, grading results, XP/coin balances, payment facts, entitlements, roles, platform settings, system-wide notifications, or audit logs.
- Grant themselves grades, access another teacher's scope, manually create generated activities, or modify student answers.

## Administrator Permissions

Administrators may manage all documented domains, but sensitive actions still require:

- Authenticated administrator custom claim.
- Explicit field allowlist.
- Audit event containing actor, action, entity, request ID, and redacted before/after values.
- Password reauthentication or step-up control where the identity provider supports it.

Administrator access does not permit writing passwords, gateway secrets, provider API keys, raw card data, or internal AI prompts to Firestore.

## Ownership and State Transitions

Rules must enforce the following transitions even when the caller owns the document:

| Record | Client transition | Trusted transition |
|---|---|---|
| Progress checkpoint | In-progress position/started state | Completion, unlock, score, reward |
| Attempt | Create and answer before submit | Submit result, grade, pass/fail, mistake creation |
| Notification | Read/unread by recipient | Create, delivery, expiry |
| Booking | Book/cancel own eligible booking | Capacity, promotion, session status |
| Wallet | Read own balance | All balance and ledger mutations |
| XP account | Read own XP | All XP and level mutations |
| Payment | Read limited own status | Create, verify, refund, invoice, entitlement |
| Referral | Read own referral status | Validation, approval, reward, fraud decision |
| Support ticket | Create own; reply when permitted | Assignment, escalation, resolution |

## Sensitive Field Rules

The following fields are never client-writable or client-readable unless explicitly projected:

`answer`, `correctAnswer`, `isCorrect`, `score`, `passed`, `balance`, `totalXp`, `xpAwarded`, `amount` on ledgers, `gatewayTransactionId`, raw gateway response, secret references, `meetingUrlSecretRef`, `fraudDecision`, internal support notes, system prompts, provider API keys, IP/user-agent values, and redacted audit before/after fields.

Because Firestore rules cannot hide fields from a readable document, sensitive fields must be stored in a server-only document rather than co-located with public fields.

## Abuse and Integrity Controls

- Use App Check for supported client platforms.
- Require server-created idempotency keys for attempts, payments, rewards, bookings, and delivery events.
- Validate numeric bounds, string lengths, enum values, and reference ownership in rules and service schemas.
- Reject writes that add unexpected fields or change immutable fields.
- Rate-limit authentication, attempt submission, support creation, referral registration, and notification commands outside Firestore rules.
- Never use a client-controlled timestamp for ordering security or financial state.
- Log denied sensitive operations without logging passwords, tokens, secrets, payment data, or unnecessary personal information.

## Backend and Admin SDK Requirements

The Admin SDK bypasses Firestore rules. Every trusted service must therefore have its own repository/service authorization check, strict Zod input validation, idempotency handling, transaction boundary, and audit behavior. A backend service account is not a substitute for a domain permission.

## Testing Requirements for Rules

Before implementation approval, the rules test matrix must cover:

- Unauthenticated access to every collection.
- Student cross-user reads/writes.
- Student reads of unpublished content and answer keys.
- Teacher access inside and outside assigned grade.
- Secretary financial scope and support scope.
- Support access to private educational/financial records.
- Administrator field allowlists and audit requirements.
- Attempt submission replay, wallet manipulation, XP manipulation, entitlement forgery, booking oversubscription, and referral self-abuse.
- Soft-delete, immutable ledger, payment, submitted-attempt, and audit behavior.

## Security Architecture (Finalized)

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

## Open Architecture Questions

1. Define the future parent role and its consent/data-access rules before adding parent documents or rules.
2. Define the future class/cohort notification target specification.  
3. Define the future cohort and parent access patterns before implementation.

These are deferred to future documentation.
