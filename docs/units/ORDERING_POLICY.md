# Ordering Policy

## El-bannawy Platform — Units & Lessons

Version: 1.0.0  
Status: Phase 2 (Units Module)  
Last Updated: 2026-07-22

---

## Purpose

This document defines the ordering policy for Units (and by extension, Lessons) in the El-bannawy Platform. Every developer, API consumer, and AI agent must follow this policy when implementing or integrating ordering logic.

---

## 1. Base Rules

### 1.1 Order Field

| Property | Value |
|----------|-------|
| Field name | `order` |
| Type | integer |
| Min value | `0` |
| Max value | `2_147_483_647` (max safe Firestore integer) |
| Required | Yes |
| Default | No default — caller must provide |

### 1.2 Start Value

**Ordering starts at `0`, not `1`.**

| Rationale | Explanation |
|-----------|-------------|
| Zero-based indexing | Matches array indices, pagination cursors, and frontend list rendering. |
| Consistency | All curriculum entities (Stage, Grade, AcademicTerm) use `0`-based `order`. |
| Future flexibility | Reserving `0` allows inserting a unit before the first unit without negative numbers. |

### 1.3 Gap Policy

**Gaps in `order` values are ALLOWED and EXPECTED.**

| Scenario | Gap behavior |
|----------|-------------|
| Normal creation | Units created at `order: 0`, `order: 10`, `order: 20` — gaps are valid. |
| After deletion | A unit at `order: 5` is deleted; `order: 5` becomes a gap. No compaction occurs. |
| After reorder | Reordering may introduce or remove gaps freely. |

**Why gaps are allowed:**

- Gaps simplify insertion — a new unit can be placed between two existing units without reshuffling every subsequent unit.
- Gaps reduce write contention — only one document is updated on insert, not N documents.
- Gaps tolerate deletion — no compaction cascade is triggered.
- The client-side display layer always sorts by `order ASC`, so gaps are invisible to end users.

**When gaps may be removed:**

- During a scheduled maintenance window, an administrator may call a compaction routine to close large gaps.
- A future `POST /api/v1/units/reorder` endpoint may optionally compact the sequence.

---

## 2. Reordering Operations

### 2.1 Single Unit Reorder

```
PATCH /api/v1/units/:id/order
Body: { "order": 15 }
```

| Rule | Description |
|------|-------------|
| SCOPE | The update affects only the target unit. |
| UNIQUENESS | The new `order` MUST NOT conflict with another active unit in the same `academicTermId`. |
| GAPS | Gaps before and after the new position are preserved. |
| CONCURRENCY | Use `_expectedVersion` to avoid lost updates. |

**Client workflow:**

1. Fetch current unit list: `GET /api/v1/units?academicTermId=term-1&sort=order:asc`.
2. Determine new position.
3. If the target `order` is already taken, first move the occupying unit to a new `order`, then update the target unit.
4. Send `PATCH /api/v1/units/:id/order { "order": <new-value> }`.

### 2.2 Move Unit to a Different Term (Cross-Term Move)

**This operation is NOT a simple reorder — it is a transfer.**

```
PATCH /api/v1/units/:id
Body: { "academicTermId": "term-2", "order": 0 }
```

| Rule | Description |
|------|-------------|
| SCOPING | Both `academicTermId` and `order` MUST be provided in the same request. |
| UNIQUENESS | The new `order` MUST be unique within the target term. |
| GAPS | The vacated `order` in the source term becomes a gap. |
| SIDE EFFECTS | No cascade — lessons inside the unit are NOT affected (they reference the unit by ID, not by term). |
| CONSTRAINT | The caller MUST verify that the target term belongs to a compatible Grade/AcademicYear. This is a client-side responsibility in Phase 1. |

**Future consideration:** A dedicated `POST /api/v1/units/:id/transfer` endpoint may be added to encapsulate cross-term transfer logic with validation.

### 2.3 Move Unit to a Different Grade

**Directly changing the grade of a unit is NOT supported in Phase 1.**

The unit's grade affiliation is determined by its `academicTermId` (the term belongs to an academic year, which belongs to a grade). To move a unit to a different grade:

1. Move the unit to a term that belongs to the target grade (see Section 2.2).
2. Or delete the unit from the source term and create a new unit in the target grade's term.

This design ensures the hierarchy `Grade → AcademicYear → Term → Unit` remains consistent at all times.

---

## 3. Deletion Behavior

### 3.1 Unit Deleted in the Middle

When a unit at `order: 5` is soft-deleted:

```
Before:  [0:A] [1:B] [5:C] [10:D] [20:E]
After:   [0:A] [1:B] [GAP] [10:D] [20:E]
```

| Rule | Description |
|------|-------------|
| NO COMPACTION | Remaining units are NOT shifted to close the gap. |
| NO REUSE | The deleted unit's `order` (5) is NOT automatically reassigned to a new unit. |
| VISIBILITY | The gap is invisible to end users — list queries sort by `order ASC` and skip deleted units. |
| AUDIT | The `deletedAt` timestamp preserves the deletion timeline. |

**Why no compaction after deletion:**

- Avoids rewriting N documents for a single deletion.
- Preserves bookmark URLs and analytics that reference `order` positions.
- Keeps the delete operation O(1) instead of O(N).
- The gap can be filled later by a new unit or a compaction run.

### 3.2 Reuse of Deleted Unit's Order

A caller MAY explicitly reuse a deleted unit's `order` value by:
1. Creating a new unit with `order: 5` in the same term.
2. Or updating an existing unit's `order` to `5` via `PATCH /:id/order`.

The system does not prevent this — uniqueness is checked only against active (non-deleted) units.

---

## 4. Import / Bulk Operations

### 4.1 Bulk Import

When importing multiple units into a term:

| Rule | Description |
|------|-------------|
| SPACING | Use spaced values (e.g., 0, 10, 20, 30) to leave room for future insertions. |
| GAP FACTOR | A gap factor of 10 is recommended (0, 10, 20, ...). |
| OPTIONAL | The caller may use sequential values (0, 1, 2, 3) if no future insertions are anticipated. |

### 4.2 Bulk Reorder

Not implemented in Phase 1. When added, the bulk reorder endpoint will:

- Accept an array of `{ id: string, order: number }` pairs.
- Execute all updates in a single Firestore transaction.
- Validate uniqueness before committing.
- Support optional compaction (auto-close gaps).

---

## 5. Lesson Ordering (Forward Reference)

When the Lessons Module is implemented, the same ordering policy applies:

| Rule | Lessons |
|------|---------|
| Field | `order` (integer, 0-based, gaps allowed) |
| Scope | Unique within the same `unitId` |
| Deletion | No compaction — gap remains |
| Reorder | `PATCH /api/v1/lessons/:id/order` |
| Cross-unit move | Update `unitId` + `order` together |

Lessons inside a deleted unit are soft-deleted recursively or orphaned — this policy will be defined in the Lessons Module specification.

---

## 6. Summary Table

| Question | Answer |
|----------|--------|
| Does ordering start from 0 or 1? | **0** |
| Are gaps in `order` allowed? | **Yes** |
| What happens when a unit is deleted? | Gap remains; no compaction |
| Can a unit move to another term? | Yes — update `academicTermId` + `order` |
| Can a unit move to another grade? | Indirectly via term transfer |
| Is auto-shifting supported? | **No** — explicit reorder only |
| Is bulk reorder supported? | Not yet (future) |
| Is concurrency handled? | Via `_expectedVersion` (optimistic locking) |
