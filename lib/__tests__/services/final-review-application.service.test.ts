import { FinalReviewApplicationService } from '../../services/final-reviews/final-review-application.service';
import { FinalReviewService } from '../../services/final-reviews/final-review.service';
import type { IFinalReview, IFinalReviewFilter } from '../../repositories/contracts';

const mockReview: IFinalReview = {
  id: 'review-1',
  title: 'Test Final Review',
  description: 'A test review',
  coverImageUrl: null,
  gradeId: 'grade-1',
  stageId: 'stage-1',
  academicYearId: 'year-1',
  opensAt: '2026-06-01T00:00:00Z',
  closesAt: '2026-07-01T00:00:00Z',
  enabled: true,
  published: true,
  isPremium: false,
  priceCoins: undefined,
  lockedOverride: null,
  createdBy: 'teacher-1',
  displayOrder: 1,
  contentVersion: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  schemaVersion: 1,
};

function createMockService(): FinalReviewService {
  return {
    create: jest.fn().mockResolvedValue({ ok: true, value: mockReview }),
    getById: jest.fn().mockResolvedValue({ ok: true, value: mockReview }),
    update: jest.fn().mockResolvedValue({ ok: true, value: { ...mockReview, contentVersion: 2 } }),
    delete: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
    restore: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
    list: jest.fn().mockResolvedValue({ ok: true, value: [mockReview] }),
    listByGrade: jest.fn().mockResolvedValue({ ok: true, value: [mockReview] }),
    createUnit: jest.fn(),
    getUnitById: jest.fn(),
    updateUnit: jest.fn(),
    deleteUnit: jest.fn(),
    listUnits: jest.fn(),
    createLesson: jest.fn(),
    getLessonById: jest.fn(),
    listLessons: jest.fn(),
    createQuestion: jest.fn(),
    listQuestions: jest.fn(),
    deleteQuestion: jest.fn(),
    createAttempt: jest.fn(),
    getAttempt: jest.fn(),
    updateAttempt: jest.fn(),
    listAttempts: jest.fn(),
    createAnswer: jest.fn(),
    listAnswers: jest.fn(),
    getProgress: jest.fn(),
    upsertProgress: jest.fn(),
    listStudentProgress: jest.fn(),
    getRepository: jest.fn(),
  } as unknown as FinalReviewService;
}

describe('FinalReviewApplicationService', () => {
  let mockService: FinalReviewService;
  let appService: FinalReviewApplicationService;

  beforeEach(() => {
    mockService = createMockService();
    appService = new FinalReviewApplicationService(mockService);
  });

  describe('create', () => {
    const validInput = {
      id: 'review-new', title: 'New Review', gradeId: 'g-1', stageId: 's-1',
      academicYearId: 'y-1', opensAt: '2026-06-01T00:00:00Z', closesAt: '2026-07-01T00:00:00Z',
      enabled: true, published: false, displayOrder: 0, createdBy: 'teacher-1',
    };

    it('should create with valid input', async () => {
      const result = await appService.create(validInput);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.title).toBe('Test Final Review');
    });

    it('should reject empty title', async () => {
      const result = await appService.create({ ...validInput, title: '' });
      expect(result.ok).toBe(false);
    });
  });

  describe('getById', () => {
    it('should return review for valid id', async () => {
      const result = await appService.getById('review-1');
      expect(result.ok).toBe(true);
    });

    it('should return NOT_FOUND for missing review', async () => {
      (mockService.getById as jest.Mock).mockResolvedValue({ ok: true, value: null });
      const result = await appService.getById('nonexistent');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('update', () => {
    it('should handle version mismatch', async () => {
      (mockService.getById as jest.Mock).mockResolvedValue({ ok: true, value: { ...mockReview, contentVersion: 5 } });
      const result = await appService.update('review-1', { title: 'Updated' }, 1);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('CONFLICT');
    });
  });

  describe('list', () => {
    it('should return paginated results', async () => {
      const result = await appService.list({ gradeId: 'g-1', published: true, enabled: true });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(1);
        expect(result.value.nextCursor).toBeNull();
      }
    });
  });

  describe('softDelete / restore', () => {
    it('should soft delete', async () => {
      const result = await appService.softDelete('review-1', 'req-1');
      expect(result.ok).toBe(true);
    });

    it('should restore', async () => {
      const result = await appService.restore('review-1', 'req-1');
      expect(result.ok).toBe(true);
    });
  });
});
