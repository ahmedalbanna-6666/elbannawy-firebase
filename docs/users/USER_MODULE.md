# Users Module

## El-bannawy Platform

Version: 1.0.0
Status: Implemented
Last Updated: 2026-07-22

## Overview

The Users Module manages all user identities, profiles, roles, and account lifecycle within the El-bannawy Platform. It follows Clean Architecture, Repository Pattern, and Domain-Driven Design principles, built on the Firestore Repository Foundation.

## Architecture

```
┌─────────────────────────────────────┐
│         API Layer (Next.js)          │
│  apps/web/src/app/api/v1/users/*    │
├─────────────────────────────────────┤
│      Application Layer               │
│  UserApplicationService              │
│  - DTO mapping                       │
│  - Input validation (Zod)           │
│  - Use case orchestration            │
├─────────────────────────────────────┤
│       Domain Layer                   │
│  UserService                        │
│  - Business rules                    │
│  - Domain operations                 │
│  - Repository delegation             │
├─────────────────────────────────────┤
│     Repository Layer                 │
│  UserRepository                      │
│  - Implements IUserRepository        │
│  - Extends BaseRepository            │
│  - Firestore queries                 │
│  - Cursor pagination                 │
├─────────────────────────────────────┤
│   Infrastructure / Persistence       │
│  Firestore Database                  │
│  Collections: users, loginEvents     │
└─────────────────────────────────────┘
```

## Components

### Domain Layer (`lib/domain/user/`)

- **Entities**: `IUser`, `UserRole`, `AccountStatus`, `LoginEvent`
- **DTOs**: `UserResponseDTO`, `UserListResponseDTO`, `UserSummaryResponseDTO`, `ApiResponseDTO`
- **Value Objects**: User role types, account status types

### Repository Layer (`lib/repositories/user/`)

- **UserRepository**: Concrete implementation of `IUserRepository`
  - Extends `BaseRepository<UserFirestoreDocument>`
  - Uses `QueryBuilder` for complex queries
  - Uses `TransactionManager` for transactional operations
  - Implements soft delete via `BaseRepository.archive/restore`
  - Cursor-based pagination for list operations

- **UserFirestoreMapper**: Maps between Firestore documents and domain entities
  - `toDomain()` - Firestore doc to full domain entity
  - `toContract()` - Firestore doc to `IUser` contract type
  - `toFirestore()` - Partial domain entity to Firestore data

### Service Layer (`lib/services/user/`)

- **UserService**: Domain service orchestrating repository operations
  - Create, read, update, delete operations
  - Status and role management
  - Soft delete and restore
  - Login event tracking

- **UserApplicationService**: Application service with full input validation and DTO mapping
  - Validates all public inputs via Zod schemas
  - Maps domain responses to API-friendly DTOs
  - Coordinates complex use cases

### API Layer (`apps/web/src/app/api/v1/users/`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/users` | GET | List users with filters and cursor pagination |
| `/api/v1/users` | POST | Create a new user |
| `/api/v1/users/[id]` | GET | Get user by ID |
| `/api/v1/users/[id]` | PATCH | Update user profile |
| `/api/v1/users/[id]` | DELETE | Soft delete user |
| `/api/v1/users/[id]/status` | PATCH | Change account status |
| `/api/v1/users/[id]/role` | PATCH | Change user role |
| `/api/v1/users/[id]/restore` | POST | Restore soft-deleted user |

## Supported Operations

1. **Create User** - Register a new user with profile, role, and academic assignment
2. **Get User** - Retrieve user by Firebase Auth UID
3. **Update Profile** - Modify user profile fields
4. **Change Status** - Change account status (active, inactive, suspended, pending)
5. **Change Role** - Change user role with audit trail
6. **Soft Delete** - Archive user without data loss
7. **Restore User** - Restore soft-deleted user
8. **List Users** - Paginated user listing with filters (role, status, grade, active)
9. **Search** - Filter users by criteria
10. **Cursor Pagination** - Stable cursor-based pagination for list operations

## Dependencies

- `@el-bannawy/lib` - Repository Foundation (BaseRepository, QueryBuilder, FirestoreMapper, TransactionManager)
- `zod` - Input validation
- `@firebase/firestore` - Firestore SDK

## Constraints

- No authentication or authorization middleware (to be added later)
- No Firebase Auth integration
- No custom claims management
- All public inputs validated via Zod schemas
- Soft delete only - no hard deletes
