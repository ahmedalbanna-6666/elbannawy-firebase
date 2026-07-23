# MASTER_EXECUTION_PLAN.md

# El-bannawy Platform
## Master Execution Plan

Version: 1.0.0

Status: ACTIVE

---

# Purpose

This document is the master execution guide for the entire El-bannawy Platform.

It is the FIRST document that every developer, technical lead, or AI coding agent must read before starting any implementation.

This document defines:

- Execution Order
- Development Phases
- Module Dependencies
- Engineering Rules
- Progress Tracking
- Definition of Done
- Release Gates

This document is the single execution source of truth.

---

# IMPORTANT

DO NOT START WRITING CODE
BEFORE READING THIS DOCUMENT.

---

# Project Vision

Build the most advanced AI-powered English learning platform in the Arab world.

Primary Goals

✓ High Performance

✓ High Scalability

✓ AI First

✓ Modern UI

✓ Production Ready

✓ Easy Maintenance

✓ Long-term Evolution

---

---

# Part I: Original Platform (NestJS + Prisma + PostgreSQL)

The original platform is **fully built and deployed**. All 15 phases are COMPLETE & LOCKED.

---

# Development Rules

Development must always follow the phases below.

Never skip a phase.

Never change execution order without updating this document.

Every phase must pass all quality gates before moving to the next one.

---

# Documentation Reading Order

Every developer must read:

README.md

↓

PROJECT_REFERENCE.md

↓

ARCHITECTURE_LOCK.md

↓

docs/firebase/FIRESTORE_ARCHITECTURE.md

↓

Architecture

↓

Database

↓

Backend

↓

Security

↓

API

↓

UI

↓

AI

↓

DevOps

↓

Testing

↓

Deployment

---

# Original Platform Development Phases (COMPLETE)

Phase 1

✅ Project Bootstrap

Phase 2

✅ Design System

Phase 3

✅ Authentication

Phase 4

✅ Core Dashboard

Phase 5

✅ Lesson Engine

Phase 6

✅ Activity Engine

Phase 7

✅ Homework

Phase 8

✅ Quiz Engine

Phase 9

✅ Reports

Phase 10

✅ Payments

Phase 11

✅ Notifications

Phase 12

✅ AI Integration

Phase 13

✅ Optimization

Phase 14

✅ Testing

Phase 15

✅ Production Deployment

---

# Phase Dependency Graph

Bootstrap

↓

Design System

↓

Authentication

↓

Dashboard

↓

Lesson Engine

↓

Activity Engine

↓

Homework

↓

Quiz

↓

Payments

↓

Notifications

↓

AI

↓

Testing

↓

Deployment

No phase may start before its dependencies are complete.

---

# Definition of Done

A module is considered complete only if:

✓ Backend Finished

✓ Frontend Finished

✓ API Documented

✓ Unit Tests Passed

✓ Integration Tests Passed

✓ Responsive

✓ Dark Mode Supported

✓ RTL Supported

✓ Accessibility Verified

✓ Documentation Updated

✓ Code Reviewed

✓ CI Passed

---

# Quality Gates

Before merging:

Lint

Type Check

Unit Tests

Integration Tests

Build

Documentation Review

Security Scan

Performance Validation

---

# Engineering Standards

TypeScript Only

Strict Mode

No any

Clean Architecture

Feature-based Structure

SOLID

DRY

KISS

Documentation Driven Development

---

# Git Workflow

feature/*

↓

Pull Request

↓

Code Review

↓

CI

↓

Merge develop

↓

Release

↓

main

---

# AI Agent Instructions

Every AI coding agent must:

Read documentation before implementation.

Never invent architecture.

Never bypass documented APIs.

Never create undocumented folders.

Never change naming conventions.

Never introduce additional dependencies without approval.

Update documentation whenever architecture changes.

---

# Folder Creation Order

apps/

↓

packages/

↓

frontend/

↓

backend/

↓

database/

↓

shared/

↓

docs/

↓

docker/

↓

scripts/

---

# Risk Management

High Risk

Authentication

Payments

Database Migrations

AI

Deployment

Medium Risk

Reports

Notifications

Storage

Low Risk

UI

Components

Utilities

---

# Success Criteria

The project succeeds when:

All modules are documented.

All tests pass.

Platform supports production deployment.

Platform supports thousands of concurrent students.

AI operates with curriculum-aware responses.

---

---

# Part II: Firebase Migration (In Progress)

The platform is migrating from PostgreSQL/Prisma to Firebase/Firestore.

---

# Firebase Migration Phases

## Phase 1: Architecture & Documentation

✅ COMPLETE & LOCKED

- Firebase Architecture Design
- Firestore data model (89 collections)
- Repository contracts (20+ interfaces)
- Collection strategy (flat root collections)
- Index design (all queries documented)
- Query patterns (cursor pagination)
- Security rules (role matrix + access classes)
- AI architecture (pgvector independent service)

---

## Phase 2: Repository Implementation — Production Migration

✅ COMPLETE & LOCKED BASELINE

| Module | Domain | Status |
|--------|--------|--------|
| Repository Foundation | BaseRepository, FirestoreService, TransactionManager, QueryBuilder, FirestoreMapper, error classes, contracts | ✅ COMPLETE & LOCKED |
| Users | User management | ✅ COMPLETE & LOCKED |
| Curriculum | EducationalSystem, Stage, Grade, AcademicYear, AcademicTerm, CurrentAcademicContext | ✅ COMPLETE & LOCKED |
| Lessons | Lesson CRUD, publish/unpublish/restore/order/complete | ✅ COMPLETE & LOCKED |
| Vocabulary | VocabularyItem, VocabularySection, VocabularyRelation, import | ✅ COMPLETE & LOCKED |
| Activities | Activity, StudentAttempt, LessonProgress, execution engine | ✅ COMPLETE & LOCKED |

🔄 PRODUCTION MIGRATION STREAMS

The remaining NestJS endpoints are migrated in 8 sequential phases.
Each phase must pass all verification gates before the next starts.

### Phase P1 — Authentication

**Goal:** Replace NestJS auth with Firebase Auth as single identity source of truth.
No NestJS session/refresh-token architecture. Firebase Auth handles credentials,
Firebase Custom Claims handle roles (`STUDENT`, `TEACHER`, `SECRETARY`, `SUPPORT`, `ADMINISTRATOR`).

| Item | Detail |
|------|--------|
| **Endpoints to migrate** | login (client-side Firebase SDK), register, me, forgot-password, reset-password, logout (client-side Firebase SDK), refresh-token (Firebase auto-refresh), sessions (Firebase managed), Google OAuth (client-side signInWithPopup), Apple OAuth (client-side signInWithPopup), complete-oauth-registration |
| **Firestore collections** | `users` (exists), `loginEvents` (exists) |
| **Repositories** | `UserService` / `UserRepository` from `@el-bannawy/lib` — Firebase Auth is the session authority. No `sessions` or `refreshTokens` collections. Firebase custom claims for RBAC. |
| **Key constraint** | Google/Apple callback URLs must be updated from `localhost:4000/api/v1/...` to Next.js route handlers. |
| **Complexity** | L |
| **Verification gates** | typecheck → lint → build → manual auth flow test → commit |
| **Status** | ✅ COMPLETE (2026-07-23) |

### Phase P2 — Curriculum (remaining)

**Goal:** Migrate remaining curriculum endpoints for continue-learning, stages, and progress.

| Item | Detail |
|------|--------|
| **Endpoints to migrate** | GET /curriculum, GET /curriculum/continue-learning, GET /curriculum/stages, GET/PATCH /curriculum/progress/:lessonId, GET /academic-context |
| **Firestore collections** | `lessonProgress` (exists), extend with progress aggregation |
| **Repositories** | Extend `CurriculumRepository` with progress methods |
| **Complexity** | M |
| **Verification gates** | typecheck → lint → build → verify curriculum browse + progress → commit |

### Phase P3 — Lessons (sub-resources)

**Goal:** Migrate remaining lesson sub-resources (videos, documents, homework/quiz attachment metadata).

| Item | Detail |
|------|--------|
| **Endpoints to migrate** | GET/POST/DELETE /lessons/:id/videos, GET/POST/DELETE /lessons/:id/document, PATCH /lessons/:id/document/downloadable, GET /lessons/:id/homework, GET /lessons/:id/quiz, POST/DELETE /lessons/:id/quiz/upload, POST/DELETE /lessons/:id/homework/upload |
| **Firestore collections** | `lessonVideos` (exists), `lessonDocuments` (exists), use Firebase Storage for file uploads |
| **Repositories** | `LessonVideoRepository`, `LessonDocumentRepository` |
| **Complexity** | M |
| **Verification gates** | typecheck → lint → build → verify lesson content display + file upload → commit |

### Phase P4 — Videos & Interactive Content

**Goal:** Migrate video playback, progress tracking, timeline events, and video questions.

| Item | Detail |
|------|--------|
| **Endpoints to migrate** | GET /videos/:id, POST /videos/:id/complete, GET /videos/:id/resume, GET /videos/:id/timeline-events, POST /timeline-events/:eventId/complete, Video Events CRUD + dispatch + reorder, Video Questions CRUD + with-event + answer |
| **Firestore collections** | `videos`, `videoProgress`, `videoEvents`, `videoQuestions`, `timelineEvents`, `timelineEventProgress` (all exist in docs) |
| **Repositories** | `VideoRepository`, `VideoEventRepository`, `VideoQuestionRepository`, `TimelineEventRepository` |
| **Complexity** | L |
| **Verification gates** | typecheck → lint → build → verify video playback + progress + timeline events → commit |

### Phase P5 — Homework

**Goal:** Full homework lifecycle — create, save, start, submit, grade, review.

| Item | Detail |
|------|--------|
| **Endpoints to migrate** | POST homework, PATCH/DELETE homework/:id, GET homework/:lessonId (analytics, questions, status), PATCH save, POST start, POST submit, GET result/history/review |
| **Firestore collections** | `homeworks`, `homeworkQuestions`, `homeworkAttempts`, `homeworkAnswers`, `answerKeys` |
| **Repositories** | `HomeworkRepository`, `HomeworkAttemptRepository` |
| **Complexity** | XL (assessment engine, locking, auto-grading, retry logic) |
| **Verification gates** | typecheck → lint → build → verify full homework flow (save→start→submit→result→review) → commit |

### Phase P6 — Quizzes

**Goal:** Full quiz lifecycle — create, save, start, submit, grade, review, unlock-status.

| Item | Detail |
|------|--------|
| **Endpoints to migrate** | POST quizzes, PATCH/DELETE quizzes/:id, GET quizzes/:lessonId (analytics, questions, unlock-status), PATCH save, POST start, POST submit, GET result/history/review |
| **Firestore collections** | `quizzes`, `quizQuestions`, `quizAttempts`, `quizAnswers`, `answerKeys`, `contentUnlocks` |
| **Repositories** | `QuizRepository`, `QuizAttemptRepository` |
| **Complexity** | XL (assessment engine, unlocking, completion policy) |
| **Verification gates** | typecheck → lint → build → verify full quiz flow (save→start→submit→result→review) → commit |

### Phase P7 — Progress & Home/Dashboard

**Goal:** Aggregate student progress views and the dashboard landing page.

| Item | Detail |
|------|--------|
| **Endpoints to migrate** | GET /home, GET /home/leaderboard, GET /activities/:id/progress, all remaining progress aggregation endpoints |
| **Firestore collections** | `studentStats`, `leaderboardSnapshots`, `xpAccounts`, `xpTransactions`, `xpLevels`, `achievements`, `userAchievements` |
| **Repositories** | `StudentStatsRepository`, `LeaderboardRepository`, `XpRepository`, `AchievementRepository` |
| **Complexity** | L (aggregation strategy — pre-computed documents vs on-the-fly queries) |
| **Verification gates** | typecheck → lint → build → verify dashboard + leaderboard → commit |

---

## Phase 3: Post-Migration Modules

⏳ Not started — to be executed after Phase 2 completion.

| Priority | Module | Rationale |
|:--------:|--------|-----------|
| Teacher | Competitions, Final Reviews, Stories (write), Live Classes (manage), Coins (manage), Support Tickets | Teacher workflow features |
| Admin | Reports, Payments, Admin students/tools, Coins packages | Admin operations |
| Optional | Document Import, Execution endpoint, Academic Context, Delegated Permissions | Utility / cleanup |
| AI | Conversation storage only (not AI service) | Per approved plan — pgvector stays independent |

---

## Phase 4: NestJS Decommission

⏳ Not started

- Confirm all endpoints migrated
- Remove `apps/backend/` directory
- Remove `database/prisma/` directory
- Remove NestJS dependencies from package.json
- Update deployment configuration
- Final documentation sweep

---

# Firebase Migration Progress

Architecture

████████████████████ 100%

Repository Implementation (Baseline)

████████████████████ 100%

Production Migration

██████░░░░░░░░░░░░░░ 22%

NestJS Decommission

░░░░░░░░░░░░░░░░░░░░ 0%

---

# Living Document Policy

This document must be updated after every completed phase.

Progress bars must reflect actual implementation.

Completed phases must be checked.

Future phases may be adjusted based on project evolution.

This document always represents the current state of the project.

---

# Final Rule

If there is any conflict between implementation and this execution plan:

STOP IMPLEMENTATION.

Update the documentation.

Then continue development.

Execution follows documentation—not assumptions.

End of Document.