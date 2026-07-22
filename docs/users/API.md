# Users API

## El-bannawy Platform

Version: 1.0.0
Status: Implemented
Last Updated: 2026-07-22

## Base URL

All endpoints are prefixed with `/api/v1`.

## Standard Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation error description"
  },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

## Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `INVALID_INPUT` | 400 | Validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource already exists |
| `CONFLICT` | 409 | Version conflict |
| `FORBIDDEN` | 403 | Permission denied |
| `PRECONDITION_FAILED` | 412 | Precondition failed |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `UNAVAILABLE` | 503 | Service temporarily unavailable |
| `INTERNAL` | 500 | Internal server error |

---

## List Users

```http
GET /users
```

Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `limit` | number | No | Page size (1-100, default: 20) |
| `cursor` | string | No | Pagination cursor |
| `role` | string | No | Comma-separated role filter |
| `isActive` | boolean | No | Active status filter |
| `gradeId` | string | No | Grade filter |

Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uid-123",
        "role": "student",
        "fullName": "Ahmed Mohamed",
        "mobileNumber": "+201234567890",
        "isActive": true,
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "nextCursor": "cursor-xyz"
  },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

---

## Create User

```http
POST /users
```

Request Body:
| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Firebase Auth UID |
| `role` | string | Yes | User role |
| `fullName` | string | Yes | Full name (1-200 chars) |
| `mobileNumber` | string | Yes | International format (+201234567890) |
| `email` | string | No | Email address |
| `englishName` | string | No | English name |
| `parentMobile` | string | No | Parent mobile number |
| `governorate` | string | No | Governorate |
| `school` | string | No | School name |
| `avatarUrl` | string | No | Avatar URL |
| `jobTitle` | string | No | Job title (non-student roles) |
| `educationalSystemId` | string | No | Educational system |
| `stageId` | string | No | Stage |
| `gradeId` | string | No | Grade |
| `academicYearId` | string | No | Academic year |
| `termId` | string | No | Term |
| `isActive` | boolean | No | Active status (default: true) |

Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uid-123",
    "role": "student",
    "fullName": "Ahmed Mohamed",
    "mobileNumber": "+201234567890",
    "isActive": true,
    "createdAt": "2026-07-22T00:00:00.000Z",
    "updatedAt": "2026-07-22T00:00:00.000Z"
  },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

Validation Rules:
- `id`: Required, 1-128 characters
- `role`: Must be one of: `student`, `teacher`, `staff`, `secretary`, `support`, `administrator`
- `fullName`: Required, 1-200 characters
- `mobileNumber`: Required, must be international format
- `email`: Optional, must be valid email format

---

## Get User

```http
GET /users/{id}
```

Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uid-123",
    "role": "student",
    "fullName": "Ahmed Mohamed",
    "mobileNumber": "+201234567890",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-07-22T00:00:00.000Z"
  },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

Response: `404 Not Found` if user does not exist.

---

## Update Profile

```http
PATCH /users/{id}
```

Request Body:
| Field | Type | Required | Description |
|---|---|---|---|
| `fullName` | string | No | Full name |
| `mobileNumber` | string | No | International format |
| `email` | string | No | Email address |
| `englishName` | string | No | English name |
| `parentMobile` | string | No | Parent mobile |
| `governorate` | string | No | Governorate |
| `school` | string | No | School name |
| `avatarUrl` | string | No | Avatar URL |
| `jobTitle` | string | No | Job title |
| `_expectedVersion` | number | No | Optimistic concurrency version |

Response: `200 OK`

---

## Change Status

```http
PATCH /users/{id}/status
```

Request Body:
| Field | Type | Required | Description |
|---|---|---|---|
| `status` | string | Yes | New status: `active`, `inactive`, `suspended`, `pending` |
| `reason` | string | No | Reason for status change |

Response: `200 OK`

---

## Change Role

```http
PATCH /users/{id}/role
```

Request Body:
| Field | Type | Required | Description |
|---|---|---|---|
| `role` | string | Yes | New role |

Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uid-123",
    "role": "teacher",
    "fullName": "Ahmed Mohamed",
    "mobileNumber": "+201234567890",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-07-22T00:00:00.000Z"
  },
  "timestamp": "2026-07-22T00:00:00.000Z"
}
```

---

## Soft Delete User

```http
DELETE /users/{id}
```

Response: `200 OK` (data is null)

---

## Restore User

```http
POST /users/{id}/restore
```

Response: `200 OK` (data is null)

---

## Pagination

All list endpoints use cursor-based pagination.

1. First request: `GET /users?limit=20`
2. Response includes `nextCursor`
3. Subsequent request: `GET /users?limit=20&cursor=<nextCursor>`
4. When `nextCursor` is `null`, there are no more results
