# Firestore Collections

## El-bannawy Platform - Collection Contract

Version: 2.0.0  
Status: Phase 1 design baseline  
Last Updated: 2026-07-21

## Reading This Contract

This is a logical Firestore contract. It defines every collection in the Phase 1 inventory. `!` means required, `?` means nullable/optional. Every mutable document also has `id: string!`, `createdAt: Timestamp!`, `updatedAt: Timestamp!`, and `schemaVersion: number!`; soft-deletable documents add `deletedAt: Timestamp?`. Immutable records retain `createdAt` and `schemaVersion` and never change after creation.

`Timestamp` means a Firestore server timestamp. `Ref` means a stable string ID, not a client-trusted authorization grant. `Map<K,V>` means a Zod-validated discriminated object, never untyped JSON. All boundaries validate with strict Zod schemas before persistence.

Rules shown here are domain validation rules. Firestore Security Rules are defined separately in `SECURITY_RULES.md`.

## Identity and Access

### `users`

- **Purpose:** Profile, role, status, and current academic assignment for one Firebase Auth identity.
- **Fields:** `fullName:string!`, `englishName:string?`, `email:string?`, `mobileNumber:string!`, `parentMobile:string?`, `role:Role!`, `status:AccountStatus!`, `educationalSystemId:Ref?`, `stageId:Ref?`, `gradeId:Ref?`, `academicYearId:Ref?`, `termId:Ref?`, `governorate:string?`, `school:string?`, `avatarPath:string?`, `jobTitle:string?`, `createdBy:Ref?`.
- **Indexes:** `role`; `status`; `mobileNumber` unique by trusted service; `gradeId,status`.
- **Relationships:** Auth UID; optional educational system/stage/grade/year/term; teacher scope through `teacherAssignments`.
- **Validation:** Role is one of the five documented roles; only administrators may change role/status or academic assignment; no password, token, secret, or arbitrary permission field.

### `loginEvents`

- **Purpose:** Immutable login, logout, refresh, password reset, and failed-login audit facts.
- **Fields:** `userId:Ref!`, `eventType:AuthEventType!`, `success:boolean!`, `failureCode:string?`, `occurredAt:Timestamp!`, `ipHash:string?`, `userAgentHash:string?`, `requestId:string!`.
- **Indexes:** `userId,occurredAt DESC`; `eventType,occurredAt DESC`.
- **Relationships:** Belongs to one user; Firebase Auth remains credential authority.
- **Validation:** Server-only create; never store raw passwords, tokens, IP addresses, or secrets; immutable.

### `teacherAssignments`

- **Purpose:** Teacher-to-grade authorization scope.
- **Fields:** `teacherId:Ref!`, `gradeId:Ref!`, `academicYearId:Ref?`, `status:AssignmentStatus!`, `assignedBy:Ref!`, `assignedAt:Timestamp!`.
- **Indexes:** `teacherId,status`; `gradeId,status`; unique active `teacherId,gradeId,academicYearId`.
- **Relationships:** Teacher and grade; no individual permission grants.
- **Validation:** `teacherId` must have role TEACHER; only administrators manage assignments; soft delete on removal.

## Academic Structure

### `educationalSystems`

- **Purpose:** Student-selectable educational systems.
- **Fields:** `name:string!`, `code:string!`, `displayOrder:number!`, `active:boolean!`.
- **Indexes:** `code` unique; `active,displayOrder`.
- **Relationships:** Referenced by users, units, stories, and review content.
- **Validation:** Code is immutable after publication; display order is non-negative.

### `stages`

- **Purpose:** Educational stages.
- **Fields:** `name:string!`, `code:string!`, `displayOrder:number!`, `active:boolean!`.
- **Indexes:** `code` unique; `active,displayOrder`.
- **Relationships:** Has grades.
- **Validation:** Name/code required and unique; only administrator writes.

### `grades`

- **Purpose:** Grades within a stage.
- **Fields:** `stageId:Ref!`, `name:string!`, `code:string!`, `displayOrder:number!`, `active:boolean!`, `supportPhone:string?`, `supportEmail:string?`, `supportWhatsapp:string?`.
- **Indexes:** `stageId,active,displayOrder`; unique `stageId,code`.
- **Relationships:** Belongs to stage; referenced by users, units, stories, live sessions, and review content.
- **Validation:** Stage must exist; order is non-negative; only administrators write.

### `academicYears`

- **Purpose:** School year configuration.
- **Fields:** `name:string!`, `code:string!`, `isActive:boolean!`, `startsAt:Timestamp?`, `endsAt:Timestamp?`.
- **Indexes:** `isActive`; `startsAt DESC`; unique `code`.
- **Relationships:** Has terms and scopes content.
- **Validation:** End must be after start; at most one active year is enforced by a trusted transaction.

### `terms`

- **Purpose:** Terms assigned by teachers/administrators, never selected by students.
- **Fields:** `academicYearId:Ref!`, `name:string!`, `code:string!`, `displayOrder:number!`, `startsAt:Timestamp?`, `endsAt:Timestamp?`.
- **Indexes:** `academicYearId,displayOrder`; unique `academicYearId,code`.
- **Relationships:** Belongs to academic year; referenced by units, books, stories, and reviews.
- **Validation:** Academic year must exist; date range must be within the year when dates are present.

### `books`

- **Purpose:** Optional textbook grouping.
- **Fields:** `title:string!`, `gradeId:Ref!`, `termId:Ref!`, `academicYearId:Ref!`, `displayOrder:number!`, `published:boolean!`.
- **Indexes:** `gradeId,termId,displayOrder`; `published,gradeId`.
- **Relationships:** Grade and term; has units.
- **Validation:** Grade and term must be compatible; only teacher in grade scope or administrator may edit.

### `units`

- **Purpose:** Ordered group of lessons.
- **Fields:** `title:string!`, `description:string?`, `gradeId:Ref!`, `educationalSystemId:Ref?`, `academicYearId:Ref?`, `termId:Ref?`, `bookId:Ref?`, `displayOrder:number!`, `isPremium:boolean!`, `priceCoins:number?`, `published:boolean!`, `lockedOverride:boolean?`.
- **Indexes:** `gradeId,published,displayOrder`; `gradeId,academicYearId,termId,displayOrder`; `bookId,displayOrder`.
- **Relationships:** Grade and optional book/year/term; has lessons.
- **Validation:** Price is required and positive only for premium units; scope references must exist; published content cannot have missing required metadata.

### `lessons`

- **Purpose:** Smallest complete main-curriculum learning unit.
- **Fields:** `unitId:Ref!`, `gradeId:Ref!`, `title:string!`, `description:string?`, `displayOrder:number!`, `estimatedDurationMinutes:number!`, `contentVersion:number!`, `isPremium:boolean!`, `priceCoins:number?`, `published:boolean!`, `isHidden:boolean!`, `videoMode:VideoMode!`, `homeworkEnabled:boolean!`, `quizEnabled:boolean!`, `completionPolicy:CompletionPolicy!`, `xpReward:number!`, `lockedOverride:boolean?`, `unitTitleSnapshot:string!`.
- **Indexes:** `unitId,published,isHidden,displayOrder`; `gradeId,published,displayOrder`; `published,updatedAt DESC`.
- **Relationships:** Unit; videos, document, vocabulary, homework, and quiz.
- **Validation:** At least one enabled video before publication; score 0-100; XP non-negative; no client may publish or alter completion policy without teacher/admin scope.

## Lesson Content

### `lessonVideos`

- **Purpose:** Provider-neutral metadata for one lesson video.
- **Fields:** `ownerType:VideoOwnerType!`, `ownerId:Ref!`, `lessonId:Ref?`, `storyLessonId:Ref?`, `title:string!`, `provider:VideoProvider!`, `providerVideoId:string!`, `providerUrl:string!`, `durationSeconds:number!`, `thumbnailUrl:string?`, `displayOrder:number!`, `enabled:boolean!`, `interactiveTimelineEnabled:boolean!`, `contentVersion:number!`, `metadata:Map<string,string>?`.
- **Indexes:** `lessonId,enabled,displayOrder`; `ownerType,ownerId,enabled,displayOrder`; `provider,providerVideoId` unique.
- **Relationships:** One lesson or story lesson; owns timeline events and activities by ID.
- **Validation:** Exactly one owner reference is set; Version 1 accepts validated YouTube unlisted URLs only; URL/video ID must match; duration non-negative; no video file path.

### `lessonDocuments`

- **Purpose:** One-to-one metadata for the source Microsoft Word document.
- **Fields:** `lessonId:Ref!`, `storagePath:string!`, `fileName:string!`, `mimeType:string!`, `fileSizeBytes:number!`, `sha256:string!`, `processingStatus:DocumentProcessingStatus!`, `extractedAt:Timestamp?`, `errorCode:string?`.
- **Indexes:** `lessonId` unique; `processingStatus,createdAt`.
- **Relationships:** One lesson; source for generated activities and vocabulary.
- **Validation:** MIME type must be an approved Word type; storage path must be server-owned; file size and checksum verified; source is not PDF in Version 1.

### `timelineEvents`

- **Purpose:** Timestamp trigger on one video.
- **Fields:** `ownerType:VideoOwnerType!`, `ownerId:Ref!`, `lessonId:Ref?`, `storyLessonId:Ref?`, `videoId:Ref!`, `activityId:Ref!`, `timestampSeconds:number!`, `eventType:TimelineEventType!`, `required:boolean!`, `enabled:boolean!`, `displayOrder:number!`, `contentVersion:number!`.
- **Indexes:** `videoId,enabled,timestampSeconds`; `lessonId,enabled`.
- **Relationships:** Lesson or story lesson, video, and activity; activity must share video.
- **Validation:** Exactly one owner reference is set; timestamp within known duration when available; activity/video relationship checked server-side; no duplicate enabled timestamp per video.

### `activities`

- **Purpose:** Dynamically rendered activity owned by a lesson video.
- **Fields:** `ownerType:VideoOwnerType!`, `ownerId:Ref!`, `lessonId:Ref?`, `storyLessonId:Ref?`, `videoId:Ref!`, `activityType:ActivityType!`, `title:string!`, `instructions:string?`, `config:Map<string,unknown>!`, `sourceDocumentId:Ref?`, `displayOrder:number!`, `required:boolean!`, `enabled:boolean!`, `contentVersion:number!`.
- **Indexes:** `videoId,enabled,displayOrder`; `lessonId,activityType`.
- **Relationships:** Lesson/story video and optional timeline event; answer key is separate.
- **Validation:** Exactly one owner reference is set; config validated by the activity-type Zod schema; source document is required for generated lesson activities and absent only for explicitly supported story/review activities; teachers may configure availability but cannot invent generated source content.

### `answerKeys`

- **Purpose:** Private server-side grading data for all objective items.
- **Fields:** `itemType:AnswerItemType!`, `itemId:Ref!`, `contentVersion:number!`, `answer:Map<string,unknown>!`, `scoringPolicy:Map<string,unknown>!`, `checksum:string!`.
- **Indexes:** `itemType,itemId,contentVersion` unique.
- **Relationships:** One activity/homework question/quiz question/assessment question.
- **Validation:** Server/Admin SDK only; never readable by student, teacher, secretary, or support; answer schema matches item type.

### `vocabularySections`

- **Purpose:** Ordered vocabulary groups in a lesson.
- **Fields:** `lessonId:Ref!`, `kind:VocabularySectionKind!`, `title:string?`, `displayOrder:number!`, `contentVersion:number!`.
- **Indexes:** `lessonId,displayOrder`.
- **Relationships:** Has vocabulary items and relations.
- **Validation:** Kind is a documented enum; lesson must exist; no duplicate order within a lesson.

### `vocabularyItems`

- **Purpose:** Generated lesson vocabulary.
- **Fields:** `lessonId:Ref!`, `sectionId:Ref?`, `word:string!`, `pronunciation:string!`, `translation:string!`, `definition:string!`, `example:string!`, `partOfSpeech:string?`, `audioPath:string?`, `imagePath:string?`, `displayOrder:number!`, `contentVersion:number!`.
- **Indexes:** `lessonId,displayOrder`; `lessonId,word`.
- **Relationships:** Lesson and optional section; student state in `vocabularyProgress`.
- **Validation:** Word/translation/example non-empty; asset paths point to Storage metadata; no duplicate word within a lesson version.

### `vocabularyRelations`

- **Purpose:** Synonym/antonym relationships.
- **Fields:** `lessonId:Ref!`, `sectionId:Ref!`, `primaryItemId:Ref!`, `relationType:VocabularyRelationType!`, `relatedWord:string!`, `relatedTranslation:string?`, `displayOrder:number!`, `contentVersion:number!`.
- **Indexes:** `lessonId,sectionId,displayOrder`.
- **Relationships:** Lesson, section, and primary vocabulary item.
- **Validation:** Section and item must belong to lesson; relation type is SYNONYM or ANTONYM.

## Assessments

### `homework`

- **Purpose:** Optional assignment owned by one lesson or story lesson.
- **Fields:** `ownerType:LearningOwnerType!`, `ownerId:Ref!`, `lessonId:Ref?`, `storyLessonId:Ref?`, `title:string!`, `instructions:string?`, `passingScore:number!`, `maxAttempts:number?`, `unlimitedAttempts:boolean!`, `published:boolean!`, `allowRetry:boolean!`, `showAnswers:boolean!`, `xpReward:number!`, `contentVersion:number!`.
- **Indexes:** `ownerType,ownerId` unique; `published,ownerType`.
- **Relationships:** Exactly one lesson or story lesson; has homework questions and student attempts.
- **Validation:** Owner fields match owner type; homework never controls main lesson unlock; score 0-100; one homework per owner.

### `homeworkQuestions`

- **Purpose:** Public question content for homework.
- **Fields:** `homeworkId:Ref!`, `questionType:QuestionType!`, `prompt:string!`, `instructions:string?`, `explanation:string?`, `options:Map<string,string>?`, `points:number!`, `displayOrder:number!`, `contentVersion:number!`.
- **Indexes:** `homeworkId,displayOrder`.
- **Relationships:** One homework; private answer in `answerKeys`.
- **Validation:** Type-specific schema; points positive; options contain no correctness flags; order unique per homework.

### `quizzes`

- **Purpose:** Optional End Lesson Assessment, one per lesson or story lesson.
- **Fields:** `ownerType:LearningOwnerType!`, `ownerId:Ref!`, `lessonId:Ref?`, `storyLessonId:Ref?`, `title:string!`, `instructions:string?`, `passingScore:number!`, `maxAttempts:number?`, `unlimitedAttempts:boolean!`, `published:boolean!`, `allowRetry:boolean!`, `showAnswers:boolean!`, `xpReward:number!`, `requiredForCompletion:boolean!`, `contentVersion:number!`.
- **Indexes:** `ownerType,ownerId` unique; `published,ownerType`; `lessonId,requiredForCompletion`.
- **Relationships:** One owner; has quiz questions and attempts.
- **Validation:** At most one per owner; required-for-completion only when lesson configuration enables it; passing score 0-100.

### `quizQuestions`

- **Purpose:** Public question content for End Lesson Assessments.
- **Fields:** `quizId:Ref!`, `questionType:QuestionType!`, `prompt:string!`, `instructions:string?`, `explanation:string?`, `options:Map<string,string>?`, `points:number!`, `displayOrder:number!`, `contentVersion:number!`.
- **Indexes:** `quizId,displayOrder`.
- **Relationships:** Quiz; private answer in `answerKeys`.
- **Validation:** Same type-specific and answer-key rules as homework questions.

### `assessments`

- **Purpose:** Standalone or unit-level assessment aggregate.
- **Fields:** `title:string!`, `description:string?`, `instructions:string?`, `assessmentType:AssessmentType!`, `gradeId:Ref?`, `unitId:Ref?`, `visibility:AssessmentVisibility!`, `passingScore:number?`, `maxScore:number!`, `timeLimitSeconds:number?`, `attemptsAllowed:number?`, `unlimitedAttempts:boolean!`, `startAt:Timestamp?`, `endAt:Timestamp?`, `scoringType:ScoringType!`, `feedbackPolicy:FeedbackPolicy!`, `contentVersion:number!`.
- **Indexes:** `visibility,gradeId,startAt`; `unitId,visibility`; `startAt,endAt`.
- **Relationships:** Optional grade/unit; has assessment questions and attempts.
- **Validation:** Dates ordered; score and attempt limits coherent; published assessment has questions and grading policy.

### `assessmentQuestions`

- **Purpose:** Public questions for standalone assessments.
- **Fields:** `assessmentId:Ref!`, `questionType:QuestionType!`, `prompt:string!`, `instructions:string?`, `sectionKey:string?`, `points:number!`, `displayOrder:number!`, `contentVersion:number!`.
- **Indexes:** `assessmentId,displayOrder`; `assessmentId,sectionKey,displayOrder`.
- **Relationships:** Assessment; private answer in `answerKeys`.
- **Validation:** Assessment must exist; points positive; no answer key or provider secret in public data.

## Independent Content Paths

### `stories`

- **Purpose:** Independent story learning path.
- **Fields:** `title:string!`, `description:string?`, `gradeId:Ref!`, `stageId:Ref!`, `educationalSystemId:Ref?`, `academicYearId:Ref!`, `termId:Ref!`, `displayOrder:number!`, `published:boolean!`, `contentVersion:number!`.
- **Indexes:** `gradeId,published,displayOrder`; `academicYearId,termId,gradeId`.
- **Relationships:** Grade/year/term; has chapters and story lessons.
- **Validation:** Grade must belong to stage; student access requires published grade scope.

### `storyChapters`

- **Purpose:** Ordered story chapter.
- **Fields:** `storyId:Ref!`, `title:string!`, `chapterNumber:number!`, `displayOrder:number!`, `published:boolean!`, `contentVersion:number!`.
- **Indexes:** `storyId,displayOrder`; `storyId,published,displayOrder`.
- **Relationships:** Story; has story lessons.
- **Validation:** Chapter number/order unique within story; story must exist.

### `storyLessons`

- **Purpose:** Story learning lesson with the same video engine but independent progress.
- **Fields:** `storyId:Ref!`, `chapterId:Ref!`, `title:string!`, `displayOrder:number!`, `published:boolean!`, `contentVersion:number!`, `homeworkEnabled:boolean!`, `quizRequired:boolean!`.
- **Indexes:** `chapterId,published,displayOrder`; `storyId,published`.
- **Relationships:** Story/chapter; owns videos through `lessonVideos` with `ownerType=STORY_LESSON`.
- **Validation:** Chapter must belong to story; story quiz is mandatory for chapter progression.

### `storyFiles`

- **Purpose:** Story PDF and future approved file metadata.
- **Fields:** `storyId:Ref!`, `storyLessonId:Ref!`, `storagePath:string!`, `fileName:string!`, `mimeType:string!`, `fileSizeBytes:number!`, `sha256:string!`.
- **Indexes:** `storyLessonId,createdAt DESC`.
- **Relationships:** Story and story lesson.
- **Validation:** Version 1 MIME type is PDF; server-owned Storage path and checksum required.

### `storyVocabulary`

- **Purpose:** Vocabulary independent from main lesson vocabulary.
- **Fields:** `storyId:Ref!`, `storyLessonId:Ref!`, `word:string!`, `pronunciation:string!`, `translation:string!`, `definition:string!`, `example:string!`, `displayOrder:number!`, `contentVersion:number!`.
- **Indexes:** `storyLessonId,displayOrder`; `storyId,word`.
- **Relationships:** Story and story lesson; student state uses `vocabularyProgress` with `ownerType`.
- **Validation:** Same vocabulary content rules as lesson vocabulary.

### `finalReviews`

- **Purpose:** Teacher-activated review period.
- **Fields:** `title:string!`, `gradeId:Ref!`, `stageId:Ref!`, `academicYearId:Ref!`, `opensAt:Timestamp!`, `closesAt:Timestamp!`, `enabled:boolean!`, `published:boolean!`, `createdBy:Ref!`, `contentVersion:number!`.
- **Indexes:** `gradeId,enabled,opensAt`; `enabled,opensAt,closesAt`.
- **Relationships:** Grade/stage/year; has review units.
- **Validation:** Close after open; only teachers in grade scope or administrators can toggle; inactive periods expose no content.

### `finalReviewUnits`

- **Purpose:** Ordered unit inside a final review.
- **Fields:** `finalReviewId:Ref!`, `unitId:Ref!`, `title:string!`, `displayOrder:number!`, `published:boolean!`.
- **Indexes:** `finalReviewId,published,displayOrder`.
- **Relationships:** Review and source unit.
- **Validation:** Source unit grade must match review grade; unique unit per review.

### `finalReviewLessons`

- **Purpose:** Review lesson with summary, video, and practice references.
- **Fields:** `finalReviewUnitId:Ref!`, `title:string!`, `summary:string!`, `notesPath:string?`, `displayOrder:number!`, `published:boolean!`, `contentVersion:number!`.
- **Indexes:** `finalReviewUnitId,published,displayOrder`.
- **Relationships:** Review unit; review questions and optional video/file metadata.
- **Validation:** Notes path is Storage-owned; publication requires valid content.

### `finalReviewQuestions`

- **Purpose:** Practice or exam question in final review.
- **Fields:** `finalReviewId:Ref!`, `finalReviewUnitId:Ref!`, `finalReviewLessonId:Ref?`, `questionType:QuestionType!`, `prompt:string!`, `points:number!`, `exam:boolean!`, `displayOrder:number!`, `contentVersion:number!`.
- **Indexes:** `finalReviewUnitId,exam,displayOrder`; `finalReviewId,exam`.
- **Relationships:** Review, unit, and optional lesson; answer key is server-only.
- **Validation:** Parent chain must match; practice does not affect ranking; exam policy controls attempts.

## Student Progress and Assessment State

### `lessonProgress`

- **Purpose:** One student's lesson completion projection.
- **Fields:** `studentId:Ref!`, `lessonId:Ref!`, `contentVersion:number!`, `status:ProgressStatus!`, `progressPercent:number!`, `completedVideoCount:number!`, `requiredActivityCount:number!`, `completedActivityCount:number!`, `homeworkStatus:AttemptStatus?`, `quizStatus:AttemptStatus?`, `lastVideoId:Ref?`, `startedAt:Timestamp?`, `completedAt:Timestamp?`, `lessonTitleSnapshot:string!`, `gradeId:Ref!`.
- **Indexes:** `studentId,status,updatedAt DESC`; `studentId,gradeId,updatedAt DESC`; `lessonId,status`.
- **Relationships:** Student, lesson, and source grade.
- **Validation:** 0-100; completion only from trusted completion service; deterministic ID `studentId_lessonId_contentVersion`.

### `videoProgress`

- **Purpose:** Per-student playback and completion state.
- **Fields:** `studentId:Ref!`, `lessonId:Ref!`, `videoId:Ref!`, `contentVersion:number!`, `lastPositionSeconds:number!`, `watchedSeconds:number!`, `watchPercent:number!`, `completed:boolean!`, `completedAt:Timestamp?`, `lastActiveAt:Timestamp!`.
- **Indexes:** `studentId,lessonId,updatedAt DESC`; `videoId,completed`.
- **Relationships:** Student, lesson, video.
- **Validation:** Position/duration non-negative; completion requires provider completion and required events; client cannot set completed.

### `timelineEventProgress`

- **Purpose:** Per-student completion state for required/optional timeline events.
- **Fields:** `studentId:Ref!`, `lessonId:Ref!`, `videoId:Ref!`, `timelineEventId:Ref!`, `activityId:Ref!`, `completed:boolean!`, `skipped:boolean!`, `completedAt:Timestamp?`, `attemptCount:number!`.
- **Indexes:** `studentId,videoId,completed`; `studentId,lessonId`.
- **Relationships:** Student, video, event, activity.
- **Validation:** Required events cannot be skipped; event/activity/video chain is checked server-side.

### `activityProgress`

- **Purpose:** Per-student activity result projection.
- **Fields:** `studentId:Ref!`, `activityId:Ref!`, `lessonId:Ref!`, `videoId:Ref!`, `contentVersion:number!`, `status:ActivityProgressStatus!`, `score:number?`, `responseRef:Ref?`, `attemptCount:number!`, `completedAt:Timestamp?`.
- **Indexes:** `studentId,lessonId,updatedAt DESC`; `activityId,studentId`.
- **Relationships:** Student and activity; subjective response may link to `aiAssessments`.
- **Validation:** Score 0-100; status transitions are monotonic except an explicit retry; response content is size-limited and sanitized.

### `vocabularyProgress`

- **Purpose:** Student learned/favorite state for lesson or story vocabulary.
- **Fields:** `studentId:Ref!`, `ownerType:VocabularyOwnerType!`, `itemId:Ref!`, `learned:boolean!`, `favorite:boolean!`, `reviewCount:number!`, `lastReviewedAt:Timestamp?`.
- **Indexes:** `studentId,ownerType,learned`; `studentId,favorite`; `itemId,studentId`.
- **Relationships:** Student and vocabulary item.
- **Validation:** Deterministic ID `studentId_ownerType_itemId`; no effect on lesson unlock.

### `homeworkAttempts`

- **Purpose:** Student homework attempt and immutable submission result.
- **Fields:** `studentId:Ref!`, `homeworkId:Ref!`, `ownerType:LearningOwnerType!`, `attemptNumber:number!`, `status:AttemptStatus!`, `score:number?`, `passed:boolean?`, `startedAt:Timestamp!`, `submittedAt:Timestamp?`, `gradedAt:Timestamp?`, `timeSpentSeconds:number?`, `contentVersion:number!`, `idempotencyKey:string!`.
- **Indexes:** `studentId,homeworkId,attemptNumber`; `homeworkId,status,submittedAt DESC`; `studentId,submittedAt DESC`.
- **Relationships:** Student, homework, answers, mistakes.
- **Validation:** Attempt number transactionally unique; submitted attempts immutable; automatic grading uses server-only answer key; homework does not unlock lessons.

### `homeworkAnswers`

- **Purpose:** One answer per homework question and attempt.
- **Fields:** `attemptId:Ref!`, `studentId:Ref!`, `homeworkId:Ref!`, `questionId:Ref!`, `answer:Map<string,unknown>!`, `isCorrect:boolean?`, `score:number?`, `feedback:string?`, `submittedAt:Timestamp!`.
- **Indexes:** `attemptId,questionId` unique; `studentId,homeworkId`.
- **Relationships:** Attempt, homework, question.
- **Validation:** Answer type matches question; grading fields server-only; answer immutable after submission.

### `quizAttempts`

- **Purpose:** Student End Lesson Assessment attempt.
- **Fields:** `studentId:Ref!`, `quizId:Ref!`, `ownerType:LearningOwnerType!`, `attemptNumber:number!`, `status:AttemptStatus!`, `score:number?`, `passed:boolean?`, `startedAt:Timestamp!`, `submittedAt:Timestamp?`, `gradedAt:Timestamp?`, `contentVersion:number!`, `idempotencyKey:string!`.
- **Indexes:** `studentId,quizId,attemptNumber`; `quizId,passed,submittedAt DESC`; `studentId,submittedAt DESC`.
- **Relationships:** Student, quiz, answers, mistakes, lesson progress.
- **Validation:** Attempt limit enforced transactionally; only passed result can satisfy required progression; XP is awarded once per qualifying policy.

### `quizAnswers`

- **Purpose:** One answer per quiz question and attempt.
- **Fields:** `attemptId:Ref!`, `studentId:Ref!`, `quizId:Ref!`, `questionId:Ref!`, `answer:Map<string,unknown>!`, `isCorrect:boolean?`, `score:number?`, `feedback:string?`, `submittedAt:Timestamp!`.
- **Indexes:** `attemptId,questionId` unique; `studentId,quizId`.
- **Relationships:** Quiz attempt, quiz, question.
- **Validation:** Same answer and immutability rules as homework answers.

### `assessmentAttempts`

- **Purpose:** Attempts for standalone assessments and final review exams.
- **Fields:** `studentId:Ref!`, `assessmentId:Ref!`, `attemptNumber:number!`, `status:AttemptStatus!`, `score:number?`, `maxScore:number!`, `passed:boolean?`, `startedAt:Timestamp!`, `submittedAt:Timestamp?`, `completedAt:Timestamp?`, `expiresAt:Timestamp?`, `timeSpentSeconds:number?`, `contentVersion:number!`, `idempotencyKey:string!`.
- **Indexes:** `studentId,assessmentId,attemptNumber`; `assessmentId,status,submittedAt DESC`.
- **Relationships:** Student, assessment, answers, mistakes.
- **Validation:** Assessment window/attempt policy checked server-side; submitted results immutable.

### `assessmentAnswers`

- **Purpose:** One answer per standalone assessment question.
- **Fields:** `attemptId:Ref!`, `studentId:Ref!`, `assessmentId:Ref!`, `questionId:Ref!`, `answer:Map<string,unknown>!`, `isCorrect:boolean?`, `score:number?`, `feedback:string?`.
- **Indexes:** `attemptId,questionId` unique; `studentId,assessmentId`.
- **Relationships:** Assessment attempt and question.
- **Validation:** Type-specific validation; answer key and grading fields are not student-readable.

### `storyProgress`

- **Purpose:** Independent story/chapter/lesson progress projection.
- **Fields:** `studentId:Ref!`, `storyId:Ref!`, `chapterId:Ref?`, `storyLessonId:Ref?`, `status:ProgressStatus!`, `progressPercent:number!`, `completedAt:Timestamp?`, `lastActiveAt:Timestamp!`, `contentVersion:number!`.
- **Indexes:** `studentId,storyId,updatedAt DESC`; `storyId,status`.
- **Relationships:** Student and story hierarchy.
- **Validation:** Story quiz requirement controls lesson/chapter completion; never merged with main lesson progress.

### `finalReviewProgress`

- **Purpose:** Student progress in a teacher-activated final review.
- **Fields:** `studentId:Ref!`, `finalReviewId:Ref!`, `unitId:Ref?`, `lessonId:Ref?`, `progressPercent:number!`, `readiness:ReadinessStatus?`, `lastActiveAt:Timestamp!`, `completedAt:Timestamp?`.
- **Indexes:** `studentId,finalReviewId,updatedAt DESC`; `finalReviewId,readiness`.
- **Relationships:** Student and final review hierarchy.
- **Validation:** Read access requires active review window and grade scope; no normal lesson unlock effect.

### `mistakes`

- **Purpose:** Current mastery record for every incorrect answer.
- **Fields:** `studentId:Ref!`, `sourceType:MistakeSource!`, `sourceId:Ref!`, `lessonId:Ref?`, `unitId:Ref?`, `questionId:Ref!`, `questionType:QuestionType!`, `studentAnswer:Map<string,unknown>!`, `correctAnswerSnapshot:Map<string,unknown>!`, `explanationSnapshot:string?`, `status:MistakeStatus!`, `attemptCount:number!`, `firstIncorrectAt:Timestamp!`, `lastReviewedAt:Timestamp?`, `masteredAt:Timestamp?`.
- **Indexes:** `studentId,status,lastReviewedAt DESC`; `studentId,lessonId,status`; `studentId,sourceType,status`.
- **Relationships:** Student and source question/content.
- **Validation:** Created only from a server grading result; students cannot delete or alter; correct retry transitions to MASTERED but history remains.

### `mistakeReviews`

- **Purpose:** Immutable retry history for a mistake.
- **Fields:** `mistakeId:Ref!`, `studentId:Ref!`, `answer:Map<string,unknown>!`, `isCorrect:boolean!`, `reviewedAt:Timestamp!`, `attemptNumber:number!`.
- **Indexes:** `mistakeId,reviewedAt DESC`; `studentId,reviewedAt DESC`.
- **Relationships:** Mistake and student.
- **Validation:** Server-created or server-validated; cannot be deleted by student.

### `studentStats`

- **Purpose:** Rebuildable dashboard projection.
- **Fields:** `studentId:Ref!`, `completedLessons:number!`, `completedUnits:number!`, `completedStoryLessons:number!`, `averageQuizScore:number!`, `homeworkCompletionRate:number!`, `attendanceRate:number!`, `currentXp:number!`, `currentCoins:number!`, `streakDays:number!`, `lastActiveAt:Timestamp?`, `projectionVersion:number!`.
- **Indexes:** `studentId` unique; `lastActiveAt DESC` for admin metrics.
- **Relationships:** Projection of progress, ledgers, and attendance.
- **Validation:** Server-only writes; all rates 0-100; must be rebuildable from source collections.

## Games and Live Classes

### `gameCategories`

- **Purpose:** Educational game categories.
- **Fields:** `name:string!`, `code:string!`, `displayOrder:number!`, `active:boolean!`.
- **Indexes:** `active,displayOrder`; `code` unique.
- **Relationships:** Has games.
- **Validation:** Administrator-managed; code immutable after publication.

### `games`

- **Purpose:** Supplementary game catalog.
- **Fields:** `categoryId:Ref!`, `title:string!`, `description:string!`, `difficulty:Difficulty!`, `estimatedMinutes:number!`, `stageIds:Ref[]!`, `gradeIds:Ref[]!`, `xpMin:number!`, `xpMax:number!`, `published:boolean!`, `gameConfig:Map<string,unknown>!`.
- **Indexes:** `published,difficulty`; `categoryId,published`; `stageIds` array index.
- **Relationships:** Category, optional assignments, attempts.
- **Validation:** Duration 2-10 minutes for Version 1; XP bounds valid; games never unlock lessons.

### `gameAssignments`

- **Purpose:** Optional teacher assignment of a game to grade or student.
- **Fields:** `gameId:Ref!`, `teacherId:Ref!`, `gradeId:Ref?`, `studentId:Ref?`, `startsAt:Timestamp?`, `endsAt:Timestamp?`, `enabled:boolean!`.
- **Indexes:** `teacherId,enabled`; `gradeId,enabled`; `studentId,enabled`.
- **Relationships:** Game and teacher scope; exactly one grade or student target.
- **Validation:** Teacher must be assigned to target grade; dates ordered; assignment cannot grant lesson access.

### `gameAttempts`

- **Purpose:** Student game play history and best-result projection.
- **Fields:** `studentId:Ref!`, `gameId:Ref!`, `score:number!`, `durationSeconds:number!`, `completed:boolean!`, `xpAwarded:number!`, `playedAt:Timestamp!`, `idempotencyKey:string!`.
- **Indexes:** `studentId,gameId,playedAt DESC`; `gameId,playedAt DESC`.
- **Relationships:** Student and game; XP ledger event if eligible.
- **Validation:** Score/range validated by game config; XP daily limits enforced server-side; immutable.

### `teacherAvailability`

- **Purpose:** Recurring teacher availability blocks.
- **Fields:** `teacherId:Ref!`, `dayOfWeek:number!`, `startsAtLocal:string!`, `endsAtLocal:string!`, `timezone:string!`, `gradeId:Ref?`, `active:boolean!`.
- **Indexes:** `teacherId,active,dayOfWeek`; `gradeId,active`.
- **Relationships:** Teacher and optional grade; source for live sessions.
- **Validation:** End after start; valid IANA timezone; soft delete only.

### `teacherDateBlocks`

- **Purpose:** Dates when an availability block cannot create sessions.
- **Fields:** `teacherId:Ref!`, `date:Timestamp!`, `reason:string?`, `active:boolean!`.
- **Indexes:** `teacherId,date`; `date,active`.
- **Relationships:** Teacher availability domain.
- **Validation:** Date normalized to teacher timezone; soft delete only.

### `teacherLiveSettings`

- **Purpose:** One-to-one teacher meeting defaults.
- **Fields:** `teacherId:Ref!`, `meetingProvider:MeetingProvider!`, `defaultMeetingUrl:string?`, `meetingPasswordSecretRef:string?`, `allowOverride:boolean!`, `accessWindowMinutes:number!`.
- **Indexes:** `teacherId` unique.
- **Relationships:** Teacher and live sessions.
- **Validation:** Meeting password is a secret reference, never plaintext; access window non-negative.

### `liveSessions`

- **Purpose:** Concrete scheduled online class.
- **Fields:** `teacherId:Ref!`, `gradeId:Ref!`, `stageId:Ref!`, `availabilityId:Ref?`, `title:string!`, `description:string?`, `scheduledAt:Timestamp!`, `endsAt:Timestamp!`, `durationMinutes:number!`, `maxStudents:number?`, `bookingCount:number!`, `status:LiveSessionStatus!`, `meetingProvider:MeetingProvider!`, `published:boolean!`.
- **Indexes:** `gradeId,published,status,scheduledAt`; `teacherId,status,scheduledAt`; `status,scheduledAt`.
- **Relationships:** Teacher, grade, availability, bookings, waitlist, attendance.
- **Validation:** End after start; capacity positive; booking count changes only in transaction; meeting link never public.

### `liveSessionSecrets`

- **Purpose:** Server-only meeting link/password references for one live session.
- **Fields:** `liveSessionId:Ref!`, `meetingUrlSecretRef:string!`, `meetingPasswordSecretRef:string?`, `providerMetadata:Map<string,string>?`.
- **Indexes:** `liveSessionId` unique.
- **Relationships:** One live session; secret values are held outside Firestore.
- **Validation:** Trusted-service/admin only; never readable by students, teachers, secretaries, support, or direct client queries; no plaintext URL/password.

### `liveBookings`

- **Purpose:** Student booking for a live session.
- **Fields:** `liveSessionId:Ref!`, `studentId:Ref!`, `status:BookingStatus!`, `bookedAt:Timestamp!`, `cancelledAt:Timestamp?`, `confirmationCode:string!`.
- **Indexes:** `liveSessionId,status,bookedAt`; `studentId,status,bookedAt DESC`; unique active `liveSessionId,studentId`.
- **Relationships:** Session and student.
- **Validation:** Grade match, session open, capacity available, and booking window checked transactionally.

### `liveWaitlistEntries`

- **Purpose:** Ordered waiting list when a session is full.
- **Fields:** `liveSessionId:Ref!`, `studentId:Ref!`, `position:number!`, `status:WaitlistStatus!`, `joinedAt:Timestamp!`, `promotedAt:Timestamp?`.
- **Indexes:** `liveSessionId,status,position`; `studentId,status`.
- **Relationships:** Session and student.
- **Validation:** One active entry per student/session; position assigned transactionally; grade match required.

### `liveAttendance`

- **Purpose:** Attendance facts for one booking/session participant.
- **Fields:** `liveSessionId:Ref!`, `studentId:Ref!`, `bookingId:Ref!`, `status:AttendanceStatus!`, `joinedAt:Timestamp?`, `leftAt:Timestamp?`, `durationSeconds:number!`.
- **Indexes:** `liveSessionId,status`; `studentId,joinedAt DESC`; unique `liveSessionId,studentId`.
- **Relationships:** Session, booking, student.
- **Validation:** Join/leave times ordered; attendance is system-recorded; XP effect follows documented policy only.

### `liveAnnouncements`

- **Purpose:** Session-scoped teacher announcements.
- **Fields:** `liveSessionId:Ref!`, `authorId:Ref!`, `message:string!`, `publishedAt:Timestamp!`, `active:boolean!`.
- **Indexes:** `liveSessionId,publishedAt DESC`.
- **Relationships:** Session and teacher.
- **Validation:** Author must own session or be administrator; message sanitized and size-limited.

## Gamification and Commerce

### `xpAccounts`

- **Purpose:** Current XP and level projection for one student.
- **Fields:** `studentId:Ref!`, `totalXp:number!`, `level:number!`, `updatedAt:Timestamp!`, `projectionVersion:number!`.
- **Indexes:** `totalXp DESC`; `studentId` unique.
- **Relationships:** Student, XP transactions, level definitions.
- **Validation:** Server-only writes; XP never negative unless a documented correction transaction is recorded.

### `xpTransactions`

- **Purpose:** Immutable XP history.
- **Fields:** `studentId:Ref!`, `amount:number!`, `sourceType:XpSource!`, `sourceId:Ref?`, `reason:string!`, `occurredAt:Timestamp!`, `idempotencyKey:string!`, `reversalOf:Ref?`.
- **Indexes:** `studentId,occurredAt DESC`; `sourceType,occurredAt DESC`; `idempotencyKey` unique.
- **Relationships:** Student and source event.
- **Validation:** Server-only; no purchase/transfer; duplicate source reward rejected.

### `xpLevels`

- **Purpose:** Configurable XP thresholds.
- **Fields:** `level:number!`, `minimumXp:number!`, `title:string!`, `active:boolean!`.
- **Indexes:** `minimumXp`; `active,level`.
- **Relationships:** Used by XP account projection.
- **Validation:** Unique level; thresholds strictly increasing; administrator only.

### `achievements`

- **Purpose:** Achievement definitions.
- **Fields:** `code:string!`, `title:string!`, `description:string!`, `iconPath:string?`, `criteria:Map<string,unknown>!`, `active:boolean!`.
- **Indexes:** `code` unique; `active`.
- **Relationships:** Has user achievements.
- **Validation:** Criteria schema versioned; administrator-managed.

### `userAchievements`

- **Purpose:** Achievement awarded to a student.
- **Fields:** `studentId:Ref!`, `achievementId:Ref!`, `earnedAt:Timestamp!`, `sourceEventId:Ref?`.
- **Indexes:** `studentId,earnedAt DESC`; unique `studentId,achievementId`.
- **Relationships:** Student and achievement.
- **Validation:** Server-created; no duplicate award.

### `leaderboardSnapshots`

- **Purpose:** Periodic ranking read model based only on XP.
- **Fields:** `periodType:LeaderboardPeriod!`, `periodKey:string!`, `scopeType:LeaderboardScope!`, `scopeId:Ref?`, `studentId:Ref!`, `rank:number!`, `totalXp:number!`, `displayNameSnapshot:string!`.
- **Indexes:** `periodType,periodKey,scopeType,scopeId,rank`; `studentId,periodType,periodKey`.
- **Relationships:** Student and XP projection.
- **Validation:** Server-generated; coins never included; privacy settings applied to display projection.

### `wallets`

- **Purpose:** Current coin balance projection for one student.
- **Fields:** `studentId:Ref!`, `balance:number!`, `totalPurchased:number!`, `totalEarned:number!`, `totalSpent:number!`, `pending:number!`, `updatedAt:Timestamp!`, `projectionVersion:number!`.
- **Indexes:** `studentId` unique.
- **Relationships:** Student and coin ledger.
- **Validation:** Server-only transaction writes; balance cannot become negative; no client mutation.

### `coinPackages`

- **Purpose:** Products that sell coins.
- **Fields:** `name:string!`, `description:string?`, `coinAmount:number!`, `priceMinorUnits:number!`, `currency:string!`, `active:boolean!`, `displayOrder:number!`.
- **Indexes:** `active,displayOrder`; `currency,active`.
- **Relationships:** Referenced by payments.
- **Validation:** Amounts positive; currency explicit; only administrator manages pricing.

### `coinTransactions`

- **Purpose:** Immutable coin ledger.
- **Fields:** `studentId:Ref!`, `amount:number!`, `transactionType:CoinTransactionType!`, `sourceType:string!`, `sourceId:Ref?`, `balanceAfter:number!`, `occurredAt:Timestamp!`, `idempotencyKey:string!`, `reversalOf:Ref?`.
- **Indexes:** `studentId,occurredAt DESC`; `transactionType,occurredAt DESC`; `idempotencyKey` unique.
- **Relationships:** Student, wallet, payment/reward/entitlement source.
- **Validation:** Server-only, atomic with wallet; transfers prohibited; immutable.

### `contentEntitlements`

- **Purpose:** Successful purchase/reward activation for premium content.
- **Fields:** `studentId:Ref!`, `contentType:ContentType!`, `contentId:Ref!`, `sourceType:EntitlementSource!`, `sourceId:Ref!`, `paymentId:Ref?`, `active:boolean!`, `activatedAt:Timestamp!`, `expiresAt:Timestamp?`.
- **Indexes:** `studentId,contentType,active`; `contentType,contentId,active`; unique active `studentId,contentType,contentId`.
- **Relationships:** Student, content, payment or reward source.
- **Validation:** Server-only; active entitlement requires successful source; cannot activate admin features.

### `payments`

- **Purpose:** Immutable financial payment fact and controlled status transitions.
- **Fields:** `studentId:Ref!`, `productType:ProductType!`, `productId:Ref!`, `paymentMethod:PaymentMethod!`, `amountMinorUnits:number!`, `currency:string!`, `status:PaymentStatus!`, `gatewayTransactionId:string?`, `gatewayReference:string?`, `idempotencyKey:string!`, `verifiedAt:Timestamp?`, `completedAt:Timestamp?`, `refundedAt:Timestamp?`.
- **Indexes:** `studentId,createdAt DESC`; `status,createdAt DESC`; `gatewayTransactionId` unique when present; `idempotencyKey` unique.
- **Relationships:** Student, package/content, invoice, entitlement.
- **Validation:** Server/gateway only; never card number/CVV; status transitions are finite-state and audited.

### `invoices`

- **Purpose:** Receipt metadata for a successful payment.
- **Fields:** `paymentId:Ref!`, `studentId:Ref!`, `invoiceNumber:string!`, `amountMinorUnits:number!`, `currency:string!`, `storagePath:string?`, `issuedAt:Timestamp!`.
- **Indexes:** `paymentId` unique; `studentId,issuedAt DESC`; `invoiceNumber` unique.
- **Relationships:** Payment and student.
- **Validation:** Created only after successful verification; PDF path is server-owned; immutable except storage processing status.

### `coupons`

- **Purpose:** Administrator-configured discount codes.
- **Fields:** `code:string!`, `discountType:DiscountType!`, `discountValue:number!`, `maxUses:number?`, `usedCount:number!`, `startsAt:Timestamp?`, `expiresAt:Timestamp?`, `productTypes:ProductType[]!`, `active:boolean!`.
- **Indexes:** `code` unique; `active,expiresAt`; `productTypes` array index.
- **Relationships:** Applied to payments.
- **Validation:** Value bounded by discount type; usage increment transactional; no expired/disabled use.

## Referral and Communication

### `referralProfiles`

- **Purpose:** One permanent referral code per student.
- **Fields:** `studentId:Ref!`, `code:string!`, `totalInvitations:number!`, `successfulReferrals:number!`, `pendingReferrals:number!`, `totalRewardCoins:number!`.
- **Indexes:** `studentId` unique; `code` unique.
- **Relationships:** Student and referrals.
- **Validation:** Code immutable and unique; counters rebuildable; students cannot write reward fields.

### `referrals`

- **Purpose:** Immutable referral lifecycle.
- **Fields:** `referrerId:Ref!`, `referredStudentId:Ref!`, `referralCode:string!`, `status:ReferralStatus!`, `registeredAt:Timestamp!`, `approvedAt:Timestamp?`, `rewardType:RewardType?`, `rewardAmount:number?`, `rewardTransactionId:Ref?`, `fraudDecision:string?`.
- **Indexes:** `referrerId,status,registeredAt DESC`; `referredStudentId` unique; `referralCode,status`.
- **Relationships:** Two users, optional coin/XP reward.
- **Validation:** No self-referral, duplicate referred user, or client reward; server validates mobile verification, approval, and policy conditions.

### `referralPolicies`

- **Purpose:** Administrator-controlled referral rules.
- **Fields:** `name:string!`, `requiredConditions:ReferralCondition[]!`, `rewardType:RewardType!`, `rewardAmount:number!`, `dailyLimit:number?`, `monthlyLimit:number?`, `active:boolean!`, `startsAt:Timestamp?`, `endsAt:Timestamp?`.
- **Indexes:** `active,startsAt`; `endsAt`.
- **Relationships:** Used by referral validation.
- **Validation:** Versioned; only one active policy per scope; no client access to mutation.

### `notificationPreferences`

- **Purpose:** Student channel/category preferences.
- **Fields:** `userId:Ref!`, `lessonReminders:boolean!`, `homeworkReminders:boolean!`, `liveSessionReminders:boolean!`, `achievementNotifications:boolean!`, `motivationalMessages:boolean!`, `studyTips:boolean!`, `teacherAnnouncements:boolean!`, `pushEnabled:boolean!`, `emailEnabled:boolean!`, `whatsappEnabled:boolean!`, `quietHours:Map<string,string>?`.
- **Indexes:** `userId` unique.
- **Relationships:** User and notification delivery.
- **Validation:** Critical security/payment notifications cannot be disabled; only owner or administrator update.

### `notificationTemplates`

- **Purpose:** Channel-neutral notification templates.
- **Fields:** `type:NotificationType!`, `channel:DeliveryChannel!`, `locale:string!`, `titleTemplate:string!`, `bodyTemplate:string!`, `active:boolean!`, `version:number!`.
- **Indexes:** `type,channel,locale,active`; unique active type/channel/locale.
- **Relationships:** Campaigns and deliveries.
- **Validation:** Templates cannot contain secrets; placeholders are allow-listed; administrator only.

### `notificationCampaigns`

- **Purpose:** Immediate or scheduled teacher/admin notification command.
- **Fields:** `createdBy:Ref!`, `notificationType:NotificationType!`, `targetType:NotificationTargetType!`, `targetIds:Ref[]!`, `channel:DeliveryChannel!`, `messageTemplateId:Ref!`, `scheduledAt:Timestamp?`, `status:CampaignStatus!`.
- **Indexes:** `createdBy,createdAt DESC`; `status,scheduledAt`; `targetType,targetIds` array index.
- **Relationships:** Creator, target users/grades, template, notification records.
- **Validation:** Teacher targets limited to assigned grades/students; teachers cannot broadcast system-wide; target list size bounded.

### `notifications`

- **Purpose:** In-app notification history for one recipient.
- **Fields:** `userId:Ref!`, `notificationType:NotificationType!`, `priority:NotificationPriority!`, `title:string!`, `message:string!`, `campaignId:Ref?`, `read:boolean!`, `readAt:Timestamp?`, `expiresAt:Timestamp?`.
- **Indexes:** `userId,read,createdAt DESC`; `userId,createdAt DESC`; `notificationType,createdAt DESC`.
- **Relationships:** Recipient and optional campaign.
- **Validation:** Recipient cannot be changed; read transition only by recipient or trusted service; history not deleted by user.

### `notificationDeliveries`

- **Purpose:** Per-channel delivery attempt and outcome.
- **Fields:** `notificationId:Ref!`, `userId:Ref!`, `channel:DeliveryChannel!`, `status:DeliveryStatus!`, `providerMessageId:string?`, `attemptCount:number!`, `nextAttemptAt:Timestamp?`, `sentAt:Timestamp?`, `deliveredAt:Timestamp?`, `failedAt:Timestamp?`, `failureCode:string?`, `idempotencyKey:string!`.
- **Indexes:** `notificationId,channel` unique; `status,nextAttemptAt`; `userId,createdAt DESC`.
- **Relationships:** Notification and user/device.
- **Validation:** Server/worker only; retry policy bounded; never store sensitive provider payloads.

### `deviceTokens`

- **Purpose:** Push delivery registration.
- **Fields:** `userId:Ref!`, `tokenHash:string!`, `platform:DevicePlatform!`, `appVersion:string?`, `lastSeenAt:Timestamp!`, `active:boolean!`.
- **Indexes:** `userId,active`; `tokenHash` unique.
- **Relationships:** User and push delivery.
- **Validation:** Token may be registered/deleted only by owner or trusted service; raw token storage follows provider policy.

## AI, Reporting, Analytics, Support, and Administration

### `conversations`

- **Purpose:** One Ask El-bannawy AI conversation header.
- **Fields:** `userId:Ref!`, `title:string!`, `status:ConversationStatus!`, `lastMessageAt:Timestamp?`, `messageCount:number!`, `contextVersion:string!`.
- **Indexes:** `userId,updatedAt DESC`; `userId,status,updatedAt DESC`.
- **Relationships:** User and nested messages.
- **Validation:** User owns conversation; title size-limited; no prompt/system policy stored in a client-readable header.

### `conversations/{conversationId}/messages`

- **Purpose:** Parent-scoped conversation messages.
- **Fields:** `authorType:ConversationAuthor!`, `userId:Ref!`, `content:string!`, `createdAt:Timestamp!`, `responseStatus:AIResponseStatus!`, `citationIds:Ref[]!`, `usageEventId:Ref?`.
- **Indexes:** Default parent ordering by `createdAt`; collection-group index is not required.
- **Relationships:** Conversation and optional AI usage event.
- **Validation:** Student may create only a user message; AI messages are trusted-service writes; citations must be approved knowledge documents; internal prompts never stored.

### `aiAssessments`

- **Purpose:** Assessment result for subjective activity responses.
- **Fields:** `studentId:Ref!`, `activityProgressId:Ref!`, `status:AIJobStatus!`, `score:number?`, `grammarFeedback:string?`, `vocabularyFeedback:string?`, `generalFeedback:string?`, `recommendationIds:Ref[]!`, `modelProvider:string!`, `modelVersion:string!`, `completedAt:Timestamp?`.
- **Indexes:** `studentId,createdAt DESC`; `activityProgressId` unique active result; `status,createdAt`.
- **Relationships:** Student, activity response, recommendations.
- **Validation:** Trusted worker only; response must be validated before publication; provider credentials never stored.

### `aiRecommendations`

- **Purpose:** Student learning recommendation generated from approved context.
- **Fields:** `studentId:Ref!`, `sourceType:string!`, `sourceId:Ref?`, `recommendation:string!`, `status:RecommendationStatus!`, `expiresAt:Timestamp?`, `createdBy:string!`.
- **Indexes:** `studentId,status,createdAt DESC`; `expiresAt,status`.
- **Relationships:** Student and source learning record.
- **Validation:** Must cite approved educational context; no curriculum invention; student may dismiss but not rewrite.

### `aiUsageEvents`

- **Purpose:** AI cost, latency, model, and outcome metadata.
- **Fields:** `userId:Ref?`, `conversationId:Ref?`, `operation:string!`, `provider:string!`, `model:string!`, `inputTokens:number!`, `outputTokens:number!`, `latencyMs:number!`, `status:string!`, `occurredAt:Timestamp!`, `costMinorUnits:number?`.
- **Indexes:** `userId,occurredAt DESC`; `provider,occurredAt DESC`; `status,occurredAt DESC`.
- **Relationships:** Optional user/conversation.
- **Validation:** No prompt text, answer keys, secrets, or private content; append-only trusted-service writes.

### `knowledgeDocuments`

- **Purpose:** Metadata and lifecycle for approved AI knowledge sources.
- **Fields:** `sourceType:string!`, `sourceId:Ref?`, `title:string!`, `contentVersion:number!`, `approvalStatus:KnowledgeApprovalStatus!`, `vectorNamespace:string!`, `embeddingVersion:string!`, `storagePath:string?`, `approvedBy:Ref?`, `approvedAt:Timestamp?`.
- **Indexes:** `approvalStatus,updatedAt DESC`; `sourceType,sourceId,contentVersion`.
- **Relationships:** Content source; vectors in pgvector by namespace/version.
- **Validation:** Only approved documents are retrievable; no internal prompts or secrets; source version immutable after indexing.

### `reports`

- **Purpose:** Generated or materialized report descriptor and summary.
- **Fields:** `reportType:ReportType!`, `ownerId:Ref!`, `scopeType:ReportScope!`, `scopeId:Ref?`, `filters:Map<string,unknown>!`, `status:ReportStatus!`, `summary:Map<string,unknown>?`, `generatedAt:Timestamp?`, `expiresAt:Timestamp?`.
- **Indexes:** `ownerId,createdAt DESC`; `reportType,scopeType,createdAt DESC`; `status,createdAt`.
- **Relationships:** Owner and source scopes; exports.
- **Validation:** Access scope checked at read time; summary is rebuildable; large results generated asynchronously.

### `reportExports`

- **Purpose:** PDF/XLSX/CSV export metadata.
- **Fields:** `reportId:Ref!`, `requestedBy:Ref!`, `format:ReportFormat!`, `storagePath:string?`, `status:ExportStatus!`, `requestedAt:Timestamp!`, `completedAt:Timestamp?`, `expiresAt:Timestamp?`.
- **Indexes:** `requestedBy,requestedAt DESC`; `reportId,createdAt DESC`; `status,requestedAt`.
- **Relationships:** Report and Storage file.
- **Validation:** Server-generated; download authorization checked each time; files expire according to policy.

### `scheduledReports`

- **Purpose:** Administrator-managed recurring report schedule.
- **Fields:** `createdBy:Ref!`, `reportType:ReportType!`, `filters:Map<string,unknown>!`, `frequency:ReportFrequency!`, `nextRunAt:Timestamp!`, `deliveryChannels:DeliveryChannel[]!`, `active:boolean!`.
- **Indexes:** `active,nextRunAt`; `createdBy,active`.
- **Relationships:** Creator and generated reports.
- **Validation:** Administrator only in Version 1; schedule bounded and timezone explicit.

### `teacherNotes`

- **Purpose:** Teacher comments attached to an authorized student report context.
- **Fields:** `teacherId:Ref!`, `studentId:Ref!`, `lessonId:Ref?`, `reportId:Ref?`, `note:string!`, `visibility:TeacherNoteVisibility!`, `createdAt:Timestamp!`.
- **Indexes:** `studentId,createdAt DESC`; `teacherId,studentId,createdAt DESC`.
- **Relationships:** Teacher, student, optional lesson/report.
- **Validation:** Teacher must have student/grade scope; note sanitized; students read only notes explicitly made visible.

### `analyticsEvents`

- **Purpose:** Append-only operational event facts for recent metrics and export.
- **Fields:** `eventType:string!`, `occurredAt:Timestamp!`, `actorId:Ref?`, `studentId:Ref?`, `gradeId:Ref?`, `lessonId:Ref?`, `properties:Map<string,unknown>!`, `requestId:string!`.
- **Indexes:** `eventType,occurredAt DESC`; `studentId,occurredAt DESC`; `gradeId,eventType,occurredAt DESC`.
- **Relationships:** Optional source entities.
- **Validation:** No passwords, tokens, payment secrets, raw AI prompts, or unnecessary personal data; trusted-service writes; retention policy applies.

### `analyticsDailyMetrics`

- **Purpose:** Daily aggregate metrics used by dashboards.
- **Fields:** `metricDate:string!`, `scopeType:AnalyticsScope!`, `scopeId:Ref?`, `metricName:string!`, `value:number!`, `dimensions:Map<string,string>!`, `calculationVersion:number!`.
- **Indexes:** `metricDate,scopeType,scopeId,metricName`; `metricName,metricDate DESC`.
- **Relationships:** Rebuildable from analytics events and domain facts.
- **Validation:** Trusted-service writes; one document per metric/date/scope/dimension key; no mutable global counter.

### `supportTickets`

- **Purpose:** Technical support ticket lifecycle.
- **Fields:** `createdBy:Ref!`, `assignedTo:Ref?`, `category:SupportCategory!`, `priority:SupportPriority!`, `status:SupportStatus!`, `subject:string!`, `description:string!`, `userRole:Role!`, `resolvedAt:Timestamp?`, `closedAt:Timestamp?`.
- **Indexes:** `createdBy,createdAt DESC`; `assignedTo,status,updatedAt DESC`; `status,priority,createdAt ASC`.
- **Relationships:** User and nested messages; no direct financial/content mutation.
- **Validation:** Creator authenticated; support can transition workflow but cannot delete or edit financial/educational records; every staff action audited.

### `supportTickets/{ticketId}/messages`

- **Purpose:** Ticket replies and private internal notes.
- **Fields:** `authorId:Ref!`, `authorRole:Role!`, `message:string!`, `internal:boolean!`, `createdAt:Timestamp!`, `attachmentPaths:string[]!`.
- **Indexes:** Default parent ordering by `createdAt`.
- **Relationships:** One support ticket and author.
- **Validation:** Internal messages visible only to support/admin; attachments are Storage-owned and scanned; immutable after creation.

### `systemSettings`

- **Purpose:** Administrator-controlled platform configuration.
- **Fields:** `key:string!`, `value:Map<string,unknown>!`, `sensitive:boolean!`, `effectiveAt:Timestamp?`, `updatedBy:Ref!`.
- **Indexes:** `key` unique; `effectiveAt`.
- **Relationships:** Administration only.
- **Validation:** Sensitive values are secret references, not plaintext; administrator only; every update audited.

### `featureFlags`

- **Purpose:** Controlled feature availability by environment/role/scope.
- **Fields:** `key:string!`, `enabled:boolean!`, `environment:string!`, `roleAllowList:Role[]!`, `gradeIds:Ref[]!`, `startsAt:Timestamp?`, `endsAt:Timestamp?`, `updatedBy:Ref!`.
- **Indexes:** `environment,key` unique; `enabled,startsAt`.
- **Relationships:** Administration and optional grade scope.
- **Validation:** Administrator only; dates ordered; flags cannot bypass authentication, authorization, or business rules.

### `auditLogs`

- **Purpose:** Immutable security and administrative audit trail.
- **Fields:** `actorId:Ref!`, `actorRole:Role!`, `action:string!`, `entity:string!`, `entityId:Ref?`, `before:Map<string,unknown>?`, `after:Map<string,unknown>?`, `requestId:string!`, `occurredAt:Timestamp!`, `ipHash:string?`, `deviceHash:string?`.
- **Indexes:** `actorId,occurredAt DESC`; `entity,entityId,occurredAt DESC`; `action,occurredAt DESC`.
- **Relationships:** Actor and target entity.
- **Validation:** Trusted-service create only; redact personal/payment secrets; no update or delete by application roles.

## Collection Count and Exclusions

The inventory contains the root collections listed in `FIRESTORE_ARCHITECTURE.md` and 2 nested message collections. Firebase Auth users, sessions, refresh tokens, passwords, Storage binary contents, Redis queues, pgvector embeddings, and warehouse tables are intentionally not duplicated as Firestore collections. They are external authorities in the hybrid architecture.
