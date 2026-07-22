# Architecture Lock

Version: 1.0.0

Status: Frozen

Date: 2026-07-21

Project: El-bannawy Platform

Migration: PostgreSQL → Firebase

---

# Approved Decisions

## Authentication

- **Firebase Authentication** is the single source of truth for identity
- **Firebase Session Cookies** provide secure client session management
- **Firebase Custom Claims** implement role-based access control with roles: `STUDENT`, `TEACHER`, `SECRETARY`, `SUPPORT`, `ADMINISTRATOR`
- **No NestJS JWT** - Firebase ID tokens are the only application boundary token
- **No Authentication Bridge** - Direct Firebase integration without additional layers

## Data Storage

- **Firestore as the operational database** - Primary document store with eventual consistency
- **Cloud Storage** - File storage for documents, media, exports (binary content not in Firestore)
- **Flat Collection Strategy** - All domain entities are root collections (89 total)
- **Two Nested Collections Only** - `conversations/{id}/messages` and `supportTickets/{id}/messages`
- **Hybrid Model** - pgvector as independent AI vector database service

## Architecture Patterns

- **Repository Pattern** - Domain repositories own persistence, contracts in `REPOSITORY_CONTRACTS.md`
- **Clean Architecture** - Controllers/API adapters own transport, services own business rules
- **SOLID** - Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **Zod validation** - All input validation at boundaries with strict TypeScript
- **TypeScript Strict Mode** - No `any`, exhaustive checking enabled
- **Documentation Driven** - Code implements documented architecture, never invents

## AI Architecture

- **AI Architecture** is independent service using pgvector
- Vector storage separate from operational database
- Synchronization with Firestore for metadata consistency
- pgvector failure handling with graceful degradation

## Query Strategy

- **Cursor Strategy** - Pagination with stable cursor, no offset
- **Index Strategy** - Composite indexes with authorization fields first
- **Batch Reads** - Group related queries to minimize round trips
- **Read Models** - Pre-aggregated summaries for dashboards
- **Collection Group Queries** - Limited to cross-user reports

## Security Rules

- **Second Layer** - Firestore rules secondary to service authorization
- **Field Allowlist** - Explicit field permissions, no field-level redaction
- **Trust Boundaries** - Clear separation by role with defined capabilities
- **No Client-Trustable Fields** - Client cannot supply `isAdmin`, `ownerId`, etc.

## Index Strategy

- **Composite Indexes** - Equality fields first, then filtering, then cursor
- **Single-Field Indexes** - Required for unique lookups and operational keys
- **Index Size Limits** - Keep under 100KB when possible
- **Index Maintenance** - Document all usage for maintenance planning

## Repository Contracts

- **Service Layer** - Repositories handle persistence only
- **Input Validation** - Zod schemas at API boundaries
- **Transaction Boundaries** - Firestore transactions for state changes
- **Optimistic Concurrency** - Version checks for updates
- **Idempotency** - Request IDs for replay detection

---

# Non-Negotiable Rules

## Code Rules

- No `any` type - Use `unknown` or explicit generics
- No `ts-ignore` - Fix type errors properly
- No untyped JSON - All boundaries use Zod schemas
- No mixed responsibilities - Single domain per service
- No code organization violations - Follow documented folder structure

## Architecture Rules

- No business logic inside repositories - Services own business rules
- No direct Firestore access outside repositories - Guarded by service layer
- No API route accessing Firestore - Controlles receive requests only
- No reading secrets from Firestore - Server-only collections for sensitive data
- No field-level redaction in Firestore rules - Server mediates sensitive access
- No duplicate business logic - Reuse existing code/utilities
- No random folder structures - Follow documented architecture

## Database Rules

- No bypasses to Prisma - Firestore is operational store
- No manual production database edits - Everything through repositories
- No schema changes without migration - Keep schemaVersion
- No unindexed queries - All queries documented in INDEXES.md
- No hard deletes - Soft delete everywhere
- No cross-document references - Use root collections for cross-domain relationships

## Documentation Rules

- Documentation is the source of truth - Architecture never redefined
- Every architectural change requires documentation update
- Documentation updates before implementation begins
- Never assume undocumented requirements
- All new code documented

## Testing Rules

- Every feature requires tests - Unit, Integration, E2E where applicable
- Coverage targets: Business Logic 90%, Critical Services 95%, UI Components 80%
- TypeScript, ESLint, Build, Tests must pass for every commit
- No failing tests for merge
- Accessibility, regression, and performance tests where applicable

## Security Rules

- Validate every request - Zod schemas at boundaries
- Authorize every request - Role and scope checks
- Sanitize every input - Do not trust client data
- Encrypt secrets - External secret store for production
- Never log passwords, tokens, secrets, payment data, personal information
- Follow least privilege everywhere - Minimal required access

---

# Migration Order

## Phase 1 ✅ COMPLETE & LOCKED

- ✅ Project Bootstrap
- ✅ Documentation Complete
- ✅ Firebase Architecture Design
- ✅ Collection Strategy Approved
- ✅ Repository Contracts Defined
- ✅ Security Rules Designed
- ✅ Query Patterns Documented
- ✅ Repository Implementation Ready

## Phase 2 🔄 IN PROGRESS

### Completed Modules

- ✅ **Repository Foundation** (BaseRepository, FirestoreService, TransactionManager, QueryBuilder, FirestoreMapper, error classes, contracts) — COMPLETE & LOCKED
- ✅ **Users Module** (domain + Firestore repository + service + API + 5 test suites) — COMPLETE & LOCKED

### In Progress

| Module | Domain | Status | Missing |
|--------|--------|--------|---------|
| Curriculum | EducationalSystem, Stage, Grade, AcademicYear, AcademicTerm, CurrentAcademicContext | 🔄 IN PROGRESS | Services, DTOs, API routes, barrel exports, tests, docs |

### Remaining (in order)

| Priority | Module | Status |
|----------|--------|--------|
| 1 | Lesson Content (Lesson, Video, Activity, Vocabulary) | ⏳ |
| 2 | Assessment (Homework, Quiz, Assessment) | ⏳ |
| 3 | Progress (LessonProgress, VideoProgress, Stats) | ⏳ |
| 4 | Story (Story, Chapter, StoryLesson) | ⏳ |
| 5 | Final Review | ⏳ |
| 6 | Games | ⏳ |
| 7 | Live Classes | ⏳ |
| 8 | Gamification (XP, Achievements, Leaderboard) | ⏳ |
| 9 | Commerce (Wallet, Payment, Invoice, Coupon) | ⏳ |
| 10 | Referral | ⏳ |
| 11 | Notifications | ⏳ |
| 12 | AI | ⏳ |
| 13 | Reports | ⏳ |
| 14 | Support | ⏳ |
| 15 | Administration | ⏳ |

### Required Deliverables

- Test Data Seeds
- Repository Implementations
- Service Layer
- Controller Layer (if applicable)
- Integration Tests
- End-to-End Tests

## Phase 3 ⏳ Not started

- AI Integration
- Optimization
- Performance Tuning
- Monitoring Setup

---

# Change Management

Any future architecture modification requires:

1. **Change Request** - Document the proposed change with rationale
2. **Impact Analysis** - Document effects on all related components
3. **Approval** - Formal approval from architecture owner(s)
4. **Documentation Update** - Update this document before any code change
5. **Version Increment** - Bump version (MINOR for backward compatible, MAJOR for breaking)

No architectural changes may be introduced during implementation without updating this document and going through the change approval process.

---

# Architecture Verification Checklist

[ ] **Documentation Consistency**
    - All existing documentation matches approved architecture
    - No undocumented collections or fields
    - No conflicting documentation sections

[ ] **Repository Compliance**
    - All repositories follow interface contracts in REPOSITORY_CONTRACTS.md
    - No repository methods accept `any` or raw Firestore snapshots
    - All queries map to approved indexes in INDEXES.md
    - All writes have documented ownership and transaction boundaries

[ ] **Naming Conventions**
    - Collections use lowerCamelCase
    - Document fields use lowerCamelCase
    - Interfaces use PascalCase
    - Enums use PascalCase
    - Constants use UPPER_SNAKE_CASE
    - Files use kebab-case

[ ] **Security Verification**
    - All security rules reference existing collections
    - No undocumented access patterns
    - No field-level redaction in Firestore
    - Sensitive fields in server-only collections

[ ] **Index Strategy**
    - Every query has documented composite indexes
    - All indexes used in implementation
    - No missing indexes for approved queries
    - Index sizes within limits

[ ] **Domain Model Compliance**
    - Every repository references valid collections
    - Every aggregate exists in DOMAIN_MODEL.md
    - No references to non-existent collections
    - All relationships documented

[ ] **Architecture Integrity**
    - No undocumented collections created
    - No deviations from approved architecture
    - Documentation remains source of truth
    - All code implements documented patterns

---

# Verification Status

## Phase 1 Verification ✅

✅ **Consistency Check Complete**
- All documentation synchronized with approved architecture
- No conflicts found in documentation
- Architecture fully documented in all required areas
- Repository contracts stable and comprehensive

## Phase 2 Implementation Status

| Module | Domain Entities | Repository | Service | API | Tests | Status |
|--------|----------------|------------|---------|-----|-------|--------|
| Repository Foundation | — (base infrastructure) | ✅ | ✅ | ✅ | ✅ | ✅ COMPLETE & LOCKED |
| Users | User, LoginEvent | ✅ | ✅ | ✅ | ✅ 5 suites | ✅ COMPLETE & LOCKED |
| Curriculum | EducationalSystem, Stage, Grade, AcademicYear, AcademicTerm | ✅ | ❌ | ❌ | ❌ | 🔄 IN PROGRESS |
| Remaining 15 modules | — | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

## Status: Architecture Frozen

This document serves as the **official architectural baseline** for the El-bannawy Platform Firebase migration.

All implementation must follow the architecture defined in this document. Any proposed changes must go through the **Change Management** process above.

Implementation is proceeding on Phase 2 (Repository Implementation) with the architectural foundation stable and well-documented.