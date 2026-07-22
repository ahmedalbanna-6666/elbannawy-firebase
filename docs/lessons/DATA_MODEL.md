# Lessons Module — Data Model

## El-bannawy Platform

Version: 1.0.0  
Status: Phase 6.1 (Lessons Core Module)  
Last Updated: 2026-07-22

---

## Firestore Collection

| Property | Type | Collection | Document ID |
|----------|------|------------|-------------|
| `lessons` | Root collection | `lessons` | Custom alphanumeric ID |

---

## Document Schema

### Field Mapping

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | — | Unique lesson identifier (matches document ID) |
| `unitId` | string | Yes | — | Parent Unit ID |
| `title` | string | Yes | — | Lesson title (max 300 chars) |
| `slug` | string | Yes | — | URL-safe slug (lowercase, hyphens) |
| `description` | string | No | null | Lesson description (max 5000 chars) |
| `displayOrder` | integer | Yes | — | Display order within unit (non-negative) |
| `status` | string | Yes | `'draft'` | Lesson status: `draft`, `published`, `archived` |
| `isPublished` | boolean | Yes | `false` | Published flag |
| `isVisible` | boolean | Yes | `true` | Visibility flag |
| `estimatedDuration` | integer | No | null | Estimated duration in minutes (min 1) |
| `createdAt` | Timestamp | Yes | — | Creation timestamp |
| `updatedAt` | Timestamp | Yes | — | Last update timestamp |
| `schemaVersion` | integer | Yes | 1 | Schema version for migration support |
| `deletedAt` | Timestamp / null | No | null | Soft delete timestamp |

---

## Indexes

### Required Composite Indexes

| Collection | Fields | Query |
|-----------|--------|-------|
| `lessons` | `unitId` Ascending, `deletedAt` Ascending, `displayOrder` Ascending | `getLessonsByUnit` |
| `lessons` | `unitId` Ascending, `deletedAt` Ascending, `isPublished` Ascending, `status` Ascending, `displayOrder` Ascending | `getPublishedLessons` |

### Required Single-Field Indexes

| Collection | Field | Query |
|-----------|-------|-------|
| `lessons` | `deletedAt` | `listLessons` filter |
| `lessons` | `unitId` | `getLessonsByUnit` |
| `lessons` | `status` | `listLessons` filter |
| `lessons` | `isPublished` | `listLessons` filter |
| `lessons` | `isVisible` | `listLessons` filter |
| `lessons` | `displayOrder` | `listLessons` order |

---

## Entity Types

### Domain Lesson

```typescript
interface Lesson extends IBaseEntity {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly displayOrder: number;
  readonly status: LessonStatus;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly estimatedDuration?: number;
}
```

### Domain LessonSummary

```typescript
interface LessonSummary {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly displayOrder: number;
  readonly status: LessonStatus;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly estimatedDuration?: number;
  readonly createdAt: string;
}
```

### LessonStatus

```typescript
const LessonStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

type LessonStatus = 'draft' | 'published' | 'archived';
```

---

## Firestore Document Shape

When stored in Firestore, each lesson document has the following shape:

```javascript
{
  unitId: "unit-1",
  title: "Lesson 1: Hello World",
  slug: "lesson-1-hello-world",
  description: "Introduction to greetings",
  displayOrder: 0,
  status: "draft",
  isPublished: false,
  isVisible: true,
  estimatedDuration: 30,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  schemaVersion: 1,
  deletedAt: null
}
```

The document ID matches the `id` field and is stored as part of the document reference.

---

## Contract Interfaces

### ILesson

```typescript
interface ILesson {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly displayOrder: number;
  readonly status: LessonStatus;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly estimatedDuration?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}
```

### ILessonSummary

```typescript
interface ILessonSummary {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly displayOrder: number;
  readonly status: LessonStatus;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly estimatedDuration?: number;
  readonly createdAt: string;
}
```

### CreateLessonInput

```typescript
interface CreateLessonInput {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly displayOrder: number;
  readonly status?: LessonStatus;
  readonly isPublished?: boolean;
  readonly isVisible?: boolean;
  readonly estimatedDuration?: number;
}
```

### UpdateLessonInput

```typescript
interface UpdateLessonInput {
  readonly title?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly displayOrder?: number;
  readonly status?: LessonStatus;
  readonly isPublished?: boolean;
  readonly isVisible?: boolean;
  readonly estimatedDuration?: number;
}
```

---

## Repository Methods

The `ILessonRepository` interface exposes 15 methods:

| Method | Input | Returns | Description |
|--------|-------|---------|-------------|
| `createLesson` | `CreateLessonInput` | `ILesson` | Create a new lesson |
| `updateLesson` | `id`, `UpdateLessonInput`, `version` | `ILesson` | Update existing lesson |
| `getLessonById` | `id` | `ILesson` | Get lesson by ID |
| `listLessons` | `LessonFilter`, `PageQuery` | `Page<ILessonSummary>` | List with filters + pagination |
| `getLessonsByUnit` | `unitId` | `ILesson[]` | Get all lessons in a unit |
| `getPublishedLessons` | `unitId` | `ILesson[]` | Get published lessons in unit |
| `searchLessons` | `searchTerm`, `PageQuery` | `Page<ILessonSummary>` | Search by title/slug |
| `getPreviousLesson` | `unitId`, `displayOrder` | `ILesson \| null` | Previous lesson navigation |
| `getNextLesson` | `unitId`, `displayOrder` | `ILesson \| null` | Next lesson navigation |
| `softDeleteLesson` | `id`, `requestId` | `void` | Soft delete |
| `restoreLesson` | `id`, `requestId` | `void` | Restore soft-deleted |
| `archiveLesson` | `id`, `requestId` | `void` | Archive lesson |
| `publishLesson` | `id`, `requestId` | `ILesson` | Publish lesson |
| `unpublishLesson` | `id`, `requestId` | `ILesson` | Unpublish lesson |
| `changeOrder` | `id`, `newOrder`, `version` | `ILesson` | Change display order |
