# Users Data Model

## El-bannawy Platform

Version: 1.0.0
Status: Implemented
Last Updated: 2026-07-22

## Collections

### `users`

Root collection of user profiles and role assignments.

**Document ID:** Firebase Auth UID

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Firebase Auth UID |
| `fullName` | `string` | Yes | Full name in Arabic |
| `englishName` | `string?` | No | Full name in English |
| `email` | `string?` | No | Email address |
| `mobileNumber` | `string` | Yes | Mobile number (international format) |
| `parentMobile` | `string?` | No | Parent/guardian mobile |
| `role` | `Role` | Yes | Role object |
| `status` | `AccountStatus` | Yes | Account status object |
| `educationalSystemId` | `string?` | No | Educational system reference |
| `stageId` | `string?` | No | Stage reference |
| `gradeId` | `string?` | No | Grade reference |
| `academicYearId` | `string?` | No | Academic year reference |
| `termId` | `string?` | No | Term reference |
| `governorate` | `string?` | No | Governorate |
| `school` | `string?` | No | School name |
| `avatarUrl` | `string?` | No | Avatar image URL |
| `jobTitle` | `string?` | No | Job title (staff roles) |
| `isActive` | `boolean` | Yes | Whether the user is active |
| `createdBy` | `string?` | No | Who created this user |
| `createdAt` | `Timestamp` | Yes | Server timestamp |
| `updatedAt` | `Timestamp` | Yes | Server timestamp |
| `deletedAt` | `Timestamp?` | No | Soft delete timestamp |
| `schemaVersion` | `number` | Yes | Schema version (currently 1) |

### `Role` (Embedded Object)

| Field | Type | Required | Description |
|---|---|---|---|
| `role` | `UserRoleType` | Yes | One of: `student`, `teacher`, `staff`, `secretary`, `support`, `administrator` |
| `grantedAt` | `string` | Yes | ISO 8601 timestamp of role assignment |

### `AccountStatus` (Embedded Object)

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | `AccountStatusType` | Yes | One of: `active`, `inactive`, `suspended`, `pending` |
| `reason` | `string?` | No | Reason for current status |

### `loginEvents`

Immutable audit log of authentication events.

**Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Event ID |
| `userId` | `string` | Yes | User reference |
| `eventType` | `string` | Yes | Event type |
| `ipAddress` | `string?` | No | Client IP address |
| `userAgent` | `string?` | No | User agent string |
| `createdAt` | `Timestamp` | Yes | Server timestamp |
| `schemaVersion` | `number` | Yes | Schema version |

## Enums

### UserRoleType

- `student` - Student learner
- `teacher` - Teacher/instructor
- `staff` - Staff member
- `secretary` - Secretary
- `support` - Support agent
- `administrator` - System administrator

### AccountStatusType

- `active` - Account is active and usable
- `inactive` - Account is inactive
- `suspended` - Account is suspended (with reason)
- `pending` - Account pending activation

## Indexes

| Collection | Fields | Query |
|---|---|---|
| `users` | `role ASC, status ASC, createdAt DESC` | Admin users by role/status |
| `users` | `gradeId ASC, status ASC, createdAt DESC` | Students in a grade |
| `users` | `mobileNumber` (single) | Unique mobile lookup |
| `users` | `role` (single) | Filter by role |
| `users` | `status` (single) | Filter by status |
| `loginEvents` | `userId ASC, createdAt DESC` | User login history |

## Relationships

- User documents use the Firebase Auth UID as document ID
- One-to-one relationship between Auth user and Firestore user document
- Users reference optional academic structure documents (educationalSystem, stage, grade, academicYear, term) by ID
- Teacher-to-grade assignments are managed via the `teacherAssignments` collection (separate module)

## Soft Delete

- Users are soft-deleted by setting `deletedAt` to a timestamp
- Soft-deleted users are excluded from standard queries
- The `restoreUser` operation clears the `deletedAt` field
- User data is never hard-deleted
