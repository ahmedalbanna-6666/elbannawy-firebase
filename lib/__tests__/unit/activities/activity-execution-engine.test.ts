import { ActivityExecutionEngine } from '../../../engine/activity-execution-engine';
import { ActivityPluginRegistry } from '../../../activities/registry';
import type { ActivityPlugin } from '../../../activities/types';
import type {
  IActivityRepository,
  IStudentAttemptRepository,
  ILessonProgressRepository,
} from '../../../repositories/contracts';

describe('ActivityExecutionEngine', () => {
  let engine: ActivityExecutionEngine;
  let pluginRegistry: ActivityPluginRegistry;
  let mockActivityRepo: jest.Mocked<IActivityRepository>;
  let mockAttemptRepo: jest.Mocked<IStudentAttemptRepository>;
  let mockProgressRepo: jest.Mocked<ILessonProgressRepository>;

  const mockPlugin: ActivityPlugin = {
    type: 'activity',
    manifest: {
      type: 'multiple-choice',
      version: 1,
      displayName: 'Multiple Choice',
      description: 'MCQ',
      category: 'assessment',
      renderer: 'mcq-renderer',
      validator: 'mcq-validator',
      scorer: 'mcq-scorer',
      capabilities: { timed: true, aiSupported: false, retryable: true, partialCredit: false, attachments: false, shuffle: true, reviewable: true },
    },
    getInitialState: jest.fn().mockReturnValue({ started: true }),
    grade: jest.fn().mockReturnValue({ score: 80, maxScore: 100, feedback: 'Good' }),
  };

  beforeEach(() => {
    pluginRegistry = new ActivityPluginRegistry();
    pluginRegistry.register(mockPlugin);

    mockActivityRepo = {
      getActivityById: jest.fn(),
      createActivity: jest.fn(),
      updateActivity: jest.fn(),
      listActivities: jest.fn(),
      getActivitiesByLesson: jest.fn(),
      searchActivities: jest.fn(),
      softDeleteActivity: jest.fn(),
      restoreActivity: jest.fn(),
      publishActivity: jest.fn(),
      unpublishActivity: jest.fn(),
      changeActivityOrder: jest.fn(),
    } as any;

    mockAttemptRepo = {
      createAttempt: jest.fn(),
      updateAttempt: jest.fn(),
      getAttemptById: jest.fn(),
      getStudentAttempt: jest.fn(),
      getLatestAttempt: jest.fn(),
      listAttempts: jest.fn(),
      getAttemptsByActivity: jest.fn(),
      getAttemptsByStudent: jest.fn(),
    } as any;

    mockProgressRepo = {
      createProgress: jest.fn(),
      getProgress: jest.fn(),
      getStudentLessonProgress: jest.fn(),
      updateProgress: jest.fn(),
      listStudentProgress: jest.fn(),
    } as any;

    engine = new ActivityExecutionEngine(
      pluginRegistry,
      mockActivityRepo,
      mockAttemptRepo,
      mockProgressRepo,
    );
  });

  describe('startAttempt', () => {
    it('returns null if activity not found', async () => {
      mockActivityRepo.getActivityById.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'Not found', retryable: false, requestId: '' } });
      const result = await engine.startAttempt('act-1', 'student-1', 'lesson-1', 'unit-1');
      expect(result).toBeNull();
    });

    it('returns null if activity not published', async () => {
      mockActivityRepo.getActivityById.mockResolvedValue({
        ok: true,
        value: { id: 'act-1', status: 'draft', type: 'multiple-choice', isScorable: true, isPractice: false, maxAttempts: 3, timeLimit: 60, retryable: true, displayOrder: 1, isRequired: true, config: { schemaVersion: 1, data: {} }, prerequisiteActivityIds: [], lessonId: 'l-1', title: 'Test', subtitle: '', instructions: '', metadata: { estimatedDuration: 0, skill: '', difficulty: '', tags: [], bloomLevel: '', aiGenerated: false }, createdAt: '', updatedAt: '', schemaVersion: 1, deletedAt: null } as any,
      });
      const result = await engine.startAttempt('act-1', 'student-1', 'lesson-1', 'unit-1');
      expect(result).toBeNull();
    });

    it('starts an attempt for a published activity', async () => {
      mockActivityRepo.getActivityById.mockResolvedValue({
        ok: true,
        value: { id: 'act-1', status: 'published', type: 'multiple-choice', isScorable: true, isPractice: false, maxAttempts: 3, timeLimit: 60, retryable: true, displayOrder: 1, isRequired: true, config: { schemaVersion: 1, data: {} }, prerequisiteActivityIds: [], lessonId: 'l-1', title: 'Test', subtitle: '', instructions: '', metadata: { estimatedDuration: 0, skill: '', difficulty: '', tags: [], bloomLevel: '', aiGenerated: false }, createdAt: '', updatedAt: '', schemaVersion: 1, deletedAt: null } as any,
      });
      mockAttemptRepo.getLatestAttempt.mockResolvedValue({ ok: true, value: null });
      mockAttemptRepo.createAttempt.mockResolvedValue({
        ok: true,
        value: { id: 'attempt-1', activityId: 'act-1', studentId: 'student-1', lessonId: 'l-1', unitId: 'u-1', attemptNumber: 1, maxScore: 100, gradingMethod: 'auto', status: 'in_progress', startedAt: new Date().toISOString(), activitySchemaVersion: 1, metadata: {}, createdAt: '', updatedAt: '' } as any,
      });
      mockProgressRepo.getStudentLessonProgress.mockResolvedValue({ ok: true, value: null });
      mockActivityRepo.getActivitiesByLesson.mockResolvedValue({ ok: true, value: [] });
      mockProgressRepo.createProgress.mockResolvedValue({
        ok: true,
        value: { id: 'progress-1', studentId: 'student-1', lessonId: 'l-1', unitId: 'u-1', status: 'not_started', completedActivities: 0, totalActivities: 1, percentage: 0, createdAt: '', updatedAt: '' } as any,
      });

      const result = await engine.startAttempt('act-1', 'student-1', 'lesson-1', 'unit-1');
      expect(result).not.toBeNull();
      expect(result!.success).toBe(true);
      expect(result!.events[0].type).toBe('activity_started');
    });
  });

  describe('submitAttempt', () => {
    it('returns null if attempt not found', async () => {
      mockAttemptRepo.getAttemptById.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: 'Not found', retryable: false, requestId: '' } });
      const result = await engine.submitAttempt('attempt-1', { answer: 'A' }, 30);
      expect(result).toBeNull();
    });

    it('returns null if attempt not in_progress', async () => {
      mockAttemptRepo.getAttemptById.mockResolvedValue({
        ok: true,
        value: { id: 'attempt-1', status: 'submitted', activityId: 'act-1', studentId: 'student-1', lessonId: 'l-1', unitId: 'u-1', attemptNumber: 1, maxScore: 100, gradingMethod: 'auto', startedAt: '', activitySchemaVersion: 1, metadata: {}, createdAt: '', updatedAt: '' } as any,
      });
      const result = await engine.submitAttempt('attempt-1', { answer: 'A' }, 30);
      expect(result).toBeNull();
    });

    it('grades and submits an attempt', async () => {
      mockAttemptRepo.getAttemptById.mockResolvedValue({
        ok: true,
        value: { id: 'attempt-1', status: 'in_progress', activityId: 'act-1', studentId: 'student-1', lessonId: 'l-1', unitId: 'u-1', attemptNumber: 1, maxScore: 100, gradingMethod: 'auto', startedAt: '', activitySchemaVersion: 1, metadata: {}, createdAt: '', updatedAt: '' } as any,
      });
      mockActivityRepo.getActivityById.mockResolvedValue({
        ok: true,
        value: { id: 'act-1', status: 'published', type: 'multiple-choice', isScorable: true, isPractice: false, maxAttempts: 3, timeLimit: 60, retryable: true, displayOrder: 1, isRequired: true, config: { schemaVersion: 1, data: {} }, prerequisiteActivityIds: [], lessonId: 'l-1', title: 'Test', subtitle: '', instructions: '', metadata: { estimatedDuration: 0, skill: '', difficulty: '', tags: [], bloomLevel: '', aiGenerated: false }, createdAt: '', updatedAt: '', schemaVersion: 1, deletedAt: null } as any,
      });
      mockAttemptRepo.updateAttempt.mockResolvedValue({
        ok: true,
        value: { id: 'attempt-1', status: 'submitted', score: 80, maxScore: 100, percentage: 80, passed: true, feedback: 'Good', activityId: 'act-1', studentId: 'student-1', lessonId: 'l-1', unitId: 'u-1', attemptNumber: 1, gradingMethod: 'auto', startedAt: '', submittedAt: new Date().toISOString(), timeSpent: 30, activitySchemaVersion: 1, metadata: {}, createdAt: '', updatedAt: '' } as any,
      });
      mockProgressRepo.getStudentLessonProgress.mockResolvedValue({
        ok: true,
        value: { id: 'progress-1', studentId: 'student-1', lessonId: 'l-1', unitId: 'u-1', status: 'in_progress', completedActivities: 0, totalActivities: 1, percentage: 0, lastActivityId: 'act-1', createdAt: '', updatedAt: '' } as any,
      });
      mockProgressRepo.updateProgress.mockResolvedValue({ ok: true, value: {} as any });

      const result = await engine.submitAttempt('attempt-1', { answer: 'A' }, 30);
      expect(result).not.toBeNull();
      expect(result!.success).toBe(true);
      expect(result!.score).toBe(80);
      expect(result!.passed).toBe(true);
      expect(result!.events[0].type).toBe('activity_completed');
    });
  });

  describe('getExecutionContext', () => {
    it('returns null if activity not found', async () => {
      mockActivityRepo.getActivityById.mockResolvedValue({ ok: false, error: { code: 'NOT_FOUND', message: '', retryable: false, requestId: '' } });
      const result = await engine.getExecutionContext('act-1', 'student-1');
      expect(result).toBeNull();
    });

    it('returns null if no plugin found for activity type', async () => {
      mockActivityRepo.getActivityById.mockResolvedValue({
        ok: true,
        value: { id: 'act-1', type: 'unknown-type', status: 'published', isScorable: true, isPractice: false, maxAttempts: 3, timeLimit: 60, retryable: true, displayOrder: 1, isRequired: true, config: { schemaVersion: 1, data: {} }, prerequisiteActivityIds: [], lessonId: 'l-1', title: 'Test', subtitle: '', instructions: '', metadata: { estimatedDuration: 0, skill: '', difficulty: '', tags: [], bloomLevel: '', aiGenerated: false }, createdAt: '', updatedAt: '', schemaVersion: 1, deletedAt: null } as any,
      });
      const result = await engine.getExecutionContext('act-1', 'student-1');
      expect(result).toBeNull();
    });
  });
});
