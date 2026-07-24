# USER_JOURNEY.md

# El-bannawy Platform

## User Journey

Version: 1.0.0

---

# Purpose

This document defines the complete journey of every student inside the El-bannawy Platform.

This journey represents the official learning flow.

AI Agents must never change this flow without documentation approval.

---

# Student Journey

Student

↓

Create Account

↓

Verify Account

↓

Login

↓

Select Educational System

↓

Select Educational Stage

↓

Select Grade

↓

Home Dashboard

↓

Continue Learning

↓

Study Lesson

↓

Complete Homework

↓

Pass End Lesson Assessment

↓

Unlock Next Lesson

↓

Complete Unit

↓

Complete Course

---

# First Login

After creating an account the student must:

1. Verify account.
2. Login.
3. Select educational system.
4. Select stage.
5. Select grade.

The academic term is assigned by the teacher.

Students cannot change the academic term.

---

# Home Dashboard

After login the student lands on Home.

The Home page contains:

1. Ask El-bannawy AI

2. Book Live Class

3. Continue Learning

4. Curriculum Units

5. Coins / Subscription Status (balance + plan info, upgrade CTA)

6. Story

7. Final Review

8. Learn From Mistakes

9. Educational Games

This order must never change.

## Premium Indicators on Home

- If student has an active subscription: show subscription badge + plan name + days remaining
- If student has no subscription: show "Upgrade to Premium" CTA card
- Premium units/lessons in the curriculum display a premium badge and price (coins) or "Subscribe to Unlock" prompt
- If student already unlocked a premium item: show regular status (completed/current/locked)

---

# Continue Learning

Continue Learning always opens:

The last unfinished lesson.

If no lesson exists:

Open the first available lesson.

---

# Unit Journey

Student

↓

Choose Unit

↓

View Lessons

↓

Select Lesson

↓

Lesson Page

---

# Lesson Journey

Each Lesson contains:

Video 1 (timeline events + activities)

↓

Video 2 (timeline events + activities)

↓

Video N (timeline events + activities)

↓

Homework (optional — if enabled by teacher)

↓

End Lesson Assessment (optional — if enabled by teacher)

In Sequential Mode: videos must be completed in order.

In Any-Order Mode: students choose which video to watch.

The overall order (videos → homework → assessment) is fixed.

---

# Interactive Video Journey (Per Video)

This journey applies independently to each video in the lesson.

Student starts video.

↓

Playback continues normally (pause, resume, seek allowed).

↓

Playback reaches a configured Timeline Event.

↓

Video pauses automatically.

↓

Activity opens automatically.

↓

Student completes the activity.

↓

Student cannot bypass the activity.

↓

Video resumes from the same position.

↓

Next Timeline Event (if any).

↓

Video ends.

↓

Video N completed — proceed to next video or section.

---

# Activity Journey

Student reaches the Activities section (below the current video).

↓

Activities are rendered dynamically from the Word document (per video).

↓

Student completes each activity (belongs to current video).

↓

Activities may be objective or subjective.

↓

Objective activities are auto-graded.

↓

Subjective activities are evaluated by the AI Assessment Engine.

↓

Results are recorded.

---

# Homework Journey

Student opens Homework (if enabled by teacher).

↓

Answers questions.

↓

Submits Homework.

↓

Receives result.

↓

Homework stored.

---

# Quiz Journey

Student starts End Lesson Assessment (if enabled by teacher).

↓

Answers questions.

↓

Submit Assessment.

↓

System calculates score.

↓

Pass

↓

Lesson progression if configured.

Fail

↓

Retry.

---

# Learn From Mistakes Journey

Wrong Answer

↓

Automatically stored.

↓

Added to Learn From Mistakes.

↓

Student revisits.

↓

Answers correctly.

↓

Progress updated.

---

# Story Journey

Student

↓

Story Module

↓

Story Lesson

↓

Video

↓

Homework

↓

Quiz

↓

Next Story Lesson

---

# Final Review Journey

Student

↓

Final Review

↓

Review Videos

↓

Practice

↓

Final Exams

↓

Performance Report

The Final Review is available only when enabled by teachers.

---

# Educational Games Journey

Student

↓

Games

↓

Choose Game

↓

Play

↓

Earn XP

↓

Return Home

---

# Ask El-bannawy AI Journey

Student

↓

Open AI Assistant

↓

Ask Question

↓

AI Response

↓

Continue Learning

The AI must use approved educational content only.

---

# Live Class Journey

Student

↓

Book Live Class

↓

Receive Confirmation

↓

Receive Reminder

↓

Join Live Session

↓

Attendance Recorded

---

# Referral Journey

Student

↓

Copy Referral Link

↓

Invite Friend

↓

Friend Registers

↓

Reward Granted

---

# XP Journey

Complete Lesson

↓

Complete Homework

↓

Pass Quiz

↓

Earn XP

↓

Increase Rank

XP cannot be purchased.

---

# Purchase & Content Activation Journey

## Premium Content Discovery

Student browses content

↓

Sees Premium badge on locked unit/lesson

↓

Views price (Coins or Subscription required)

↓

Option A: Purchase with Coins (one-time unlock)

Option B: Subscribe (recurring access to all premium content)

---

## Subscription Purchase Journey (Option B)

Student selects subscription plan

↓

Plan types: Monthly, Quarterly, Yearly, Full Course

↓

Proceeds to Checkout

↓

Selects Payment Method (Paymob, Fawry, Instapay, etc.)

↓

Redirected to Payment Gateway

↓

Completes Payment

↓

Back to Platform — Payment Verification

↓

Payment Verified ✅

↓

Subscription Activated 🎉

↓

Content Entitlements Auto-Generated (all premium units/lessons in plan)

↓

Student accesses premium content

↓

First premium lesson unlocked

---

## Subscription States

| State     | Description                  | Student Experience                   |
| --------- | ---------------------------- | ------------------------------------ |
| TRIAL     | Free trial period (N days)   | Full premium access, no payment yet  |
| ACTIVE    | Within billing period        | Full premium access                  |
| GRACE     | Payment overdue (N days)     | Access continues, reminders sent     |
| EXPIRED   | Past due beyond grace period | Premium content locked               |
| CANCELLED | Student/admin cancelled      | Access until period end, then locked |
| UPGRADED  | Upgraded to higher plan      | New plan active, old plan prorated   |

## Subscription Lifecycle

```
TRIAL (if offered)
  ↓ on trial end or payment
ACTIVE
  ↓ on cancel
ACTIVE (until period end) → CANCELLED
  ↓ on non-payment
GRACE (N days)
  ↓ after grace period
EXPIRED → all entitlements revoked
```

---

## Coin Purchase Journey (Option A)

Student opens Coins Store

↓

Views available Coin Packages (500, 1000, 2000, etc.)

↓

Selects Package

↓

Chooses Payment Method

↓

Completes Payment

↓

Payment Verified ✅

↓

Coins Added to Wallet

↓

New Balance Updated

---

## Content Unlock with Coins

Student on Premium Unit/Lesson

↓

Sees: "Unlock with N Coins" button

↓

Clicks Unlock

↓

System checks wallet balance

↓

Sufficient Balance

↓

Coins Deducted

↓

Content Entitlement Created

↓

Content Activated ✅

↓

Student accesses premium lesson

Insufficient Balance

↓

"Not enough coins" prompt

↓

Option: Buy more coins (redirect to coin store)

---

## Content Activation Rules

### Automatic Activation (Subscription)

| Trigger                 | Action                                             | Scope                                |
| ----------------------- | -------------------------------------------------- | ------------------------------------ |
| Subscription created    | Grant entitlements for all premium content in plan | All units/lessons in plan            |
| Subscription renewed    | Extend all entitlements expiration date            | Same scope                           |
| Subscription upgraded   | Grant additional entitlements for new plan         | Additional units/lessons             |
| Subscription downgraded | Keep existing entitlements until period end        | No immediate revocation              |
| Subscription expired    | Revoke all entitlements tied to subscription       | All subscription-scoped entitlements |

### Manual Activation (Secretary/Admin)

Secretary or Admin may:

- Manually activate content for a student
- Manually deactivate content (revoke entitlement)
- Extend subscription period
- Grant temporary access (X days)
- Activate full course for a student

### Entitlement Expiration

When an entitlement expires:

1. Student loses access to the premium content
2. Premium badge reappears on locked content
3. Student can re-subscribe or re-purchase
4. Student progress on that content is preserved (not deleted)
5. If student re-subscribes, progress is restored

Entitlements never delete student progress — they only gate access.

---

## Free Trial Journey

Student selects Subscription Plan

↓

Plan has Free Trial (e.g., 7 days)

↓

Student enters payment method (not charged)

↓

Trial period starts

↓

Full premium access during trial

↓

Day N-1: Reminder "Your trial ends tomorrow"

↓

Day N: Trial ends

↓

Option A: Auto-convert to paid (if payment method on file)

Option B: Prompt to subscribe (premium content locked)

↓

If no action: subscription enters EXPIRED state

---

## Upgrade / Downgrade Journey

### Upgrade

Student on Basic Plan (Monthly)

↓

Selects Premium Plan (Yearly)

↓

System calculates prorated credit for remaining Basic period

↓

Student pays difference

↓

Subscription upgraded immediately

↓

Additional entitlements granted immediately

### Downgrade

Student on Premium Plan

↓

Selects Basic Plan

↓

No immediate refund (unless within refund policy)

↓

Premium access continues until current period end

↓

At period end: downgrade takes effect

↓

Premium-only entitlements revoked

↓

Basic entitlements remain

---

## Purchase Analytics

Track:

- Subscription conversion rate (trial → paid)
- Monthly Recurring Revenue (MRR)
- Average Revenue Per User (ARPU)
- Churn rate
- Most popular plan
- Coin purchase volume
- Content unlock popularity (which units/lessons most unlocked)

---

# Reports Journey

Student

↓

Reports

↓

View Progress

↓

View Scores

↓

View Attendance

↓

View XP

↓

View Coins

---

# Logout Journey

Student

↓

Profile

↓

Logout

↓

Session Ends

↓

Return to Login

---

# Final Rule

Every student inside the platform must follow this journey.

No undocumented flow may be introduced.

End of Document.
