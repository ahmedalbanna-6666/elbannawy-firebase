# Units Module

## Overview

The Units Module manages the ordered curriculum groups within the academic structure:

```
EducationalSystem → Stage → Grade → AcademicYear → Term → Unit
```

Each Unit is a group of lessons within a specific academic term.

## Architecture

### Clean Architecture Layers

| Layer       | Component              | Location                         |
| ----------- | ---------------------- | -------------------------------- |
| Domain      | Entity interfaces      | `lib/domain/units/entities/`     |
| Repository  | UnitRepository         | `lib/repositories/units/`        |
| Service     | UnitService            | `lib/services/units/`            |
| Application | UnitApplicationService | `lib/services/units/`            |
| API         | Next.js Route Handlers | `apps/web/src/app/api/v1/units/` |

### Domain Entities

- `Unit` — Ordered curriculum group within an academic term (e.g. "Unit 1: Greetings", "Unit 2: Family")

## File Structure

```
lib/
  domain/units/entities/
    unit.entity.ts      — Unit entity interface
    index.ts
  domain/units/
    index.ts
  repositories/units/
    unit.repository.ts       — Firestore implementation
    unit-firestore-mapper.ts — Document <-> Domain mapping
    index.ts
  repositories/validators/
    unit.validator.ts        — Zod schemas
  services/units/
    unit.service.ts              — Domain service (delegates to repository)
    unit-application.service.ts  — Orchestration + validation + DTO mapping
    dto/unit-response.dto.ts     — API response interfaces
    index.ts
  __tests__/
    unit/units/
      unit-firestore-mapper.test.ts
      unit.validator.test.ts
      unit.repository.test.ts
      unit.service.test.ts
      unit-application.service.test.ts
    contract/iunit-repository.contract.test.ts
    integration/unit.repository.integration.test.ts

apps/web/src/app/api/v1/units/
  route.ts                        — GET (list) / POST (create)
  [id]/route.ts                   — GET (by id) / PATCH (update) / DELETE (soft delete)
  [id]/restore/route.ts           — POST restore
  [id]/publish/route.ts           — POST publish
  [id]/unpublish/route.ts         — POST unpublish
  [id]/order/route.ts             — PATCH order
  reorder/route.ts                — POST bulk-reorder
```

## Firestore Collection

| Collection | Document ID | Key Fields                                                          |
| ---------- | ----------- | ------------------------------------------------------------------- |
| `units`    | custom ID   | academicTermId, name, nameAr, order, isActive, isPremium, published |

## API Endpoints

All endpoints are under `/api/v1/units`.

### List & Create

```
GET  /api/v1/units?academicTermId=term-1&isActive=true&published=true&limit=20
POST /api/v1/units  body: { id, academicTermId, name, nameAr, order, ... }
```

Query parameters: `academicTermId`, `isActive`, `isPremium`, `published`, `search`, `limit`, `cursor`

When `academicTermId` is provided on GET, returns all units for that term via `getUnitsByTerm`.

### Entity CRUD

```
GET    /api/v1/units/:id
PATCH  /api/v1/units/:id  body: { ...update, _expectedVersion }
DELETE /api/v1/units/:id
```

### Restore

```
POST /api/v1/units/:id/restore
```

### Publish / Unpublish

```
POST /api/v1/units/:id/publish
POST /api/v1/units/:id/unpublish
```

### Update Order (Single)

```
PATCH /api/v1/units/:id/order  body: { order: number }
```

Update the order of a single unit. Use this for incremental changes or when only one unit needs adjustment.

### Bulk Reorder

```
POST /api/v1/units/reorder  body: { academicTermId: string, orders: Record<string, number> }
```

Bulk-reorder all units within an academic term in a single atomic request.

**Request body:**

```json
{
  "academicTermId": "term-1",
  "orders": {
    "unit-id-1": 1,
    "unit-id-2": 3,
    "unit-id-3": 2,
    "unit-id-4": 4
  }
}
```

**Behavior:**

- Accepts a map of `unitId → order` for all units being reordered.
- The `academicTermId` parameter ensures all units belong to the same term.
- Executed inside a Firestore transaction for atomicity.
- If any unit in the `orders` map does not belong to the specified term, the entire operation is rejected.
- The server auto-assigns compact sequential integer values (1, 2, 3, ...) if the client provides non-sequential values — no gaps are preserved.
- Returns the updated list of units with their new order values.

**Validation rules:**

- `academicTermId` is required and must reference an existing term.
- `orders` must contain at least 2 entries (single-unit reorder should use PATCH).
- Each value in `orders` must be a non-negative integer.
- All unit IDs in `orders` must exist and belong to `academicTermId`.
- Soft-deleted units in `orders` are rejected — restore them first.

## Ordering Rules

### Field Semantics

The `order` field (integer, non-negative) determines the display sequence of units within the same academic term.

### Uniqueness Constraint

`order` must be unique within the same `academicTermId`. No two active (non-deleted) units in the same term may share the same `order` value.

This uniqueness is enforced at the application layer (not Firestore) and must be validated before create or update operations.

### Insertion in the Middle (Reordering Strategy)

When a new unit is inserted between existing units, the caller must explicitly set the desired `order` value. The system DOES NOT auto-shift existing units.

**Recommended workflows:**

1. **Single unit insert:** Fetch the current unit list sorted by `order` (ascending). Determine the target position. Assign the new unit an `order` value that falls between adjacent units (e.g., if units at order 1 and 2 exist, a new unit at order 1.5 is invalid — use integer values only, so assign `order: 2` and bump the existing `order: 2` unit to `order: 3` via `PATCH /:id/order`).

2. **Bulk reorder (multiple units affected):** Use `POST /api/v1/units/reorder` with all unit IDs and their desired order values in a single request. The server executes the entire operation atomically inside a Firestore transaction, ensuring no partial updates or race conditions.

### Deletion Behavior

When a unit is soft-deleted (via `DELETE /api/v1/units/:id`), the remaining units are NOT automatically reordered. This is a deliberate design decision:

- Preserves historical references (e.g., progress records, analytics snapshots that reference order positions).
- Avoids unintended side effects during concurrent updates.
- The `deletedAt` filter ensures deleted units do not appear in list queries.

If reordering is desired after deletion, callers must explicitly update the `order` field of affected units via `PATCH /:id/order`.

### Restore Behavior

When a unit is restored (via `POST /api/v1/units/:id/restore`), its `order` value is restored as-is. If the original `order` conflicts with an existing unit, the caller must explicitly reassign a new `order` value.

## Validation (Zod Schemas)

Defined in `lib/repositories/validators/unit.validator.ts`:

- `CreateUnitInputSchema` — id, academicTermId, name, nameAr, order (required); description, isActive, isPremium, published (optional with defaults)
- `UpdateUnitInputSchema` — All fields optional
- `UnitFilterSchema` — academicTermId, isActive, isPremium, published, search
- `UnitIdSchema` — Validates non-empty ID
- `BulkReorderSchema` — academicTermId (required), orders (Record<string, number> with min 2 entries)

## Test Coverage

| Test Suite               | File                                  | Tests     |
| ------------------------ | ------------------------------------- | --------- |
| Mapper Unit              | `unit-firestore-mapper.test.ts`       | 4 tests   |
| Validator Unit           | `unit.validator.test.ts`              | 35+ tests |
| Repository Unit          | `unit.repository.test.ts`             | 18+ tests |
| Service Unit             | `unit.service.test.ts`                | 15+ tests |
| Application Service Unit | `unit-application.service.test.ts`    | 20+ tests |
| Contract                 | `iunit-repository.contract.test.ts`   | 25+ tests |
| Integration              | `unit.repository.integration.test.ts` | 22+ tests |

## Soft Delete

The `units` collection supports soft delete via `deletedAt` (Timestamp | null) field.
List queries filter by `deletedAt == null`.
Restore sets `deletedAt = null`.

## Key Dependencies

- `firebase-admin/firestore` — Timestamp, DocumentSnapshot
- `zod` — Input validation
- `QueryBuilder` — Firestore query construction
- `TransactionManager` — Firestore transactions
