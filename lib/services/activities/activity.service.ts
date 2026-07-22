import { ActivityPluginRegistry } from '../../activities/registry';
import { ActivityExecutionEngine } from '../../engine/activity-execution-engine';
import type { ActivityPlugin } from '../../activities/types';
import type {
  IActivityRepository,
  IStudentAttemptRepository,
  ILessonProgressRepository,
  CreateActivityInput,
  UpdateActivityInput,
} from '../../repositories/contracts';
import type { PageQuery, Page } from '../../shared/types/pagination.types';
import type {
  ExecutionContext,
  StudentAttempt,
  StudentAttemptSummary,
  LessonProgress,
} from '../../domain/activities';
import {
  toActivityOutput,
  toActivitySummaryOutput,
  toAttemptOutput,
  toAttemptSummaryOutput,
  toProgressOutput,
  toExecutionResponse,
  type CreateActivityRequest,
  type UpdateActivityRequest,
  type StartAttemptRequest,
  type SubmitAttemptRequest,
  type ActivityOutput,
  type ActivitySummaryOutput,
  type ExecutionResponse,
} from './dto/activity-response.dto';

export interface ActivityServiceConfig {
  defaultMaxAttempts?: number;
  defaultTimeLimit?: number;
}

export class ActivityService {
  private readonly engine: ActivityExecutionEngine;
  private readonly pluginRegistry: ActivityPluginRegistry;

  constructor(
    private readonly activityRepo: IActivityRepository,
    private readonly attemptRepo: IStudentAttemptRepository,
    private readonly progressRepo: ILessonProgressRepository,
    config: ActivityServiceConfig = {},
  ) {
    this.pluginRegistry = new ActivityPluginRegistry();
    this.engine = new ActivityExecutionEngine(
      this.pluginRegistry,
      this.activityRepo,
      this.attemptRepo,
      this.progressRepo,
      {
        defaultMaxAttempts: config.defaultMaxAttempts,
        defaultTimeLimit: config.defaultTimeLimit,
      },
    );
  }

  getPluginRegistry(): ActivityPluginRegistry {
    return this.pluginRegistry;
  }

  registerPlugin(plugin: ActivityPlugin, enabled = true): void {
    this.pluginRegistry.register(plugin, enabled);
  }

  async createActivity(request: CreateActivityRequest): Promise<{ ok: boolean; data?: ActivityOutput; error?: string }> {
    const input: CreateActivityInput = {
      id: request.id,
      lessonId: request.lessonId,
      type: request.type,
      title: request.title,
      subtitle: request.subtitle,
      instructions: request.instructions,
      displayOrder: request.displayOrder,
      config: request.config,
      isRequired: request.isRequired,
      isScorable: request.isScorable,
      isPractice: request.isPractice,
      timeLimit: request.timeLimit,
      maxAttempts: request.maxAttempts,
      retryable: request.retryable,
      prerequisiteActivityIds: request.prerequisiteActivityIds,
      metadata: {
        ...request.metadata,
        aiGenerated: false,
        tags: request.metadata?.tags ?? [],
      },
    };

    const result = await this.activityRepo.createActivity(input);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: toActivityOutput(result.value) };
  }

  async updateActivity(id: string, request: UpdateActivityRequest): Promise<{ ok: boolean; data?: ActivityOutput; error?: string }> {
    const input: UpdateActivityInput = { ...request };
    const result = await this.activityRepo.updateActivity(id, input, 1);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: toActivityOutput(result.value) };
  }

  async getActivity(id: string): Promise<{ ok: boolean; data?: ActivityOutput; error?: string }> {
    const result = await this.activityRepo.getActivityById(id);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: toActivityOutput(result.value) };
  }

  async listActivities(lessonId?: string, page: PageQuery = { limit: 20 }): Promise<{ ok: boolean; data?: Page<ActivitySummaryOutput>; error?: string }> {
    const result = await this.activityRepo.listActivities({ lessonId }, page);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    const items = result.value.items.map((s) => toActivitySummaryOutput(s));
    return { ok: true, data: { items, nextCursor: result.value.nextCursor } };
  }

  async getActivitiesByLesson(lessonId: string): Promise<{ ok: boolean; data?: ActivityOutput[]; error?: string }> {
    const result = await this.activityRepo.getActivitiesByLesson(lessonId);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: result.value.map((a) => toActivityOutput(a)) };
  }

  async deleteActivity(id: string, requestId: string): Promise<{ ok: boolean; error?: string }> {
    const result = await this.activityRepo.softDeleteActivity(id, requestId);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  }

  async restoreActivity(id: string, requestId: string): Promise<{ ok: boolean; data?: ActivityOutput; error?: string }> {
    const restoreResult = await this.activityRepo.restoreActivity(id, requestId);
    if (!restoreResult.ok) {
      return { ok: false, error: restoreResult.error.message };
    }
    return this.getActivity(id);
  }

  async publishActivity(id: string, requestId: string): Promise<{ ok: boolean; data?: ActivityOutput; error?: string }> {
    const result = await this.activityRepo.publishActivity(id, requestId);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: toActivityOutput(result.value) };
  }

  async unpublishActivity(id: string, requestId: string): Promise<{ ok: boolean; data?: ActivityOutput; error?: string }> {
    const result = await this.activityRepo.unpublishActivity(id, requestId);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: toActivityOutput(result.value) };
  }

  async reorderActivity(id: string, newOrder: number): Promise<{ ok: boolean; data?: ActivityOutput; error?: string }> {
    const result = await this.activityRepo.changeActivityOrder(id, newOrder, 1);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: toActivityOutput(result.value) };
  }

  async getExecutionContext(activityId: string, studentId: string): Promise<{ ok: boolean; data?: ExecutionContext; error?: string }> {
    const context = await this.engine.getExecutionContext(activityId, studentId);
    if (!context) {
      return { ok: false, error: 'Execution context not available' };
    }
    return { ok: true, data: context };
  }

  async startAttempt(activityId: string, request: StartAttemptRequest): Promise<{ ok: boolean; data?: ExecutionResponse; error?: string }> {
    const result = await this.engine.startAttempt(activityId, request.studentId, request.lessonId, request.unitId);
    if (!result) {
      return { ok: false, error: 'Failed to start attempt' };
    }
    return { ok: true, data: toExecutionResponse(result) };
  }

  async submitAttempt(attemptId: string, request: SubmitAttemptRequest): Promise<{ ok: boolean; data?: ExecutionResponse; error?: string }> {
    const result = await this.engine.submitAttempt(attemptId, request.answer, request.timeSpent);
    if (!result) {
      return { ok: false, error: 'Failed to submit attempt' };
    }
    return { ok: true, data: toExecutionResponse(result) };
  }

  async getAttempt(attemptId: string): Promise<{ ok: boolean; data?: StudentAttempt; error?: string }> {
    const result = await this.attemptRepo.getAttemptById(attemptId);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: toAttemptOutput(result.value) };
  }

  async getStudentAttempts(studentId: string, page: PageQuery = { limit: 20 }): Promise<{ ok: boolean; data?: Page<StudentAttemptSummary>; error?: string }> {
    const result = await this.attemptRepo.getAttemptsByStudent(studentId, page);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    const items = result.value.items.map((s) => toAttemptSummaryOutput(s));
    return { ok: true, data: { items, nextCursor: result.value.nextCursor } };
  }

  async getStudentLessonProgress(studentId: string, lessonId: string): Promise<{ ok: boolean; data?: LessonProgress; error?: string }> {
    const result = await this.progressRepo.getStudentLessonProgress(studentId, lessonId);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    if (!result.value) {
      return { ok: false, error: 'Progress not found' };
    }
    return { ok: true, data: toProgressOutput(result.value) };
  }

  async getStudentProgress(studentId: string, unitId?: string): Promise<{ ok: boolean; data?: LessonProgress[]; error?: string }> {
    const result = await this.progressRepo.listStudentProgress(studentId, unitId);
    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, data: result.value.map((p) => toProgressOutput(p)) };
  }
}
