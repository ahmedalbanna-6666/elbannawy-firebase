# Units Module — Business Rules

## El-bannawy Platform

Version: 1.0.0  
Status: Phase 2 (Units Module)  
Last Updated: 2026-07-22

---

## Purpose

This document defines the business rules governing Unit entities in the El-bannawy Platform. These rules apply to all implementations, APIs, and integrations involving units.

---

## 1. Entity Definition

### 1.1 Unit

A Unit is an ordered group of lessons within an academic term.

### 1.2 Hierarchy

```
EducationalSystem → Stage → Grade → AcademicYear → Term → Unit → Lesson
```

A Unit belongs to exactly one Term (via `academicTermId`).

---

## 2. Ordering Rules

### 2.1 Display Order

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| ORD-001 | Every unit MUST have a non-negative integer `order` value. | Zod schema validation. |
| ORD-002 | `order` MUST be unique within the same `academicTermId` for active (non-deleted) units. | Application-layer validation before create/update. |
| ORD-003 | Units are displayed in ascending `order` sequence. | Firestore query `orderBy('order', 'asc')`. |

### 2.2 Insertion

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| INS-001 | When inserting a new unit, the caller MUST provide an explicit `order` value. | Zod schema requires `order`. |
| INS-002 | The system SHALL NOT auto-shift existing units. | Explicit design decision. |
| INS-003 | If inserting between two existing units, the caller MUST update the `order` of affected units via `PATCH /:id/order`. | Client-side responsibility. |
| INS-004 | A future bulk-reorder endpoint may be added; Phase 1 uses per-unit updates. | Documented roadmap intent. |

### 2.3 Deletion

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| DEL-001 | Soft-deleting a unit SHALL NOT trigger automatic reordering of remaining units. | Repository does not reorder on delete. |
| DEL-002 | Deleted units are excluded from list queries via `deletedAt == null` filter. | QueryBuilder filter. |
| DEL-003 | If reordering is desired after deletion, callers MUST use `PATCH /:id/order` on affected units. | Explicit design decision. |

### 2.4 Restore

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| RST-001 | Restoring a unit restores its `order` value as-is. | Repository sets `deletedAt = null` only. |
| RST-002 | If the restored `order` conflicts with an existing active unit, the caller MUST reassign a new `order` value. | Client-side responsibility. |

---

## 3. Publication Rules

### 3.1 Published State

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PUB-001 | A unit MAY be in `published: true` or `published: false` state. | Zod schema (boolean, default `false`). |
| PUB-002 | Only published units are visible to students. | Filter `published: true` in client queries. |
| PUB-003 | Toggling publish state does NOT affect `order` or other fields. | `PATCH /:id/publish` and `/unpublish` only update `published`. |

### 3.2 Premium Content

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PRE-001 | A unit MAY be marked as `isPremium: true`, requiring additional access rights. | Zod schema (boolean, default `false`). |
| PRE-002 | Premium status is independent of published status. | Both fields are independent booleans. |

---

## 4. Activation Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| ACT-001 | A unit MAY be `isActive: true` or `isActive: false`. | Zod schema (boolean, default `true`). |
| ACT-002 | Inactive units are excluded from student-facing queries. | Filter `isActive: true` in client queries. |
| ACT-003 | Inactive units are still accessible to administrators. | No filter applied for admin queries. |

---

## 5. Soft Delete Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| SD-001 | Units support soft delete via `deletedAt` (Timestamp or null). | Repository implementation. |
| SD-002 | A soft-deleted unit returns `NOT_FOUND` on `getUnitById`. | Repository `getUnitById` checks `deletedAt`. |
| SD-003 | Soft-deleted units are excluded from `listUnits` and `getUnitsByTerm`. | QueryBuilder filter `deletedAt == null`. |
| SD-004 | Soft-deleted units can be restored via `restoreUnit`. | Repository sets `deletedAt = null`. |
| SD-005 | Soft delete requires a non-empty `requestId` for audit trail. | Repository validation. |

---

## 6. Validation Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| VAL-001 | `id` MUST be a non-empty string. | Zod `UnitIdSchema`. |
| VAL-002 | `academicTermId` MUST be a non-empty string. | Zod `CreateUnitInputSchema`. |
| VAL-003 | `name` MUST be a non-empty string, max 200 characters. | Zod schema. |
| VAL-004 | `nameAr` MUST be a non-empty string, max 200 characters. | Zod schema. |
| VAL-005 | `description` is optional, max 2000 characters. | Zod schema. |
| VAL-006 | `order` MUST be a non-negative integer. | Zod schema. |
| VAL-007 | `isActive` defaults to `true`. | Zod schema. |
| VAL-008 | `isPremium` defaults to `false`. | Zod schema. |
| VAL-009 | `published` defaults to `false`. | Zod schema. |

---

## 7. Invariants

The following invariants MUST hold at all times:

1. Every unit belongs to exactly one term (`academicTermId` is required).
2. Within a term, `order` values of active units form a non-repeating sequence.
3. Deleting a unit does not invalidate existing progress records (soft delete).
4. A restored unit may require manual `order` reassignment if conflicts arise.

---

## 8. Future Considerations

- **Bulk Reorder Endpoint**: A `POST /api/v1/units/reorder` endpoint accepting an ordered array of `{id, order}` pairs may be added.
- **Unique Constraint Enforcement**: A Firestore query-based uniqueness check for `order` within `academicTermId` may be added to the application service.
- **Auto-Shift on Insert**: If the product requires auto-shifting, a transaction-based reorder operation will be designed and documented.
