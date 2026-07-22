# Lessons Module — Business Rules

## El-bannawy Platform

Version: 1.0.0  
Status: Phase 6.1 (Lessons Core Module)  
Last Updated: 2026-07-22

---

## Purpose

This document defines the business rules governing Lesson entities in the El-bannawy Platform. These rules apply to all implementations, APIs, and integrations involving lessons.

---

## 1. Entity Definition

### 1.1 Lesson

A Lesson is an individual instructional unit within a curriculum Unit.

### 1.2 Hierarchy

```
EducationalSystem → Stage → Grade → AcademicYear → Term → Unit → Lesson
```

A Lesson belongs to exactly one Unit (via `unitId`).

---

## 2. Ordering Rules

See `ORDERING_POLICY.md` for complete ordering rules.

### 2.1 Display Order

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| ORD-001 | Every lesson MUST have a non-negative integer `displayOrder` value. | Zod schema validation. |
| ORD-002 | `displayOrder` MUST be unique within the same `unitId` for active (non-deleted) lessons. | Application-layer validation before create/update. |
| ORD-003 | Lessons are displayed in ascending `displayOrder` sequence. | Firestore query `orderBy('displayOrder', 'asc')`. |
| ORD-004 | Ordering starts at 0. | Schema allows `min(0)`. |
| ORD-005 | Gaps in ordering are allowed. | Explicit design decision. |

### 2.2 Insertion

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| INS-001 | When inserting a new lesson, the caller MUST provide an explicit `displayOrder` value. | Zod schema requires `displayOrder`. |
| INS-002 | The system SHALL NOT auto-shift existing lessons. | Explicit design decision. |
| INS-003 | If inserting between two existing lessons, the caller MUST update the `displayOrder` of affected lessons via `PATCH /:id/order`. | Client-side responsibility. |

### 2.3 Deletion

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| DEL-001 | Soft-deleting a lesson SHALL NOT trigger automatic reordering of remaining lessons. | Repository does not reorder on delete. |
| DEL-002 | Deleted lessons are excluded from list queries via `deletedAt == null` filter. | QueryBuilder filter. |
| DEL-003 | If reordering is desired after deletion, callers MUST use `PATCH /:id/order` on affected lessons. | Explicit design decision. |

### 2.4 Restore

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| RST-001 | Restoring a lesson restores its `displayOrder` value as-is. | Repository sets `deletedAt = null` only. |
| RST-002 | If the restored `displayOrder` conflicts with an existing active lesson, the caller MUST reassign a new `displayOrder` value. | Client-side responsibility. |

---

## 3. Status Rules

### 3.1 Lesson Status

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| STA-001 | A lesson MUST have one of: `draft`, `published`, `archived`. | Zod LessonStatusEnum. |
| STA-002 | `draft` is the default status on creation. | Repository sets `status: 'draft'`. |
| STA-003 | `published` is set via `POST /:id/publish`. | Repository sets `status: 'published'` and `isPublished: true`. |
| STA-004 | `archived` is set via `archiveLesson`. | Repository sets `status: 'archived'`, `isPublished: false`, `isVisible: false`. |
| STA-005 | Unpublishing sets status back to `draft`. | Repository sets `status: 'draft'` and `isPublished: false`. |

### 3.2 Publication

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PUB-001 | `isPublished: true` is required for student-visible content. | Repository / service layer. |
| PUB-002 | Published lessons must also have `status: 'published'`. | Repository `publishLesson` sets both. |
| PUB-003 | Unpublishing does NOT delete the lesson. | `unpublishLesson` only updates status. |

### 3.3 Visibility

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| VIS-001 | `isVisible: true` (default) makes the lesson appear in listings. | Zod default `true`. |
| VIS-002 | `isVisible: false` hides the lesson from student-facing queries. | Filter in client queries. |
| VIS-003 | Archived lessons automatically have `isVisible: false`. | Repository `archiveLesson`. |

---

## 4. Navigation Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| NAV-001 | `getPreviousLesson` returns the lesson with the highest `displayOrder` lower than the current lesson in the same unit. | Repository query + sort desc. |
| NAV-002 | `getNextLesson` returns the lesson with the lowest `displayOrder` higher than the current lesson in the same unit. | Repository query + sort asc. |
| NAV-003 | Navigation methods ignore soft-deleted lessons. | `getLessonsByUnit` filters `deletedAt == null`. |
| NAV-004 | Navigation methods ignore archived lessons. | Status-based filtering in client queries. |

---

## 5. Soft Delete Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| SD-001 | Lessons support soft delete via `deletedAt` (Timestamp or null). | Repository implementation. |
| SD-002 | A soft-deleted lesson returns `NOT_FOUND` on `getLessonById`. | Repository checks `deletedAt`. |
| SD-003 | Soft-deleted lessons are excluded from `listLessons` and `getLessonsByUnit`. | QueryBuilder filter `deletedAt == null`. |
| SD-004 | Soft-deleted lessons can be restored via `restoreLesson`. | Repository sets `deletedAt = null`. |
| SD-005 | Soft delete requires a non-empty `requestId` for audit trail. | Repository validation. |

---

## 6. Validation Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| VAL-001 | `id` MUST be a non-empty string. | Zod `LessonIdSchema`. |
| VAL-002 | `unitId` MUST be a non-empty string. | Zod `CreateLessonInputSchema`. |
| VAL-003 | `title` MUST be a non-empty string, max 300 characters. | Zod schema. |
| VAL-004 | `slug` MUST be a non-empty string, max 300 characters, lowercase alphanumeric with hyphens. | Zod regex `/^[a-z0-9-]+$/`. |
| VAL-005 | `description` is optional, max 5000 characters. | Zod schema. |
| VAL-006 | `displayOrder` MUST be a non-negative integer. | Zod schema `min(0)`. |
| VAL-007 | `status` MUST be one of `draft`, `published`, `archived` (default `draft`). | Zod `LessonStatusEnum`. |
| VAL-008 | `isPublished` defaults to `false`. | Zod schema. |
| VAL-009 | `isVisible` defaults to `true`. | Zod schema. |
| VAL-010 | `estimatedDuration` is optional, minimum 1 minute. | Zod schema `min(1)`. |

---

## 7. Versioning Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| VER-001 | `schemaVersion` is set to 1 for all new lessons. | `LessonFirestoreMapper.SCHEMA_VERSION`. |
| VER-002 | `_expectedVersion` can be passed during updates for optimistic concurrency. | Repository layer. |

---

## 8. Invariants

The following invariants MUST hold at all times:

1. Every lesson belongs to exactly one unit (`unitId` is required).
2. Within a unit, `displayOrder` values of active lessons form a non-repeating sequence.
3. A lesson is NOT a parent of any child entities in this phase (activities, vocabulary, etc.).
4. Deleting a lesson does not invalidate existing progress records (soft delete).
5. A restored lesson may require manual `displayOrder` reassignment if conflicts arise.
6. Navigation (prev/next) only considers active (non-deleted, non-archived) lessons.

---

## 9. Out of Scope (Phase 6.1)

The following are explicitly NOT part of this phase:

- Activities (grammar, listening, speaking, reading, writing)
- Vocabulary items
- Reading passages
- Listening exercises
- Video content
- PDF resources
- Homework assignments
- Quiz questions
- AI-powered content generation
- Game-based activities
- Student progress tracking per lesson
- Lesson completion logic
- Analytics dashboards per lesson
