# AUDIT_LOGS_API.md

# El-bannawy Platform

## Audit Logs API Specification

Version: 1.0.0

---

# Purpose

This document defines all API endpoints related to the Audit Logs Module.

The Audit Logs API provides a complete, immutable record of every critical action performed within the El-bannawy Platform.

Audit Logs are essential for:

- Security
- Compliance
- Troubleshooting
- Incident Investigation
- Change Tracking
- Accountability

Audit logs are append-only.

Existing records must never be modified or deleted.

---

# Base Endpoint

/api/v1/audit-logs

---

# Authentication

Required

JWT Access Token

Administrator Role

Read-only access for Support Lead (Limited).

---

# Supported Roles

- Administrator
- Support Lead (Read Only)

---

# ==========================

# AUDIT LOGS

# ==========================

GET

/audit-logs

Description

Return audit logs.

Supported Filters

- User
- Module
- Action
- Resource
- Status
- Date Range
- IP Address

Response

```json
[
  {
    "id": "",
    "timestamp": "",
    "userId": "",
    "module": "Lessons",
    "action": "UPDATE",
    "resourceId": "",
    "status": "SUCCESS"
  }
]
```

---

# ==========================

# SINGLE LOG

# ==========================

GET

/audit-logs/{logId}

Description

Return complete audit record.

Includes

- User
- IP Address
- Device
- Browser
- Action
- Previous Value
- New Value
- Execution Time

---

# ==========================

# USER ACTIVITY

# ==========================

GET

/audit-logs/users/{userId}

Description

Return user activity timeline.

Filters

- Today

- Last 7 Days

- Last Month

---

# ==========================

# MODULE HISTORY

# ==========================

GET

/audit-logs/modules/{module}

Description

Return history for one module.

Examples

- Lessons

- Homework

- Payments

- AI

- Users

---

# ==========================

# SECURITY EVENTS

# ==========================

GET

/audit-logs/security

Description

Return security events.

Examples

- Failed Login

- Permission Denied

- Password Reset

- MFA Failure

- Token Revoked

---

# ==========================

# EXPORT

# ==========================

GET

/audit-logs/export

Administrator

Supported Formats

- CSV

- XLSX

- PDF

---

# ==========================

# SEARCH

# ==========================

GET

/audit-logs/search

Supported Parameters

- User

- Action

- Module

- Resource

- IP

- Date

---

# ==========================

# RETENTION

# ==========================

## Policy Tiers

| Tier    | Duration      | Storage                                              | Queryable                        | Includes                                                        |
| ------- | ------------- | ---------------------------------------------------- | -------------------------------- | --------------------------------------------------------------- |
| Hot     | 90 days       | Primary DB (Firestore)                               | Full search, all filters         | All audit events                                                |
| Warm    | 1 year        | Archive DB (Firestore export to BigQuery or similar) | Aggregated search, date-filtered | All audit events                                                |
| Cold    | 7 years       | Compressed JSON in Cloud Storage                     | Export only, no live query       | All audit events (without request/response bodies after 1 year) |
| Deleted | After 7 years | Permanently deleted                                  | None                             | N/A                                                             |

## Aggregation Strategy

After 90 days, old logs are automatically aggregated into daily summaries:

```
Summary document structure:
{
  "date": "2026-07-22",
  "module": "Users",
  "actions": {
    "CREATE": 45,
    "UPDATE": 123,
    "DELETE": 3
  },
  "uniqueUsers": 28,
  "uniqueIPs": 15,
  "averageResponseTime": 340,
  "errorCount": 2
}
```

Raw log details are preserved in Warm/Cold storage but only daily summaries remain in Hot storage.

## Retention API

GET /audit-logs/retention

Return current retention policy and storage statistics.

Response:

```json
{
  "hotDays": 90,
  "warmDays": 365,
  "coldDays": 2555,
  "totalSize": "4.2 GB",
  "hotSize": "1.8 GB",
  "warmSize": "1.5 GB",
  "coldSize": "0.9 GB",
  "estimatedDailyGrowth": "20 MB",
  "nextArchivalDate": "2026-10-20",
  "nextDeletionDate": "2033-07-22"
}
```

## Storage Estimation

| Factor                       | Estimate       |
| ---------------------------- | -------------- |
| Average log entry size       | 1.2 KB         |
| Daily log volume (current)   | 15,000 entries |
| Daily storage growth         | ~18-20 MB      |
| Year 1 storage               | ~6.5 GB        |
| Year 7 storage (total)       | ~45 GB         |
| Hot storage cost (Firestore) | ~$2-4/month    |
| Cold storage cost (GCS)      | ~$0.50/month   |

## Deletion Policy

- Hot data: automatically moved to Warm after 90 days via scheduled job
- Warm data: automatically moved to Cold after 1 year
- Cold data: permanently deleted after 7 years
- Deletion is irreversible — no grace period
- Before deletion, generate final export and notify administrators

## Compliance

Retention policy complies with:

- Egyptian data protection law
- GDPR (if EU students)
- Educational record retention requirements

---

# ==========================

# SYSTEM EVENTS

# ==========================

GET

/audit-logs/system

Return

- Deployment

- Configuration Changes

- Service Restart

- Maintenance Mode

- Feature Flags

---

# ==========================

# VALIDATION

# ==========================

Validate

- Administrator Permission

- Log Exists

- Module Exists

- Date Range

---

# ==========================

# SECURITY

# ==========================

Audit Logs are immutable.

Records cannot be:

- Edited

- Deleted

- Hidden

Every privileged action must generate an audit log.

---

# ==========================

# RATE LIMIT

# ==========================

Audit Search

30 Requests / Minute

Export

10 Requests / Minute

---

# ==========================

# STATUS CODES

# ==========================

200 OK

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

422 Validation Error

429 Too Many Requests

500 Internal Server Error

---

# ==========================

# PERFORMANCE

# ==========================

Search

<500ms

Single Record

<100ms

Export

Background Processing

---

# ==========================

# AUTOMATIC EVENTS

# ==========================

Automatically record

✓ Login

✓ Logout

✓ User Creation

✓ User Update

✓ Permission Change

✓ Lesson Update

✓ Homework Update

✓ Quiz Update

✓ Payment Verification

✓ Coin Transaction

✓ XP Award

✓ AI Configuration

✓ File Upload

✓ File Delete

✓ System Configuration

✓ Maintenance Mode

✓ Feature Flags

---

# ==========================

# ACCEPTANCE CRITERIA

# ==========================

✓ Audit logs are generated automatically.

✓ Logs are searchable.

✓ Logs are immutable.

✓ Export works.

✓ Security events are tracked.

✓ System events are tracked.

✓ Authorization works.

---

# Final Rule

The Audit Logs API is the single source of truth for platform activity.

Every critical action performed by users, administrators or automated services must be permanently recorded to ensure complete traceability, accountability and security.

End of Document.
