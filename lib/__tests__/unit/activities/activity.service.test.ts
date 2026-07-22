import { ActivityService } from '../../../services/activities/activity.service';
import type {
  IActivityRepository,
  IStudentAttemptRepository,
  ILessonProgressRepository,
  ILessonRepository,
} from '../../../repositories/contracts';
import type { ActivityPlugin } from '../../../activities/types';

describe('ActivityService', () => {
  let service: ActivityService;
  let mockActivityRepo: jest.Mocked<IActivityRepository>;
  let mockAttemptRepo: jest.Mocked<IStudentAttemptRepository>;
  let mockProgressRepo: jest.Mocked<ILessonProgressRepository>;
  let mockLessonRepo: jest.Mocked<ILessonRepository>;

  const mockPlugin: ActivityPlugin = {
    type: 'activity',
    manifest: {
      type: 'multiple-choice',
      version: 1,
      displayName: 'Multiple Choice',
      description: 'MCQ plugin',
      category: 'assessment',
      renderer: 'mcq-renderer',
      validator: 'mcq-validator',
      scorer: 'mcq-scorer',
      capabilities: { timed: true, aiSupported: false, retryable: true, partialCredit: false, attachments: false, shuffle: true, reviewable: true },
    },
  };

  beforeEach(() => {
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

    mockLessonRepo = {} as any;

    service = new ActivityService(
      mockActivityRepo,
      mockAttemptRepo,
      mockProgressRepo,
    );
  });

  describe('plugin registry', () => {
    it('allows registering plugins', () => {
      service.registerPlugin(mockPlugin);
      const registry = service.getPluginRegistry();
      expect(registry.has('multiple-choice')).toBe(true);
    });
  });

  describe('createActivity', () => {
    it('creates an activity successfully', async () => {
      mockActivityRepo.createActivity.mockResolvedValue({
        ok: true,
        value: { id: 'act-1', lessonId: 'l-1', type: 'mcq', title: 'Test', displayOrder: 1, status: 'draft', isRequired: true, isScorable: true, isPractice: false, retryable: false, config: { schemaVersion: 1, data: {} }, prerequisiteActivityIds: [], metadata: { tags: [], aiGenerated: false }, createdAt: '', updatedAt: '', schemaVersion: 1, deletedAt: null } as any,
      });

      const result = await service.createActivity({
        id: 'act-1',
        lessonId: 'l-1',
        type: 'mcq',
        title: 'Test Activity',
        displayOrder: 1,
        config: { schemaVersion: 1, data: {} },
      });

      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('returns error if creation fails', async () => {
      mockActivityRepo.createActivity.mockResolvedValue({
        ok: false,
        error: { code: 'ALREADY_EXISTS', message: 'Activity already exists', retryable: false, requestId: '' },
      });

      const result = await service.createActivity({
        id: 'act-1',
        lessonId: 'l-1',
        type: 'mcq',
        title: 'Test',
        displayOrder: 1,
        config: { schemaVersion: 1, data: {} },
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Activity already exists');
    });
  });

  describe('getActivity', () => {
    it('retrieves an existing activity', async () => {
      mockActivityRepo.getActivityById.mockResolvedValue({
        ok: true,
        value: { id: 'act-1', title: 'Found', lessonId: 'l-1', type: 'mcq', displayOrder: 1, status: 'published', isRequired: true, isScorable: true, isPractice: false, retryable: false, config: { schemaVersion: 1, data: {} }, prerequisiteActivityIds: [], metadata: { tags: [], aiGenerated: false }, createdAt: '', updatedAt: '', schemaVersion: 1, deletedAt: null } as any,
      });

      const result = await service.getActivity('act-1');
      expect(result.ok).toBe(true);
      expect(result.data!.title).toBe('Found');
    });

    it('returns error for missing activity', async () => {
      mockActivityRepo.getActivityById.mockResolvedValue({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Not found', retryable: false, requestId: '' },
      });

      const result = await service.getActivity('nonexistent');
      expect(result.ok).toBe(false);
    });
  });

  describe('deleteActivity', () => {
    it('soft deletes an activity', async () => {
      mockActivityRepo.softDeleteActivity.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.deleteActivity('act-1', 'req-1');
      expect(result.ok).toBe(true);
    });
  });

  describe('publishActivity', () => {
    it('publishes an activity', async () => {
      mockActivityRepo.publishActivity.mockResolvedValue({
        ok: true,
        value: { id: 'act-1', status: 'published', lessonId: 'l-1', type: 'mcq', title: 'Pub', displayOrder: 1, isRequired: true, isScorable: true, isPractice: false, retryable: false, config: { schemaVersion: 1, data: {} }, prerequisiteActivityIds: [], metadata: { tags: [], aiGenerated: false }, createdAt: '', updatedAt: '', schemaVersion: 1, deletedAt: null } as any,
      });

      const result = await service.publishActivity('act-1', 'req-1');
      expect(result.ok).toBe(true);
      expect(result.data!.status).toBe('published');
    });
  });
});
