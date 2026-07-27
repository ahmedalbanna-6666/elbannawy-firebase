import { StoryApplicationService } from '../../services/stories/story-application.service';
import { StoryService } from '../../services/stories/story.service';
import type { RepositoryResult } from '../../shared/types/repository.types';
import type { IStory, IStoryFilter } from '../../repositories/contracts';

const mockStory: IStory = {
  id: 'story-1',
  title: 'Test Story',
  description: 'A test story',
  coverImageUrl: null,
  gradeId: 'grade-1',
  stageId: 'stage-1',
  displayOrder: 1,
  published: true,
  isPremium: false,
  priceCoins: undefined,
  lockedOverride: null,
  contentVersion: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  schemaVersion: 1,
};

function createMockService(): StoryService {
  const mock: Record<string, jest.Mock> = {};
  const service = {
    create: jest.fn().mockResolvedValue({ ok: true, value: mockStory }),
    getById: jest.fn().mockResolvedValue({ ok: true, value: mockStory }),
    update: jest.fn().mockResolvedValue({ ok: true, value: { ...mockStory, contentVersion: 2 } }),
    delete: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
    restore: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
    list: jest.fn().mockResolvedValue({ ok: true, value: [mockStory] }),
    listByGrade: jest.fn().mockResolvedValue({ ok: true, value: [mockStory] }),
    createChapter: jest.fn(),
    getChapterById: jest.fn(),
    updateChapter: jest.fn(),
    deleteChapter: jest.fn(),
    listChapters: jest.fn(),
    createLesson: jest.fn(),
    getLessonById: jest.fn(),
    listLessons: jest.fn(),
    getProgress: jest.fn(),
    upsertProgress: jest.fn(),
    listStudentProgress: jest.fn(),
    getRepository: jest.fn(),
  } as unknown as StoryService;
  return service;
}

describe('StoryApplicationService', () => {
  let mockService: StoryService;
  let appService: StoryApplicationService;

  beforeEach(() => {
    mockService = createMockService();
    appService = new StoryApplicationService(mockService);
  });

  describe('create', () => {
    const validInput = {
      id: 'story-new', title: 'New Story', gradeId: 'g-1', stageId: 's-1',
      academicYearId: 'y-1', termId: 't-1', displayOrder: 0, published: false,
    };

    it('should create a story with valid input', async () => {
      const result = await appService.create(validInput);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.title).toBe('Test Story');
      }
    });

    it('should reject empty title', async () => {
      const result = await appService.create({ ...validInput, title: '' });
      expect(result.ok).toBe(false);
    });

    it('should reject missing gradeId', async () => {
      const result = await appService.create({ ...validInput, gradeId: undefined });
      expect(result.ok).toBe(false);
    });
  });

  describe('getById', () => {
    it('should return story for valid id', async () => {
      const result = await appService.getById('story-1');
      expect(result.ok).toBe(true);
    });

    it('should reject invalid id', async () => {
      const result = await appService.getById('');
      expect(result.ok).toBe(false);
    });

    it('should return NOT_FOUND for missing story', async () => {
      (mockService.getById as jest.Mock).mockResolvedValue({ ok: true, value: null });
      const result = await appService.getById('nonexistent');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('update', () => {
    it('should update with valid data', async () => {
      const result = await appService.update('story-1', { title: 'Updated' });
      expect(result.ok).toBe(true);
    });

    it('should handle version check', async () => {
      const result = await appService.update('story-1', { title: 'Updated' }, 1);
      expect(result.ok).toBe(true);
    });

    it('should reject version mismatch', async () => {
      (mockService.getById as jest.Mock).mockResolvedValue({ ok: true, value: { ...mockStory, contentVersion: 5 } });
      const result = await appService.update('story-1', { title: 'Updated' }, 1);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('CONFLICT');
    });
  });

  describe('list', () => {
    it('should return paginated results', async () => {
      const result = await appService.list({ gradeId: 'g-1', published: true });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(1);
        expect(result.value.nextCursor).toBeNull();
      }
    });

    it('should handle empty filter', async () => {
      const result = await appService.list({});
      expect(result.ok).toBe(true);
    });
  });

  describe('softDelete / restore', () => {
    it('should soft delete with requestId', async () => {
      const result = await appService.softDelete('story-1', 'req-1');
      expect(result.ok).toBe(true);
    });

    it('should restore with requestId', async () => {
      const result = await appService.restore('story-1', 'req-1');
      expect(result.ok).toBe(true);
    });
  });
});
