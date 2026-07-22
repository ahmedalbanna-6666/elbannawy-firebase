# Activity Data Model

## Activities Collection (`activities`)

```
/activities/{activityId}
```

| Field | Type | Default | Description |
|---|---|---|---|
| id | string | — | Unique identifier |
| lessonId | string | — | Parent lesson reference |
| type | string | — | Activity type (matches plugin manifest) |
| title | string | — | Display title |
| subtitle | string? | null | Optional subtitle |
| instructions | string? | null | Activity instructions |
| displayOrder | number | — | Order within lesson |
| config.schemaVersion | number | 1 | Config schema version |
| config.data | unknown | — | Activity-type-specific data |
| status | string | 'draft' | draft / published / archived |
| isRequired | boolean | true | Must be completed |
| isScorable | boolean | true | Generates a score |
| isPractice | boolean | false | Practice mode (no grading) |
| timeLimit | number? | null | Time limit in seconds |
| maxAttempts | number? | null | Max attempts allowed |
| retryable | boolean | false | Can retry after failure |
| prerequisiteActivityIds | string[] | [] | Activities that must be completed first |
| metadata | object | — | Estimated duration, skill, difficulty, tags, bloomLevel |
| createdAt | Timestamp | — | Creation timestamp |
| updatedAt | Timestamp | — | Last update timestamp |
| schemaVersion | number | 1 | Document schema version |
| deletedAt | Timestamp? | null | Soft delete timestamp |

## Student Attempts Collection (`student_attempts`)

```
/student_attempts/{attemptId}
```

| Field | Type | Default | Description |
|---|---|---|---|
| id | string | — | Unique identifier |
| activityId | string | — | Activity reference |
| studentId | string | — | Student reference |
| lessonId | string | — | Lesson reference |
| unitId | string | — | Unit reference |
| attemptNumber | number | — | 1-based attempt count |
| answer | unknown? | null | Student's submitted answer |
| score | number? | null | Score awarded |
| maxScore | number | — | Maximum possible score |
| percentage | number? | null | Score percentage |
| passed | boolean? | null | Pass/fail status |
| feedback | string? | null | Automated feedback |
| correctAnswer | unknown? | null | Correct answer (shown post-submission) |
| startedAt | Timestamp | — | When attempt started |
| submittedAt | Timestamp? | null | When submitted |
| timeLimit | number? | null | Time limit for this attempt |
| timeSpent | number? | null | Time spent in seconds |
| status | string | 'in_progress' | in_progress / submitted / graded / expired |
| gradingMethod | string | 'auto' | auto / manual / ai_assisted / practice |
| state | unknown? | null | Activity-type-specific state |
| activitySchemaVersion | number | — | Schema version at time of attempt |
| metadata | object | — | IP, user agent, device type |

## Lesson Progress Collection (`lesson_progress`)

```
/lesson_progress/{progressId}
```

| Field | Type | Default | Description |
|---|---|---|---|
| id | string | — | Unique identifier |
| studentId | string | — | Student reference |
| lessonId | string | — | Lesson reference |
| unitId | string | — | Unit reference |
| status | string | 'not_started' | not_started / in_progress / completed |
| completedActivities | number | 0 | Number of completed activities |
| totalActivities | number | — | Total activities in lesson |
| percentage | number | 0 | Completion percentage |
| score | number? | null | Cumulative score |
| maxScore | number? | null | Max cumulative score |
| lastActivityId | string? | null | Most recent activity |
| startedAt | Timestamp? | null | When lesson was started |
| completedAt | Timestamp? | null | When lesson was completed |
| createdAt | Timestamp | — | Creation timestamp |
| updatedAt | Timestamp | — | Last update timestamp |
