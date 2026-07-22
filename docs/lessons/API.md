# Lessons Module — API Reference

## El-bannawy Platform

Version: 1.0.0  
Base Path: `/api/v1/lessons`  
Status: Phase 6.1 (Lessons Core Module)  
Last Updated: 2026-07-22

---

## Standard Response Format

### Success

```json
{
  "success": true,
  "data": { "...": "..." },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Lesson not found: lesson-1"
  },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_INPUT` | 400 | Validation failure |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Duplicate resource |
| `CONFLICT` | 409 | Version conflict |
| `FORBIDDEN` | 403 | Access denied |
| `INTERNAL` | 500 | Unexpected error |

---

## Endpoints

### 1. List Lessons

```
GET /api/v1/lessons
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `unitId` | string | No | — | Filter by unit ID |
| `status` | string | No | — | Filter by status (`draft`, `published`, `archived`) |
| `isPublished` | boolean | No | — | Filter by published state |
| `isVisible` | boolean | No | — | Filter by visibility |
| `search` | string | No | — | Search by title or slug |
| `limit` | integer | No | 20 | Page size (1-100) |
| `cursor` | string | No | — | Pagination cursor |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "lesson-1",
        "unitId": "unit-1",
        "title": "Lesson 1: Hello World",
        "slug": "lesson-1-hello-world",
        "displayOrder": 0,
        "status": "published",
        "isPublished": true,
        "isVisible": true,
        "estimatedDuration": 30,
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "nextCursor": null
  },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

When `search` parameter is provided, the endpoint performs text search by title and slug.

---

### 2. Create Lesson

```
POST /api/v1/lessons
```

**Request Body:**

```json
{
  "id": "lesson-1",
  "unitId": "unit-1",
  "title": "Lesson 1: Hello World",
  "slug": "lesson-1-hello-world",
  "displayOrder": 0,
  "description": "Introduction to greetings",
  "status": "draft",
  "isPublished": false,
  "isVisible": true,
  "estimatedDuration": 30
}
```

**Required fields:** `id`, `unitId`, `title`, `slug`, `displayOrder`

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "lesson-1",
    "unitId": "unit-1",
    "title": "Lesson 1: Hello World",
    "slug": "lesson-1-hello-world",
    "description": "Introduction to greetings",
    "displayOrder": 0,
    "status": "draft",
    "isPublished": false,
    "isVisible": true,
    "estimatedDuration": 30,
    "createdAt": "2026-07-22T00:00:00.000Z",
    "updatedAt": "2026-07-22T00:00:00.000Z"
  },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

---

### 3. Get Lesson by ID

```
GET /api/v1/lessons/:id
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prev` | boolean | No | Returns the previous lesson in the same unit |
| `next` | boolean | No | Returns the next lesson in the same unit |

**Response (200) — Standard:**

```json
{
  "success": true,
  "data": {
    "id": "lesson-1",
    "unitId": "unit-1",
    "title": "Lesson 1: Hello World",
    "slug": "lesson-1-hello-world",
    "description": "Introduction to greetings",
    "displayOrder": 0,
    "status": "draft",
    "isPublished": false,
    "isVisible": true,
    "estimatedDuration": 30,
    "createdAt": "2026-07-22T00:00:00.000Z",
    "updatedAt": "2026-07-22T00:00:00.000Z"
  },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

**Response (200) — With `?prev=true` or `?next=true`:** Returns the adjacent lesson data directly (or `null` if no adjacent lesson exists).

---

### 4. Update Lesson

```
PATCH /api/v1/lessons/:id
```

**Request Body:**

```json
{
  "title": "Updated Lesson Title",
  "isPublished": true,
  "_expectedVersion": 0
}
```

**Response (200):**

```json
{
  "success": true,
  "data": { "...": "updated lesson data" },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

---

### 5. Soft Delete Lesson

```
DELETE /api/v1/lessons/:id
```

**Response (200):**

```json
{
  "success": true,
  "data": null,
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

---

### 6. Restore Lesson

```
POST /api/v1/lessons/:id/restore
```

**Response (200):**

```json
{
  "success": true,
  "data": null,
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

---

### 7. Publish Lesson

```
POST /api/v1/lessons/:id/publish
```

**Response (200):**

```json
{
  "success": true,
  "data": { "...": "published lesson data" },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

---

### 8. Unpublish Lesson

```
POST /api/v1/lessons/:id/unpublish
```

**Response (200):**

```json
{
  "success": true,
  "data": { "...": "unpublished lesson data" },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

---

### 9. Change Order

```
PATCH /api/v1/lessons/:id/order
```

**Request Body:**

```json
{
  "displayOrder": 5,
  "_expectedVersion": 0
}
```

**Response (200):**

```json
{
  "success": true,
  "data": { "...": "updated lesson data with new displayOrder" },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

---

### 10. Get Lessons by Unit

```
GET /api/v1/units/:unitId/lessons
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `published` | boolean | No | false | When `true`, returns only published lessons |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [ "...lesson data..." ],
    "nextCursor": null
  },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

---

## DTO Types

### LessonOutput

```typescript
interface LessonOutput {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly displayOrder: number;
  readonly status: string;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly estimatedDuration?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
```

### LessonSummaryOutput

```typescript
interface LessonSummaryOutput {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly displayOrder: number;
  readonly status: string;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly estimatedDuration?: number;
  readonly createdAt: string;
}
```

### LessonListOutput

```typescript
interface LessonListOutput<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}
```
