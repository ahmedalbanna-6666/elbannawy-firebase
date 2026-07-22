# Curriculum Module

## Overview

The Curriculum Module manages the hierarchical educational structure:

```
EducationalSystem → Stage → Grade → AcademicYear → AcademicTerm
```

## Architecture

### Clean Architecture Layers

| Layer | Component | Location |
|-------|-----------|----------|
| Domain | Entity interfaces | `lib/domain/curriculum/entities/` |
| Repository | CurriculumRepository | `lib/repositories/curriculum/` |
| Service | CurriculumService | `lib/services/curriculum/` |
| Application | CurriculumApplicationService | `lib/services/curriculum/` |
| API | Next.js Route Handlers | `apps/web/src/app/api/v1/curriculum/` |

### Domain Entities

- `EducationalSystem` — Top-level educational system (e.g. Egyptian National, American Diploma)
- `Stage` — Educational stage within a system (e.g. Primary, Preparatory, Secondary)
- `Grade` — Grade level within a stage (e.g. Grade 1, Grade 2)
- `AcademicYear` — Academic year (e.g. 2025-2026)
- `AcademicTerm` — Term within an academic year (e.g. First Term, Second Term)

## File Structure

```
lib/
  domain/curriculum/entities/
    educational-system.entity.ts
    stage.entity.ts
    grade.entity.ts
    academic-year.entity.ts
    academic-term.entity.ts
    current-academic-context.ts
    index.ts
  repositories/curriculum/
    curriculum.repository.ts       — Firestore implementation
    curriculum-firestore-mapper.ts — Document <-> Domain mapping
    index.ts
  repositories/validators/
    curriculum.validator.ts        — Zod schemas
  services/curriculum/
    curriculum.service.ts          — Domain service (delegates to repository)
    curriculum-application.service.ts — Orchestration + validation + DTO mapping
    dto/curriculum-response.dto.ts — API response interfaces
    index.ts
  __tests__/
    unit/curriculum/
      curriculum-firestore-mapper.test.ts
      curriculum.validator.test.ts
      curriculum.repository.test.ts
      curriculum.service.test.ts
    contract/icurriculum-repository.contract.test.ts
    integration/curriculum.repository.integration.test.ts

apps/web/src/app/api/v1/curriculum/
  route.ts                        — GET (list) / POST (create) dispatcher
  [id]/route.ts                   — GET (by id) / PATCH (update) / DELETE (soft delete)
  [id]/restore/route.ts           — POST restore
  context/route.ts                — GET current academic context
```

## Firestore Collections

| Collection | Document ID | Key Fields |
|-----------|-------------|------------|
| `educationalSystems` | custom ID | name, nameAr, isActive |
| `stages` | custom ID | educationalSystemId, order |
| `grades` | custom ID | educationalSystemId, stageId, order |
| `academicYears` | custom ID | educationalSystemId, startDate, endDate, isCurrent |
| `academicTerms` | custom ID | academicYearId, order, startDate, endDate, isCurrent |

## API Endpoints

All endpoints are under `/api/v1/curriculum`.

### Collection Dispatcher

```
GET  /api/v1/curriculum?collection=educationalSystems&isActive=true&limit=20
POST /api/v1/curriculum  body: { collection, ...data }
```

Query parameters: `collection` (required), `stageId`, `educationalSystemId`, `isActive`, `isCurrent`, `search`, `limit`, `cursor`

### Entity CRUD

```
GET    /api/v1/curriculum/:id?collection=educationalSystems
PATCH  /api/v1/curriculum/:id?collection=educationalSystems  body: { ...update, expectedVersion }
DELETE /api/v1/curriculum/:id?collection=educationalSystems  body: { requestId }
```

### Restore

```
POST /api/v1/curriculum/:id/restore?collection=educationalSystems  body: { requestId }
```

### Academic Context

```
GET /api/v1/curriculum/context
```

Returns the current academic context (educationalSystem, stage, grade, academicYear, academicTerm).

## Validation (Zod Schemas)

Defined in `lib/repositories/validators/curriculum.validator.ts`:

- `CreateEducationalSystemInputSchema`, `UpdateEducationalSystemInputSchema`
- `CreateStageInputSchema`, `UpdateStageInputSchema`
- `CreateGradeInputSchema`, `UpdateGradeInputSchema`
- `CreateAcademicYearInputSchema`, `UpdateAcademicYearInputSchema`
- `CreateAcademicTermInputSchema`, `UpdateAcademicTermInputSchema`
- `CurriculumFilterSchema`, `CurriculumIdSchema`

## Test Coverage

| Test Suite | File | Tests |
|-----------|------|-------|
| Mapper Unit | `curriculum-firestore-mapper.test.ts` | 14 tests |
| Validator Unit | `curriculum.validator.test.ts` | 33 tests |
| Repository Unit | `curriculum.repository.test.ts` | 25 tests |
| Service Unit | `curriculum.service.test.ts` | 25 tests |
| Contract | `icurriculum-repository.contract.test.ts` | 40+ tests |
| Integration | `curriculum.repository.integration.test.ts` | 20+ tests |

## Soft Delete

All 5 collections support soft delete via `deletedAt` (Timestamp | null) field.
List queries filter by `deletedAt == null`.
Restore sets `deletedAt = null`.

## Key Dependencies

- `firebase-admin/firestore` — Timestamp, DocumentSnapshot
- `zod` — Input validation
- `QueryBuilder` — Firestore query construction
- `TransactionManager` — Firestore transactions
