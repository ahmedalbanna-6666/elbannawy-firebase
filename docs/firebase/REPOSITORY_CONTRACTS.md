# Repository Contracts

## El-bannawy Platform - Firestore Repository Design

Version: 2.0.0  
Status: Phase 1 design baseline  
Last Updated: 2026-07-21

## Purpose and Scope

This document defines the repository boundary for each domain. It is a TypeScript-oriented design contract, not application code. Implementations must use strict TypeScript, explicit return types, Zod validation at input boundaries, and Firestore transactions/batches where specified.

Repositories own persistence and query translation only. They do not decide business policy, calculate authorization, call external providers, or expose Firestore SDK types to the domain layer. Use cases/services own business rules; controllers/API adapters own transport DTOs.

## Shared Contract Types

The following conceptual types are shared by all repository interfaces:

```ts
type RepositoryResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: RepositoryError };

interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

interface PageQuery {
  readonly limit: number;
  readonly cursor?: string;
}

interface RepositoryError {
  readonly code:
    | "NOT_FOUND"
    | "ALREADY_EXISTS"
    | "CONFLICT"
    | "INVALID_INPUT"
    | "FORBIDDEN"
    | "PRECONDITION_FAILED"
    | "RATE_LIMITED"
    | "UNAVAILABLE"
    | "INTERNAL";
  readonly message: string;
  readonly retryable: boolean;
  readonly requestId: string;
}
```

The snippet specifies shapes only. It is not an implementation. Domain return types are named aggregates/projections from `DOMAIN_MODEL.md`; transport/API response wrappers are not repository types.

## Contract Rules

1. `getById` returns `NOT_FOUND` rather than `null` for a required aggregate lookup.
2. `find...` methods return an empty page/list when no matching records exist.
3. Create methods return `ALREADY_EXISTS` for deterministic-ID collisions.
4. Update methods use optimistic version checks and return `CONFLICT` when the version changed.
5. Delete means soft delete for user-facing content and never means deletion for ledgers, payments, submitted attempts, or audit logs.
6. Repositories do not accept arbitrary field maps. Each command uses an explicit typed input validated by Zod before the repository call.
7. Repositories never return answer keys, secrets, raw gateway payloads, internal prompts, or private support notes to public read models.
8. Retryable Firestore transaction failures return `UNAVAILABLE` or `CONFLICT` with the request ID; callers may retry only idempotent commands.
9. Every write accepts a request ID and, where relevant, an idempotency key.
10. All list methods require a bounded `PageQuery`; offset pagination is not supported.

CRUD interpretation: each mutable domain aggregate exposes create, get/list, update, and a lifecycle removal method such as `archive`, `deactivate`, or `softDelete`. Immutable domains intentionally expose no update/delete methods because payments, submitted answers, ledgers, delivery history, mistakes, analytics facts, and audit logs must be retained. A lifecycle removal method changes visibility/status and never destroys the document.

## Identity and Access Repository

### `IUserRepository`

```text
createUser(input: CreateUserInput): Promise<RepositoryResult<User>>
getUserById(userId: UserId): Promise<RepositoryResult<User>>
findUserByMobile(mobileNumber: string): Promise<RepositoryResult<User | null>>
findUserByEmail(email: string): Promise<RepositoryResult<User | null>>
listUsers(filter: UserFilter, page: PageQuery): Promise<RepositoryResult<Page<UserSummary>>>
updateProfile(userId: UserId, input: UpdateProfileInput, expectedVersion: number): Promise<RepositoryResult<User>>
updateAcademicAssignment(userId: UserId, input: AcademicAssignmentInput): Promise<RepositoryResult<User>>
changeAccountStatus(userId: UserId, status: AccountStatus, requestId: string): Promise<RepositoryResult<User>>
changeRole(userId: UserId, role: Role, requestId: string): Promise<RepositoryResult<User>>
softDeleteUser(userId: UserId, requestId: string): Promise<RepositoryResult<void>>
appendLoginEvent(input: AppendLoginEventInput): Promise<RepositoryResult<LoginEvent>>
listLoginEvents(userId: UserId, page: PageQuery): Promise<RepositoryResult<Page<LoginEvent>>>
```

Authentication credentials, password resets, sessions, and refresh tokens are Firebase Auth responsibilities. `IUserRepository` stores only the Firestore profile and role projection. Role/status mutation must be accompanied by claim synchronization and an audit record in the use case.

### `ITeacherAssignmentRepository`

```text
createAssignment(input: CreateTeacherAssignmentInput): Promise<RepositoryResult<TeacherAssignment>>
getAssignmentById(assignmentId: AssignmentId): Promise<RepositoryResult<TeacherAssignment>>
listTeacherAssignments(teacherId: UserId, page: PageQuery): Promise<RepositoryResult<Page<TeacherAssignment>>>
listGradeTeachers(gradeId: GradeId, page: PageQuery): Promise<RepositoryResult<Page<TeacherAssignment>>>
hasGradeScope(teacherId: UserId, gradeId: GradeId): Promise<RepositoryResult<boolean>>
deactivateAssignment(assignmentId: AssignmentId, requestId: string): Promise<RepositoryResult<void>>
```

The repository may answer scope queries but cannot grant scope based on caller input. Assignment uniqueness is transactionally enforced.

## Academic Structure Repository

### `IAcademicRepository`

```text
createEducationalSystem(input: CreateEducationalSystemInput): Promise<RepositoryResult<EducationalSystem>>
listEducationalSystems(filter: ActiveFilter, page: PageQuery): Promise<RepositoryResult<Page<EducationalSystem>>>
updateEducationalSystem(id: EducationalSystemId, input: UpdateEducationalSystemInput): Promise<RepositoryResult<EducationalSystem>>
deactivateEducationalSystem(id: EducationalSystemId): Promise<RepositoryResult<void>>

createStage(input: CreateStageInput): Promise<RepositoryResult<Stage>>
getStageById(id: StageId): Promise<RepositoryResult<Stage>>
listStages(filter: ActiveFilter, page: PageQuery): Promise<RepositoryResult<Page<Stage>>>
updateStage(id: StageId, input: UpdateStageInput): Promise<RepositoryResult<Stage>>
deactivateStage(id: StageId): Promise<RepositoryResult<void>>

createGrade(input: CreateGradeInput): Promise<RepositoryResult<Grade>>
getGradeById(id: GradeId): Promise<RepositoryResult<Grade>>
listGradesByStage(stageId: StageId, page: PageQuery): Promise<RepositoryResult<Page<Grade>>>
updateGrade(id: GradeId, input: UpdateGradeInput): Promise<RepositoryResult<Grade>>
deactivateGrade(id: GradeId): Promise<RepositoryResult<void>>

createAcademicYear(input: CreateAcademicYearInput): Promise<RepositoryResult<AcademicYear>>
getAcademicYearById(id: AcademicYearId): Promise<RepositoryResult<AcademicYear>>
getActiveAcademicYear(): Promise<RepositoryResult<AcademicYear | null>>
updateAcademicYear(id: AcademicYearId, input: UpdateAcademicYearInput): Promise<RepositoryResult<AcademicYear>>
deactivateAcademicYear(id: AcademicYearId): Promise<RepositoryResult<void>>

createTerm(input: CreateTermInput): Promise<RepositoryResult<Term>>
getTermById(id: TermId): Promise<RepositoryResult<Term>>
listTermsByYear(yearId: AcademicYearId, page: PageQuery): Promise<RepositoryResult<Page<Term>>>
updateTerm(id: TermId, input: UpdateTermInput): Promise<RepositoryResult<Term>>
deactivateTerm(id: TermId): Promise<RepositoryResult<void>>

createBook(input: CreateBookInput): Promise<RepositoryResult<Book>>
getBookById(id: BookId): Promise<RepositoryResult<Book>>
listBooks(filter: BookFilter, page: PageQuery): Promise<RepositoryResult<Page<Book>>>
updateBook(id: BookId, input: UpdateBookInput): Promise<RepositoryResult<Book>>
archiveBook(id: BookId, requestId: string): Promise<RepositoryResult<void>>

createUnit(input: CreateUnitInput): Promise<RepositoryResult<Unit>>
getUnitById(id: UnitId): Promise<RepositoryResult<Unit>>
listUnits(filter: UnitFilter, page: PageQuery): Promise<RepositoryResult<Page<Unit>>>
updateUnit(id: UnitId, input: UpdateUnitInput): Promise<RepositoryResult<Unit>>
publishUnit(id: UnitId, requestId: string): Promise<RepositoryResult<Unit>>
archiveUnit(id: UnitId, requestId: string): Promise<RepositoryResult<Unit>>
```

The service validates parent compatibility (stage/grade/year/term/book) before invoking writes. The repository does not infer a student's term.

## Lesson Content Repository

### `ILessonRepository`

```text
createLesson(input: CreateLessonInput): Promise<RepositoryResult<Lesson>>
getLessonById(id: LessonId): Promise<RepositoryResult<Lesson>>
listLessons(filter: LessonFilter, page: PageQuery): Promise<RepositoryResult<Page<LessonSummary>>>
updateLesson(id: LessonId, input: UpdateLessonInput, expectedVersion: number): Promise<RepositoryResult<Lesson>>
publishLesson(id: LessonId, requestId: string): Promise<RepositoryResult<Lesson>>
unpublishLesson(id: LessonId, requestId: string): Promise<RepositoryResult<Lesson>>
softDeleteLesson(id: LessonId, requestId: string): Promise<RepositoryResult<void>>
getLessonReadModel(id: LessonId, studentId?: UserId): Promise<RepositoryResult<LessonReadModel>>
```

### `ILessonContentRepository`

```text
createVideo(input: CreateLessonVideoInput): Promise<RepositoryResult<LessonVideo>>
listVideos(lessonId: LessonId, page: PageQuery): Promise<RepositoryResult<Page<LessonVideo>>>
updateVideo(id: LessonVideoId, input: UpdateLessonVideoInput): Promise<RepositoryResult<LessonVideo>>
archiveVideo(id: LessonVideoId, requestId: string): Promise<RepositoryResult<void>>
reorderVideos(lessonId: LessonId, orderedIds: readonly LessonVideoId[]): Promise<RepositoryResult<void>>
createLessonDocument(input: CreateLessonDocumentInput): Promise<RepositoryResult<LessonDocument>>
getLessonDocument(lessonId: LessonId): Promise<RepositoryResult<LessonDocument | null>>
updateDocumentProcessing(id: LessonDocumentId, input: DocumentProcessingUpdate): Promise<RepositoryResult<LessonDocument>>

createActivity(input: CreateActivityInput): Promise<RepositoryResult<Activity>>
listActivities(videoId: LessonVideoId, page: PageQuery): Promise<RepositoryResult<Page<Activity>>>
updateActivity(id: ActivityId, input: UpdateActivityInput): Promise<RepositoryResult<Activity>>
setActivityEnabled(id: ActivityId, enabled: boolean): Promise<RepositoryResult<Activity>>
archiveActivity(id: ActivityId, requestId: string): Promise<RepositoryResult<void>>

createTimelineEvent(input: CreateTimelineEventInput): Promise<RepositoryResult<TimelineEvent>>
listTimelineEvents(videoId: LessonVideoId, page: PageQuery): Promise<RepositoryResult<Page<TimelineEvent>>>
updateTimelineEvent(id: TimelineEventId, input: UpdateTimelineEventInput): Promise<RepositoryResult<TimelineEvent>>
deleteTimelineEvent(id: TimelineEventId, requestId: string): Promise<RepositoryResult<void>>

createVocabularySection(input: CreateVocabularySectionInput): Promise<RepositoryResult<VocabularySection>>
listVocabularySections(lessonId: LessonId, page: PageQuery): Promise<RepositoryResult<Page<VocabularySection>>>
createVocabularyItem(input: CreateVocabularyItemInput): Promise<RepositoryResult<VocabularyItem>>
listVocabularyItems(owner: VocabularyOwner, page: PageQuery): Promise<RepositoryResult<Page<VocabularyItem>>>
updateVocabularyItem(id: VocabularyItemId, input: UpdateVocabularyItemInput): Promise<RepositoryResult<VocabularyItem>>
archiveVocabularyItem(id: VocabularyItemId, requestId: string): Promise<RepositoryResult<void>>
createVocabularyRelation(input: CreateVocabularyRelationInput): Promise<RepositoryResult<VocabularyRelation>>
```

Generated activity and vocabulary content must retain the source document and content version. A teacher cannot use this repository to invent an activity outside the documented generation flow.

## Assessment Repository

### `IAssessmentRepository`

```text
createHomework(input: CreateHomeworkInput): Promise<RepositoryResult<Homework>>
getHomeworkByOwner(owner: LearningOwner): Promise<RepositoryResult<Homework | null>>
updateHomework(id: HomeworkId, input: UpdateHomeworkInput): Promise<RepositoryResult<Homework>>
publishHomework(id: HomeworkId, requestId: string): Promise<RepositoryResult<Homework>>
archiveHomework(id: HomeworkId, requestId: string): Promise<RepositoryResult<void>>
listHomeworkQuestions(homeworkId: HomeworkId, page: PageQuery): Promise<RepositoryResult<Page<HomeworkQuestion>>>
createHomeworkQuestion(input: CreateHomeworkQuestionInput): Promise<RepositoryResult<HomeworkQuestion>>
updateHomeworkQuestion(id: HomeworkQuestionId, input: UpdateQuestionInput): Promise<RepositoryResult<HomeworkQuestion>>

createQuiz(input: CreateQuizInput): Promise<RepositoryResult<Quiz>>
getQuizByOwner(owner: LearningOwner): Promise<RepositoryResult<Quiz | null>>
updateQuiz(id: QuizId, input: UpdateQuizInput): Promise<RepositoryResult<Quiz>>
publishQuiz(id: QuizId, requestId: string): Promise<RepositoryResult<Quiz>>
archiveQuiz(id: QuizId, requestId: string): Promise<RepositoryResult<void>>
listQuizQuestions(quizId: QuizId, page: PageQuery): Promise<RepositoryResult<Page<QuizQuestion>>>
createQuizQuestion(input: CreateQuizQuestionInput): Promise<RepositoryResult<QuizQuestion>>
updateQuizQuestion(id: QuizQuestionId, input: UpdateQuestionInput): Promise<RepositoryResult<QuizQuestion>>

createAssessment(input: CreateAssessmentInput): Promise<RepositoryResult<Assessment>>
getAssessmentById(id: AssessmentId): Promise<RepositoryResult<Assessment>>
listAssessments(filter: AssessmentFilter, page: PageQuery): Promise<RepositoryResult<Page<Assessment>>>
updateAssessment(id: AssessmentId, input: UpdateAssessmentInput): Promise<RepositoryResult<Assessment>>
archiveAssessment(id: AssessmentId, requestId: string): Promise<RepositoryResult<void>>
listAssessmentQuestions(id: AssessmentId, page: PageQuery): Promise<RepositoryResult<Page<AssessmentQuestion>>>
createAssessmentQuestion(input: CreateAssessmentQuestionInput): Promise<RepositoryResult<AssessmentQuestion>>
updateAssessmentQuestion(id: AssessmentQuestionId, input: UpdateQuestionInput): Promise<RepositoryResult<AssessmentQuestion>>
```

Answer keys have no public repository method. Grading infrastructure receives them through a server-only repository with an explicit service identity.

## Progress Repository

### `IProgressRepository`

```text
getLessonProgress(studentId: UserId, lessonId: LessonId): Promise<RepositoryResult<LessonProgress | null>>
listLessonProgress(studentId: UserId, filter: ProgressFilter, page: PageQuery): Promise<RepositoryResult<Page<LessonProgress>>>
saveVideoCheckpoint(input: SaveVideoCheckpointInput): Promise<RepositoryResult<VideoProgress>>
getVideoProgress(studentId: UserId, videoId: LessonVideoId): Promise<RepositoryResult<VideoProgress | null>>
saveTimelineCheckpoint(input: SaveTimelineCheckpointInput): Promise<RepositoryResult<TimelineEventProgress>>
saveActivityCheckpoint(input: SaveActivityCheckpointInput): Promise<RepositoryResult<ActivityProgress>>
saveVocabularyProgress(input: SaveVocabularyProgressInput): Promise<RepositoryResult<VocabularyProgress>>
getStudentStats(studentId: UserId): Promise<RepositoryResult<StudentStats>>
rebuildStudentStats(studentId: UserId, requestId: string): Promise<RepositoryResult<StudentStats>>
markLessonCompleted(input: MarkLessonCompletedInput): Promise<RepositoryResult<LessonProgress>>
```

Client checkpoint methods cannot set completion, score, unlock, or reward fields. Completion is a transaction coordinated by the learning service.

## Attempt and Mistake Repositories

### `IAttemptRepository`

```text
createHomeworkAttempt(input: CreateHomeworkAttemptInput): Promise<RepositoryResult<HomeworkAttempt>>
getHomeworkAttempt(studentId: UserId, attemptId: AttemptId): Promise<RepositoryResult<HomeworkAttempt>>
listHomeworkAttempts(studentId: UserId, homeworkId: HomeworkId, page: PageQuery): Promise<RepositoryResult<Page<HomeworkAttempt>>>
saveHomeworkAnswer(input: SaveAttemptAnswerInput): Promise<RepositoryResult<HomeworkAnswer>>
submitHomeworkAttempt(input: SubmitAttemptInput): Promise<RepositoryResult<HomeworkAttempt>>

createQuizAttempt(input: CreateQuizAttemptInput): Promise<RepositoryResult<QuizAttempt>>
getQuizAttempt(studentId: UserId, attemptId: AttemptId): Promise<RepositoryResult<QuizAttempt>>
listQuizAttempts(studentId: UserId, quizId: QuizId, page: PageQuery): Promise<RepositoryResult<Page<QuizAttempt>>>
saveQuizAnswer(input: SaveAttemptAnswerInput): Promise<RepositoryResult<QuizAnswer>>
submitQuizAttempt(input: SubmitAttemptInput): Promise<RepositoryResult<QuizAttempt>>

createAssessmentAttempt(input: CreateAssessmentAttemptInput): Promise<RepositoryResult<AssessmentAttempt>>
getAssessmentAttempt(studentId: UserId, attemptId: AttemptId): Promise<RepositoryResult<AssessmentAttempt>>
listAssessmentAttempts(studentId: UserId, assessmentId: AssessmentId, page: PageQuery): Promise<RepositoryResult<Page<AssessmentAttempt>>>
saveAssessmentAnswer(input: SaveAttemptAnswerInput): Promise<RepositoryResult<AssessmentAnswer>>
submitAssessmentAttempt(input: SubmitAttemptInput): Promise<RepositoryResult<AssessmentAttempt>>
```

### `IMistakeRepository`

```text
recordIncorrectAnswer(input: RecordMistakeInput): Promise<RepositoryResult<Mistake>>
getMistake(studentId: UserId, mistakeId: MistakeId): Promise<RepositoryResult<Mistake>>
listMistakes(studentId: UserId, filter: MistakeFilter, page: PageQuery): Promise<RepositoryResult<Page<Mistake>>>
recordMistakeReview(input: MistakeReviewInput): Promise<RepositoryResult<MistakeReview>>
markMistakeMastered(mistakeId: MistakeId, studentId: UserId): Promise<RepositoryResult<Mistake>>
listMistakeReviews(mistakeId: MistakeId, page: PageQuery): Promise<RepositoryResult<Page<MistakeReview>>>
```

Mistakes are created from grading results, cannot be deleted by students, and retain their history after mastery.

## Story, Final Review, and Games Repositories

### `IStoryRepository`

```text
createStory(input: CreateStoryInput): Promise<RepositoryResult<Story>>
getStoryById(id: StoryId): Promise<RepositoryResult<Story>>
listStories(filter: StoryFilter, page: PageQuery): Promise<RepositoryResult<Page<Story>>>
updateStory(id: StoryId, input: UpdateStoryInput): Promise<RepositoryResult<Story>>
archiveStory(id: StoryId, requestId: string): Promise<RepositoryResult<void>>
createChapter(input: CreateStoryChapterInput): Promise<RepositoryResult<StoryChapter>>
listChapters(storyId: StoryId, page: PageQuery): Promise<RepositoryResult<Page<StoryChapter>>>
updateChapter(id: StoryChapterId, input: UpdateStoryChapterInput): Promise<RepositoryResult<StoryChapter>>
archiveChapter(id: StoryChapterId, requestId: string): Promise<RepositoryResult<void>>
createStoryLesson(input: CreateStoryLessonInput): Promise<RepositoryResult<StoryLesson>>
listStoryLessons(chapterId: StoryChapterId, page: PageQuery): Promise<RepositoryResult<Page<StoryLesson>>>
updateStoryLesson(id: StoryLessonId, input: UpdateStoryLessonInput): Promise<RepositoryResult<StoryLesson>>
archiveStoryLesson(id: StoryLessonId, requestId: string): Promise<RepositoryResult<void>>
createStoryFile(input: CreateStoryFileInput): Promise<RepositoryResult<StoryFile>>
listStoryFiles(storyLessonId: StoryLessonId, page: PageQuery): Promise<RepositoryResult<Page<StoryFile>>>
createStoryVocabulary(input: CreateStoryVocabularyInput): Promise<RepositoryResult<StoryVocabulary>>
listStoryVocabulary(storyLessonId: StoryLessonId, page: PageQuery): Promise<RepositoryResult<Page<StoryVocabulary>>>
saveStoryProgress(input: SaveStoryProgressInput): Promise<RepositoryResult<StoryProgress>>
getStoryProgress(studentId: UserId, storyId: StoryId): Promise<RepositoryResult<StoryProgress | null>>
```

Story progress and completion are not written to main curriculum progress.

### `IFinalReviewRepository`

```text
createFinalReview(input: CreateFinalReviewInput): Promise<RepositoryResult<FinalReview>>
getFinalReviewById(id: FinalReviewId): Promise<RepositoryResult<FinalReview>>
listFinalReviewsForStudent(studentId: UserId, page: PageQuery): Promise<RepositoryResult<Page<FinalReview>>>
updateFinalReview(id: FinalReviewId, input: UpdateFinalReviewInput): Promise<RepositoryResult<FinalReview>>
archiveFinalReview(id: FinalReviewId, requestId: string): Promise<RepositoryResult<void>>
createReviewUnit(input: CreateFinalReviewUnitInput): Promise<RepositoryResult<FinalReviewUnit>>
listReviewUnits(reviewId: FinalReviewId, page: PageQuery): Promise<RepositoryResult<Page<FinalReviewUnit>>>
createReviewLesson(input: CreateFinalReviewLessonInput): Promise<RepositoryResult<FinalReviewLesson>>
listReviewLessons(unitId: FinalReviewUnitId, page: PageQuery): Promise<RepositoryResult<Page<FinalReviewLesson>>>
createReviewQuestion(input: CreateFinalReviewQuestionInput): Promise<RepositoryResult<FinalReviewQuestion>>
listReviewQuestions(reviewId: FinalReviewId, filter: ReviewQuestionFilter, page: PageQuery): Promise<RepositoryResult<Page<FinalReviewQuestion>>>
saveReviewProgress(input: SaveFinalReviewProgressInput): Promise<RepositoryResult<FinalReviewProgress>>
```

Student listing must enforce activation window and grade scope before the repository returns content.

### `IGameRepository`

```text
createGame(input: CreateGameInput): Promise<RepositoryResult<Game>>
getGameById(id: GameId): Promise<RepositoryResult<Game>>
listAvailableGames(filter: GameFilter, page: PageQuery): Promise<RepositoryResult<Page<Game>>>
updateGame(id: GameId, input: UpdateGameInput): Promise<RepositoryResult<Game>>
archiveGame(id: GameId, requestId: string): Promise<RepositoryResult<void>>
createGameCategory(input: CreateGameCategoryInput): Promise<RepositoryResult<GameCategory>>
listGameCategories(filter: ActiveFilter, page: PageQuery): Promise<RepositoryResult<Page<GameCategory>>>
createAssignment(input: CreateGameAssignmentInput): Promise<RepositoryResult<GameAssignment>>
listAssignments(filter: GameAssignmentFilter, page: PageQuery): Promise<RepositoryResult<Page<GameAssignment>>>
recordAttempt(input: RecordGameAttemptInput): Promise<RepositoryResult<GameAttempt>>
listStudentAttempts(studentId: UserId, gameId: GameId, page: PageQuery): Promise<RepositoryResult<Page<GameAttempt>>>
```

Game attempt persistence is idempotent and does not directly unlock lessons.

## Live Classes Repository

### `ILiveClassRepository`

```text
createAvailability(input: CreateAvailabilityInput): Promise<RepositoryResult<TeacherAvailability>>
listAvailability(teacherId: UserId, page: PageQuery): Promise<RepositoryResult<Page<TeacherAvailability>>>
deactivateAvailability(id: AvailabilityId): Promise<RepositoryResult<void>>
createDateBlock(input: CreateDateBlockInput): Promise<RepositoryResult<TeacherDateBlock>>
getTeacherLiveSettings(teacherId: UserId): Promise<RepositoryResult<TeacherLiveSettings | null>>
updateTeacherLiveSettings(teacherId: UserId, input: UpdateLiveSettingsInput): Promise<RepositoryResult<TeacherLiveSettings>>

createSession(input: CreateLiveSessionInput): Promise<RepositoryResult<LiveSession>>
getSessionById(id: LiveSessionId): Promise<RepositoryResult<LiveSession>>
listSessions(filter: LiveSessionFilter, page: PageQuery): Promise<RepositoryResult<Page<LiveSessionSummary>>>
updateSession(id: LiveSessionId, input: UpdateLiveSessionInput): Promise<RepositoryResult<LiveSession>>
publishSession(id: LiveSessionId): Promise<RepositoryResult<LiveSession>>
cancelSession(id: LiveSessionId, reason: string): Promise<RepositoryResult<LiveSession>>
bookSession(input: BookSessionInput): Promise<RepositoryResult<LiveBooking>>
cancelBooking(input: CancelBookingInput): Promise<RepositoryResult<LiveBooking>>
joinWaitlist(input: JoinWaitlistInput): Promise<RepositoryResult<LiveWaitlistEntry>>
recordAttendance(input: RecordAttendanceInput): Promise<RepositoryResult<LiveAttendance>>
listAttendance(sessionId: LiveSessionId, page: PageQuery): Promise<RepositoryResult<Page<LiveAttendance>>>
createAnnouncement(input: CreateLiveAnnouncementInput): Promise<RepositoryResult<LiveAnnouncement>>
```

Booking, waitlist promotion, capacity, and attendance transitions require transactions. Meeting URLs are returned only through an authorized command/query.

## Gamification and Commerce Repositories

### `IGamificationRepository`

```text
getXpAccount(studentId: UserId): Promise<RepositoryResult<XPAccount>>
listXpTransactions(studentId: UserId, page: PageQuery): Promise<RepositoryResult<Page<XPTransaction>>>
recordXpTransaction(input: RecordXPTransactionInput): Promise<RepositoryResult<XPTransaction>>
getXpLevels(page: PageQuery): Promise<RepositoryResult<Page<XPLevel>>>
createAchievement(input: CreateAchievementInput): Promise<RepositoryResult<Achievement>>
listAchievements(filter: AchievementFilter, page: PageQuery): Promise<RepositoryResult<Page<Achievement>>>
updateAchievement(id: AchievementId, input: UpdateAchievementInput): Promise<RepositoryResult<Achievement>>
deactivateAchievement(id: AchievementId): Promise<RepositoryResult<void>>
listUserAchievements(studentId: UserId, page: PageQuery): Promise<RepositoryResult<Page<UserAchievement>>>
awardAchievement(input: AwardAchievementInput): Promise<RepositoryResult<UserAchievement>>
listLeaderboard(input: LeaderboardQuery): Promise<RepositoryResult<Page<LeaderboardEntry>>>

getWallet(studentId: UserId): Promise<RepositoryResult<Wallet>>
listCoinTransactions(studentId: UserId, page: PageQuery): Promise<RepositoryResult<Page<CoinTransaction>>>
recordCoinTransaction(input: RecordCoinTransactionInput): Promise<RepositoryResult<CoinTransaction>>
```

XP and coin transaction methods are trusted-service methods. They atomically update their current account projection and reject duplicate idempotency keys.

### `ICommerceRepository`

```text
listCoinPackages(filter: PackageFilter, page: PageQuery): Promise<RepositoryResult<Page<CoinPackage>>>
createCoinPackage(input: CreateCoinPackageInput): Promise<RepositoryResult<CoinPackage>>
updateCoinPackage(id: CoinPackageId, input: UpdateCoinPackageInput): Promise<RepositoryResult<CoinPackage>>
createPayment(input: CreatePaymentInput): Promise<RepositoryResult<Payment>>
getPaymentById(id: PaymentId): Promise<RepositoryResult<Payment>>
listPayments(filter: PaymentFilter, page: PageQuery): Promise<RepositoryResult<Page<PaymentSummary>>>
recordGatewayVerification(input: GatewayVerificationInput): Promise<RepositoryResult<Payment>>
createInvoice(input: CreateInvoiceInput): Promise<RepositoryResult<Invoice>>
listInvoices(studentId: UserId, page: PageQuery): Promise<RepositoryResult<Page<Invoice>>>
createEntitlement(input: CreateEntitlementInput): Promise<RepositoryResult<ContentEntitlement>>
getActiveEntitlement(input: EntitlementQuery): Promise<RepositoryResult<ContentEntitlement | null>>
listStudentEntitlements(studentId: UserId, page: PageQuery): Promise<RepositoryResult<Page<ContentEntitlement>>>
createCoupon(input: CreateCouponInput): Promise<RepositoryResult<Coupon>>
updateCoupon(id: CouponId, input: UpdateCouponInput): Promise<RepositoryResult<Coupon>>
deactivateCoupon(id: CouponId): Promise<RepositoryResult<void>>
validateCoupon(input: ValidateCouponInput): Promise<RepositoryResult<CouponValidation>>
```

Payment verification, invoice creation, wallet updates, and entitlement activation are one idempotent trusted workflow. The repository never stores card data.

## Referral and Communication Repositories

### `IReferralRepository`

```text
getReferralProfile(studentId: UserId): Promise<RepositoryResult<ReferralProfile>>
createReferralProfile(studentId: UserId): Promise<RepositoryResult<ReferralProfile>>
getReferralByReferredStudent(studentId: UserId): Promise<RepositoryResult<Referral | null>>
listReferrals(referrerId: UserId, filter: ReferralFilter, page: PageQuery): Promise<RepositoryResult<Page<Referral>>>
registerReferral(input: RegisterReferralInput): Promise<RepositoryResult<Referral>>
approveReferral(input: ApproveReferralInput): Promise<RepositoryResult<Referral>>
rejectReferral(input: RejectReferralInput): Promise<RepositoryResult<Referral>>
getActivePolicy(): Promise<RepositoryResult<ReferralPolicy | null>>
updatePolicy(id: ReferralPolicyId, input: UpdateReferralPolicyInput): Promise<RepositoryResult<ReferralPolicy>>
```

Approval and reward are a transaction with idempotent ledger creation. Students cannot write referral status or reward fields.

### `INotificationRepository`

```text
getPreferences(userId: UserId): Promise<RepositoryResult<NotificationPreference>>
updatePreferences(userId: UserId, input: UpdateNotificationPreferencesInput): Promise<RepositoryResult<NotificationPreference>>
registerDevice(input: RegisterDeviceInput): Promise<RepositoryResult<DeviceToken>>
deactivateDevice(userId: UserId, tokenId: DeviceTokenId): Promise<RepositoryResult<void>>
listNotifications(userId: UserId, filter: NotificationFilter, page: PageQuery): Promise<RepositoryResult<Page<Notification>>>
markNotificationRead(userId: UserId, notificationId: NotificationId): Promise<RepositoryResult<Notification>>
createTemplate(input: CreateNotificationTemplateInput): Promise<RepositoryResult<NotificationTemplate>>
createCampaign(input: CreateNotificationCampaignInput): Promise<RepositoryResult<NotificationCampaign>>
scheduleCampaign(id: NotificationCampaignId): Promise<RepositoryResult<NotificationCampaign>>
cancelCampaign(id: NotificationCampaignId): Promise<RepositoryResult<NotificationCampaign>>
createDelivery(input: CreateNotificationDeliveryInput): Promise<RepositoryResult<NotificationDelivery>>
updateDeliveryStatus(id: NotificationDeliveryId, input: DeliveryStatusInput): Promise<RepositoryResult<NotificationDelivery>>
```

Target selection, channel preference, quiet hours, retry count, and critical-notification policy are service responsibilities. Delivery history is append-oriented and not user-editable.

## AI Repository

### `IAIRepository`

```text
createConversation(input: CreateConversationInput): Promise<RepositoryResult<Conversation>>
getConversation(userId: UserId, conversationId: ConversationId): Promise<RepositoryResult<Conversation>>
listConversations(userId: UserId, page: PageQuery): Promise<RepositoryResult<Page<Conversation>>>
appendMessage(input: AppendConversationMessageInput): Promise<RepositoryResult<ConversationMessage>>
listMessages(userId: UserId, conversationId: ConversationId, page: PageQuery): Promise<RepositoryResult<Page<ConversationMessage>>>
createAIAssessment(input: CreateAIAssessmentInput): Promise<RepositoryResult<AIAssessment>>
getAIAssessment(studentId: UserId, activityProgressId: ActivityProgressId): Promise<RepositoryResult<AIAssessment | null>>
createRecommendation(input: CreateRecommendationInput): Promise<RepositoryResult<AIRecommendation>>
listRecommendations(studentId: UserId, page: PageQuery): Promise<RepositoryResult<Page<AIRecommendation>>>
recordUsageEvent(input: RecordAIUsageEventInput): Promise<RepositoryResult<AIUsageEvent>>
getApprovedKnowledgeDocument(source: KnowledgeSource): Promise<RepositoryResult<KnowledgeDocument | null>>
```

The service must execute authentication -> context -> memory -> RAG -> prompt -> provider -> response validation -> logging. The repository never stores provider keys, internal prompts, raw unapproved context, or vectors.

## Reporting and Analytics Repository

### `IReportingRepository`

```text
createReport(input: CreateReportInput): Promise<RepositoryResult<Report>>
getReport(ownerId: UserId, reportId: ReportId): Promise<RepositoryResult<Report>>
listReports(ownerId: UserId, filter: ReportFilter, page: PageQuery): Promise<RepositoryResult<Page<Report>>>
createExport(input: CreateReportExportInput): Promise<RepositoryResult<ReportExport>>
getExport(requestedBy: UserId, exportId: ReportExportId): Promise<RepositoryResult<ReportExport>>
createSchedule(input: CreateScheduledReportInput): Promise<RepositoryResult<ScheduledReport>>
listSchedules(ownerId: UserId, page: PageQuery): Promise<RepositoryResult<Page<ScheduledReport>>>
writeDailyMetric(input: WriteDailyMetricInput): Promise<RepositoryResult<AnalyticsDailyMetric>>
queryDailyMetrics(input: AnalyticsMetricQuery, page: PageQuery): Promise<RepositoryResult<Page<AnalyticsDailyMetric>>>
appendAnalyticsEvent(input: AppendAnalyticsEventInput): Promise<RepositoryResult<void>>
```

Reports are read models. The repository does not calculate a report by scanning unbounded Firestore collections; it consumes bounded source queries or precomputed summaries.

## Support and Administration Repositories

### `ISupportRepository`

```text
createTicket(input: CreateSupportTicketInput): Promise<RepositoryResult<SupportTicket>>
getTicketForActor(ticketId: SupportTicketId, actorId: UserId): Promise<RepositoryResult<SupportTicket>>
listTickets(filter: SupportTicketFilter, page: PageQuery): Promise<RepositoryResult<Page<SupportTicket>>>
assignTicket(ticketId: SupportTicketId, agentId: UserId): Promise<RepositoryResult<SupportTicket>>
transitionTicket(ticketId: SupportTicketId, status: SupportStatus): Promise<RepositoryResult<SupportTicket>>
appendMessage(input: AppendSupportMessageInput): Promise<RepositoryResult<SupportMessage>>
listMessages(ticketId: SupportTicketId, actorId: UserId, page: PageQuery): Promise<RepositoryResult<Page<SupportMessage>>>
```

The repository enforces parent-ticket access but the use case enforces support role and assignment. Internal notes are never returned to students.

### `IAdministrationRepository`

```text
getSetting(key: string): Promise<RepositoryResult<SystemSetting | null>>
setSetting(input: SetSystemSettingInput): Promise<RepositoryResult<SystemSetting>>
getFeatureFlag(key: string, environment: string): Promise<RepositoryResult<FeatureFlag | null>>
setFeatureFlag(input: SetFeatureFlagInput): Promise<RepositoryResult<FeatureFlag>>
appendAuditLog(input: AppendAuditLogInput): Promise<RepositoryResult<AuditLog>>
listAuditLogs(filter: AuditLogFilter, page: PageQuery): Promise<RepositoryResult<Page<AuditLog>>>
```

Settings and flags require administrator authorization in the use case. Audit logs have an append-only repository method and no update/delete method.

## Error Handling and Observability

Repositories map Firestore failures to the stable error codes above. They must not expose Firestore paths, stack traces, SQL errors, gateway responses, or environment variables. Every operation records structured telemetry outside the document payload containing request ID, domain, operation, duration, status, and actor ID where policy permits. Sensitive values are excluded.

## Repository Acceptance Criteria

- Every method has an explicit input and return type.
- No repository method accepts `any`, arbitrary maps, or raw Firestore snapshots.
- Every query maps to an approved index in `INDEXES.md`.
- Every write has a documented ownership and transaction boundary.
- Immutable collections expose no update/delete contract.
- Server-only collections have no client repository contract.
- Contract tests cover not found, duplicate, conflict, forbidden, retryable transaction, and idempotent replay behavior.
