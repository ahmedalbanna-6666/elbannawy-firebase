# Activity Engine

## Overview

The Activity Engine is the core system for managing, executing, and grading learning activities within the El-bannawy Platform. It follows Domain-Driven Design principles with Clean Architecture layering.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js Routes)             │
├─────────────────────────────────────────────────────────────┤
│                      Service Layer                          │
│              (ActivityService + ExecutionEngine)             │
├─────────────────────────────────────────────────────────────┤
│                   Repository Layer (Firestore)               │
│  ActivityRepository | StudentAttemptRepo | ProgressRepo     │
├─────────────────────────────────────────────────────────────┤
│                   Domain Layer                               │
│  Activity | StudentAttempt | LessonProgress | ExecutionCtx   │
├─────────────────────────────────────────────────────────────┤
│                  Plugin System (Registry)                    │
│  MultipleChoice | FillBlank | Matching | Speaking | Writing │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### Domain Models
- `Activity` - Core activity entity with config, metadata, status lifecycle
- `StudentAttempt` - Tracks student work on an activity
- `LessonProgress` - Tracks overall lesson completion
- `ExecutionContext` - Runtime context for rendering/grading
- `ExecutionResult` - Result of attempt submission

### Status Lifecycle

**Activity:** `draft → published → archived`

**Attempt:** `in_progress → submitted → graded | expired`

**Lesson Progress:** `not_started → in_progress → completed`

## Collections

| Collection | Firestore Name | Key Fields |
|---|---|---|
| Activities | `activities` | lessonId, type, status, displayOrder |
| Student Attempts | `student_attempts` | activityId, studentId, lessonId, status |
| Lesson Progress | `lesson_progress` | studentId, lessonId, status |

## Activity Configuration

Each activity contains a `config` object with:
- `schemaVersion` - Version of the activity config schema
- `data` - Activity-type-specific configuration (questions, options, etc.)

Activity metadata supports: estimatedDuration, skill, difficulty, tags, bloomLevel.
