# Lessons Module

## Overview

The Lessons Module manages the ordered instructional content within the academic curriculum structure:

```
EducationalSystem → Stage → Grade → AcademicYear → Term → Unit → Lesson
```

Each Lesson is an individual instructional unit belonging to exactly one Unit.

## Architecture

### Clean Architecture Layers

| Layer | Component | Location |
|-------|-----------|----------|
| Domain | Entity interfaces | `lib/domain/lessons/entities/` |
| Repository | LessonRepository | `lib/repositories/lessons/` |
| Service | LessonService | `lib/services/lessons/` |
| Application | LessonApplicationService | `lib/services/lessons/` |
| API | Next.js Route Handlers | `apps/web/src/app/api/v1/lessons/` |

### Domain Entities

- `Lesson` — Individual lesson within a unit (e.g. "Lesson 1: Hello World", "Lesson 2: Family Members")
- `LessonSummary` — Lightweight view of lesson (no description, updatedAt, less detail)

### Status Values

| Value | Description |
|-------|-------------|
| `draft` | Lesson being prepared, not yet visible to students |
| `published` | Lesson is live and available |
| `archived` | Lesson is retired and hidden |

## File Structure

```
lib/
  domain/lessons/entities/
    lesson.entity.ts      — Lesson entity interfaces + LessonStatus type
    index.ts
  domain/lessons/
    index.ts
  repositories/contracts.ts       — ILessonRepository, ILesson contracts (appended)
  repositories/lessons/
    lesson.repository.ts          — Firestore implementation (15+ methods)
    lesson-firestore-mapper.ts    — Document <-> Domain mapping
    index.ts
  repositories/validators/
    lesson.validator.ts           — Zod schemas (Create, Update, Filter, Id, ChangeOrder)
  services/lessons/
    lesson.service.ts             — Domain service (delegates to repository)
    lesson-application.service.ts — Orchestration + validation + DTO mapping
    dto/lesson-response.dto.ts    — API response interfaces
    index.ts
  __tests__/
    unit/lessons/
      lesson-firestore-mapper.test.ts
      lesson.validator.test.ts
      lesson.repository.test.ts
      lesson.service.test.ts
      lesson-application.service.test.ts
    contract/ilesson-repository.contract.test.ts
    integration/lessons/lesson.repository.integration.test.ts
  index.ts                        — Barrel exports (LessonRepository, LessonService, LessonApplicationService, etc.)

apps/web/src/app/api/v1/lessons/
  route.ts                          — GET (list/search) / POST (create)
  [id]/route.ts                     — GET (by id, prev, next) / PATCH (update) / DELETE (soft delete)
  [id]/restore/route.ts             — POST restore
  [id]/publish/route.ts             — POST publish
  [id]/unpublish/route.ts           — POST unpublish
  [id]/order/route.ts               — PATCH change order
apps/web/src/app/api/v1/units/[unitId]/lessons/
  route.ts                          — GET (by unit, published only)
```

## Firestore Collection

| Collection | Document ID | Key Fields |
|-----------|-------------|------------|
| `lessons` | custom ID | unitId, title, slug, displayOrder, status, isPublished, isVisible |

## Ordering Rules

See `ORDERING_POLICY.md` for complete ordering rules.

### Summary

- `displayOrder` is a non-negative integer, unique within the same `unitId`.
- Ordering starts at 0, gaps allowed, no auto-compaction on delete.
- Navigation methods (`getPreviousLesson`, `getNextLesson`) ignore deleted lessons.

## API Endpoints

All endpoints are under `/api/v1/lessons` or `/api/v1/units/:unitId/lessons`.

See `API.md` for complete API reference.

### Quick Reference

```
GET    /api/v1/lessons                    — List (with filters, pagination)
GET    /api/v1/lessons?search=hello       — Search by title/slug
POST   /api/v1/lessons                    — Create lesson
GET    /api/v1/lessons/:id                — Get by id (with ?prev=true / ?next=true)
PATCH  /api/v1/lessons/:id                — Update lesson
DELETE /api/v1/lessons/:id                — Soft delete lesson
POST   /api/v1/lessons/:id/restore        — Restore soft-deleted lesson
POST   /api/v1/lessons/:id/publish        — Publish lesson
POST   /api/v1/lessons/:id/unpublish      — Unpublish lesson
PATCH  /api/v1/lessons/:id/order          — Change display order
GET    /api/v1/units/:unitId/lessons      — Get lessons by unit (?published=true)
```

## Validation (Zod Schemas)

Defined in `lib/repositories/validators/lesson.validator.ts`:

| Schema | Fields | Notes |
|--------|--------|-------|
| `CreateLessonInputSchema` | id, unitId, title, slug, displayOrder (required); description, status, isPublished, isVisible, estimatedDuration (optional with defaults) | status defaults to 'draft', isPublished defaults to false, isVisible defaults to true |
| `UpdateLessonInputSchema` | All fields optional | Partial updates supported |
| `LessonFilterSchema` | unitId, status, isPublished, isVisible, search | All optional |
| `LessonIdSchema` | Non-empty string | Validates ID parameter |
| `ChangeOrderSchema` | displayOrder (non-negative integer) | For order updates |

## Test Coverage

| Test Suite | File | Tests |
|-----------|------|-------|
| Mapper Unit | `lesson-firestore-mapper.test.ts` | 7 tests |
| Validator Unit | `lesson.validator.test.ts` | 25+ tests |
| Repository Unit | `lesson.repository.test.ts` | 25+ tests |
| Service Unit | `lesson.service.test.ts` | 20+ tests |
| Application Service Unit | `lesson-application.service.test.ts` | 25+ tests |
| Contract | `ilesson-repository.contract.test.ts` | 25+ tests |
| Integration | `lesson.repository.integration.test.ts` | 25+ tests |

## Soft Delete

The `lessons` collection supports soft delete via `deletedAt` (Timestamp | null) field.
List queries filter by `deletedAt == null`.
Restore sets `deletedAt = null`.

## Key Dependencies

- `firebase-admin/firestore` — Timestamp, DocumentSnapshot
- `zod` — Input validation
- `QueryBuilder` — Firestore query construction
- `TransactionManager` — Firestore transactions
