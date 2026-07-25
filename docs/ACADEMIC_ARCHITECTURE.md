# Academic Architecture

> Architecture Freeze Document
> Last Updated: 2026-07-25
> Status: LOCKED

---

## Purpose

This document defines the immutable rules of the Academic Architecture.

Any future developer or AI Agent must read this document before making any changes to the academic domain.

Violating these rules requires an architecture review and approval from the project owner.

---

## Architecture Rules

### 1. Education Systems — STATIC

| Property | Value |
|----------|-------|
| Mutability | **Static** |
| Source of Truth | In-code constants (`lib/domain/curriculum/constants/educational-systems.ts`) |
| Firestore Collection | `educationalSystems` (read-only by rule) |
| Allowed IDs | `GENERAL`, `LANGUAGE`, `INTERNATIONAL` |
| CRUD | ❌ **No CRUD API**. Hardcoded in source code. |
| Future Change | Requires architecture review and MASTER_EXECUTION_PLAN.md update |

### 2. Stages — STATIC

| Property | Value |
|----------|-------|
| Mutability | **Static** |
| Source of Truth | In-code constants (`lib/domain/curriculum/constants/stages.ts`) |
| Firestore Collection | `stages` (read-only by rule) |
| Allowed IDs | `PRIMARY`, `PREPARATORY`, `SECONDARY` |
| CRUD | ❌ **No CRUD API**. Hardcoded in source code. |
| Future Change | Requires architecture review and MASTER_EXECUTION_PLAN.md update |

### 3. Grades — STATIC

| Property | Value |
|----------|-------|
| Mutability | **Static** |
| Source of Truth | In-code constants (`lib/domain/curriculum/constants/grades.ts`) |
| Firestore Collection | `grades` (read-only by rule) |
| Allowed IDs | `GRADE_1` through `GRADE_12` |
| CRUD | ❌ **No CRUD API**. Hardcoded in source code. |
| Future Change | Requires architecture review and MASTER_EXECUTION_PLAN.md update |

### 4. Academic Year — DYNAMIC

| Property | Value |
|----------|-------|
| Mutability | **Dynamic** |
| Source of Truth | Firestore collection `academicYears` |
| CRUD | ✅ Full CRUD via API (admin only by security rule) |
| Soft Delete | ✅ Supported (`deletedAt` field) |
| Current Year | Selected via `isCurrent: true` flag |
| Schema | Defined in `lib/repositories/contracts.ts` (`IAcademicYear`) |

### 5. Academic Term — DYNAMIC

| Property | Value |
|----------|-------|
| Mutability | **Dynamic** |
| Source of Truth | Firestore collection `academicTerms` |
| Parent | Must reference a valid, non-deleted `academicYearId` |
| CRUD | ✅ Full CRUD via API (admin only by security rule) |
| Soft Delete | ✅ Supported (`deletedAt` field) |
| Current Term | Selected via `isCurrent: true` flag (scoped to academic year) |
| Schema | Defined in `lib/repositories/contracts.ts` (`IAcademicTerm`) |

### 6. Subject — CONTENT-BOUND

| Property | Value |
|----------|-------|
| Mutability | **Content-bound** |
| Status | Not an independent entity in the current architecture |
| Relationship | Subjects emerge from the curriculum hierarchy (book → unit → lesson) |
| CRUD | ❌ **No independent Subject CRUD**. Subjects are derived from content structure. |
| Future Change | If a standalone Subject entity is needed, it requires a full architecture review |

---

## Security Rules

| Collection | Read | Write | Rationale |
|-----------|------|-------|-----------|
| `educationalSystems` | Authenticated user | ❌ Denied | Static data served from code |
| `stages` | Authenticated user | ❌ Denied | Static data served from code |
| `grades` | Authenticated user | ❌ Denied | Static data served from code |
| `academicYears` | Authenticated user | Admin only | Dynamic data managed via API |
| `academicTerms` | Authenticated user | Admin only | Dynamic data managed via API |

---

## Client-Side Restrictions

The Firestore security rules enforce that **students cannot modify** the following fields on their own `users` document:

- `gradeId`
- `stageId`
- `educationalSystemId`
- `academicYearId`
- `termId`

These fields can only be modified via the Admin SDK (backend API).

---

## Frontend Display Constants

The frontend uses `apps/web/src/lib/education-options.ts` for display labels (Arabic names).

This is acceptable because:

- It provides Arabic UI labels without an extra Firestore read
- It mirrors the backend constants exactly
- It MUST be kept in sync with `lib/domain/curriculum/constants/`

**Rule:** If a grade, stage, or system is added to the backend constants, the frontend `education-options.ts` MUST be updated simultaneously.

---

## Data Integrity Rules

Every write to the system must satisfy:

1. **User** → `gradeId` must reference a valid grade from the static grades set
2. **Unit** → `gradeId` must reference a valid grade from the static grades set
3. **Lesson** → `unitId` must reference an existing, non-deleted unit
4. **AcademicTerm** → `academicYearId` must reference an existing, non-deleted academic year
5. **Academic Year** → Should have at least one term referencing it (warning, not enforced)

---

## Migration History

| Date | Change | Author |
|------|--------|--------|
| 2026-07-22 | Initial academic architecture design | Architecture docs |
| 2026-07-25 | Finalized static vs dynamic split. Frozen architecture. | Architecture docs |
| 2026-07-25 | Added client-side field restrictions to Firestore rules | Security audit |

---

## What Requires an Architecture Review

Any change to:

- Adding/removing an educational system
- Adding/removing a stage
- Adding/removing a grade
- Making grades/stages/systems dynamic
- Introducing a standalone Subject entity
- Changing the static constants source
- Modifying the security rules for academic collections
- Adding CRUD endpoints for static entities
- Changing the academic year/term data model

---

## Final Rule

> **The academic architecture is frozen.**
>
> Static entities (education systems, stages, grades) must remain static.
> Dynamic entities (academic years, terms) must remain in Firestore.
> Any deviation requires a documented architecture review.
>
> No CRUD for stages or grades shall be introduced without re-evaluating
> the entire academic data model.
