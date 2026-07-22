# Module Implementation Checklist

## El-bannawy Platform

Version: 1.0.0
Status: Active
Last Updated: 2026-07-22

## Purpose

Every module **must** pass this checklist before being marked complete.
This ensures consistent quality, testability, and maintainability across all modules.

---

## Checklist

### 1. Domain Layer

- [ ] Entity interfaces defined (`lib/domain/<module>/entities/`)
- [ ] Value objects defined (if applicable)
- [ ] Business rules captured in domain types
- [ ] Exports re-exported from `index.ts`

### 2. Repository Layer

- [ ] Repository contract interface defined (extends `lib/repositories/contracts.ts` patterns)
- [ ] Repository implementation created (`lib/repositories/<module>/<module>.repository.ts`)
- [ ] CRUD operations match documented API spec
- [ ] Error handling covers all documented error codes
- [ ] Pagination implemented where required (cursor-based)

### 3. Firestore Mapper

- [ ] Mapper class created (`lib/repositories/<module>/<module>-firestore-mapper.ts`)
- [ ] Firestore document interface defined
- [ ] `toDomain()` — Firestore doc → domain entity
- [ ] `toContract()` — Firestore doc → contract type
- [ ] `toFirestore()` — domain entity → Firestore data
- [ ] Timestamp handling consistent with platform standard

### 4. Validators (Zod)

- [ ] Zod schemas created (`lib/repositories/validators/<module>.validator.ts`)
- [ ] Input validation for all public operations
- [ ] Enums use `z.enum()` or `z.nativeEnum()`
- [ ] Reusable types inferred from schemas

### 5. DTOs

- [ ] Response DTOs defined (`lib/domain/<module>/dto/`)
- [ ] Consistent with `ApiResponseDTO<T>` / `PaginatedApiResponseDTO<T>`
- [ ] List response includes pagination metadata

### 6. Services

- [ ] Domain service created (`lib/services/<module>/<module>.service.ts`)
- [ ] Application service created (`lib/services/<module>/<module>-application.service.ts`)
- [ ] All inputs validated via Zod before processing
- [ ] Result types use `RepositoryResult<T>` pattern
- [ ] Error codes properly mapped

### 7. API Layer

- [ ] Route handlers created (`apps/web/src/app/api/v1/<module>/`)
- [ ] Standard response format used: `{ success, data/error, timestamp }`
- [ ] JSON parsing errors handled
- [ ] Input validation with Zod
- [ ] Error codes mapped to HTTP statuses
- [ ] All endpoints documented in API.md

### 8. Unit Tests

- [ ] Validator tests
- [ ] Mapper tests
- [ ] Service tests
- [ ] Repository tests
- [ ] Each test file covers: success, failure, edge cases

### 9. Contract Tests

- [ ] Repository contract tests created (`lib/__tests__/contract/`)
- [ ] All interface methods tested
- [ ] Consistent with `iuser-repository.contract.test.ts` patterns

### 10. Integration Tests

- [ ] Integration tests created (`lib/__tests__/integration/`)
- [ ] Firestore emulator or test harness configured
- [ ] Real Firestore read/write tested

### 11. Documentation

- [ ] `docs/<module>/DATA_MODEL.md` — collections, fields, indexes, relationships
- [ ] `docs/<module>/API.md` — endpoints, request/response examples, error codes
- [ ] `docs/<module>/MODULE.md` — architecture, components, dependencies, constraints
- [ ] `docs/<module>/TESTING.md` — test structure and categories

### 12. Quality Gates

- [ ] TypeScript passes (strict mode, no `any`)
- [ ] ESLint passes (no warnings)
- [ ] Build succeeds
- [ ] All tests pass (unit + contract + integration)
- [ ] Dark mode supported (UI modules)
- [ ] RTL supported (UI modules)
- [ ] Responsive layout (UI modules)
- [ ] Loading, error, and empty states handled (UI modules)

### 13. Coverage

| Layer | Target |
|-------|--------|
| Business Logic | ≥ 90% |
| Critical Services | ≥ 95% |
| UI Components | ≥ 80% |

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| **Developer** | | |
| **Reviewer** | | |
| **Architecture** | | |

---

## Usage

1. Copy this checklist for each new module
2. Tick items as they are completed
3. Attach to the Pull Request description
4. PR is blocked until all items are checked

## Modules Status

| Module | Domain | Repository | Mapper | Validators | DTOs | Services | API | Unit Tests | Contract Tests | Integration Tests | Docs | Coverage | Sign-off |
|--------|--------|------------|--------|------------|------|----------|-----|------------|----------------|-------------------|------|----------|---------|
| Users | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |

---

*This document is part of the El-bannawy Platform engineering standards.*
