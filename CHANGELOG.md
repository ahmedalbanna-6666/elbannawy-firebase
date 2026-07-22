# Changelog

## El-bannawy Platform

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Phase 1 — Project Foundation (2026-07-22)

- Initialize monorepo with Turborepo
- Configure TypeScript strict mode across all packages
- Set up ESLint and Prettier
- Configure TailwindCSS design system
- Set up Prisma with PostgreSQL schema
- Create Firestore repository foundation (`BaseRepository`, `TransactionManager`, `QueryBuilder`, `FirestoreMapper`)
- Implement shared packages (`@el-bannawy/lib`, `@el-bannawy/shared`)
- Create project documentation structure (`docs/`)
- Establish CI/CD pipeline configuration

### Phase 2 — Design System (Planned)

### Phase 3 — Authentication (Planned)

### Phase 4 — Core Dashboard (Planned)

### Phase 5 — Lesson Engine (Planned)

### Phase 6 — Activity Engine (Planned)

### Phase 7 — Homework (Planned)

### Phase 8 — Quiz Engine (Planned)

### Phase 9 — Reports (Planned)

### Phase 10 — Payments (Planned)

### Phase 11 — Notifications (Planned)

### Phase 12 — AI Integration (Planned)

### Phase 13 — Optimization (Planned)

### Phase 14 — Testing (Planned)

### Phase 15 — Production Deployment (Planned)

---

## [0.1.0] — 2026-07-22

### Added

- **Users Module**: Complete CRUD with Firestore persistence
  - Domain entities, contracts, and value objects (`lib/domain/user/`)
  - Firestore mapper with `toDomain()`, `toContract()`, `toFirestore()` (`lib/repositories/user/user-firestore-mapper.ts`)
  - Zod validators for all user operations (`lib/repositories/validators/user.validator.ts`)
  - Response DTOs with standard format (`lib/domain/user/dto/`)
  - Domain service and application service (`lib/services/user/`)
  - Next.js API routes (8 endpoints) with cursor pagination (`apps/web/src/app/api/v1/users/`)
  - Unit, contract, and integration tests (`lib/__tests__/`)
  - Documentation: `DATA_MODEL.md`, `API.md`, `MODULE.md`, `TESTING.md`

- **NestJS Backend Scaffold**: 25 controllers covering auth, profile, admin, lessons, quizzes, homework, videos, live classes, payments, coins, AI, reports, curriculum, stories, competitions, support, and more

- **Data Model Definition**: Firestore collections `users` and `loginEvents` fully documented
  - Embedded objects: `Role`, `AccountStatus`
  - Enums: `UserRoleType` (6 roles), `AccountStatusType` (4 statuses)
  - Indexes and relationships documented

- **Engineering Standards**:
  - `AGENTS.md` — AI development operating system rules
  - `docs/engineering/MODULE_CHECKLIST.md` — standardized module implementation checklist

- **Accessibility**: RTL support, dark/light mode toggle, responsive layout foundation

### Changed

- N/A (initial release)

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- No authentication/authorization middleware yet (documented and planned for Phase 3)
- No Firebase Auth integration yet (planned)
- Soft delete enforced — no hard deletes

---

## [0.0.1] — 2026-07-21

### Added

- Project initialization and monorepo setup
- Documentation skeleton
- Repository scaffolding

---

*For a complete list of changes, refer to the commit history.*
