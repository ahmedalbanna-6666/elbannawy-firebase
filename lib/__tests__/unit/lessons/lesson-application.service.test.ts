import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { LessonApplicationService } from '../../../services/lessons/lesson-application.service';
import { LessonService } from '../../../services/lessons/lesson.service';

const mockService = {
  createLesson: jest.fn<any>(),
  updateLesson: jest.fn<any>(),
  getLessonById: jest.fn<any>(),
  listLessons: jest.fn<any>(),
  getLessonsByUnit: jest.fn<any>(),
  getPublishedLessons: jest.fn<any>(),
  searchLessons: jest.fn<any>(),
  getPreviousLesson: jest.fn<any>(),
  getNextLesson: jest.fn<any>(),
  softDeleteLesson: jest.fn<any>(),
  restoreLesson: jest.fn<any>(),
  archiveLesson: jest.fn<any>(),
  publishLesson: jest.fn<any>(),
  unpublishLesson: jest.fn<any>(),
  changeOrder: jest.fn<any>(),
  getRepository: jest.fn<any>(),
};

describe('LessonApplicationService', () => {
  let appService: LessonApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    appService = new LessonApplicationService(mockService as unknown as LessonService);
  });

  describe('createLesson', () => {
    it('creates lesson with valid input', async () => {
      const mockResult = {
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Test Lesson',
        slug: 'test-lesson',
        displayOrder: 1,
        status: 'draft',
        isPublished: false,
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockService.createLesson.mockResolvedValue({ ok: true, value: mockResult });

      const result = await appService.createLesson({
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Test Lesson',
        slug: 'test-lesson',
        displayOrder: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('lesson-1');
        expect(result.value.title).toBe('Test Lesson');
      }
    });

    it('rejects invalid input', async () => {
      const result = await appService.createLesson({
        id: '',
        unitId: 'unit-1',
        title: 'Test',
        slug: 'test',
        displayOrder: 1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('rejects missing required fields', async () => {
      const result = await appService.createLesson({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('updateLesson', () => {
    it('updates lesson with valid input', async () => {
      const mockResult = {
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Updated',
        slug: 'updated',
        displayOrder: 1,
        status: 'published',
        isPublished: true,
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockService.updateLesson.mockResolvedValue({ ok: true, value: mockResult });

      const result = await appService.updateLesson('lesson-1', { title: 'Updated', isPublished: true }, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isPublished).toBe(true);
      }
    });

    it('rejects empty id', async () => {
      const result = await appService.updateLesson('', { title: 'Test' }, 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('rejects invalid slug in update', async () => {
      const result = await appService.updateLesson('lesson-1', { slug: 'Bad Slug!' }, 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('getLessonById', () => {
    it('gets lesson by valid id', async () => {
      const mockResult = {
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Test',
        slug: 'test',
        displayOrder: 1,
        status: 'draft',
        isPublished: false,
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockService.getLessonById.mockResolvedValue({ ok: true, value: mockResult });

      const result = await appService.getLessonById('lesson-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty id', async () => {
      const result = await appService.getLessonById('');

      expect(result.ok).toBe(false);
    });
  });

  describe('listLessons', () => {
    it('lists lessons with valid filter', async () => {
      mockService.listLessons.mockResolvedValue({
        ok: true,
        value: { items: [], nextCursor: null },
      });

      const result = await appService.listLessons({ unitId: 'unit-1' }, { limit: 20 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
      }
    });
  });

  describe('getLessonsByUnit', () => {
    it('gets lessons by valid unit id', async () => {
      mockService.getLessonsByUnit.mockResolvedValue({ ok: true, value: [] });

      const result = await appService.getLessonsByUnit('unit-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty unit id', async () => {
      const result = await appService.getLessonsByUnit('');

      expect(result.ok).toBe(false);
    });
  });

  describe('getPublishedLessons', () => {
    it('gets published lessons by valid unit id', async () => {
      mockService.getPublishedLessons.mockResolvedValue({ ok: true, value: [] });

      const result = await appService.getPublishedLessons('unit-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty unit id', async () => {
      const result = await appService.getPublishedLessons('');

      expect(result.ok).toBe(false);
    });
  });

  describe('searchLessons', () => {
    it('searches with valid term', async () => {
      mockService.searchLessons.mockResolvedValue({
        ok: true,
        value: { items: [], nextCursor: null },
      });

      const result = await appService.searchLessons('hello', { limit: 20 });

      expect(result.ok).toBe(true);
    });

    it('rejects empty search term', async () => {
      const result = await appService.searchLessons('', { limit: 20 });

      expect(result.ok).toBe(false);
    });
  });

  describe('getPreviousLesson', () => {
    it('gets previous lesson', async () => {
      mockService.getPreviousLesson.mockResolvedValue({ ok: true, value: null });

      const result = await appService.getPreviousLesson('unit-1', 2);

      expect(result.ok).toBe(true);
    });
  });

  describe('getNextLesson', () => {
    it('gets next lesson', async () => {
      mockService.getNextLesson.mockResolvedValue({ ok: true, value: null });

      const result = await appService.getNextLesson('unit-1', 1);

      expect(result.ok).toBe(true);
    });
  });

  describe('softDeleteLesson', () => {
    it('soft deletes with valid id and requestId', async () => {
      mockService.softDeleteLesson.mockResolvedValue({ ok: true, value: undefined });

      const result = await appService.softDeleteLesson('lesson-1', 'delete-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty id', async () => {
      const result = await appService.softDeleteLesson('', 'delete-1');

      expect(result.ok).toBe(false);
    });
  });

  describe('restoreLesson', () => {
    it('restores with valid id and requestId', async () => {
      mockService.restoreLesson.mockResolvedValue({ ok: true, value: undefined });

      const result = await appService.restoreLesson('lesson-1', 'restore-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty id', async () => {
      const result = await appService.restoreLesson('', 'restore-1');

      expect(result.ok).toBe(false);
    });
  });

  describe('archiveLesson', () => {
    it('archives with valid id and requestId', async () => {
      mockService.archiveLesson.mockResolvedValue({ ok: true, value: undefined });

      const result = await appService.archiveLesson('lesson-1', 'archive-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty id', async () => {
      const result = await appService.archiveLesson('', 'archive-1');

      expect(result.ok).toBe(false);
    });
  });

  describe('publishLesson', () => {
    it('publishes with valid id', async () => {
      const mockResult = {
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Test',
        slug: 'test',
        displayOrder: 1,
        status: 'published',
        isPublished: true,
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockService.publishLesson.mockResolvedValue({ ok: true, value: mockResult });

      const result = await appService.publishLesson('lesson-1', 'publish-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty id', async () => {
      const result = await appService.publishLesson('', 'publish-1');

      expect(result.ok).toBe(false);
    });
  });

  describe('unpublishLesson', () => {
    it('unpublishes with valid id', async () => {
      const mockResult = {
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Test',
        slug: 'test',
        displayOrder: 1,
        status: 'draft',
        isPublished: false,
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockService.unpublishLesson.mockResolvedValue({ ok: true, value: mockResult });

      const result = await appService.unpublishLesson('lesson-1', 'unpublish-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty id', async () => {
      const result = await appService.unpublishLesson('', 'unpublish-1');

      expect(result.ok).toBe(false);
    });
  });

  describe('changeOrder', () => {
    it('changes order with valid input', async () => {
      const mockResult = {
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Test',
        slug: 'test',
        displayOrder: 5,
        status: 'draft',
        isPublished: false,
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockService.changeOrder.mockResolvedValue({ ok: true, value: mockResult });

      const result = await appService.changeOrder('lesson-1', { displayOrder: 5 }, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.displayOrder).toBe(5);
      }
    });

    it('rejects empty id', async () => {
      const result = await appService.changeOrder('', { displayOrder: 5 }, 0);

      expect(result.ok).toBe(false);
    });

    it('rejects negative displayOrder', async () => {
      const result = await appService.changeOrder('lesson-1', { displayOrder: -1 }, 0);

      expect(result.ok).toBe(false);
    });
  });
});
