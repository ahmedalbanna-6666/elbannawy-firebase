# Users Module Testing

## El-bannawy Platform

Version: 1.0.0
Status: Implemented
Last Updated: 2026-07-22

## Test Structure

```
lib/__tests__/
├── unit/
│   ├── validators/
│   │   ├── user.validator.test.ts
│   │   └── user-firestore-mapper.test.ts
│   ├── repositories/
│   │   └── user.repository.test.ts
│   └── services/
│       └── user.service.test.ts
├── integration/
│   └── user.repository.integration.test.ts
└── contract/
    └── iuser-repository.contract.test.ts
```

## Test Categories

### Unit Tests

Test individual components in isolation with mocked dependencies.

**Validator Tests** (`user.validator.test.ts`)
- Schema validation boundaries
- Required field validation
- Optional field handling
- Type validation
- Default values
- Edge cases (empty strings, special characters, boundary values)

**Repository Tests** (`user.repository.test.ts`)
- All IUserRepository method implementations
- Input validation delegation
- Error handling and propagation
- Success path verification
- Error code correctness

**Service Tests** (`user.service.test.ts`)
- Business logic orchestration
- Repository delegation
- Domain operation coordination
- Error forwarding

**Mapper Tests** (`user-firestore-mapper.test.ts`)
- Firestore to domain mapping
- Domain to Firestore mapping
- Null/undefined handling
- Optional field transformations

### Integration Tests

Require Firebase Emulator to be running locally.

```bash
# Start Firebase Emulator
firebase emulators:start --only firestore

# Run integration tests
npx jest --testPathPattern=integration
```

Test scenarios:
- Create user and verify persistence
- Read user by ID
- Find user by mobile number
- Update user profile
- List users with pagination
- Filter by role and status
- Change account status
- Change user role
- Soft delete and restore
- Cursor pagination across pages
- Duplicate handling
- Empty result sets

### Contract Tests

Verify that the UserRepository implementation satisfies the IUserRepository contract.

Test coverage:
- Method signatures and parameter counts
- Return type contracts (RepositoryResult<IUser>, RepositoryResult<void>, etc.)
- Error code consistency (INVALID_INPUT, NOT_FOUND, etc.)
- Input validation behavior
- Error response format compliance

## Running Tests

```bash
# All tests
pnpm --filter @el-bannawy/lib test

# Unit tests only
pnpm --filter @el-bannawy/lib test -- --testPathPattern=unit

# Integration tests (requires Firebase Emulator)
pnpm --filter @el-bannawy/lib test -- --testPathPattern=integration

# Contract tests
pnpm --filter @el-bannawy/lib test -- --testPathPattern=contract

# Specific test file
pnpm --filter @el-bannawy/lib test -- --testPathPattern="user.validator"
```

## Coverage Targets

| Layer | Target |
|---|---|
| Validators | 100% |
| Firestore Mapper | 100% |
| UserRepository | 90% |
| UserService | 90% |
| UserApplicationService | 85% |

## Test Data

Tests use generated unique IDs to avoid collisions:
- `${testUserId}-${Date.now()}` pattern for user creation
- Unique mobile numbers per test
- Randomized event IDs for login events
