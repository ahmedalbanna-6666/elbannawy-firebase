# Query Patterns

## El-bannawy Platform - Firebase Query Strategy

Version: 2.0.0  
Status: Phase 1 design baseline  
Last Updated: 2026-07-21

## Purpose

This document defines the approved query patterns for the El-bannawy Platform's Firestore deployment. It documents the logical query requirements, expected result sets, indexing strategies, cursor-based pagination, caching approaches, and read patterns for each screen and service operation.

Queries are documented from the domain perspective (use case/service responsibilities). Implementation in repositories may add additional filters (e.g., `teacherId` from claims) but must not modify the documented query contract.

## Query Rules

1. Every query must be bounded by tenant/environment, ownership, grade scope, or time. This Version 1 deployment uses one business tenant, but `gradeId` and role scope remain mandatory authorization filters.
2. Every list query returns a deterministic `Page<T>` with a stable cursor. No offset pagination is used.
3. The primary authorization field is always part of the composite index. For read-anywhere queries (e.g., debug/metrics), add an admin-only scope gate at the use case or service layer.
4. Firestore collections are root collections. Nested query patterns are limited to parent-scoped messages (`conversations/{conversationId}/messages`) and `supportTickets/{ticketId}/messages`.
5. Use collection-group queries sparingly and only when strictly required by a documented requirement (e.g., cross-user reports).

## Query Catalog by Screen/Service

### Identity and Access

#### Student Profile Screen
- **Query:** `users` by `userId`
- **Collections:** `users`
- **Required Indexes:** Primary index on `userId`
- **Cursor Strategy:** Direct ID lookup
- **Pagination:** None (single document)
- **Cache Strategy:** 24-hour TTL for profile data
- **Expected Reads:** 1 document
- **Realtime vs One-time Reads:** Real-time for avatar/profile updates

#### Teacher Assignment Management
- **Query:** `teacherAssignments` by `teacherId` and `status`
- **Collections:** `teacherAssignments`
- **Required Indexes:** `teacherId ASC, status ASC, updatedAt DESC`
- **Cursor Strategy:** Limit 50 per page
- **Pagination:** Cursor-based with `updatedAt`
- **Cache Strategy:** 15-minute TTL for assignment scope
- **Expected Reads:** Variable (assignments per teacher)
- **Realtime vs One-time Reads:** Real-time for assignment changes

### Academic Structure

#### Unit Editor (Teacher)
- **Query:** `units` by `gradeId`, `academicYearId`, `termId`, `published`, `displayOrder`
- **Collections:** `units`, `books`, `terms`, `academicYears`
- **Required Indexes:** 
  - `gradeId ASC, published ASC, displayOrder ASC`
  - `gradeId ASC, academicYearId ASC, termId ASC, displayOrder ASC`
- **Cursor Strategy:** Limit 50 per page
- **Pagination:** Cursor on `displayOrder`
- **Cache Strategy:** 30-minute TTL for catalog data
- **Expected Reads:** Variable (units per scope)
- **Realtime vs One-time Reads:** Real-time for published content changes

### Learning Progress

#### Student Lesson View
- **Primary Query Pattern**
  - Read published lesson and unit projections
  - Read `lessonVideos`, `timelineEvents`, `activities`, vocabulary, homework/quiz metadata, and the student's progress records in bounded batches
- **Collection Queries:**
  - `lessons` by `unitId, published, isHidden, displayOrder`
  - `lessonVideos` by `lessonId, enabled, displayOrder`
  - `timelineEvents` by `videoId, enabled, timestampSeconds`
  - `activities` by `videoId, enabled, displayOrder`
  - `vocabularySections`, `vocabularyItems`, `vocabularyRelations` by `lessonId, displayOrder`
  - `lessonProgress` by `studentId, lessonId`
- **Required Indexes:** Multiple composite indexes per collection
- **Cursor Strategy:** Batch per collection type
- **Pagination:** Fixed batch sizes (typically 50 per collection)
- **Cache Strategy:** 2-hour TTL for lesson summaries
- **Expected Reads:** ~10-20 documents (batch read)
- **Realtime vs One-time Reads:** Real-time for progress updates

#### Student Dashboard
- **Query:**
  - `studentStats` by `studentId`
  - `lessonProgress` by `studentId, status`
  - `notifications` by `userId, read`
  - `xpAccounts` by `studentId`
  - `wallets` by `studentId`
- **Collections:** `studentStats`, `lessonProgress`, `notifications`, `xpAccounts`, `wallets`
- **Required Indexes:**
  - `studentId` primary indexes
  - `lessonProgress: studentId ASC, status ASC, updatedAt DESC`
  - `notifications: userId ASC, read ASC, createdAt DESC`
- **Cursor Strategy:** Cursor on `updatedAt`
- **Pagination:** Limit 20 per page
- **Cache Strategy:** 15-minute TTL for dashboard cards
- **Expected Reads:** 5 documents
- **Realtime vs One-time Reads:** Real-time for stats updates

### Assessment and Submission

#### Homework Review (Teacher)
- **Query:** `homeworkAttempts` by `homeworkId, status, submittedAt DESC`
- **Collections:** `homeworkAttempts`, `homeworkAnswers`, `homeworkQuestions`
- **Required Indexes:** `homeworkId ASC, status ASC, submittedAt DESC`
- **Cursor Strategy:** Limit 50 per page
- **Pagination:** Cursor on `submittedAt`
- **Cache Strategy:** 10-minute TTL for submission list
- **Expected Reads:** Variable (attempts per homework)
- **Realtime vs One-time Reads:** Real-time for new submissions

#### Live Session Booking
- **Query:** `liveSessions` by `gradeId, published, status, scheduledAt`
- **Collections:** `liveSessions`, `liveBookings`
- **Required Indexes:** `gradeId ASC, published ASC, status ASC, scheduledAt ASC`
- **Cursor Strategy:** Limit 20 per page
- **Pagination:** Cursor on `scheduledAt`
- **Cache Strategy:** 5-minute TTL for session availability
- **Expected Reads:** Variable (sessions per grade)
- **Realtime vs One-time Reads:** Real-time for availability changes

### Reporting and Analytics

#### Report Generation
- **Query:** `reports` by `ownerId, createdAt DESC`
- **Collections:** `reports`, `reportExports`
- **Required Indexes:** `ownerId ASC, createdAt DESC`
- **Cursor Strategy:** Limit 10 per page
- **Pagination:** Cursor on `createdAt`
- **Cache Strategy:** 30-minute TTL for report history
- **Expected Reads:** Variable (user reports)
- **Realtime vs One-time Reads:** One-time reads for history

#### Teacher Dashboard Reports
- **Query:** Cross-collection aggregation via pre-computed read models
- **Read Models:** `studentStats`, `xpAccounts`, `wallets`, `reports`, `analyticsDailyMetrics`
- **Expected Reads:** 5-10 pre-aggregated documents
- **Cache Strategy:** 10-minute TTL for dashboard metrics
- **Realtime vs One-time Reads:** Real-time for live metrics

### AI and Knowledge

#### AI Conversation History
- **Query:** `conversations` by `userId, status, updatedAt DESC`
- **Collections:** `conversations`
- **Required Indexes:** `userId ASC, updatedAt DESC`
- **Cursor Strategy:** Limit 20 per page
- **Pagination:** Cursor on `updatedAt`
- **Cache Strategy:** 1-hour TTL for conversation list
- **Expected Reads:** Variable (user conversations)
- **Realtime vs One-time Reads:** Real-time for new messages

#### Knowledge Document Search
- **Query:** `knowledgeDocuments` by `approvalStatus, updatedAt DESC`
- **Collections:** `knowledgeDocuments`
- **Required Indexes:** `approvalStatus ASC, updatedAt DESC`
- **Cursor Strategy:** Limited admin-only queries
- **Pagination:** Limit 50 per page
- **Cache Strategy:** 2-hour TTL for knowledge list
- **Expected Reads:** Variable (approved documents)
- **Realtime vs One-time Reads:** One-time reads for admin management

### Support Management

#### Support Ticket Queue (Agent)
- **Query:** `supportTickets` by `assignedTo, status, updatedAt DESC`
- **Collections:** `supportTickets`
- **Required Indexes:** `assignedTo ASC, status ASC, updatedAt DESC`
- **Cursor Strategy:** Limit 20 per page
- **Pagination:** Cursor on `updatedAt`
- **Cache Strategy:** 10-minute TTL for ticket queue
- **Expected Reads:** Variable (tickets per agent)
- **Realtime vs One-time Reads:** Real-time for ticket updates

## Performance Guidelines

### Read Volume Optimization

- **Batch size:** Group related queries to minimize round trips
- **Eager loading:** Load all documents needed for a screen in one batch per collection type
- **Display field projections:** Cache denormalized display fields at service layer
- **Field exclusion:** Never fetch entire documents - use field masks or collection projections

### Index Utilization

- **Leading equality fields:** Always include the most selective authorization fields in composite indexes
- **Order matters:** Equality fields first, then filtering fields, then cursor fields
- **Index sizing:** Keep indexes under 100KB per index when possible
- **Maintenance:** Document all index usage for maintenance planning

### Caching Strategy

- **TTL patterns:**
  - Profile data: 24 hours
  - Catalog/content: 30 minutes to 2 hours
  - Progress/state: 5-15 minutes
  - Notifications: Real-time
  - Admin/config: 30 minutes

- **Cache invalidation:** Invalidate based on collection updates, not time alone
- **Stale-while-revalidate:** Allow brief use of stale data during background updates

### Error Handling Patterns

- **Not found:** Return stable `NOT_FOUND` error for missing aggregates
- **Conflict:** Use optimistic concurrency with version checks
- **Permission:** Return `FORBIDDEN` for authorization failures
- **Idempotency:** All writes include request ID for replay detection

## Compliance Summary

### Query Validation Checklist

1. **Authorization Field:** Every query includes a bound on tenant, ownership, grade scope, or time
2. **Deterministic Pagination:** All list queries use cursor-based pagination with stable ordering
3. **Index Coverage:** Every query maps to a documented composite index
4. **Bounded Results:** All queries have a documented page size limit
5. **Access Control:** Teacher queries include `gradeId` scope from trusted assignment
6. **Real-time Usage:** Real-time queries are documented where required for user experience
7. **Admin Access:** Admin-only queries are marked and gate-checked at the service layer
8. **Cross-Collection:** All cross-collection queries use read models or bounded list patterns
9. **Cache Strategy:** Every query has a documented caching approach
10. **Expected Volume:** All query patterns document expected read volume for capacity planning

This document serves as the contract between domain and infrastructure teams for query execution, performance optimization, and query pattern evolution.