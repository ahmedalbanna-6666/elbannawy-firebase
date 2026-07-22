# Activity Execution Engine

## Overview

The `ActivityExecutionEngine` orchestrates the entire activity lifecycle: context building, attempt creation, submission, grading, and progress tracking.

## Flow

```
Student clicks "Start" →
  1. Engine validates activity is published
  2. Checks max attempts hasn't been reached
  3. Creates a new StudentAttempt (status: in_progress)
  4. Initializes activity state from plugin
  5. Creates/updates LessonProgress (not_started → in_progress)
  6. Returns ExecutionResult with attempt + progress

Student submits answer →
  1. Engine validates attempt is in_progress
  2. Delegates grading to the activity plugin
  3. Updates attempt with score, feedback, status: submitted
  4. Updates lesson progress (increment completed activities)
  5. If all activities complete, marks lesson as completed
  6. Returns ExecutionResult with score + feedback + progress
```

## Key API

### `getExecutionContext(activityId, studentId, mode)`
Builds the runtime context for rendering an activity, including permissions and settings.

### `startAttempt(activityId, studentId, lessonId, unitId)`
Creates a new attempt. Returns `null` if activity is not published or max attempts exceeded.

### `submitAttempt(attemptId, answer, timeSpent)`
Grades and finalizes the attempt. Returns `null` if attempt not found or already submitted.

## Permissions

The engine calculates permissions dynamically:

| Permission | Condition |
|---|---|
| canAttempt | Activity published AND attempts < maxAttempts |
| canRetry | Activity is retryable AND attempts < maxAttempts |
| canReview | Activity published AND attempt is graded/submitted |
| canSkip | Activity is not required |

## Settings

| Setting | Source |
|---|---|
| locale | Default: 'en' |
| direction | Default: 'ltr' |
| showFeedback | Based on isScorable |
| showCorrectAnswer | Based on isScorable AND !isPractice |
| timeLimit | From activity config |

## Progress Calculation

- `percentage = (completedActivities / totalActivities) * 100`
- `score = cumulative sum of all graded attempts`
- Status changes to `completed` when all activities are done
