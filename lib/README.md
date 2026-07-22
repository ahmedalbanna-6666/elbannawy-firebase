// README.md

# Repository Infrastructure

This module provides the core repository infrastructure for the El-bannawy Platform, designed according to Clean Architecture, SOLID principles, and Domain-Driven Design patterns.

## Architecture Summary

### Overview
The repository infrastructure implements a generic, type-safe foundation for all Firebase-based repositories in the platform. It follows the Repository Pattern with dependency injection, allowing business logic to operate against abstract repository interfaces without knowing persistence details.

### Core Components

1. **BaseRepository** - Generic CRUD abstraction with standard operations:
   - `create()` - Create new entities
   - `getById()` - Retrieve entities by ID
   - `update()` - Update existing entities with optimistic concurrency control
   - `archive()` - Soft delete functionality
   - `restore()` - Restore archived entities
   - `exists()` - Check entity existence

2. **QueryBuilder** - Advanced query capabilities:
   - Field-based filtering with multiple operators
   - OrderBy, limit, and cursor pagination
   - Projections for selective field retrieval
   - Support for complex filter conditions

3. **Repository Contracts** - TypeScript interfaces defining all repository boundaries:
   - Identity and Access Repository (User, TeacherAssignment)
   - Academic Structure Repository (EducationalSystem, Stage, Grade, etc.)
   - Lesson Content Repository (Lesson, Video, Activity, Vocabulary, etc.)
   - Assessment Repository (Homework, Quiz, Assessment, etc.)
   - Progress Repository (LessonProgress, VideoProgress, Attempts, etc.)
   - Gamification, Commerce, AI, and other domain repositories

4. **Firestore Mapper Layer** - Bidirectional transformation:
   - Firestore Document ⇔ Domain Entity ⇔ DTO
   - Timestamp normalization and type safety
   - Cursor-based pagination support

5. **Validation Layer** - Zod-based validation at repository boundaries:
   - Comprehensive schemas for all input types
   - Domain-driven validation rules
   - Early error detection before persistence

6. **Error Layer** - Standardized repository errors:
   - `ValidationError` - INVALID_INPUT
   - `NotFoundError` - NOT_FOUND
   - `ConflictError` - ALREADY_EXISTS
   - `PermissionDeniedError` - FORBIDDEN
   - `ConcurrencyError` - PRECONDITION_FAILED
   - `TransactionError` - UNAVAILABLE
   - `RateLimitError` - RATE_LIMITED
   - `UnexpectedRepositoryError` - INTERNAL

7. **Transaction Manager** - Firestore transaction management:
   - Retry logic with exponential backoff
   - Idempotency support
   - Optimistic concurrency control
   - Transaction ID generation and tracking

8. **Repository Factory** - Dependency injection:
   - Factory-based repository instantiation
   - Single entry point for all repositories
   - Testability and loose coupling

9. **Shared Types** - Common abstractions:
   - `RepositoryResult<T>` - Unified response type
   - `Page<T>` - Pagination results
   - `ICursor` - Cursor for pagination
   - `IFilter` - Query filters

## Design Decisions

### 1. TypeScript Strict Mode
- All code is written in TypeScript with strict mode enabled
- No `any` types used throughout the codebase
- Explicit return types for all functions
- Exhaustive type checking

### 2. Repository Pattern
- Repositories own persistence and query translation only
- Business logic resides in use cases/services layers
- No repository exposes Firestore SDK types
- Clear separation of concerns

### 3. Dependency Injection
- Repositories depend on abstractions (interfaces)
- TransactionManager injected into repositories
- RepositoryFactory manages repository construction
- Enhanced testability and flexibility

### 4. Zod Validation
- Every repository validates data using Zod at input boundaries
- Domain-driven validation rules embedded in schemas
- Early error detection before any side effects

### 5. Error Handling
- Standardized `RepositoryError` interface
- Domain-specific error codes
- Retryable vs non-retryable error differentiation
- Request ID tracking for debugging

### 6. Transaction Management
- Optimistic concurrency through version checking
- Retry with exponential backoff
- Idempotency keys for safe retries
- Structured error reporting

### 7. Pagination
- Cursor-based pagination (no offset)
- Common `Page` and `PageQuery` interfaces
- Next cursor support for infinite scroll
- Bounded query pages (20-50 items)

## Dependency Graph

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Use Cases     │    │   Business      │    │   Framework    │
│ / Services      │───▶│   Logic         │───▶│   (NestJS,     │
└─────────────────┘    │   (Core)         │    │   Zod, TypeScript)
                      └─────────┬─────────┘    └─────────────────┘
                                │
                      ┌─────────▼─────────┐    ┌─────────────────┐
│   Shared Types   │    │   Repository     │    │   Error Layer   │
│  (Pagination,     │    │   Contracts      │───▶│   (Errors)      │
│   Cursor, Filter) │    │  (IUserRepository,│    │   (RepositoryError)
│                  │    │   ILessonRepository│   │                  │
└─────────────────┘    └─────────┬─────────┘    └─────────────────┘
                                │
                          ┌─────▼─────┐    ┌─────────────────┐
│   Firestore Mapper  │    │   Base     │    │   Query Builder │
│   (Transformer)     │───▶│ Repository  │───▶│  (QueryBuilder) │
│                    │    │   (CRUD)    │    │                │
└─────────────────┬───┘    └─────────────┘    └─────────────────┘
                  │
            ┌─────▼─────┐    ┌─────────────────┐    ┌─────────────────┐
│   Validation Layer │    │ Transaction     │    │  Repository     │
│   (Zod Schemas)   │───▶│   Manager       │───▶│   Factory       │
│                  │    │                 │    │ (DI Container) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Known Limitations

### 1. Firestore SDK Abstraction
- Firestore SDK is mocked in TransactionManager
- Real Firebase integration requires proper SDK injection
- Transaction-based operations are conceptual

### 2. Performance Considerations
- Cursor-based pagination requires reverse lookups
- Firestore aggregation functions are not implemented
- Batch writes for multi-document operations are conceptual

### 3. Domain Coverage
- Only User and TeacherAssignment repositories are fully implemented
- Other repositories are skeleton implementations
- Actual business logic is not yet integrated

### 4. Testing
- Comprehensive unit tests for all components are missing
- Integration tests with actual Firestore are not yet implemented
- Mocking strategy for testing is conceptual

### 5. Type Safety
- While TypeScript strict mode is enforced, some runtime type guards could be more comprehensive
- Zod validation schemas may not cover all edge cases

## Usage Example

### Creating a User

```typescript
import { RepositoryFactory, TransactionManager } from '@el-bannawy/lib';

const factory = new RepositoryFactory(TransactionManager.getInstance());
const userRepo = factory.createUserRepository();

const input: CreateUserInput = {
  id: 'uuid-string',
  role: 'student',
  fullName: 'John Doe',
  mobileNumber: '1234567890',
};

const result = await userRepo.createUser(input);
if (result.ok) {
  console.log('User created:', result.value);
} else {
  console.error('Error:', result.error.code, result.error.message);
}
```

### Executing a Query

```typescript
import { TransactionManager } from '@el-bannawy/lib';

const transactionManager = TransactionManager.getInstance();
const query = new QueryBuilder(transactionManager);

const filter = {
  role: { $in: ['student', 'teacher'] },
  isActive: { $eq: true }
};

const pageQuery: PageQuery = {
  limit: 20,
  cursor: undefined,
};

const result = await query
  .whereFilter(filter)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .execute('users');
```

### Error Handling

```typescript
import { fromError, ValidationError } from '@el-bannawy/lib';

try {
  // Business logic that may throw
} catch (error) {
  const repositoryError = fromError(error);
  switch (repositoryError.code) {
    case 'NOT_FOUND':
      // Handle not found
      break;
    case 'CONFLICT':
      // Handle conflict (retryable)
      break;
    default:
      // Handle other errors
      break;
  }
}
```

## Current Status

This implementation completes **Phase 2** of the El-bannawy Platform development:
- ✅ BaseRepository abstraction
- ✅ QueryBuilder with advanced features
- ✅ Repository contracts/interfaces
- ✅ Firestore Mapper layer
- ✅ Validation layer (Zod)
- ✅ Error layer with all standard errors
- ✅ Transaction Manager with retry logic
- ✅ Repository Factory for DI
- ✅ Shared types (repository, pagination, cursor, filter)

**Note**: This is the foundation infrastructure only. Business modules (Authentication, Curriculum, Lessons, APIs, UI) are implemented separately following the documented phases.

## Recommendations for Future Work

1. Implement specific repository implementations for all domain contracts
2. Add comprehensive unit and integration tests
3. Integrate with actual Firebase Admin SDK
4. Implement repository-specific validation schemas
5. Add monitoring and observability for repository operations
6. Implement caching strategies for read-heavy operations
7. Add repository performance metrics and monitoring
8. Implement repository-specific business rules validation

---

## License

Part of El-bannawy Platform - Build the most advanced AI-powered English learning platform in the Arab world.
