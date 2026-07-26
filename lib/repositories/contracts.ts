// lib/repositories/contracts.ts

import { RepositoryResult } from "../shared/types/repository.types";
import { Page, PageQuery } from "../shared/types/pagination.types";

export type IUserRole = "student" | "teacher" | "staff" | "secretary" | "support" | "administrator";

// Base entity interface
export interface IBaseEntity {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

// Identity and Access
export interface IUser {
  readonly id: string;
  readonly role: IUserRole;
  readonly fullName: string;
  readonly mobileNumber: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateUserInput {
  readonly id: string;
  readonly role: IUserRole;
  readonly fullName: string;
  readonly mobileNumber: string;
  readonly isActive?: boolean;
}

export interface UpdateProfileInput {
  readonly fullName?: string;
  readonly mobileNumber?: string;
}

export interface AcademicAssignmentInput {
  readonly gradeId?: string;
  readonly academicYearId?: string;
}

export interface AppendLoginEventInput {
  readonly eventType: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface LoginEvent {
  readonly id: string;
  readonly userId: string;
  readonly eventType: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly createdAt: string;
}

export interface UserFilter {
  readonly role?: IUserRole[];
  readonly isActive?: boolean;
  readonly gradeId?: string;
}

export interface UserSummary {
  readonly id: string;
  readonly role: IUserRole;
  readonly fullName: string;
  readonly mobileNumber: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface AccountStatus {
  readonly status: "active" | "inactive" | "suspended" | "pending";
  readonly reason?: string;
}

export interface Role {
  readonly role: IUserRole;
  readonly grantedAt: string;
}

export interface IUserRepository {
  createUser(input: CreateUserInput): Promise<RepositoryResult<IUser>>;
  getUserById(userId: string): Promise<RepositoryResult<IUser>>;
  findUserByMobile(mobileNumber: string): Promise<RepositoryResult<IUser | null>>;
  findUserByEmail(email: string): Promise<RepositoryResult<IUser | null>>;
  listUsers(filter: UserFilter, page: PageQuery): Promise<RepositoryResult<Page<UserSummary>>>;
  updateProfile(
    userId: string,
    input: UpdateProfileInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IUser>>;
  updateAcademicAssignment(
    userId: string,
    input: AcademicAssignmentInput,
  ): Promise<RepositoryResult<IUser>>;
  changeAccountStatus(
    userId: string,
    status: AccountStatus,
    requestId: string,
  ): Promise<RepositoryResult<void>>;
  changeRole(userId: string, role: Role, requestId: string): Promise<RepositoryResult<IUser>>;
  softDeleteUser(userId: string, requestId: string): Promise<RepositoryResult<void>>;
  restoreUser(userId: string, requestId: string): Promise<RepositoryResult<void>>;
  appendLoginEvent(input: AppendLoginEventInput): Promise<RepositoryResult<LoginEvent>>;
  listLoginEvents(userId: string, page: PageQuery): Promise<RepositoryResult<Page<LoginEvent>>>;
}

export interface TeacherAssignment {
  readonly id: string;
  readonly teacherId: string;
  readonly gradeId: string;
  readonly academicYearId: string;
  readonly status: "active" | "inactive";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateTeacherAssignmentInput {
  readonly id: string;
  readonly teacherId: string;
  readonly gradeId: string;
  readonly academicYearId: string;
}

export interface ITutorRepository {
  createAssignment(
    input: CreateTeacherAssignmentInput,
  ): Promise<RepositoryResult<TeacherAssignment>>;
  getAssignmentById(assignmentId: string): Promise<RepositoryResult<TeacherAssignment>>;
  listTeacherAssignments(
    teacherId: string,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<TeacherAssignment>>>;
  listGradeTeachers(
    gradeId: string,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<TeacherAssignment>>>;
  hasGradeScope(teacherId: string, gradeId: string): Promise<RepositoryResult<boolean>>;
  deactivateAssignment(assignmentId: string, requestId: string): Promise<RepositoryResult<void>>;
}

// Common types for inputs
export interface BaseFilter {
  readonly [key: string]: unknown;
}

export interface BasePageQuery {
  readonly limit: number;
  readonly cursor?: string;
}

// ===== Curriculum Contracts =====

export interface IEducationalSystem {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description?: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface IStage {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface IGrade {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly stageId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface IAcademicYear {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isCurrent: boolean;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface IAcademicTerm {
  readonly id: string;
  readonly academicYearId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly isCurrent: boolean;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface IEducationalSystemSummary {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface IStageSummary {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface IGradeSummary {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly stageId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface IAcademicYearSummary {
  readonly id: string;
  readonly name: string;
  readonly isCurrent: boolean;
  readonly startDate: string;
  readonly endDate: string;
  readonly createdAt: string;
}

export interface IAcademicTermSummary {
  readonly id: string;
  readonly academicYearId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isCurrent: boolean;
  readonly createdAt: string;
}

export interface ICurrentAcademicContext {
  readonly educationalSystem: IEducationalSystem | null;
  readonly stage: IStage | null;
  readonly grade: IGrade | null;
  readonly academicYear: IAcademicYear | null;
  readonly academicTerm: IAcademicTerm | null;
}

export interface CreateAcademicYearInput {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isCurrent?: boolean;
  readonly isActive?: boolean;
}

export interface UpdateAcademicYearInput {
  readonly name?: string;
  readonly nameAr?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly isCurrent?: boolean;
  readonly isActive?: boolean;
}

export interface CreateAcademicTermInput {
  readonly id: string;
  readonly academicYearId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly isCurrent?: boolean;
  readonly isActive?: boolean;
}

export interface UpdateAcademicTermInput {
  readonly name?: string;
  readonly nameAr?: string;
  readonly order?: number;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly isCurrent?: boolean;
  readonly isActive?: boolean;
}

export interface CurriculumFilter {
  readonly educationalSystemId?: string;
  readonly stageId?: string;
  readonly gradeId?: string;
  readonly academicYearId?: string;
  readonly isActive?: boolean;
  readonly isCurrent?: boolean;
  readonly search?: string;
}

export type CurriculumCollection =
  | "academicYears"
  | "academicTerms";

export interface ICurriculumRepository {
  getEducationalSystemById(id: string): Promise<RepositoryResult<IEducationalSystem>>;
  listEducationalSystems(
    filter: CurriculumFilter,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<IEducationalSystemSummary>>>;

  getStageById(id: string): Promise<RepositoryResult<IStage>>;
  listStages(
    filter: CurriculumFilter,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<IStageSummary>>>;
  getStagesBySystem(systemId: string): Promise<RepositoryResult<IStage[]>>;

  getGradeById(id: string): Promise<RepositoryResult<IGrade>>;
  listGrades(
    filter: CurriculumFilter,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<IGradeSummary>>>;
  getGradesByStage(stageId: string): Promise<RepositoryResult<IGrade[]>>;

  createAcademicYear(input: CreateAcademicYearInput): Promise<RepositoryResult<IAcademicYear>>;
  updateAcademicYear(
    id: string,
    input: UpdateAcademicYearInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IAcademicYear>>;
  getAcademicYearById(id: string): Promise<RepositoryResult<IAcademicYear>>;
  listAcademicYears(
    filter: CurriculumFilter,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<IAcademicYearSummary>>>;

  createAcademicTerm(input: CreateAcademicTermInput): Promise<RepositoryResult<IAcademicTerm>>;
  updateAcademicTerm(
    id: string,
    input: UpdateAcademicTermInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IAcademicTerm>>;
  getAcademicTermById(id: string): Promise<RepositoryResult<IAcademicTerm>>;
  listAcademicTerms(
    filter: CurriculumFilter,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<IAcademicTermSummary>>>;
  getTermsByAcademicYear(academicYearId: string): Promise<RepositoryResult<IAcademicTerm[]>>;

  getCurrentAcademicYear(): Promise<RepositoryResult<IAcademicYear | null>>;
  getCurrentAcademicTerm(academicYearId: string): Promise<RepositoryResult<IAcademicTerm | null>>;
  getCurrentAcademicContext(userId?: string): Promise<RepositoryResult<ICurrentAcademicContext>>;

  softDeleteCurriculum(
    id: string,
    collection: CurriculumCollection,
    requestId: string,
  ): Promise<RepositoryResult<void>>;
  restoreCurriculum(
    id: string,
    collection: CurriculumCollection,
    requestId: string,
  ): Promise<RepositoryResult<void>>;
}

// ===== Unit Contracts =====

export interface IUnit {
  readonly id: string;
  readonly academicTermId: string;
  readonly gradeId?: string;
  readonly academicYearId?: string;
  readonly educationalSystemId?: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description?: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly isPremium: boolean;
  readonly priceCoins?: number;
  readonly published: boolean;
  readonly lockedOverride: boolean | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface IUnitSummary {
  readonly id: string;
  readonly academicTermId: string;
  readonly gradeId?: string;
  readonly academicYearId?: string;
  readonly educationalSystemId?: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly isPremium: boolean;
  readonly priceCoins?: number;
  readonly published: boolean;
  readonly lockedOverride: boolean | null;
  readonly createdAt: string;
}

export interface CreateUnitInput {
  readonly id: string;
  readonly academicTermId: string;
  readonly gradeId?: string;
  readonly academicYearId?: string;
  readonly educationalSystemId?: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description?: string;
  readonly order: number;
  readonly isActive?: boolean;
  readonly isPremium?: boolean;
  readonly priceCoins?: number;
  readonly published?: boolean;
  readonly lockedOverride?: boolean | null;
}

export interface UpdateUnitInput {
  readonly name?: string;
  readonly nameAr?: string;
  readonly description?: string;
  readonly order?: number;
  readonly isActive?: boolean;
  readonly isPremium?: boolean;
  readonly priceCoins?: number;
  readonly gradeId?: string;
  readonly academicYearId?: string;
  readonly educationalSystemId?: string;
  readonly published?: boolean;
  readonly lockedOverride?: boolean | null;
}

export interface UnitFilter {
  readonly academicTermId?: string;
  readonly gradeId?: string;
  readonly isActive?: boolean;
  readonly isPremium?: boolean;
  readonly published?: boolean;
  readonly search?: string;
}

export interface IUnitRepository {
  createUnit(input: CreateUnitInput): Promise<RepositoryResult<IUnit>>;
  updateUnit(
    id: string,
    input: UpdateUnitInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IUnit>>;
  getUnitById(id: string): Promise<RepositoryResult<IUnit>>;
  listUnits(filter: UnitFilter, page: PageQuery): Promise<RepositoryResult<Page<IUnitSummary>>>;
  getUnitsByTerm(academicTermId: string): Promise<RepositoryResult<IUnit[]>>;
  softDeleteUnit(id: string, requestId: string): Promise<RepositoryResult<void>>;
  restoreUnit(id: string, requestId: string): Promise<RepositoryResult<void>>;
}

// ===== Lesson Contracts =====

export type LessonStatus = "draft" | "published" | "archived";

export interface ILesson {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly displayOrder: number;
  readonly status: LessonStatus;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly isPremium: boolean;
  readonly lockedOverride: boolean | null;
  readonly homeworkEnabled: boolean;
  readonly quizEnabled: boolean;
  readonly estimatedDuration?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface ILessonSummary {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly displayOrder: number;
  readonly status: LessonStatus;
  readonly isPublished: boolean;
  readonly isVisible: boolean;
  readonly isPremium: boolean;
  readonly lockedOverride: boolean | null;
  readonly homeworkEnabled: boolean;
  readonly quizEnabled: boolean;
  readonly estimatedDuration?: number;
  readonly createdAt: string;
}

export interface CreateLessonInput {
  readonly id: string;
  readonly unitId: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly displayOrder: number;
  readonly status?: LessonStatus;
  readonly isPublished?: boolean;
  readonly isVisible?: boolean;
  readonly isPremium?: boolean;
  readonly lockedOverride?: boolean | null;
  readonly homeworkEnabled?: boolean;
  readonly quizEnabled?: boolean;
  readonly estimatedDuration?: number;
}

export interface UpdateLessonInput {
  readonly title?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly displayOrder?: number;
  readonly status?: LessonStatus;
  readonly isPublished?: boolean;
  readonly isVisible?: boolean;
  readonly isPremium?: boolean;
  readonly lockedOverride?: boolean | null;
  readonly homeworkEnabled?: boolean;
  readonly quizEnabled?: boolean;
  readonly estimatedDuration?: number;
}

export interface LessonFilter {
  readonly unitId?: string;
  readonly status?: LessonStatus;
  readonly isPublished?: boolean;
  readonly isVisible?: boolean;
  readonly search?: string;
}

export interface ILessonRepository {
  createLesson(input: CreateLessonInput): Promise<RepositoryResult<ILesson>>;
  updateLesson(
    id: string,
    input: UpdateLessonInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<ILesson>>;
  getLessonById(id: string): Promise<RepositoryResult<ILesson>>;
  listLessons(
    filter: LessonFilter,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<ILessonSummary>>>;
  getLessonsByUnit(unitId: string): Promise<RepositoryResult<ILesson[]>>;
  getPublishedLessons(unitId: string): Promise<RepositoryResult<ILesson[]>>;
  getPublishedLessonCounts(unitIds: string[]): Promise<RepositoryResult<Map<string, number>>>;
  getPublishedLessonsByUnitIds(unitIds: string[]): Promise<RepositoryResult<Map<string, ILesson[]>>>;
  searchLessons(
    searchTerm: string,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<ILessonSummary>>>;
  getPreviousLesson(
    unitId: string,
    currentDisplayOrder: number,
  ): Promise<RepositoryResult<ILesson | null>>;
  getNextLesson(
    unitId: string,
    currentDisplayOrder: number,
  ): Promise<RepositoryResult<ILesson | null>>;
  softDeleteLesson(id: string, requestId: string): Promise<RepositoryResult<void>>;
  restoreLesson(id: string, requestId: string): Promise<RepositoryResult<void>>;
  archiveLesson(id: string, requestId: string): Promise<RepositoryResult<void>>;
  publishLesson(id: string, requestId: string): Promise<RepositoryResult<ILesson>>;
  unpublishLesson(id: string, requestId: string): Promise<RepositoryResult<ILesson>>;
  changeOrder(
    id: string,
    newOrder: number,
    expectedVersion: number,
  ): Promise<RepositoryResult<ILesson>>;
}

// ===== Activity Contracts =====

export type IActivityStatus = "draft" | "published" | "archived";

export interface IActivity {
  readonly id: string;
  readonly lessonId: string;
  readonly type: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly instructions?: string;
  readonly displayOrder: number;
  readonly config: {
    readonly schemaVersion: number;
    readonly data: unknown;
  };
  readonly status: IActivityStatus;
  readonly isRequired: boolean;
  readonly isScorable: boolean;
  readonly isPractice: boolean;
  readonly timeLimit?: number;
  readonly maxAttempts?: number;
  readonly retryable: boolean;
  readonly prerequisiteActivityIds: string[];
  readonly metadata: {
    readonly estimatedDuration?: number;
    readonly skill?: string;
    readonly difficulty?: string;
    readonly tags: string[];
    readonly bloomLevel?: string;
    readonly aiGenerated: boolean;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface IActivitySummary {
  readonly id: string;
  readonly lessonId: string;
  readonly type: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly displayOrder: number;
  readonly status: IActivityStatus;
  readonly isRequired: boolean;
  readonly isScorable: boolean;
  readonly isPractice: boolean;
  readonly metadata: {
    readonly estimatedDuration?: number;
    readonly skill?: string;
    readonly difficulty?: string;
    readonly tags: string[];
    readonly aiGenerated: boolean;
  };
  readonly createdAt: string;
}

export interface CreateActivityInput {
  readonly id: string;
  readonly lessonId: string;
  readonly type: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly instructions?: string;
  readonly displayOrder: number;
  readonly config: {
    readonly schemaVersion: number;
    readonly data: unknown;
  };
  readonly status?: IActivityStatus;
  readonly isRequired?: boolean;
  readonly isScorable?: boolean;
  readonly isPractice?: boolean;
  readonly timeLimit?: number;
  readonly maxAttempts?: number;
  readonly retryable?: boolean;
  readonly prerequisiteActivityIds?: string[];
  readonly metadata?: {
    readonly estimatedDuration?: number;
    readonly skill?: string;
    readonly difficulty?: string;
    readonly tags?: string[];
    readonly bloomLevel?: string;
    readonly aiGenerated?: boolean;
  };
}

export interface UpdateActivityInput {
  readonly title?: string;
  readonly subtitle?: string;
  readonly instructions?: string;
  readonly displayOrder?: number;
  readonly config?: {
    readonly schemaVersion: number;
    readonly data: unknown;
  };
  readonly status?: IActivityStatus;
  readonly isRequired?: boolean;
  readonly isScorable?: boolean;
  readonly isPractice?: boolean;
  readonly timeLimit?: number;
  readonly maxAttempts?: number;
  readonly retryable?: boolean;
  readonly prerequisiteActivityIds?: string[];
  readonly metadata?: {
    readonly estimatedDuration?: number;
    readonly skill?: string;
    readonly difficulty?: string;
    readonly tags?: string[];
    readonly bloomLevel?: string;
    readonly aiGenerated?: boolean;
  };
}

export interface ActivityFilter {
  readonly lessonId?: string;
  readonly type?: string;
  readonly status?: IActivityStatus;
  readonly isRequired?: boolean;
  readonly isScorable?: boolean;
  readonly isPractice?: boolean;
  readonly search?: string;
}

export interface IActivityRepository {
  createActivity(input: CreateActivityInput): Promise<RepositoryResult<IActivity>>;
  updateActivity(
    id: string,
    input: UpdateActivityInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IActivity>>;
  getActivityById(id: string): Promise<RepositoryResult<IActivity>>;
  listActivities(
    filter: ActivityFilter,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<IActivitySummary>>>;
  getActivitiesByLesson(lessonId: string): Promise<RepositoryResult<IActivity[]>>;
  searchActivities(
    searchTerm: string,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<IActivitySummary>>>;
  softDeleteActivity(id: string, requestId: string): Promise<RepositoryResult<void>>;
  restoreActivity(id: string, requestId: string): Promise<RepositoryResult<void>>;
  publishActivity(id: string, requestId: string): Promise<RepositoryResult<IActivity>>;
  unpublishActivity(id: string, requestId: string): Promise<RepositoryResult<IActivity>>;
  changeActivityOrder(
    id: string,
    newOrder: number,
    expectedVersion: number,
  ): Promise<RepositoryResult<IActivity>>;
}

// ===== Student Attempt Contracts =====

export type IAttemptStatus = "in_progress" | "submitted" | "graded" | "expired";

export type IHomeworkAttemptStatus = "not_started" | "in_progress" | "submitted" | "graded";
export type IGradingMethod = "auto" | "manual" | "ai_assisted" | "practice";

export interface IStudentAttempt {
  readonly id: string;
  readonly activityId: string;
  readonly studentId: string;
  readonly lessonId: string;
  readonly unitId: string;
  readonly attemptNumber: number;
  readonly answer?: unknown;
  readonly score?: number;
  readonly maxScore: number;
  readonly percentage?: number;
  readonly passed?: boolean;
  readonly feedback?: string;
  readonly correctAnswer?: unknown;
  readonly startedAt: string;
  readonly submittedAt?: string;
  readonly timeLimit?: number;
  readonly timeSpent?: number;
  readonly status: IAttemptStatus;
  readonly gradingMethod: IGradingMethod;
  readonly state?: unknown;
  readonly activitySchemaVersion: number;
  readonly metadata: {
    readonly ipAddress?: string;
    readonly userAgent?: string;
    readonly deviceType?: string;
    readonly submittedFrom?: string;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IStudentAttemptSummary {
  readonly id: string;
  readonly activityId: string;
  readonly studentId: string;
  readonly attemptNumber: number;
  readonly score?: number;
  readonly maxScore: number;
  readonly percentage?: number;
  readonly passed?: boolean;
  readonly status: IAttemptStatus;
  readonly gradingMethod: IGradingMethod;
  readonly submittedAt?: string;
  readonly timeSpent?: number;
}

export interface CreateAttemptInput {
  readonly id: string;
  readonly activityId: string;
  readonly studentId: string;
  readonly lessonId: string;
  readonly unitId: string;
  readonly attemptNumber: number;
  readonly maxScore: number;
  readonly gradingMethod: IGradingMethod;
  readonly timeLimit?: number;
  readonly activitySchemaVersion: number;
  readonly state?: unknown;
}

export interface UpdateAttemptInput {
  readonly answer?: unknown;
  readonly score?: number;
  readonly percentage?: number;
  readonly passed?: boolean;
  readonly feedback?: string;
  readonly correctAnswer?: unknown;
  readonly submittedAt?: string;
  readonly timeSpent?: number;
  readonly status?: IAttemptStatus;
  readonly state?: unknown;
}

export interface AttemptFilter {
  readonly activityId?: string;
  readonly studentId?: string;
  readonly lessonId?: string;
  readonly unitId?: string;
  readonly status?: IAttemptStatus;
  readonly gradingMethod?: IGradingMethod;
}

export interface IStudentAttemptRepository {
  createAttempt(input: CreateAttemptInput): Promise<RepositoryResult<IStudentAttempt>>;
  updateAttempt(id: string, input: UpdateAttemptInput): Promise<RepositoryResult<IStudentAttempt>>;
  getAttemptById(id: string): Promise<RepositoryResult<IStudentAttempt>>;
  getStudentAttempt(
    activityId: string,
    studentId: string,
  ): Promise<RepositoryResult<IStudentAttempt | null>>;
  getLatestAttempt(
    activityId: string,
    studentId: string,
  ): Promise<RepositoryResult<IStudentAttempt | null>>;
  listAttempts(
    filter: AttemptFilter,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<IStudentAttemptSummary>>>;
  getAttemptsByActivity(activityId: string): Promise<RepositoryResult<IStudentAttempt[]>>;
  getAttemptsByStudent(
    studentId: string,
    page: PageQuery,
  ): Promise<RepositoryResult<Page<IStudentAttemptSummary>>>;
}

// ===== Lesson Progress Contracts =====

export type ILessonProgressStatus = "not_started" | "in_progress" | "completed";

export interface ILessonProgress {
  readonly id: string;
  readonly studentId: string;
  readonly lessonId: string;
  readonly unitId: string;
  readonly status: ILessonProgressStatus;
  readonly completedActivities: number;
  readonly totalActivities: number;
  readonly percentage: number;
  readonly score?: number;
  readonly maxScore?: number;
  readonly lastActivityId?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateLessonProgressInput {
  readonly id: string;
  readonly studentId: string;
  readonly lessonId: string;
  readonly unitId: string;
  readonly totalActivities: number;
}

export interface UpdateLessonProgressInput {
  readonly status?: ILessonProgressStatus;
  readonly completedActivities?: number;
  readonly totalActivities?: number;
  readonly score?: number;
  readonly maxScore?: number;
  readonly lastActivityId?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
}

export interface ILessonProgressRepository {
  createProgress(input: CreateLessonProgressInput): Promise<RepositoryResult<ILessonProgress>>;
  getProgress(id: string): Promise<RepositoryResult<ILessonProgress>>;
  getStudentLessonProgress(
    studentId: string,
    lessonId: string,
  ): Promise<RepositoryResult<ILessonProgress | null>>;
  updateProgress(
    id: string,
    input: UpdateLessonProgressInput,
  ): Promise<RepositoryResult<ILessonProgress>>;
  listStudentProgress(
    studentId: string,
    unitId?: string,
  ): Promise<RepositoryResult<ILessonProgress[]>>;
}

// ===== Vocabulary Section Contracts =====

export type VocabularySectionKind = "STANDARD_VOCABULARY" | "SYNONYM_ANTONYM";

export interface IVocabularySection {
  readonly id: string;
  readonly lessonId: string;
  readonly kind: VocabularySectionKind;
  readonly title: string | null;
  readonly displayOrder: number;
  readonly contentVersion: number;
  readonly sourceTableIndex: number | null;
  readonly sourceTitleRowIndex: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface CreateVocabularySectionInput {
  readonly id: string;
  readonly lessonId: string;
  readonly kind: VocabularySectionKind;
  readonly title: string | null;
  readonly displayOrder: number;
  readonly sourceTableIndex: number | null;
  readonly sourceTitleRowIndex: number | null;
}

export interface UpdateVocabularySectionInput {
  readonly kind?: VocabularySectionKind;
  readonly title?: string | null;
  readonly displayOrder?: number;
}

export interface VocabularySectionFilter {
  readonly lessonId?: string;
  readonly kind?: VocabularySectionKind;
}

export interface IVocabularySectionRepository {
  create(input: CreateVocabularySectionInput): Promise<RepositoryResult<IVocabularySection>>;
  getById(id: string): Promise<RepositoryResult<IVocabularySection | null>>;
  update(
    id: string,
    input: UpdateVocabularySectionInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IVocabularySection>>;
  listByLesson(lessonId: string): Promise<RepositoryResult<IVocabularySection[]>>;
  deleteByLesson(lessonId: string): Promise<RepositoryResult<void>>;
}

// ===== Vocabulary Item Contracts =====

export interface IVocabularyItem {
  readonly id: string;
  readonly lessonId: string;
  readonly sectionId: string | null;
  readonly word: string;
  readonly pronunciation: string;
  readonly translation: string;
  readonly definition: string | null;
  readonly example: string | null;
  readonly partOfSpeech: string | null;
  readonly audioPath: string | null;
  readonly imagePath: string | null;
  readonly displayOrder: number;
  readonly contentVersion: number;
  readonly sourceTableIndex: number | null;
  readonly sourceRowIndex: number | null;
  readonly sourcePairIndex: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface CreateVocabularyItemInput {
  readonly id: string;
  readonly lessonId: string;
  readonly sectionId: string | null;
  readonly word: string;
  readonly pronunciation: string;
  readonly translation: string;
  readonly definition?: string | null;
  readonly example?: string | null;
  readonly partOfSpeech?: string | null;
  readonly audioPath?: string | null;
  readonly imagePath?: string | null;
  readonly displayOrder: number;
  readonly sourceTableIndex?: number | null;
  readonly sourceRowIndex?: number | null;
  readonly sourcePairIndex?: number | null;
}

export interface UpdateVocabularyItemInput {
  readonly word?: string;
  readonly pronunciation?: string;
  readonly translation?: string;
  readonly definition?: string | null;
  readonly example?: string | null;
  readonly partOfSpeech?: string | null;
  readonly displayOrder?: number;
}

export interface VocabularyItemFilter {
  readonly lessonId?: string;
  readonly sectionId?: string;
}

export interface IVocabularyItemRepository {
  create(input: CreateVocabularyItemInput): Promise<RepositoryResult<IVocabularyItem>>;
  getById(id: string): Promise<RepositoryResult<IVocabularyItem | null>>;
  update(
    id: string,
    input: UpdateVocabularyItemInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IVocabularyItem>>;
  listByLesson(lessonId: string): Promise<RepositoryResult<IVocabularyItem[]>>;
  listBySection(sectionId: string): Promise<RepositoryResult<IVocabularyItem[]>>;
  deleteByLesson(lessonId: string): Promise<RepositoryResult<void>>;
  deleteBySection(sectionId: string): Promise<RepositoryResult<void>>;
}

// ===== Vocabulary Relation Contracts =====

export type VocabularyRelationType = "SYNONYM" | "ANTONYM";

export interface IVocabularyRelation {
  readonly id: string;
  readonly lessonId: string;
  readonly sectionId: string;
  readonly primaryItemId: string;
  readonly relationType: VocabularyRelationType;
  readonly relatedWord: string;
  readonly relatedTranslation: string | null;
  readonly displayOrder: number;
  readonly contentVersion: number;
  readonly sourceTableIndex: number | null;
  readonly sourceRowIndex: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface CreateVocabularyRelationInput {
  readonly id: string;
  readonly lessonId: string;
  readonly sectionId: string;
  readonly primaryItemId: string;
  readonly relationType: VocabularyRelationType;
  readonly relatedWord: string;
  readonly relatedTranslation?: string | null;
  readonly displayOrder: number;
  readonly sourceTableIndex?: number | null;
  readonly sourceRowIndex?: number | null;
}

export interface UpdateVocabularyRelationInput {
  readonly relationType?: VocabularyRelationType;
  readonly relatedWord?: string;
  readonly relatedTranslation?: string | null;
  readonly displayOrder?: number;
}

export interface VocabularyRelationFilter {
  readonly lessonId?: string;
  readonly sectionId?: string;
}

export interface IVocabularyRelationRepository {
  create(input: CreateVocabularyRelationInput): Promise<RepositoryResult<IVocabularyRelation>>;
  getById(id: string): Promise<RepositoryResult<IVocabularyRelation | null>>;
  update(
    id: string,
    input: UpdateVocabularyRelationInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IVocabularyRelation>>;
  listByLesson(lessonId: string): Promise<RepositoryResult<IVocabularyRelation[]>>;
  listBySection(sectionId: string): Promise<RepositoryResult<IVocabularyRelation[]>>;
  deleteByLesson(lessonId: string): Promise<RepositoryResult<void>>;
  deleteBySection(sectionId: string): Promise<RepositoryResult<void>>;
}

// ===== Lesson Video Contracts =====

export type VideoProvider = "youtube" | "vimeo" | "other";

export interface ILessonVideo {
  readonly id: string;
  readonly lessonId: string;
  readonly title: string;
  readonly provider: VideoProvider;
  readonly providerVideoId: string;
  readonly providerUrl: string;
  readonly durationSeconds: number;
  readonly thumbnailUrl?: string;
  readonly displayOrder: number;
  readonly enabled: boolean;
  readonly interactiveTimelineEnabled: boolean;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface CreateLessonVideoInput {
  readonly id: string;
  readonly lessonId: string;
  readonly title: string;
  readonly provider: VideoProvider;
  readonly providerVideoId: string;
  readonly providerUrl: string;
  readonly durationSeconds: number;
  readonly thumbnailUrl?: string;
  readonly displayOrder: number;
  readonly enabled?: boolean;
  readonly interactiveTimelineEnabled?: boolean;
}

export interface UpdateLessonVideoInput {
  readonly title?: string;
  readonly provider?: VideoProvider;
  readonly providerVideoId?: string;
  readonly providerUrl?: string;
  readonly durationSeconds?: number;
  readonly thumbnailUrl?: string;
  readonly displayOrder?: number;
  readonly enabled?: boolean;
  readonly interactiveTimelineEnabled?: boolean;
}

export interface LessonVideoFilter {
  readonly lessonId?: string;
  readonly enabled?: boolean;
}

export interface ILessonVideoRepository {
  create(input: CreateLessonVideoInput): Promise<RepositoryResult<ILessonVideo>>;
  getById(id: string): Promise<RepositoryResult<ILessonVideo | null>>;
  update(
    id: string,
    input: UpdateLessonVideoInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<ILessonVideo>>;
  listByLesson(lessonId: string): Promise<RepositoryResult<ILessonVideo[]>>;
  delete(id: string): Promise<RepositoryResult<void>>;
}

// ===== Lesson Document Contracts =====

export type DocumentProcessingStatus = "pending" | "processing" | "completed" | "failed";

export interface ILessonDocument {
  readonly id: string;
  readonly lessonId: string;
  readonly storagePath: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly fileSizeBytes: number;
  readonly sha256: string;
  readonly processingStatus: DocumentProcessingStatus;
  readonly downloadable: boolean;
  readonly extractedAt?: string;
  readonly errorCode?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface CreateLessonDocumentInput {
  readonly id: string;
  readonly lessonId: string;
  readonly storagePath: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly fileSizeBytes: number;
  readonly sha256: string;
  readonly processingStatus?: DocumentProcessingStatus;
  readonly downloadable?: boolean;
}

export interface UpdateLessonDocumentInput {
  readonly processingStatus?: DocumentProcessingStatus;
  readonly downloadable?: boolean;
  readonly extractedAt?: string;
  readonly errorCode?: string;
}

export interface ILessonDocumentRepository {
  create(input: CreateLessonDocumentInput): Promise<RepositoryResult<ILessonDocument>>;
  getByLessonId(lessonId: string): Promise<RepositoryResult<ILessonDocument | null>>;
  update(
    lessonId: string,
    input: UpdateLessonDocumentInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<ILessonDocument>>;
  delete(lessonId: string): Promise<RepositoryResult<void>>;
}

// ===== Homework Contracts =====

export interface IHomework {
  readonly id: string;
  readonly lessonId: string;
  readonly title: string;
  readonly instructions?: string;
  readonly passingScore: number;
  readonly maxAttempts: number;
  readonly unlimitedAttempts: boolean;
  readonly published: boolean;
  readonly allowRetry: boolean;
  readonly showAnswers: boolean;
  readonly xpReward: number;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface CreateHomeworkInput {
  readonly id: string;
  readonly lessonId: string;
  readonly title: string;
  readonly instructions?: string;
  readonly passingScore?: number;
  readonly maxAttempts?: number;
  readonly unlimitedAttempts?: boolean;
  readonly published?: boolean;
  readonly allowRetry?: boolean;
  readonly showAnswers?: boolean;
  readonly xpReward?: number;
}

export interface UpdateHomeworkInput {
  readonly title?: string;
  readonly instructions?: string;
  readonly passingScore?: number;
  readonly maxAttempts?: number;
  readonly unlimitedAttempts?: boolean;
  readonly published?: boolean;
  readonly allowRetry?: boolean;
  readonly showAnswers?: boolean;
  readonly xpReward?: number;
}

export interface IHomeworkRepository {
  create(input: CreateHomeworkInput): Promise<RepositoryResult<IHomework>>;
  getById(id: string): Promise<RepositoryResult<IHomework | null>>;
  getByLessonId(lessonId: string): Promise<RepositoryResult<IHomework | null>>;
  update(
    id: string,
    input: UpdateHomeworkInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IHomework>>;
  delete(id: string): Promise<RepositoryResult<void>>;
  listByLessonIds(lessonIds: string[]): Promise<RepositoryResult<IHomework[]>>;
}

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "MATCHING";

export interface IHomeworkQuestion {
  readonly id: string;
  readonly homeworkId: string;
  readonly questionType: QuestionType;
  readonly prompt: string;
  readonly instructions?: string;
  readonly explanation?: string;
  readonly options: Record<string, string> | null;
  readonly points: number;
  readonly displayOrder: number;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
}

export interface CreateHomeworkQuestionInput {
  readonly id: string;
  readonly homeworkId: string;
  readonly questionType: QuestionType;
  readonly prompt: string;
  readonly instructions?: string;
  readonly explanation?: string;
  readonly options?: Record<string, string> | null;
  readonly points?: number;
  readonly displayOrder: number;
}

export interface IHomeworkQuestionRepository {
  create(input: CreateHomeworkQuestionInput): Promise<RepositoryResult<IHomeworkQuestion>>;
  listByHomework(homeworkId: string): Promise<RepositoryResult<IHomeworkQuestion[]>>;
  getById(id: string): Promise<RepositoryResult<IHomeworkQuestion | null>>;
  deleteByHomework(homeworkId: string): Promise<RepositoryResult<void>>;
}

export interface IHomeworkAttempt {
  readonly id: string;
  readonly studentId: string;
  readonly homeworkId: string;
  readonly attemptNumber: number;
  readonly status: IHomeworkAttemptStatus;
  readonly score?: number;
  readonly passed?: boolean;
  readonly startedAt: string;
  readonly submittedAt?: string;
  readonly gradedAt?: string;
  readonly timeSpentSeconds?: number;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateHomeworkAttemptInput {
  readonly id: string;
  readonly studentId: string;
  readonly homeworkId: string;
  readonly attemptNumber: number;
}

export interface UpdateHomeworkAttemptInput {
  readonly status?: IHomeworkAttemptStatus;
  readonly score?: number;
  readonly passed?: boolean;
  readonly submittedAt?: string;
  readonly gradedAt?: string;
  readonly timeSpentSeconds?: number;
}

export interface IHomeworkAttemptRepository {
  create(input: CreateHomeworkAttemptInput): Promise<RepositoryResult<IHomeworkAttempt>>;
  getById(id: string): Promise<RepositoryResult<IHomeworkAttempt | null>>;
  getActive(
    studentId: string,
    homeworkId: string,
  ): Promise<RepositoryResult<IHomeworkAttempt | null>>;
  update(
    id: string,
    input: UpdateHomeworkAttemptInput,
  ): Promise<RepositoryResult<IHomeworkAttempt>>;
  listByStudentAndHomework(
    studentId: string,
    homeworkId: string,
  ): Promise<RepositoryResult<IHomeworkAttempt[]>>;
  countByStudentAndHomework(
    studentId: string,
    homeworkId: string,
  ): Promise<RepositoryResult<number>>;
}

export interface IHomeworkAnswer {
  readonly id: string;
  readonly attemptId: string;
  readonly studentId: string;
  readonly homeworkId: string;
  readonly questionId: string;
  readonly answer: Record<string, unknown>;
  readonly isCorrect?: boolean;
  readonly score?: number;
  readonly feedback?: string;
  readonly submittedAt: string;
  readonly createdAt: string;
}

export interface CreateHomeworkAnswerInput {
  readonly id: string;
  readonly attemptId: string;
  readonly studentId: string;
  readonly homeworkId: string;
  readonly questionId: string;
  readonly answer: Record<string, unknown>;
  readonly isCorrect?: boolean;
  readonly score?: number;
  readonly feedback?: string;
}

export interface IHomeworkAnswerRepository {
  create(input: CreateHomeworkAnswerInput): Promise<RepositoryResult<IHomeworkAnswer>>;
  listByAttempt(attemptId: string): Promise<RepositoryResult<IHomeworkAnswer[]>>;
  deleteByAttempt(attemptId: string): Promise<RepositoryResult<void>>;
}

// ===== Video Progress Contracts =====

export interface IVideoProgress {
  readonly id: string;
  readonly userId: string;
  readonly videoId: string;
  readonly lessonId: string;
  readonly lastPositionSeconds: number;
  readonly watchedSeconds: number;
  readonly watchPercent: number;
  readonly completed: boolean;
  readonly completedAt?: string;
  readonly lastActiveAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateVideoProgressInput {
  readonly id: string;
  readonly userId: string;
  readonly videoId: string;
  readonly lessonId: string;
  readonly lastPositionSeconds?: number;
  readonly watchedSeconds?: number;
}

export interface UpdateVideoProgressInput {
  readonly lastPositionSeconds?: number;
  readonly watchedSeconds?: number;
  readonly completed?: boolean;
  readonly completedAt?: string;
}

export interface IVideoProgressRepository {
  getByUserAndVideo(
    userId: string,
    videoId: string,
  ): Promise<RepositoryResult<IVideoProgress | null>>;
  upsert(
    id: string,
    input: CreateVideoProgressInput | UpdateVideoProgressInput,
  ): Promise<RepositoryResult<IVideoProgress>>;
  listByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<RepositoryResult<IVideoProgress[]>>;
}

// ===== Timeline Event Contracts =====

export type TimelineEventType = "ACTIVITY" | "QUESTION" | "NOTE" | "QUIZ";

export interface ITimelineEvent {
  readonly id: string;
  readonly videoId: string;
  readonly lessonId: string;
  readonly activityId: string;
  readonly timestampSeconds: number;
  readonly eventType: TimelineEventType;
  readonly required: boolean;
  readonly enabled: boolean;
  readonly displayOrder: number;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface CreateTimelineEventInput {
  readonly id: string;
  readonly videoId: string;
  readonly lessonId: string;
  readonly activityId: string;
  readonly timestampSeconds: number;
  readonly eventType: TimelineEventType;
  readonly required?: boolean;
  readonly enabled?: boolean;
  readonly displayOrder: number;
}

export interface UpdateTimelineEventInput {
  readonly timestampSeconds?: number;
  readonly eventType?: TimelineEventType;
  readonly required?: boolean;
  readonly enabled?: boolean;
  readonly displayOrder?: number;
}

export interface ITimelineEventRepository {
  create(input: CreateTimelineEventInput): Promise<RepositoryResult<ITimelineEvent>>;
  getById(id: string): Promise<RepositoryResult<ITimelineEvent | null>>;
  update(
    id: string,
    input: UpdateTimelineEventInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<ITimelineEvent>>;
  listByVideo(videoId: string): Promise<RepositoryResult<ITimelineEvent[]>>;
  delete(id: string): Promise<RepositoryResult<void>>;
}

// ===== Timeline Event Progress Contracts =====

export interface ITimelineEventProgress {
  readonly id: string;
  readonly userId: string;
  readonly videoId: string;
  readonly lessonId: string;
  readonly timelineEventId: string;
  readonly activityId: string;
  readonly completed: boolean;
  readonly skipped: boolean;
  readonly completedAt?: string;
  readonly attemptCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateTimelineEventProgressInput {
  readonly id: string;
  readonly userId: string;
  readonly videoId: string;
  readonly lessonId: string;
  readonly timelineEventId: string;
  readonly activityId: string;
}

export interface ITimelineEventProgressRepository {
  getByUserAndEvent(
    userId: string,
    timelineEventId: string,
  ): Promise<RepositoryResult<ITimelineEventProgress | null>>;
  upsert(
    input: CreateTimelineEventProgressInput,
  ): Promise<RepositoryResult<ITimelineEventProgress>>;
  markCompleted(id: string): Promise<RepositoryResult<ITimelineEventProgress>>;
  listByUserAndVideo(
    userId: string,
    videoId: string,
  ): Promise<RepositoryResult<ITimelineEventProgress[]>>;
}

// ===== Quiz Contracts =====

export interface IQuiz {
  readonly id: string;
  readonly lessonId: string;
  readonly title: string;
  readonly instructions?: string;
  readonly passingScore: number;
  readonly maxAttempts: number;
  readonly unlimitedAttempts: boolean;
  readonly published: boolean;
  readonly allowRetry: boolean;
  readonly showAnswers: boolean;
  readonly xpReward: number;
  readonly requiredForCompletion: boolean;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface CreateQuizInput {
  readonly id: string;
  readonly lessonId: string;
  readonly title: string;
  readonly instructions?: string;
  readonly passingScore?: number;
  readonly maxAttempts?: number;
  readonly unlimitedAttempts?: boolean;
  readonly published?: boolean;
  readonly allowRetry?: boolean;
  readonly showAnswers?: boolean;
  readonly xpReward?: number;
  readonly requiredForCompletion?: boolean;
}

export interface UpdateQuizInput {
  readonly title?: string;
  readonly instructions?: string;
  readonly passingScore?: number;
  readonly maxAttempts?: number;
  readonly unlimitedAttempts?: boolean;
  readonly published?: boolean;
  readonly allowRetry?: boolean;
  readonly showAnswers?: boolean;
  readonly xpReward?: number;
  readonly requiredForCompletion?: boolean;
}

export interface IQuizRepository {
  create(input: CreateQuizInput): Promise<RepositoryResult<IQuiz>>;
  getById(id: string): Promise<RepositoryResult<IQuiz | null>>;
  getByLessonId(lessonId: string): Promise<RepositoryResult<IQuiz | null>>;
  update(
    id: string,
    input: UpdateQuizInput,
    expectedVersion: number,
  ): Promise<RepositoryResult<IQuiz>>;
  delete(id: string): Promise<RepositoryResult<void>>;
}

export interface IQuizQuestion {
  readonly id: string;
  readonly quizId: string;
  readonly questionType: QuestionType;
  readonly prompt: string;
  readonly instructions?: string;
  readonly explanation?: string;
  readonly options: Record<string, string> | null;
  readonly points: number;
  readonly displayOrder: number;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
}

export interface CreateQuizQuestionInput {
  readonly id: string;
  readonly quizId: string;
  readonly questionType: QuestionType;
  readonly prompt: string;
  readonly instructions?: string;
  readonly explanation?: string;
  readonly options?: Record<string, string> | null;
  readonly points?: number;
  readonly displayOrder: number;
}

export interface IQuizQuestionRepository {
  create(input: CreateQuizQuestionInput): Promise<RepositoryResult<IQuizQuestion>>;
  listByQuiz(quizId: string): Promise<RepositoryResult<IQuizQuestion[]>>;
  getById(id: string): Promise<RepositoryResult<IQuizQuestion | null>>;
  deleteByQuiz(quizId: string): Promise<RepositoryResult<void>>;
}

export interface IQuizAttempt {
  readonly id: string;
  readonly studentId: string;
  readonly quizId: string;
  readonly attemptNumber: number;
  readonly status: IHomeworkAttemptStatus;
  readonly score?: number;
  readonly passed?: boolean;
  readonly startedAt: string;
  readonly submittedAt?: string;
  readonly gradedAt?: string;
  readonly timeSpentSeconds?: number;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateQuizAttemptInput {
  readonly id: string;
  readonly studentId: string;
  readonly quizId: string;
  readonly attemptNumber: number;
}

export interface UpdateQuizAttemptInput {
  readonly status?: IHomeworkAttemptStatus;
  readonly score?: number;
  readonly passed?: boolean;
  readonly submittedAt?: string;
  readonly gradedAt?: string;
  readonly timeSpentSeconds?: number;
}

export interface IQuizAttemptRepository {
  create(input: CreateQuizAttemptInput): Promise<RepositoryResult<IQuizAttempt>>;
  getById(id: string): Promise<RepositoryResult<IQuizAttempt | null>>;
  getActive(studentId: string, quizId: string): Promise<RepositoryResult<IQuizAttempt | null>>;
  update(id: string, input: UpdateQuizAttemptInput): Promise<RepositoryResult<IQuizAttempt>>;
  listByStudentAndQuiz(
    studentId: string,
    quizId: string,
  ): Promise<RepositoryResult<IQuizAttempt[]>>;
  countByStudentAndQuiz(studentId: string, quizId: string): Promise<RepositoryResult<number>>;
}

export interface IQuizAnswer {
  readonly id: string;
  readonly attemptId: string;
  readonly studentId: string;
  readonly quizId: string;
  readonly questionId: string;
  readonly answer: Record<string, unknown>;
  readonly isCorrect?: boolean;
  readonly score?: number;
  readonly feedback?: string;
  readonly submittedAt: string;
  readonly createdAt: string;
}

export interface CreateQuizAnswerInput {
  readonly id: string;
  readonly attemptId: string;
  readonly studentId: string;
  readonly quizId: string;
  readonly questionId: string;
  readonly answer: Record<string, unknown>;
  readonly isCorrect?: boolean;
  readonly score?: number;
  readonly feedback?: string;
}

export interface IQuizAnswerRepository {
  create(input: CreateQuizAnswerInput): Promise<RepositoryResult<IQuizAnswer>>;
  listByAttempt(attemptId: string): Promise<RepositoryResult<IQuizAnswer[]>>;
  deleteByAttempt(attemptId: string): Promise<RepositoryResult<void>>;
}

// ===== XP Contracts =====

export interface IXpAccount {
  readonly id: string;
  readonly studentId: string;
  readonly totalXp: number;
  readonly level: number;
  readonly updatedAt: string;
  readonly projectionVersion: number;
}

export interface IXpTransaction {
  readonly id: string;
  readonly studentId: string;
  readonly amount: number;
  readonly sourceType: string;
  readonly sourceId?: string;
  readonly reason: string;
  readonly occurredAt: string;
  readonly idempotencyKey: string;
  readonly reversalOf?: string;
}

export interface IXpLevel {
  readonly id: string;
  readonly level: number;
  readonly minimumXp: number;
  readonly title: string;
  readonly active: boolean;
}

export interface IXpAccountRepository {
  getByStudentId(studentId: string): Promise<RepositoryResult<IXpAccount | null>>;
  upsert(studentId: string, totalXp: number, level: number): Promise<RepositoryResult<IXpAccount>>;
  getLeaderboard(limit: number): Promise<RepositoryResult<IXpAccount[]>>;
}

export interface IXpTransactionRepository {
  create(input: IXpTransaction): Promise<RepositoryResult<IXpTransaction>>;
  listByStudent(studentId: string, limit?: number): Promise<RepositoryResult<IXpTransaction[]>>;
}

// ===== Achievement Contracts =====

export interface IAchievement {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly iconPath?: string;
  readonly criteria: Record<string, unknown>;
  readonly active: boolean;
  readonly createdAt: string;
}

export interface IUserAchievement {
  readonly id: string;
  readonly studentId: string;
  readonly achievementId: string;
  readonly earnedAt: string;
  readonly sourceEventId?: string;
}

export interface IAchievementRepository {
  listActive(): Promise<RepositoryResult<IAchievement[]>>;
  getByCode(code: string): Promise<RepositoryResult<IAchievement | null>>;
}

export interface IUserAchievementRepository {
  listByStudent(studentId: string): Promise<RepositoryResult<IUserAchievement[]>>;
  award(input: IUserAchievement): Promise<RepositoryResult<IUserAchievement>>;
}

// ===== Student Stats Contracts =====

export interface IStudentStats {
  readonly id: string;
  readonly studentId: string;
  readonly completedLessons: number;
  readonly completedUnits: number;
  readonly averageQuizScore: number;
  readonly homeworkCompletionRate: number;
  readonly currentXp: number;
  readonly currentCoins: number;
  readonly streakDays: number;
  readonly lastActiveAt: string;
  readonly projectionVersion: number;
}

export interface IStudentStatsRepository {
  getByStudentId(studentId: string): Promise<RepositoryResult<IStudentStats | null>>;
  computeAndSave(studentId: string): Promise<RepositoryResult<IStudentStats>>;
}

// ===== Wallet / Coin Contracts =====

export interface IWallet {
  readonly id: string;
  readonly studentId: string;
  readonly balance: number;
  readonly totalPurchased: number;
  readonly totalEarned: number;
  readonly totalSpent: number;
  readonly pending: number;
  readonly updatedAt: string;
  readonly projectionVersion: number;
}

export interface ICoinTransaction {
  readonly id: string;
  readonly studentId: string;
  readonly amount: number;
  readonly transactionType: "PURCHASE" | "REWARD" | "SPEND" | "REFUND";
  readonly sourceType: string;
  readonly sourceId?: string;
  readonly balanceAfter: number;
  readonly occurredAt: string;
  readonly idempotencyKey: string;
  readonly reversalOf?: string;
}

export interface ICoinPackage {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly coinAmount: number;
  readonly priceMinorUnits: number;
  readonly currency: string;
  readonly active: boolean;
  readonly displayOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IContentEntitlement {
  readonly id: string;
  readonly studentId: string;
  readonly contentType: string;
  readonly contentId: string;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly paymentId?: string;
  readonly active: boolean;
  readonly activatedAt: string;
  readonly expiresAt?: string;
}

export interface IWalletRepository {
  getByStudentId(studentId: string): Promise<RepositoryResult<IWallet | null>>;
  upsert(
    studentId: string,
    balance: number,
    totalPurchased: number,
    totalEarned: number,
    totalSpent: number,
    pending: number,
  ): Promise<RepositoryResult<IWallet>>;
}

export interface ICoinTransactionRepository {
  create(input: ICoinTransaction): Promise<RepositoryResult<ICoinTransaction>>;
  listByStudent(studentId: string, limit?: number): Promise<RepositoryResult<ICoinTransaction[]>>;
}

export interface ICoinPackageRepository {
  create(input: ICoinPackage): Promise<RepositoryResult<ICoinPackage>>;
  getById(id: string): Promise<RepositoryResult<ICoinPackage | null>>;
  listActive(): Promise<RepositoryResult<ICoinPackage[]>>;
  listAll(): Promise<RepositoryResult<ICoinPackage[]>>;
  update(id: string, input: Partial<ICoinPackage>): Promise<RepositoryResult<ICoinPackage>>;
  delete(id: string): Promise<RepositoryResult<void>>;
}

export interface IContentEntitlementRepository {
  getByStudentAndContent(
    studentId: string,
    contentType: string,
    contentId: string,
  ): Promise<RepositoryResult<IContentEntitlement | null>>;
  listByStudent(studentId: string): Promise<RepositoryResult<IContentEntitlement[]>>;
  listBySource(
    sourceType: string,
    sourceId: string,
  ): Promise<RepositoryResult<IContentEntitlement[]>>;
  create(input: IContentEntitlement): Promise<RepositoryResult<IContentEntitlement>>;
}

// ===== Coupon / Redeem Code Contracts =====

export interface ICoupon {
  readonly id: string;
  readonly code: string;
  readonly coinAmount: number;
  readonly contentType: string;
  readonly contentId: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly maxUses: number;
  readonly useCount: number;
  readonly active: boolean;
  readonly expiresAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ICouponRepository {
  getByCode(code: string): Promise<RepositoryResult<ICoupon | null>>;
  getById(id: string): Promise<RepositoryResult<ICoupon | null>>;
  incrementUseCount(id: string): Promise<RepositoryResult<void>>;
  create(input: ICoupon): Promise<RepositoryResult<ICoupon>>;
  update(id: string, input: Partial<ICoupon>): Promise<RepositoryResult<ICoupon>>;
  delete(id: string): Promise<RepositoryResult<void>>;
  list(): Promise<RepositoryResult<ICoupon[]>>;
}

// ===== Unlock Request Contracts =====

export interface IUnlockRequest {
  readonly id: string;
  readonly studentId: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly status: string;
  readonly adminNote?: string;
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IUnlockRequestRepository {
  create(input: IUnlockRequest): Promise<RepositoryResult<IUnlockRequest>>;
  getById(id: string): Promise<RepositoryResult<IUnlockRequest | null>>;
  list(filter: { status?: string; studentId?: string }): Promise<RepositoryResult<IUnlockRequest[]>>;
  update(id: string, input: Partial<IUnlockRequest>): Promise<RepositoryResult<IUnlockRequest>>;
}

// ===== Live Class Contracts =====

export type LiveSessionStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "SCHEDULED"
  | "OPEN"
  | "FULL"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";
export type LiveSessionType = "PRIVATE" | "GROUP";
export type LiveBookingStatus = "CONFIRMED" | "CANCELLED" | "RESCHEDULED";
export type LiveAttendanceStatus = "JOINED" | "LATE" | "LEFT_EARLY" | "ABSENT" | "COMPLETED";
export type LiveSubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
export type LiveSubscriptionType = "PRIVATE_MONTHLY" | "GROUP_MONTHLY" | "ONE_TIME_PRIVATE";
export type MeetingProvider = "EXTERNAL_URL" | "ZOOM_SDK";

export interface ILiveSession {
  readonly id: string;
  readonly title: string;
  readonly teacherId: string;
  readonly gradeId: string | null;
  readonly availabilitySlotId: string | null;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly maxStudents: number | null;
  readonly availableSeats: number | null;
  readonly status: LiveSessionStatus;
  readonly type: LiveSessionType;
  readonly meetingUrl: string | null;
  readonly meetingPassword: string | null;
  readonly meetingProvider: MeetingProvider;
  readonly notes: string | null;
  readonly publishedAt: string | null;
  readonly scheduledAt: string | null;
  readonly openedAt: string | null;
  readonly liveAt: string | null;
  readonly completedAt: string | null;
  readonly cancelledAt: string | null;
  readonly cancelReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface ILiveBooking {
  readonly id: string;
  readonly sessionId: string;
  readonly studentId: string;
  readonly subscriptionId: string | null;
  readonly status: LiveBookingStatus;
  readonly cancelledAt: string | null;
  readonly cancelReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ILiveSubscription {
  readonly id: string;
  readonly userId: string;
  readonly type: LiveSubscriptionType;
  readonly packageLabel: string;
  readonly packageSessionCount: number;
  readonly status: LiveSubscriptionStatus;
  readonly teacherId: string | null;
  readonly groupId: string | null;
  readonly sessionsTotal: number;
  readonly sessionsUsed: number;
  readonly currentPeriodStart: string;
  readonly currentPeriodEnd: string;
  readonly nextBillingDate: string | null;
  readonly autoRenew: boolean;
  readonly price: number;
  readonly cancelledAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ILiveAttendance {
  readonly id: string;
  readonly sessionId: string;
  readonly studentId: string;
  readonly status: LiveAttendanceStatus;
  readonly joinedAt: string | null;
  readonly leftAt: string | null;
  readonly durationMinutes: number | null;
  readonly markedBy: string;
  readonly markedById: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ITeacherAvailability {
  readonly id: string;
  readonly teacherId: string;
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly gradeId: string | null;
  readonly maxStudents: number;
  readonly type: LiveSessionType;
  readonly isRecurring: boolean;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
}

export interface ITeacherDateBlock {
  readonly id: string;
  readonly teacherId: string;
  readonly blockedDate: string;
  readonly reason: string | null;
  readonly createdAt: string;
  readonly deletedAt: string | null;
}

export interface ITeacherLiveSettings {
  readonly id: string;
  readonly teacherId: string;
  readonly defaultMeetingUrl: string | null;
  readonly meetingPassword: string | null;
  readonly meetingProvider: MeetingProvider;
  readonly allowOverride: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ILiveAnnouncement {
  readonly id: string;
  readonly sessionId: string;
  readonly senderId: string;
  readonly message: string;
  readonly type: string;
  readonly pinned: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ILiveSessionFilter {
  readonly teacherId?: string;
  readonly gradeId?: string;
  readonly status?: LiveSessionStatus;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export interface ILiveBookingFilter {
  readonly studentId?: string;
  readonly sessionId?: string;
  readonly status?: LiveBookingStatus;
}

export interface ILiveRepository {
  createSession(input: Partial<ILiveSession>): Promise<RepositoryResult<ILiveSession>>;
  getSessionById(id: string): Promise<RepositoryResult<ILiveSession | null>>;
  updateSession(id: string, input: Partial<ILiveSession>): Promise<RepositoryResult<ILiveSession>>;
  listSessions(filter: ILiveSessionFilter): Promise<RepositoryResult<ILiveSession[]>>;
  deleteSession(id: string): Promise<RepositoryResult<void>>;
  createBooking(input: ILiveBooking): Promise<RepositoryResult<ILiveBooking>>;
  getBookingById(id: string): Promise<RepositoryResult<ILiveBooking | null>>;
  listBookings(filter: ILiveBookingFilter): Promise<RepositoryResult<ILiveBooking[]>>;
  cancelBooking(id: string, reason?: string): Promise<RepositoryResult<void>>;
  getBookingsBySession(sessionId: string): Promise<RepositoryResult<ILiveBooking[]>>;
  getTeacherAvailability(teacherId: string): Promise<RepositoryResult<ITeacherAvailability[]>>;
  createAvailability(input: ITeacherAvailability): Promise<RepositoryResult<ITeacherAvailability>>;
  updateAvailability(
    id: string,
    input: Partial<ITeacherAvailability>,
  ): Promise<RepositoryResult<ITeacherAvailability>>;
  deleteAvailability(id: string): Promise<RepositoryResult<void>>;
  listDateBlocks(teacherId: string): Promise<RepositoryResult<ITeacherDateBlock[]>>;
  createDateBlock(input: ITeacherDateBlock): Promise<RepositoryResult<ITeacherDateBlock>>;
  deleteDateBlock(id: string): Promise<RepositoryResult<void>>;
  listAttendance(sessionId: string): Promise<RepositoryResult<ILiveAttendance[]>>;
  recordAttendance(input: ILiveAttendance): Promise<RepositoryResult<ILiveAttendance>>;
  listAnnouncements(sessionId: string): Promise<RepositoryResult<ILiveAnnouncement[]>>;
  createAnnouncement(input: ILiveAnnouncement): Promise<RepositoryResult<ILiveAnnouncement>>;
}

// ===== Story Contracts =====

export interface IStory {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImageUrl?: string;
  readonly gradeId: string;
  readonly stageId: string;
  readonly educationalSystemId?: string;
  readonly academicYearId: string;
  readonly termId: string;
  readonly displayOrder: number;
  readonly published: boolean;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface IStoryChapter {
  readonly id: string;
  readonly storyId: string;
  readonly title: string;
  readonly chapterNumber: number;
  readonly displayOrder: number;
  readonly published: boolean;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt?: string | null;
}

export interface IStoryLesson {
  readonly id: string;
  readonly storyId: string;
  readonly chapterId: string;
  readonly title: string;
  readonly displayOrder: number;
  readonly published: boolean;
  readonly contentVersion: number;
  readonly homeworkEnabled: boolean;
  readonly quizRequired: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt?: string | null;
}

export interface IStoryProgress {
  readonly id: string;
  readonly studentId: string;
  readonly storyId: string;
  readonly chapterId?: string;
  readonly storyLessonId?: string;
  readonly status: "not_started" | "in_progress" | "completed";
  readonly progressPercent: number;
  readonly completedAt?: string;
  readonly lastActiveAt: string;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IStoryFilter {
  readonly gradeId?: string;
  readonly published?: boolean;
}

export interface IStoryRepository {
  create(input: Partial<IStory>): Promise<RepositoryResult<IStory>>;
  getById(id: string): Promise<RepositoryResult<IStory | null>>;
  update(id: string, input: Partial<IStory>): Promise<RepositoryResult<IStory>>;
  delete(id: string): Promise<RepositoryResult<void>>;
  list(filter: IStoryFilter): Promise<RepositoryResult<IStory[]>>;
  listByGrade(gradeId: string): Promise<RepositoryResult<IStory[]>>;
  createChapter(input: Partial<IStoryChapter>): Promise<RepositoryResult<IStoryChapter>>;
  getChapterById(id: string): Promise<RepositoryResult<IStoryChapter | null>>;
  updateChapter(
    id: string,
    input: Partial<IStoryChapter>,
  ): Promise<RepositoryResult<IStoryChapter>>;
  deleteChapter(id: string): Promise<RepositoryResult<void>>;
  listChapters(storyId: string): Promise<RepositoryResult<IStoryChapter[]>>;
  createLesson(input: Partial<IStoryLesson>): Promise<RepositoryResult<IStoryLesson>>;
  getLessonById(id: string): Promise<RepositoryResult<IStoryLesson | null>>;
  listLessons(chapterId: string): Promise<RepositoryResult<IStoryLesson[]>>;
  getProgress(studentId: string, storyId: string): Promise<RepositoryResult<IStoryProgress | null>>;
  upsertProgress(input: IStoryProgress): Promise<RepositoryResult<IStoryProgress>>;
  listStudentProgress(studentId: string): Promise<RepositoryResult<IStoryProgress[]>>;
}

// ===== Final Review Contracts =====

export interface IFinalReview {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImageUrl?: string;
  readonly gradeId: string;
  readonly stageId: string;
  readonly academicYearId: string;
  readonly opensAt: string;
  readonly closesAt: string;
  readonly enabled: boolean;
  readonly published: boolean;
  readonly createdBy: string;
  readonly displayOrder: number;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface IFinalReviewUnit {
  readonly id: string;
  readonly finalReviewId: string;
  readonly unitId: string;
  readonly title: string;
  readonly displayOrder: number;
  readonly published: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IFinalReviewLesson {
  readonly id: string;
  readonly finalReviewUnitId: string;
  readonly title: string;
  readonly summary: string;
  readonly notesPath?: string;
  readonly displayOrder: number;
  readonly published: boolean;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IFinalReviewQuestion {
  readonly id: string;
  readonly finalReviewId: string;
  readonly finalReviewUnitId: string;
  readonly finalReviewLessonId?: string;
  readonly questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK" | "MATCHING";
  readonly prompt: string;
  readonly options?: Record<string, string>;
  readonly correctAnswer?: string;
  readonly points: number;
  readonly exam: boolean;
  readonly displayOrder: number;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IFinalReviewAttempt {
  readonly id: string;
  readonly studentId: string;
  readonly finalReviewId: string;
  readonly attemptNumber: number;
  readonly status: "in_progress" | "submitted" | "graded";
  readonly score?: number;
  readonly maxScore: number;
  readonly passed?: boolean;
  readonly startedAt: string;
  readonly submittedAt?: string;
  readonly gradedAt?: string;
  readonly timeSpentSeconds?: number;
  readonly contentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IFinalReviewAnswer {
  readonly id: string;
  readonly attemptId: string;
  readonly studentId: string;
  readonly finalReviewId: string;
  readonly questionId: string;
  readonly answer: string;
  readonly isCorrect?: boolean;
  readonly score?: number;
  readonly feedback?: string;
  readonly submittedAt: string;
  readonly createdAt: string;
}

export interface IFinalReviewProgress {
  readonly id: string;
  readonly studentId: string;
  readonly finalReviewId: string;
  readonly unitId?: string;
  readonly lessonId?: string;
  readonly progressPercent: number;
  readonly readiness?: string;
  readonly lastActiveAt: string;
  readonly completedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IFinalReviewFilter {
  readonly gradeId?: string;
  readonly enabled?: boolean;
  readonly published?: boolean;
}

export interface IFinalReviewRepository {
  create(input: Partial<IFinalReview>): Promise<RepositoryResult<IFinalReview>>;
  getById(id: string): Promise<RepositoryResult<IFinalReview | null>>;
  update(id: string, input: Partial<IFinalReview>): Promise<RepositoryResult<IFinalReview>>;
  delete(id: string): Promise<RepositoryResult<void>>;
  list(filter: IFinalReviewFilter): Promise<RepositoryResult<IFinalReview[]>>;
  listByGrade(gradeId: string): Promise<RepositoryResult<IFinalReview[]>>;
  createUnit(input: Partial<IFinalReviewUnit>): Promise<RepositoryResult<IFinalReviewUnit>>;
  getUnitById(id: string): Promise<RepositoryResult<IFinalReviewUnit | null>>;
  updateUnit(
    id: string,
    input: Partial<IFinalReviewUnit>,
  ): Promise<RepositoryResult<IFinalReviewUnit>>;
  deleteUnit(id: string): Promise<RepositoryResult<void>>;
  listUnits(finalReviewId: string): Promise<RepositoryResult<IFinalReviewUnit[]>>;
  createLesson(input: Partial<IFinalReviewLesson>): Promise<RepositoryResult<IFinalReviewLesson>>;
  getLessonById(id: string): Promise<RepositoryResult<IFinalReviewLesson | null>>;
  listLessons(unitId: string): Promise<RepositoryResult<IFinalReviewLesson[]>>;
  createQuestion(
    input: Partial<IFinalReviewQuestion>,
  ): Promise<RepositoryResult<IFinalReviewQuestion>>;
  listQuestions(
    finalReviewUnitId: string,
    exam?: boolean,
  ): Promise<RepositoryResult<IFinalReviewQuestion[]>>;
  deleteQuestion(id: string): Promise<RepositoryResult<void>>;
  createAttempt(input: IFinalReviewAttempt): Promise<RepositoryResult<IFinalReviewAttempt>>;
  getAttempt(id: string): Promise<RepositoryResult<IFinalReviewAttempt | null>>;
  updateAttempt(
    id: string,
    input: Partial<IFinalReviewAttempt>,
  ): Promise<RepositoryResult<IFinalReviewAttempt>>;
  listAttempts(
    studentId: string,
    finalReviewId: string,
  ): Promise<RepositoryResult<IFinalReviewAttempt[]>>;
  createAnswer(input: IFinalReviewAnswer): Promise<RepositoryResult<IFinalReviewAnswer>>;
  listAnswers(attemptId: string): Promise<RepositoryResult<IFinalReviewAnswer[]>>;
}

// ===== Notification Contracts =====

export interface INotification {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly message: string;
  readonly type: string;
  readonly priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  readonly link?: string;
  readonly campaignId?: string;
  readonly read: boolean;
  readonly readAt?: string;
  readonly expiresAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface INotificationPreference {
  readonly id: string;
  readonly userId: string;
  readonly lessonReminders: boolean;
  readonly homeworkReminders: boolean;
  readonly liveSessionReminders: boolean;
  readonly achievementNotifications: boolean;
  readonly motivationalMessages: boolean;
  readonly studyTips: boolean;
  readonly teacherAnnouncements: boolean;
  readonly pushEnabled: boolean;
  readonly emailEnabled: boolean;
  readonly whatsappEnabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface INotificationFilter {
  readonly userId?: string;
  readonly read?: boolean;
  readonly type?: string;
}

export interface INotificationRepository {
  create(input: INotification): Promise<RepositoryResult<INotification>>;
  getById(id: string): Promise<RepositoryResult<INotification | null>>;
  list(filter: INotificationFilter): Promise<RepositoryResult<INotification[]>>;
  markRead(id: string): Promise<RepositoryResult<void>>;
  markAllRead(userId: string): Promise<RepositoryResult<void>>;
  delete(id: string): Promise<RepositoryResult<void>>;
  getPreferences(userId: string): Promise<RepositoryResult<INotificationPreference | null>>;
  upsertPreferences(
    input: INotificationPreference,
  ): Promise<RepositoryResult<INotificationPreference>>;
}

// ===== Device Token Contracts =====

export interface IDeviceToken {
  readonly id: string;
  readonly userId: string;
  readonly token: string;
  readonly platform: "web" | "android" | "ios";
  readonly appVersion?: string;
  readonly lastSeenAt: string;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IDeviceTokenFilter {
  readonly userId?: string;
  readonly active?: boolean;
}

export interface IDeviceTokenRepository {
  create(input: IDeviceToken): Promise<RepositoryResult<IDeviceToken>>;
  getById(id: string): Promise<RepositoryResult<IDeviceToken | null>>;
  list(filter: IDeviceTokenFilter): Promise<RepositoryResult<IDeviceToken[]>>;
  deactivate(id: string): Promise<RepositoryResult<void>>;
  deactivateByUser(userId: string): Promise<RepositoryResult<void>>;
  deactivateByToken(token: string): Promise<RepositoryResult<void>>;
}

// ===== Coin Purchase Request Contracts =====

export interface ICoinPurchaseRequest {
  readonly id: string;
  readonly studentId: string;
  readonly packageId: string;
  readonly packageName: string;
  readonly coinAmount: number;
  readonly priceMinorUnits: number;
  readonly currency: string;
  readonly paymentMethod: string;
  readonly status: "PENDING" | "APPROVED" | "REJECTED";
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
  readonly adminNote?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ICoinPurchaseRequestFilter {
  readonly studentId?: string;
  readonly status?: string;
}

export interface ICoinPurchaseRequestRepository {
  create(input: ICoinPurchaseRequest): Promise<RepositoryResult<ICoinPurchaseRequest>>;
  getById(id: string): Promise<RepositoryResult<ICoinPurchaseRequest | null>>;
  list(filter: ICoinPurchaseRequestFilter): Promise<RepositoryResult<ICoinPurchaseRequest[]>>;
  update(
    id: string,
    input: Partial<ICoinPurchaseRequest>,
  ): Promise<RepositoryResult<ICoinPurchaseRequest>>;
}

// ===== Subscription Contracts =====

export type SubscriptionPlanType =
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMI_ANNUAL"
  | "YEARLY"
  | "FULL_COURSE"
  | "CUSTOM";

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "GRACE"
  | "EXPIRED"
  | "CANCELLED"
  | "UPGRADED";

export type SubscriptionBillingInterval =
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMI_ANNUAL"
  | "YEARLY"
  | "ONE_TIME";

export interface ISubscriptionPlan {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description: string;
  readonly descriptionAr: string;
  readonly type: SubscriptionPlanType;
  readonly billingInterval: SubscriptionBillingInterval;
  readonly billingIntervalCount: number;
  readonly priceMinorUnits: number;
  readonly currency: string;
  readonly trialDays: number;
  readonly maxStudentsPerPlan: number;
  readonly features: string[];
  readonly contentScope: "ALL_PREMIUM" | "SPECIFIC_UNITS" | "SPECIFIC_LESSONS" | "FULL_COURSE";
  readonly contentIds: string[];
  readonly gradeIds: string[];
  readonly active: boolean;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ISubscription {
  readonly id: string;
  readonly studentId: string;
  readonly planId: string;
  readonly planName: string;
  readonly status: SubscriptionStatus;
  readonly billingInterval: SubscriptionBillingInterval;
  readonly priceMinorUnits: number;
  readonly currency: string;
  readonly trialEndAt: string | null;
  readonly currentPeriodStart: string;
  readonly currentPeriodEnd: string;
  readonly nextBillingDate: string | null;
  readonly cancelledAt: string | null;
  readonly upgradeFromId: string | null;
  readonly paymentMethod: string;
  readonly paymentGateway: string;
  readonly paymentId: string | null;
  readonly entitlementsAutoGranted: boolean;
  readonly autoRenew: boolean;
  readonly gracePeriodEnd: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ISubscriptionPlanFilter {
  readonly type?: SubscriptionPlanType;
  readonly active?: boolean;
  readonly contentScope?: string;
  readonly gradeId?: string;
}

export interface ISubscriptionFilter {
  readonly studentId?: string;
  readonly planId?: string;
  readonly status?: SubscriptionStatus;
  readonly expiringWithinDays?: number;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export interface ISubscriptionPlanRepository {
  create(input: ISubscriptionPlan): Promise<RepositoryResult<ISubscriptionPlan>>;
  getById(id: string): Promise<RepositoryResult<ISubscriptionPlan | null>>;
  list(filter?: ISubscriptionPlanFilter): Promise<RepositoryResult<ISubscriptionPlan[]>>;
  update(
    id: string,
    input: Partial<ISubscriptionPlan>,
  ): Promise<RepositoryResult<ISubscriptionPlan>>;
  delete(id: string): Promise<RepositoryResult<void>>;
}

export interface ISubscriptionRepository {
  create(input: ISubscription): Promise<RepositoryResult<ISubscription>>;
  getById(id: string): Promise<RepositoryResult<ISubscription | null>>;
  getActiveByStudent(studentId: string): Promise<RepositoryResult<ISubscription | null>>;
  listByStudent(studentId: string): Promise<RepositoryResult<ISubscription[]>>;
  listByPlan(planId: string): Promise<RepositoryResult<ISubscription[]>>;
  listExpiring(withinDays: number): Promise<RepositoryResult<ISubscription[]>>;
  listExpired(): Promise<RepositoryResult<ISubscription[]>>;
  update(id: string, input: Partial<ISubscription>): Promise<RepositoryResult<ISubscription>>;
  cancel(id: string): Promise<RepositoryResult<ISubscription>>;
}

// ===== Notification Dispatcher Interface =====

export interface INotificationPayload {
  readonly userId: string;
  readonly title: string;
  readonly message: string;
  readonly type: string;
  readonly priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  readonly link?: string;
  readonly data?: Record<string, string>;
}

export interface INotificationDispatcher {
  send(payload: INotificationPayload): Promise<void>;
}

// ===== Report Contracts =====

export interface IReport {
  readonly id: string;
  readonly studentId: string;
  readonly periodType: "WEEKLY" | "MONTHLY" | "TERM" | "CUSTOM";
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly completedLessons: number;
  readonly averageQuizScore: number;
  readonly homeworkCompletionRate: number;
  readonly attendanceRate: number;
  readonly totalXpGained: number;
  readonly totalCoinsGained: number;
  readonly achievementsEarned: number;
  readonly strengths: string[];
  readonly weaknesses: string[];
  readonly recommendations: string[];
  readonly generatedAt: string;
  readonly createdAt: string;
}

export interface IReportFilter {
  readonly studentId?: string;
  readonly periodType?: string;
  readonly periodStart?: string;
  readonly periodEnd?: string;
}

export interface IReportRepository {
  getStudentReport(
    studentId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<RepositoryResult<IReport | null>>;
  list(filter: IReportFilter): Promise<RepositoryResult<IReport[]>>;
  generateReport(
    studentId: string,
    periodType: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<RepositoryResult<IReport>>;
}

// ===== Payment Contracts =====

export interface IPayment {
  readonly id: string;
  readonly studentId: string;
  readonly productType: string;
  readonly productId: string;
  readonly paymentMethod: string;
  readonly amountMinorUnits: number;
  readonly currency: string;
  readonly status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  readonly gatewayTransactionId?: string;
  readonly gatewayReference?: string;
  readonly idempotencyKey: string;
  readonly verifiedAt?: string;
  readonly completedAt?: string;
  readonly refundedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IInvoice {
  readonly id: string;
  readonly paymentId: string;
  readonly studentId: string;
  readonly invoiceNumber: string;
  readonly amountMinorUnits: number;
  readonly currency: string;
  readonly storagePath?: string;
  readonly issuedAt: string;
  readonly createdAt: string;
}

export interface IPaymentRepository {
  create(input: IPayment): Promise<RepositoryResult<IPayment>>;
  getById(id: string): Promise<RepositoryResult<IPayment | null>>;
  listByStudent(studentId: string): Promise<RepositoryResult<IPayment[]>>;
  updateStatus(
    id: string,
    status: string,
    data?: Partial<IPayment>,
  ): Promise<RepositoryResult<IPayment>>;
  createInvoice(input: IInvoice): Promise<RepositoryResult<IInvoice>>;
  getInvoicesByStudent(studentId: string): Promise<RepositoryResult<IInvoice[]>>;
}

// ===== Competition Contracts =====

export type CompetitionMode = "QUIZ" | "XP_SPRINT";
export type CompetitionStatus = "DRAFT" | "OPEN" | "CLOSED" | "FINALIZED";

export interface ICompetition {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly mode: CompetitionMode;
  readonly gradeId: string;
  readonly academicYearId: string;
  readonly termId: string;
  readonly teacherId: string;
  readonly status: CompetitionStatus;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly xpReward: number;
  readonly coinReward: number;
  readonly maxParticipants?: number;
  readonly published: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface ICompetitionParticipant {
  readonly id: string;
  readonly competitionId: string;
  readonly studentId: string;
  readonly score: number;
  readonly rank?: number;
  readonly status: "INVITED" | "ACCEPTED" | "SUBMITTED" | "DISQUALIFIED";
  readonly invitedAt: string;
  readonly acceptedAt?: string;
  readonly submittedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ICompetitionQuestion {
  readonly id: string;
  readonly competitionId: string;
  readonly questionType: string;
  readonly prompt: string;
  readonly options?: Record<string, string>;
  readonly correctAnswer: string;
  readonly points: number;
  readonly displayOrder: number;
  readonly createdAt: string;
}

export interface ICompetitionAttempt {
  readonly id: string;
  readonly competitionId: string;
  readonly studentId: string;
  readonly answers: Record<string, string>;
  readonly score: number;
  readonly maxScore: number;
  readonly passed?: boolean;
  readonly startedAt: string;
  readonly submittedAt?: string;
  readonly timeSpentSeconds?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ICompetitionFilter {
  readonly gradeId?: string;
  readonly teacherId?: string;
  readonly status?: CompetitionStatus;
}

export interface ICompetitionRepository {
  create(input: Partial<ICompetition>): Promise<RepositoryResult<ICompetition>>;
  getById(id: string): Promise<RepositoryResult<ICompetition | null>>;
  update(id: string, input: Partial<ICompetition>): Promise<RepositoryResult<ICompetition>>;
  delete(id: string): Promise<RepositoryResult<void>>;
  list(filter: ICompetitionFilter): Promise<RepositoryResult<ICompetition[]>>;
  createParticipant(
    input: ICompetitionParticipant,
  ): Promise<RepositoryResult<ICompetitionParticipant>>;
  getParticipant(
    competitionId: string,
    studentId: string,
  ): Promise<RepositoryResult<ICompetitionParticipant | null>>;
  listParticipants(competitionId: string): Promise<RepositoryResult<ICompetitionParticipant[]>>;
  updateParticipant(
    id: string,
    input: Partial<ICompetitionParticipant>,
  ): Promise<RepositoryResult<ICompetitionParticipant>>;
  createQuestion(input: ICompetitionQuestion): Promise<RepositoryResult<ICompetitionQuestion>>;
  listQuestions(competitionId: string): Promise<RepositoryResult<ICompetitionQuestion[]>>;
  createAttempt(input: ICompetitionAttempt): Promise<RepositoryResult<ICompetitionAttempt>>;
  getAttempt(
    competitionId: string,
    studentId: string,
  ): Promise<RepositoryResult<ICompetitionAttempt | null>>;
}

// ===== Support / Ticket Contracts =====

export interface ISupportTicket {
  readonly id: string;
  readonly userId: string;
  readonly subject: string;
  readonly description: string;
  readonly category: string;
  readonly priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  readonly status: "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
  readonly assignedTo?: string;
  readonly resolvedAt?: string;
  readonly closedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ISupportTicketMessage {
  readonly id: string;
  readonly ticketId: string;
  readonly senderId: string;
  readonly message: string;
  readonly internal: boolean;
  readonly attachments?: string[];
  readonly createdAt: string;
}

export interface IGradeSupportContact {
  readonly id: string;
  readonly gradeId: string;
  readonly phone: string | null;
  readonly email: string | null;
  readonly whatsapp: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ISupportTicketFilter {
  readonly userId?: string;
  readonly status?: string;
  readonly assignedTo?: string;
}

export interface ISupportTicketRepository {
  create(input: ISupportTicket): Promise<RepositoryResult<ISupportTicket>>;
  getById(id: string): Promise<RepositoryResult<ISupportTicket | null>>;
  update(id: string, input: Partial<ISupportTicket>): Promise<RepositoryResult<ISupportTicket>>;
  list(filter: ISupportTicketFilter): Promise<RepositoryResult<ISupportTicket[]>>;
  addMessage(input: ISupportTicketMessage): Promise<RepositoryResult<ISupportTicketMessage>>;
  listMessages(ticketId: string): Promise<RepositoryResult<ISupportTicketMessage[]>>;
  resolve(id: string): Promise<RepositoryResult<void>>;
  close(id: string): Promise<RepositoryResult<void>>;
  getGradeSupportContact(gradeId: string): Promise<RepositoryResult<IGradeSupportContact | null>>;
  upsertGradeSupportContact(
    input: IGradeSupportContact,
  ): Promise<RepositoryResult<IGradeSupportContact>>;
  listGradeSupportContacts(): Promise<RepositoryResult<IGradeSupportContact[]>>;
}
