import { ActivityPluginRegistry } from '../activities/registry';
import type { ActivityPlugin } from '../activities/types';
import type {
  Activity,
  ExecutionContext,
  ExecutionPermissions,
  ExecutionSettings,
  ExecutionResult,
  ProgressEvent,
  StudentAttempt,
} from '../domain/activities';
import type {
  IStudentAttemptRepository,
  ILessonProgressRepository,
  IActivityRepository,
  IStudentAttempt,
  UpdateAttemptInput,
} from '../repositories/contracts';
import { v4 as uuidv4 } from 'uuid';

export interface EngineConfig {
  defaultMaxAttempts: number;
  defaultTimeLimit: number;
}

export class ActivityExecutionEngine {
  private readonly pluginRegistry: ActivityPluginRegistry;
  private readonly activityRepo: IActivityRepository;
  private readonly attemptRepo: IStudentAttemptRepository;
  private readonly progressRepo: ILessonProgressRepository;
  private readonly config: EngineConfig;

  constructor(
    pluginRegistry: ActivityPluginRegistry,
    activityRepo: IActivityRepository,
    attemptRepo: IStudentAttemptRepository,
    progressRepo: ILessonProgressRepository,
    config: Partial<EngineConfig> = {},
  ) {
    this.pluginRegistry = pluginRegistry;
    this.activityRepo = activityRepo;
    this.attemptRepo = attemptRepo;
    this.progressRepo = progressRepo;
    this.config = {
      defaultMaxAttempts: config.defaultMaxAttempts ?? 3,
      defaultTimeLimit: config.defaultTimeLimit ?? 600,
    };
  }

  async getExecutionContext(
    activityId: string,
    studentId: string,
    mode: ExecutionContext['mode'] = 'view',
  ): Promise<ExecutionContext | null> {
    const activityResult = await this.activityRepo.getActivityById(activityId);
    if (!activityResult.ok) return null;

    const activity = activityResult.value;
    const plugin = this.pluginRegistry.get(activity.type);
    if (!plugin) return null;

    const manifest = plugin.manifest;
    const latestAttempt = await this.attemptRepo.getLatestAttempt(activityId, studentId);

    return {
      activity,
      manifest,
      attempt: latestAttempt.ok ? latestAttempt.value ?? undefined : undefined,
      mode,
      permissions: this.buildPermissions(activity, plugin, latestAttempt.ok ? latestAttempt.value : undefined),
      settings: this.buildSettings(activity),
    };
  }

  async startAttempt(activityId: string, studentId: string, lessonId: string, unitId: string): Promise<ExecutionResult | null> {
    const activityResult = await this.activityRepo.getActivityById(activityId);
    if (!activityResult.ok) return null;

    const activity = activityResult.value;
    const plugin = this.pluginRegistry.get(activity.type);
    if (!plugin) return null;

    if (activity.status !== 'published') return null;

    const maxAttempts = activity.maxAttempts ?? this.config.defaultMaxAttempts;
    const latestAttempt = await this.attemptRepo.getLatestAttempt(activityId, studentId);
    if (latestAttempt.ok && latestAttempt.value) {
      if (latestAttempt.value.attemptNumber >= maxAttempts) {
        return null;
      }
    }

    const attemptNumber = (latestAttempt.ok && latestAttempt.value ? latestAttempt.value.attemptNumber : 0) + 1;

    const attemptId = uuidv4();
    const initialState = plugin.getInitialState ? plugin.getInitialState({
      activity,
      manifest: plugin.manifest,
      mode: 'graded',
      permissions: this.buildPermissions(activity, plugin),
      settings: this.buildSettings(activity),
    }) : undefined;

    const createResult = await this.attemptRepo.createAttempt({
      id: attemptId,
      activityId,
      studentId,
      lessonId,
      unitId,
      attemptNumber,
      maxScore: activity.isScorable ? 100 : 0,
      gradingMethod: activity.isPractice ? 'practice' : 'auto',
      timeLimit: activity.timeLimit ?? this.config.defaultTimeLimit,
      activitySchemaVersion: plugin.manifest.version,
      state: initialState,
    });

    if (!createResult.ok) return null;

    const attempt = createResult.value;

    const events: ProgressEvent[] = [{
      type: 'activity_started',
      activityId,
      studentId,
      lessonId,
      timestamp: new Date().toISOString(),
    }];

    let progress = await this.progressRepo.getStudentLessonProgress(studentId, lessonId);
    if (!progress.ok || !progress.value) {
      const activitiesResult = await this.activityRepo.getActivitiesByLesson(lessonId);
      const totalActivities = activitiesResult.ok ? activitiesResult.value.length : 1;
      const progressResult = await this.progressRepo.createProgress({
        id: uuidv4(),
        studentId,
        lessonId,
        unitId,
        totalActivities,
      });
      if (progressResult.ok) {
        progress = progressResult;
      }
    }

    if (progress.ok && progress.value?.status === 'not_started') {
      await this.progressRepo.updateProgress(progress.value.id, {
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        lastActivityId: activityId,
      });
    }

    return {
      success: true,
      attempt: this.toDomainAttempt(attempt),
      progress: progress.ok ? (progress.value ?? undefined) : undefined,
      events,
    };
  }

  async submitAttempt(attemptId: string, answer: unknown, timeSpent: number): Promise<ExecutionResult | null> {
    const attemptResult = await this.attemptRepo.getAttemptById(attemptId);
    if (!attemptResult.ok) return null;

    const attempt = attemptResult.value;
    if (attempt.status !== 'in_progress') return null;

    const activityResult = await this.activityRepo.getActivityById(attempt.activityId);
    if (!activityResult.ok) return null;

    const activity = activityResult.value;
    const plugin = this.pluginRegistry.get(activity.type);
    if (!plugin) return null;

    const gradeResult = plugin.grade
      ? plugin.grade(this.toDomainAttemptForGrade(attempt, answer, timeSpent), activity)
      : { score: 0, maxScore: attempt.maxScore };

    const percentage = attempt.maxScore > 0 ? (gradeResult.score / attempt.maxScore) * 100 : 0;
    const passed = percentage >= 60;

    const updateInput: UpdateAttemptInput = {
      answer,
      score: gradeResult.score,
      percentage,
      passed,
      feedback: gradeResult.feedback,
      correctAnswer: gradeResult.correctAnswer,
      submittedAt: new Date().toISOString(),
      timeSpent,
      status: 'submitted',
    };

    const updateResult = await this.attemptRepo.updateAttempt(attemptId, updateInput);
    if (!updateResult.ok) return null;

    const updatedAttempt = updateResult.value;
    const events: ProgressEvent[] = [];

    const progressResult = await this.progressRepo.getStudentLessonProgress(attempt.studentId, attempt.lessonId);
    if (progressResult.ok && progressResult.value) {
      const progress = progressResult.value;
      const newCompleted = Math.min(progress.completedActivities + 1, progress.totalActivities);
      const newPercentage = progress.totalActivities > 0 ? (newCompleted / progress.totalActivities) * 100 : 0;

      const progressUpdates: Record<string, unknown> = {
        completedActivities: newCompleted,
        percentage: newPercentage,
        lastActivityId: attempt.activityId,
      };

      if (activity.isScorable && updatedAttempt.score !== undefined) {
        const currentScore = progress.score ?? 0;
        const currentMaxScore = progress.maxScore ?? 0;
        progressUpdates.score = currentScore + updatedAttempt.score;
        progressUpdates.maxScore = currentMaxScore + updatedAttempt.maxScore;
      }

      if (newCompleted >= progress.totalActivities) {
        progressUpdates.status = 'completed';
        progressUpdates.completedAt = new Date().toISOString();
      }

      await this.progressRepo.updateProgress(progress.id, progressUpdates);

      events.push({
        type: 'activity_completed',
        activityId: attempt.activityId,
        studentId: attempt.studentId,
        lessonId: attempt.lessonId,
        score: updatedAttempt.score,
        maxScore: updatedAttempt.maxScore,
        percentage: updatedAttempt.percentage,
        passed: updatedAttempt.passed,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      attempt: this.toDomainAttempt(updatedAttempt),
      progress: progressResult.ok ? progressResult.value ?? undefined : undefined,
      score: updatedAttempt.score,
      maxScore: updatedAttempt.maxScore,
      percentage: updatedAttempt.percentage,
      passed: updatedAttempt.passed,
      feedback: updatedAttempt.feedback,
      correctAnswer: updatedAttempt.correctAnswer,
      events,
    };
  }

  private buildPermissions(activity: Activity, _plugin: ActivityPlugin, latestAttempt?: IStudentAttempt | null): ExecutionPermissions {
    const maxAttempts = activity.maxAttempts ?? this.config.defaultMaxAttempts;
    const currentAttempts = latestAttempt ? latestAttempt.attemptNumber : 0;

    return {
      canAttempt: activity.status === 'published' && currentAttempts < maxAttempts,
      canRetry: activity.retryable && currentAttempts < maxAttempts,
      canReview: activity.status === 'published' && (latestAttempt?.status === 'graded' || latestAttempt?.status === 'submitted'),
      canSkip: !activity.isRequired,
    };
  }

  private buildSettings(activity: Activity): ExecutionSettings {
    return {
      locale: 'en',
      direction: 'ltr',
      showFeedback: activity.isScorable,
      showCorrectAnswer: !activity.isPractice && activity.isScorable,
      timeLimit: activity.timeLimit,
    };
  }

  private toDomainAttempt(attempt: IStudentAttempt): StudentAttempt {
    return {
      id: attempt.id,
      activityId: attempt.activityId,
      studentId: attempt.studentId,
      lessonId: attempt.lessonId,
      unitId: attempt.unitId,
      attemptNumber: attempt.attemptNumber,
      answer: attempt.answer,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      passed: attempt.passed,
      feedback: attempt.feedback,
      correctAnswer: attempt.correctAnswer,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      timeLimit: attempt.timeLimit,
      timeSpent: attempt.timeSpent,
      status: attempt.status,
      gradingMethod: attempt.gradingMethod,
      state: attempt.state,
      activitySchemaVersion: attempt.activitySchemaVersion,
      metadata: attempt.metadata,
      createdAt: attempt.createdAt,
      updatedAt: attempt.updatedAt,
    };
  }

  private toDomainAttemptForGrade(attempt: IStudentAttempt, answer: unknown, timeSpent: number): StudentAttempt {
    return {
      ...this.toDomainAttempt(attempt),
      answer,
      timeSpent,
    };
  }
}
