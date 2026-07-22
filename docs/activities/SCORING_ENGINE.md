# Scoring Engine

## El-bannawy Platform

Version: 1.0.0  
Status: Phase 7.0 — Architecture Design (Pre-Implementation)  
Last Updated: 2026-07-22

---

## Overview

The Scoring Engine is responsible for calculating scores, determining pass/fail, and generating feedback for student activity submissions. It supports four grading methods and delegates type-specific scoring logic to activity plugins.

---

## Grading Methods

| Method | Code | Description | Latency |
|--------|------|-------------|---------|
| Auto-graded | `auto` | Deterministic scoring by plugin logic. Immediate result. | < 100ms |
| Manual | `manual` | Teacher reviews and assigns score. Asynchronous. | Hours-days |
| AI-assisted | `ai_assisted` | AI suggests score + feedback, teacher approves. Semi-async. | 5-30s |
| Practice-only | `practice` | No scoring. Feedback only (if applicable). | Immediate |

---

## Auto-Graded Scoring

### Supported Activity Types

| Type | Scoring Logic |
|------|---------------|
| MCQ (single) | Exact match: correctAnswer === selectedOption. Score = maxScore if correct, 0 if incorrect. |
| MCQ (multi) | Partial credit: each correct selection = maxScore / totalCorrect. Incorrect selections may deduct (configurable). |
| True/False | Exact match: correctAnswer === selectedValue. Score = maxScore or 0. |
| Matching | Each correct match = maxScore / totalPairs. Partial credit per pair. |
| Fill Blank | Default: exact match (case-insensitive, trimmed). Acceptable alternatives from acceptableAnswers[]. Partial credit per blank. |
| Drag Order (exact) | All positions correct = maxScore. Any incorrect = 0. |
| Drag Order (adjacent) | Each correct adjacent pair = maxScore / (totalItems - 1). |
| Drag Order (positional) | Each item in correct position = maxScore / totalItems. |
| Grammar (mixed) | Delegate to embedded question type scoring. Aggregate. |

### Scoring Algorithm

```typescript
function autoScore(
  plugin: ActivityPlugin,
  config: unknown,
  answer: unknown,
): ScoringResult {
  const maxScore = calculateMaxScore(config);
  const score = plugin.score(config, answer);
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const passingThreshold = config.passingThreshold ?? 60;

  return {
    score,
    maxScore,
    percentage,
    passed: percentage >= passingThreshold,
    passingThreshold,
    partial: score > 0 && score < maxScore,
  };
}
```

### Partial Credit Rules

| Rule | Description | Applied To |
|------|-------------|------------|
| Equal distribution | Each item in a multi-item activity gets equal weight | Matching, Fill Blank, Multi-MCQ |
| Adjacent pairs | Credit for correctly ordered adjacent pairs | Drag Order (adjacent mode) |
| Positional | Credit for each item in correct position | Drag Order (positional mode) |
| No negative | Minimum score is always 0 (no negative scoring) | All |
| Custom weights | Individual items can have different weights | Future |

---

## Manual Grading

### Supported Activity Types

| Type | Typical Criteria |
|------|------------------|
| Writing | Grammar, vocabulary, structure, coherence, task completion |
| Speaking | Pronunciation, fluency, accuracy, intonation, task completion |

### Workflow

```
1. Student submits answer
2. StudentAttempt created with status = "submitted", score = null
3. Teacher dashboard shows pending items
4. Teacher opens submission
5. Teacher views rubric and assigns score per criterion
6. Teacher adds feedback comment
7. Teacher approves/overrides AI suggestion (if AI-assisted)
8. StudentAttempt updated: status = "graded", score, feedback
9. LessonProgress updated
10. Student notified of grade
```

### Teacher Grading Interface Requirements

| Feature | Description |
|---------|-------------|
| Rubric display | Show criteria with weight, possible levels, descriptions |
| Score input | Slider or numeric input per criterion |
| Auto-calculate | Total score = sum of weighted criteria |
| Feedback editor | Rich text editor for feedback |
| AI suggestion | Show AI-suggested score + feedback (if AI-assisted) |
| Override | Allow teacher to override AI suggestion |
| Quick grading | Keyboard shortcuts for common scores |
| Queue management | Sort by submission date, priority, student |

### Grading Queue

```typescript
interface GradingQueueItem {
  attemptId: string;
  studentId: string;
  studentName: string;
  activityId: string;
  activityTitle: string;
  lessonId: string;
  type: ActivityType;
  submittedAt: string;
  timeSpent?: number;
  aiScore?: number;              // AI suggestion if applicable
  aiFeedback?: string;
  rubric: RubricDefinition;
  answer: unknown;
}
```

---

## AI-Assisted Scoring

### Supported Activity Types

| Type | AI Role |
|------|---------|
| AI Writing Review | Evaluate writing against rubric. Suggest score + feedback. |
| AI Speaking Review | Evaluate speaking (transcript + audio features). Suggest score + feedback. |
| Writing (aiAssisted) | AI pre-grades, teacher approves. |
| Speaking (aiAssisted) | AI pre-grades, teacher approves. |

### AI Scoring Pipeline

```
1. Student submits answer
2. Server calls AI scoring service
3. AI service:
   a. Retrieves rubric from activity config
   b. Builds evaluation prompt with student answer + rubric
   c. Calls LLM with structured output format
   d. Parses structured response (score per criterion + overall)
   e. Returns ScoringResult + Feedback
4. Server creates StudentAttempt with:
   - score = AI score
   - status = "submitted" (pending teacher approval)
   - gradingMethod = "ai_assisted"
5. Teacher reviews and approves/overrides
6. If teacher approves within N days: status = "graded"
7. If teacher overrides: use teacher's score
```

### AI Prompt Template

```
You are an English language assessment assistant.

Evaluate the following student submission against the provided rubric.

Rubric: {rubric}

Student Answer: {answer}

Provide a score for each criterion and overall feedback.
Return in JSON format:
{
  "criteria": [{ "name": string, "score": number, "maxScore": number, "feedback": string }],
  "totalScore": number,
  "maxScore": number,
  "overallFeedback": string,
  "suggestions": string[]
}
```

### AI Scoring Safeguards

| Safeguard | Implementation |
|-----------|---------------|
| Score range validation | AI output must be within 0-maxScore for each criterion |
| Structured output | JSON schema enforced via LLM structured output mode |
| Teacher review required | AI score is a suggestion only; teacher must approve |
| Anomaly detection | Flag if AI score deviates > 30% from historical average |
| Rate limiting | Max 10 AI scoring requests per minute per student |
| Audit log | All AI scoring requests and responses are logged |

---

## Practice-Only Scoring

### Supported Activity Types

| Type | Scoring Behavior |
|------|------------------|
| Flashcards | Self-assessed rating (easy/medium/hard). No numerical score. |
| AI Dialogue | Completion-based. Score = number of turns completed / maxTurns. Practice flag set. |
| Game | Points tracked but not recorded as academic score. |
| Vocabulary (quizMode off) | No scoring. |

### Practice Rules

- `isPractice: true` on the activity definition.
- StudentAttempt is created with `gradingMethod = "practice"`.
- Score is always 0 (or completion percentage).
- Practice attempts do not count toward lesson completion.
- Practice attempts do not appear in grade reports.
- Feedback may still be generated (self-assessment, AI dialogue).

---

## Score Aggregation

### Lesson-Level Aggregation

```typescript
function calculateLessonProgress(attempts: StudentAttempt[]): LessonProgress {
  const requiredActivities = attempts.filter((a) => a.isRequired);
  const completedActivities = requiredActivities.filter((a) => a.passed === true);
  const scoredActivities = attempts.filter((a) => a.score != null);

  return {
    completedActivities: completedActivities.length,
    totalActivities: requiredActivities.length,
    percentage: requiredActivities.length > 0
      ? (completedActivities.length / requiredActivities.length) * 100
      : 0,
    score: scoredActivities.reduce((sum, a) => sum + (a.score ?? 0), 0),
    maxScore: scoredActivities.reduce((sum, a) => sum + a.maxScore, 0),
  };
}
```

### Unit-Level Aggregation

Unit score = average of all lesson scores (weighted by lesson activity count).

### Course-Level Aggregation

Course score = weighted average of all unit scores.

---

## Passing Thresholds

| Level | Default Threshold | Configurable? |
|-------|------------------|---------------|
| Activity | 60% | Per activity (`passingThreshold` in config) |
| Lesson | 70% of required activities passed | Configurable per lesson |
| Unit | 70% of lessons passed | Configurable per unit |
| Course | 60% overall | Configurable per course |

---

## Feedback Generation

### Feedback Types

| Type | Description | Used By |
|------|-------------|---------|
| Correct/Incorrect | Simple right/wrong with correct answer shown | Auto-graded |
| Explanation | Detailed explanation of correct answer | Auto-graded, AI |
| Rubric feedback | Per-criterion score with comments | Manual, AI-assisted |
| Suggestions | Improvement suggestions for next attempt | Auto (configurable), AI |
| Self-assessment prompt | "Do you want to review this topic?" | Practice |

### Feedback Template Per Type

| Type | Feedback |
|------|----------|
| MCQ | "Correct! [explanation]" / "Not quite. The correct answer is [answer]. [explanation]" |
| True/False | "Correct. [explanation]" / "Incorrect. The statement is [correctAnswer]. [explanation]" |
| Matching | "You matched [correct]/[total] correctly." + list of correct/incorrect pairs |
| Fill Blank | Per-blank feedback: "Blank 1: correct!" / "Blank 2: expected 'answer', you wrote 'your answer'" |
| Drag Order | "Your order: [studentOrder]. Correct order: [correctOrder]" |
| Writing | Per-criterion scores + overall feedback + suggestions |
| Speaking | Per-criterion scores + pronunciation feedback + suggestions |

---

## Retry Logic

### Max Attempts

| maxAttempts | Behavior |
|-------------|----------|
| null / undefined | Unlimited attempts |
| 1 | Single attempt, no retry |
| N | N total attempts allowed |

### Retry Flow

```
1. Student fails activity (percentage < passingThreshold)
2. If retryable and maxAttempts not exceeded:
   - Show "Try Again" button
   - New StudentAttempt created with incremented attemptNumber
   - Previous attempts preserved for audit
3. If not retryable:
   - Show feedback
   - Move to next activity
```

### Retry Scoring

| Policy | Behavior |
|--------|----------|
| Best score | Final score = max of all attempts |
| Last score | Final score = most recent attempt score |
| Average | Final score = average of all attempts |

Default: **Best score** (encourages improvement).

---

## Scoring Result Payload

```typescript
interface ScoringResult {
  // Score
  score: number;                        // Points earned
  maxScore: number;                     // Maximum possible points
  percentage: number;                   // score / maxScore * 100
  passed: boolean;                      // percentage >= passingThreshold
  passingThreshold: number;             // Percentage required to pass

  // Grading
  gradingMethod: 'auto' | 'manual' | 'ai_assisted' | 'practice';
  partial: boolean;                     // Whether partial credit was given

  // Feedback
  feedback: {
    message: string;                    // Human-readable summary
    details?: Array<{
      criterion?: string;               // Rubric criterion name
      score?: number;                   // Score for this criterion
      maxScore?: number;
      feedback: string;                 // Criterion-specific feedback
    }>;
    suggestions?: string[];             // Improvement suggestions
    nextSteps?: string[];               // Recommended next actions
  };

  // Correct answer (if reveal is enabled)
  correctAnswer?: unknown;

  // Metadata
  gradedAt: string;                     // ISO timestamp
  gradedBy?: string;                    // "auto" | "ai" | teacher ID
}
```

---

## Scoring Engine Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Submission Handler                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Receive validated answer                        │
│  2. Determine grading method from plugin            │
│  3. Route to scoring handler                        │
│                                                     │
└──────────┬──────────┬──────────┬──────────┬─────────┘
           │          │          │          │
           ▼          ▼          ▼          ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │   Auto   │ │  Manual  │ │ AI-      │ │ Practice │
    │  Score   │ │  Queue   │ │ Assisted │ │  (no-op) │
    └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘
         │            │            │
         ▼            ▼            ▼
    ┌─────────────────────────────────────┐
    │       Plugin.score(config, answer)  │
    └─────────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────┐
    │    Plugin.generateFeedback(...)     │
    └─────────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────┐
    │    Update StudentAttempt            │
    │    Update LessonProgress            │
    │    Return result to client          │
    └─────────────────────────────────────┘
```
