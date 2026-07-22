// lib/repositories/contracts.ts

import { RepositoryResult } from '../shared/types/repository.types';
import { Page, PageQuery } from '../shared/types/pagination.types';

export type IUserRole = 'student' | 'teacher' | 'staff' | 'secretary' | 'support' | 'administrator';

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
  readonly status: 'active' | 'inactive' | 'suspended' | 'pending';
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
  updateProfile(userId: string, input: UpdateProfileInput, expectedVersion: number): Promise<RepositoryResult<IUser>>;
  updateAcademicAssignment(userId: string, input: AcademicAssignmentInput): Promise<RepositoryResult<IUser>>;
  changeAccountStatus(userId: string, status: AccountStatus, requestId: string): Promise<RepositoryResult<void>>;
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
  readonly status: 'active' | 'inactive';
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
  createAssignment(input: CreateTeacherAssignmentInput): Promise<RepositoryResult<TeacherAssignment>>;
  getAssignmentById(assignmentId: string): Promise<RepositoryResult<TeacherAssignment>>;
  listTeacherAssignments(teacherId: string, page: PageQuery): Promise<RepositoryResult<Page<TeacherAssignment>>>;
  listGradeTeachers(gradeId: string, page: PageQuery): Promise<RepositoryResult<Page<TeacherAssignment>>>;
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

export interface CreateEducationalSystemInput {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description?: string;
  readonly isActive?: boolean;
}

export interface UpdateEducationalSystemInput {
  readonly name?: string;
  readonly nameAr?: string;
  readonly description?: string;
  readonly isActive?: boolean;
}

export interface CreateStageInput {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive?: boolean;
}

export interface UpdateStageInput {
  readonly name?: string;
  readonly nameAr?: string;
  readonly order?: number;
  readonly isActive?: boolean;
}

export interface CreateGradeInput {
  readonly id: string;
  readonly educationalSystemId: string;
  readonly stageId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive?: boolean;
}

export interface UpdateGradeInput {
  readonly name?: string;
  readonly nameAr?: string;
  readonly order?: number;
  readonly isActive?: boolean;
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

export type CurriculumCollection = 'educationalSystems' | 'stages' | 'grades' | 'academicYears' | 'academicTerms';

export interface ICurriculumRepository {
  createEducationalSystem(input: CreateEducationalSystemInput): Promise<RepositoryResult<IEducationalSystem>>;
  updateEducationalSystem(id: string, input: UpdateEducationalSystemInput, expectedVersion: number): Promise<RepositoryResult<IEducationalSystem>>;
  getEducationalSystemById(id: string): Promise<RepositoryResult<IEducationalSystem>>;
  listEducationalSystems(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IEducationalSystemSummary>>>;

  createStage(input: CreateStageInput): Promise<RepositoryResult<IStage>>;
  updateStage(id: string, input: UpdateStageInput, expectedVersion: number): Promise<RepositoryResult<IStage>>;
  getStageById(id: string): Promise<RepositoryResult<IStage>>;
  listStages(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IStageSummary>>>;
  getStagesBySystem(systemId: string): Promise<RepositoryResult<IStage[]>>;

  createGrade(input: CreateGradeInput): Promise<RepositoryResult<IGrade>>;
  updateGrade(id: string, input: UpdateGradeInput, expectedVersion: number): Promise<RepositoryResult<IGrade>>;
  getGradeById(id: string): Promise<RepositoryResult<IGrade>>;
  listGrades(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IGradeSummary>>>;
  getGradesByStage(stageId: string): Promise<RepositoryResult<IGrade[]>>;

  createAcademicYear(input: CreateAcademicYearInput): Promise<RepositoryResult<IAcademicYear>>;
  updateAcademicYear(id: string, input: UpdateAcademicYearInput, expectedVersion: number): Promise<RepositoryResult<IAcademicYear>>;
  getAcademicYearById(id: string): Promise<RepositoryResult<IAcademicYear>>;
  listAcademicYears(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IAcademicYearSummary>>>;

  createAcademicTerm(input: CreateAcademicTermInput): Promise<RepositoryResult<IAcademicTerm>>;
  updateAcademicTerm(id: string, input: UpdateAcademicTermInput, expectedVersion: number): Promise<RepositoryResult<IAcademicTerm>>;
  getAcademicTermById(id: string): Promise<RepositoryResult<IAcademicTerm>>;
  listAcademicTerms(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IAcademicTermSummary>>>;
  getTermsByAcademicYear(academicYearId: string): Promise<RepositoryResult<IAcademicTerm[]>>;

  getCurrentAcademicYear(): Promise<RepositoryResult<IAcademicYear | null>>;
  getCurrentAcademicTerm(academicYearId: string): Promise<RepositoryResult<IAcademicTerm | null>>;
  getCurrentAcademicContext(): Promise<RepositoryResult<ICurrentAcademicContext>>;

  softDeleteCurriculum(id: string, collection: CurriculumCollection, requestId: string): Promise<RepositoryResult<void>>;
  restoreCurriculum(id: string, collection: CurriculumCollection, requestId: string): Promise<RepositoryResult<void>>;
}

// ===== Unit Contracts =====

export interface IUnit {
  readonly id: string;
  readonly academicTermId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description?: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly isPremium: boolean;
  readonly published: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface IUnitSummary {
  readonly id: string;
  readonly academicTermId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly isPremium: boolean;
  readonly published: boolean;
  readonly createdAt: string;
}

export interface CreateUnitInput {
  readonly id: string;
  readonly academicTermId: string;
  readonly name: string;
  readonly nameAr: string;
  readonly description?: string;
  readonly order: number;
  readonly isActive?: boolean;
  readonly isPremium?: boolean;
  readonly published?: boolean;
}

export interface UpdateUnitInput {
  readonly name?: string;
  readonly nameAr?: string;
  readonly description?: string;
  readonly order?: number;
  readonly isActive?: boolean;
  readonly isPremium?: boolean;
  readonly published?: boolean;
}

export interface UnitFilter {
  readonly academicTermId?: string;
  readonly isActive?: boolean;
  readonly isPremium?: boolean;
  readonly published?: boolean;
  readonly search?: string;
}

export interface IUnitRepository {
  createUnit(input: CreateUnitInput): Promise<RepositoryResult<IUnit>>;
  updateUnit(id: string, input: UpdateUnitInput, expectedVersion: number): Promise<RepositoryResult<IUnit>>;
  getUnitById(id: string): Promise<RepositoryResult<IUnit>>;
  listUnits(filter: UnitFilter, page: PageQuery): Promise<RepositoryResult<Page<IUnitSummary>>>;
  getUnitsByTerm(academicTermId: string): Promise<RepositoryResult<IUnit[]>>;
  softDeleteUnit(id: string, requestId: string): Promise<RepositoryResult<void>>;
  restoreUnit(id: string, requestId: string): Promise<RepositoryResult<void>>;
}

// ===== Lesson Contracts =====

export type LessonStatus = 'draft' | 'published' | 'archived';

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
  updateLesson(id: string, input: UpdateLessonInput, expectedVersion: number): Promise<RepositoryResult<ILesson>>;
  getLessonById(id: string): Promise<RepositoryResult<ILesson>>;
  listLessons(filter: LessonFilter, page: PageQuery): Promise<RepositoryResult<Page<ILessonSummary>>>;
  getLessonsByUnit(unitId: string): Promise<RepositoryResult<ILesson[]>>;
  getPublishedLessons(unitId: string): Promise<RepositoryResult<ILesson[]>>;
  searchLessons(searchTerm: string, page: PageQuery): Promise<RepositoryResult<Page<ILessonSummary>>>;
  getPreviousLesson(unitId: string, currentDisplayOrder: number): Promise<RepositoryResult<ILesson | null>>;
  getNextLesson(unitId: string, currentDisplayOrder: number): Promise<RepositoryResult<ILesson | null>>;
  softDeleteLesson(id: string, requestId: string): Promise<RepositoryResult<void>>;
  restoreLesson(id: string, requestId: string): Promise<RepositoryResult<void>>;
  archiveLesson(id: string, requestId: string): Promise<RepositoryResult<void>>;
  publishLesson(id: string, requestId: string): Promise<RepositoryResult<ILesson>>;
  unpublishLesson(id: string, requestId: string): Promise<RepositoryResult<ILesson>>;
  changeOrder(id: string, newOrder: number, expectedVersion: number): Promise<RepositoryResult<ILesson>>;
}

// ===== Activity Contracts =====

export type IActivityStatus = 'draft' | 'published' | 'archived';

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
  updateActivity(id: string, input: UpdateActivityInput, expectedVersion: number): Promise<RepositoryResult<IActivity>>;
  getActivityById(id: string): Promise<RepositoryResult<IActivity>>;
  listActivities(filter: ActivityFilter, page: PageQuery): Promise<RepositoryResult<Page<IActivitySummary>>>;
  getActivitiesByLesson(lessonId: string): Promise<RepositoryResult<IActivity[]>>;
  searchActivities(searchTerm: string, page: PageQuery): Promise<RepositoryResult<Page<IActivitySummary>>>;
  softDeleteActivity(id: string, requestId: string): Promise<RepositoryResult<void>>;
  restoreActivity(id: string, requestId: string): Promise<RepositoryResult<void>>;
  publishActivity(id: string, requestId: string): Promise<RepositoryResult<IActivity>>;
  unpublishActivity(id: string, requestId: string): Promise<RepositoryResult<IActivity>>;
  changeActivityOrder(id: string, newOrder: number, expectedVersion: number): Promise<RepositoryResult<IActivity>>;
}

// ===== Student Attempt Contracts =====

export type IAttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'expired';
export type IGradingMethod = 'auto' | 'manual' | 'ai_assisted' | 'practice';

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
  getStudentAttempt(activityId: string, studentId: string): Promise<RepositoryResult<IStudentAttempt | null>>;
  getLatestAttempt(activityId: string, studentId: string): Promise<RepositoryResult<IStudentAttempt | null>>;
  listAttempts(filter: AttemptFilter, page: PageQuery): Promise<RepositoryResult<Page<IStudentAttemptSummary>>>;
  getAttemptsByActivity(activityId: string): Promise<RepositoryResult<IStudentAttempt[]>>;
  getAttemptsByStudent(studentId: string, page: PageQuery): Promise<RepositoryResult<Page<IStudentAttemptSummary>>>;
}

// ===== Lesson Progress Contracts =====

export type ILessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

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
  getStudentLessonProgress(studentId: string, lessonId: string): Promise<RepositoryResult<ILessonProgress | null>>;
  updateProgress(id: string, input: UpdateLessonProgressInput): Promise<RepositoryResult<ILessonProgress>>;
  listStudentProgress(studentId: string, unitId?: string): Promise<RepositoryResult<ILessonProgress[]>>;
}

// ===== Vocabulary Section Contracts =====

export type VocabularySectionKind = 'STANDARD_VOCABULARY' | 'SYNONYM_ANTONYM';

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
  update(id: string, input: UpdateVocabularySectionInput, expectedVersion: number): Promise<RepositoryResult<IVocabularySection>>;
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
  update(id: string, input: UpdateVocabularyItemInput, expectedVersion: number): Promise<RepositoryResult<IVocabularyItem>>;
  listByLesson(lessonId: string): Promise<RepositoryResult<IVocabularyItem[]>>;
  listBySection(sectionId: string): Promise<RepositoryResult<IVocabularyItem[]>>;
  deleteByLesson(lessonId: string): Promise<RepositoryResult<void>>;
  deleteBySection(sectionId: string): Promise<RepositoryResult<void>>;
}

// ===== Vocabulary Relation Contracts =====

export type VocabularyRelationType = 'SYNONYM' | 'ANTONYM';

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
  update(id: string, input: UpdateVocabularyRelationInput, expectedVersion: number): Promise<RepositoryResult<IVocabularyRelation>>;
  listByLesson(lessonId: string): Promise<RepositoryResult<IVocabularyRelation[]>>;
  listBySection(sectionId: string): Promise<RepositoryResult<IVocabularyRelation[]>>;
  deleteByLesson(lessonId: string): Promise<RepositoryResult<void>>;
  deleteBySection(sectionId: string): Promise<RepositoryResult<void>>;
}
