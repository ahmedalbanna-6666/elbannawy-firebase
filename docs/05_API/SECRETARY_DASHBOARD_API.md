# SECRETARY_DASHBOARD_API.md

# El-bannawy Platform
## Secretary Dashboard API Specification

Version: 1.0.0

---

# Purpose

This document defines all API endpoints used by the Secretary Dashboard.

The Secretary Dashboard API manages administrative operations including:

- Student Registration
- Subscription Management
- Payment Verification
- Coin Purchases
- Live Class Scheduling
- Parent Communication
- Administrative Reports

The Secretary Dashboard never manages educational content.

---

# Base Endpoint

/api/v1/secretary

---

# Authentication

Required

JWT Access Token

Secretary Role

---

# Supported Roles

- Secretary
- Administrator

---

# ==========================
# DASHBOARD
# ==========================

GET

/secretary/dashboard

Description

Return dashboard overview.

Response

```json
{
  "todayRegistrations": 18,
  "pendingPayments": 7,
  "expiringSubscriptions": 14,
  "todayLiveClasses": 9
}
```

---

# ==========================
# STUDENTS
# ==========================

GET

/secretary/students

Description

Return student list.

Filters

- Grade
- Stage
- Subscription
- Status

---

POST

/secretary/students

Create student account.

---

PATCH

/secretary/students/{studentId}

Update student information.

---

PATCH

/secretary/students/{studentId}/status

Update account status.

Possible Values

- Active
- Pending
- Suspended

---

PATCH

/secretary/students/{studentId}/reset-password

Reset student password.

---

# ==========================
# SUBSCRIPTIONS
# ==========================

## List Subscriptions

GET /secretary/subscriptions

Return subscriptions list.

Supported query parameters:
- studentId — return all subscriptions for a specific student
- status — filter by status (ACTIVE, TRIAL, GRACE, EXPIRED, CANCELLED)
- expiringWithin — return subscriptions expiring within N days
- status=expired — return all expired subscriptions

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "sub_123",
      "studentId": "student_456",
      "planId": "plan_monthly",
      "planName": "Monthly Premium",
      "status": "ACTIVE",
      "currentPeriodEnd": "2026-08-24T00:00:00Z",
      "autoRenew": true,
      "createdAt": "2026-07-01T00:00:00Z"
    }
  ]
}
```

---

## Create Subscription (Manual)

POST /secretary/subscriptions

Create a subscription for a student manually (offline registration).

Request:

```json
{
  "action": "create",
  "studentId": "student_456",
  "planId": "plan_monthly",
  "paymentMethod": "cash"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "sub_789",
    "studentId": "student_456",
    "status": "ACTIVE",
    "currentPeriodEnd": "2026-08-24T00:00:00Z"
  }
}
```

After creation, content entitlements must be manually activated via the Content Activation endpoint.

---

## Get Subscription Details

GET /secretary/subscriptions/{subscriptionId}

Return subscription with associated content entitlements.

Response includes:

```json
{
  "success": true,
  "data": {
    "subscription": { "...": "..." },
    "entitlements": [
      {
        "contentType": "UNIT",
        "contentId": "unit_123",
        "active": true,
        "expiresAt": "2026-08-24T00:00:00Z"
      }
    ]
  }
}
```

---

## Update Subscription

PATCH /secretary/subscriptions/{subscriptionId}

Update subscription fields.

Request (all fields optional):

```json
{
  "status": "ACTIVE",
  "currentPeriodEnd": "2026-09-24T00:00:00Z",
  "autoRenew": true
}
```

---

## Cancel Subscription

DELETE /secretary/subscriptions/{subscriptionId}

Cancel subscription immediately. Sets status to CANCELLED and autoRenew to false.

Student retains access until current period end.

Content entitlements are NOT immediately revoked — they expire naturally at period end.

---

## Subscription Dashboard

GET /secretary/subscriptions/dashboard

Return subscription overview metrics.

Response:

```json
{
  "activeSubscriptions": 145,
  "trialSubscriptions": 23,
  "expiringThisWeek": 14,
  "expiredLastWeek": 8,
  "gracePeriod": 3,
  "monthlyRevenue": 45000,
  "mostPopularPlan": "Monthly Premium"
}
```

---

# ==========================
# CONTENT ACTIVATION
# ==========================

The Content Activation endpoint allows secretaries to manually grant or revoke access to premium content for students.

## Activate Content

POST /secretary/content/activate

Grant a student access to premium content.

Request:

```json
{
  "studentId": "student_456",
  "contentType": "UNIT",
  "contentId": "unit_789",
  "sourceType": "manual",
  "expiresAt": "2026-08-24T00:00:00Z"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "ent_123",
    "contentType": "UNIT",
    "contentId": "unit_789",
    "active": true,
    "activatedAt": "2026-07-24T00:00:00Z",
    "expiresAt": "2026-08-24T00:00:00Z"
  }
}
```

## Activate Full Course

POST /secretary/content/activate/course

Grant a student access to all premium content (full course).

Request:

```json
{
  "studentId": "student_456",
  "durationDays": 365,
  "reason": "Full course purchase"
}
```

This activates entitlements for every premium unit and lesson in the student's grade.

## Revoke Content

POST /secretary/content/revoke

Immediately revoke a student's access to premium content.

Request:

```json
{
  "studentId": "student_456",
  "contentType": "UNIT",
  "contentId": "unit_789"
}
```

## List Student Entitlements

GET /secretary/content/entitlements?studentId=student_456

Return all content entitlements for a student, including active and expired ones.

Response:

```json
{
  "success": true,
  "data": [
    {
      "contentType": "UNIT",
      "contentId": "unit_123",
      "sourceType": "subscription",
      "active": true,
      "activatedAt": "...",
      "expiresAt": "..."
    }
  ]
}
```

## Activate Content from Payment

POST /secretary/payments/{paymentId}/activate

Verify a payment and automatically activate the corresponding content in one step.

This is the primary flow for offline payment verification:

1. Secretary marks payment as verified
2. System creates or extends the student's subscription
3. System grants content entitlements
4. Student receives notification

Request:

```json
{
  "action": "verify_and_activate"
}
```

Response includes payment status, subscription details, and activated entitlements.

---

# ==========================
# PAYMENTS
# ==========================

GET

/secretary/payments

Return payment list.

---

POST

/secretary/payments/verify

Verify payment.

---

GET

/secretary/payments/{paymentId}

Return payment details.

---

# ==========================
# COINS
# ==========================

GET

/secretary/coins

Return Coin purchase requests.

---

POST

/secretary/coins/verify

Verify Coin purchase.

Secretaries cannot manually add Coins.

---

# ==========================
# LIVE CLASSES
# ==========================

GET

/secretary/live

Return scheduled classes.

---

POST

/secretary/live

Schedule live class.

---

PATCH

/secretary/live/{classId}

Update schedule.

---

DELETE

/secretary/live/{classId}

Cancel session.

---

# ==========================
# WHATSAPP
# ==========================

POST

/secretary/whatsapp/send

Send WhatsApp message.

Supported Messages

- Registration Confirmation

- Payment Reminder

- Subscription Reminder

- Live Reminder

- Parent Report

---

GET

/secretary/whatsapp/history

Return message history.

---

# ==========================
# REPORTS
# ==========================

GET

/secretary/reports

Return administrative reports.

---

POST

/secretary/reports/generate

Generate report.

Supported

- PDF

- XLSX

---

# ==========================
# PROFILE
# ==========================

GET

/secretary/profile

Return secretary profile.

---

PATCH

/secretary/profile

Update profile.

Editable

- Name
- Phone
- Avatar

---

# ==========================
# VALIDATION
# ==========================

Validate

- Student Exists

- Payment Exists

- Subscription Exists

- Live Session Exists

- WhatsApp Template Exists

---

# ==========================
# SECURITY
# ==========================

Secretaries cannot:

- Modify educational content

- Award XP

- Modify Coins

- Change system settings

- Access administrator APIs

All requests require authorization.

---

# ==========================
# RATE LIMIT
# ==========================

Dashboard

60 Requests / Minute

Student Operations

30 Requests / Minute

Payment Verification

20 Requests / Minute

WhatsApp

20 Requests / Minute

---

# ==========================
# STATUS CODES
# ==========================

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

429 Too Many Requests

500 Internal Server Error

---

# ==========================
# PERFORMANCE
# ==========================

Dashboard

<500ms

Student Search

<200ms

Payment Verification

<500ms

Reports

Background Processing

---

# ==========================
# AUDIT LOGS
# ==========================

Record

- Student Registered

- Student Updated

- Subscription Created

- Subscription Renewed

- Payment Verified

- Live Session Scheduled

- WhatsApp Sent

---

# ==========================
# ACCEPTANCE CRITERIA
# ==========================

✓ Dashboard works.

✓ Student registration works.

✓ Subscription management works.

✓ Payment verification works.

✓ Coin verification works.

✓ Live scheduling works.

✓ WhatsApp communication works.

✓ Reports work.

✓ Authorization works.

---

# Final Rule

The Secretary Dashboard API is responsible only for operational and administrative workflows.

Educational content, student learning progress and platform configuration must remain outside the secretary's permissions.

End of Document.