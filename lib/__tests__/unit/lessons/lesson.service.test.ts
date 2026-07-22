import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { LessonService } from '../../../services/lessons/lesson.service';
import { RepositoryResult } from '../../../shared/types/repository.types';

const mockRepository = {
  createLesson: jest.fn<(input: any) => Promise<RepositoryResult<any>>>(),
  updateLesson: jest.fn<(id: string, input: any, version: number) => Promise<RepositoryResult<any>>>(),
  getLessonById: jest.fn<(id: string) => Promise<RepositoryResult<any>>>(),
  listLessons: jest.fn<(filter: any, page: any) => Promise<RepositoryResult<any>>>(),
  getLessonsByUnit: jest.fn<(unitId: string) => Promise<RepositoryResult<any>>>(),
  getPublishedLessons: jest.fn<(unitId: string) => Promise<RepositoryResult<any>>>(),
  searchLessons: jest.fn<(term: string, page: any) => Promise<RepositoryResult<any>>>(),
  getPreviousLesson: jest.fn<(unitId: string, order: number) => Promise<RepositoryResult<any>>>(),
  getNextLesson: jest.fn<(unitId: string, order: number) => Promise<RepositoryResult<any>>>(),
  softDeleteLesson: jest.fn<(id: string, requestId: string) => Promise<RepositoryResult<void>>>(),
  restoreLesson: jest.fn<(id: string, requestId: string) => Promise<RepositoryResult<void>>>(),
  archiveLesson: jest.fn<(id: string, requestId: string) => Promise<RepositoryResult<void>>>(),
  publishLesson: jest.fn<(id: string, requestId: string) => Promise<RepositoryResult<any>>>(),
  unpublishLesson: jest.fn<(id: string, requestId: string) => Promise<RepositoryResult<any>>>(),
  changeOrder: jest.fn<(id: string, order: number, version: number) => Promise<RepositoryResult<any>>>(),
};

describe('LessonService', () => {
  let service: LessonService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LessonService(mockRepository as any);
  });

  describe('createLesson', () => {
    it('creates lesson successfully', async () => {
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

      mockRepository.createLesson.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.createLesson({
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Test Lesson',
        slug: 'test-lesson',
        displayOrder: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockResult);
      }
      expect(mockRepository.createLesson).toHaveBeenCalledWith({
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Test Lesson',
        slug: 'test-lesson',
        displayOrder: 1,
      });
    });

    it('forwards repository error', async () => {
      mockRepository.createLesson.mockResolvedValue({
        ok: false,
        error: { code: 'ALREADY_EXISTS', message: 'Lesson exists', retryable: false, requestId: '' },
      });

      const result = await service.createLesson({
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Test',
        slug: 'test',
        displayOrder: 1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ALREADY_EXISTS');
      }
    });
  });

  describe('updateLesson', () => {
    it('updates lesson successfully', async () => {
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

      mockRepository.updateLesson.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.updateLesson('lesson-1', { title: 'Updated' }, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.title).toBe('Updated');
      }
      expect(mockRepository.updateLesson).toHaveBeenCalledWith('lesson-1', { title: 'Updated' }, 0);
    });

    it('forwards repository error', async () => {
      mockRepository.updateLesson.mockResolvedValue({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Lesson not found', retryable: false, requestId: '' },
      });

      const result = await service.updateLesson('non-existent', { title: 'Test' }, 0);

      expect(result.ok).toBe(false);
    });
  });

  describe('getLessonById', () => {
    it('gets lesson by id', async () => {
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

      mockRepository.getLessonById.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.getLessonById('lesson-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('lesson-1');
      }
    });

    it('forwards not found error', async () => {
      mockRepository.getLessonById.mockResolvedValue({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Lesson not found', retryable: false, requestId: '' },
      });

      const result = await service.getLessonById('non-existent');

      expect(result.ok).toBe(false);
    });
  });

  describe('listLessons', () => {
    it('lists lessons with filter', async () => {
      mockRepository.listLessons.mockResolvedValue({
        ok: true,
        value: { items: [], nextCursor: null },
      });

      const result = await service.listLessons({ unitId: 'unit-1' }, { limit: 20 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
      }
      expect(mockRepository.listLessons).toHaveBeenCalledWith({ unitId: 'unit-1' }, { limit: 20 });
    });
  });

  describe('getLessonsByUnit', () => {
    it('gets lessons by unit', async () => {
      mockRepository.getLessonsByUnit.mockResolvedValue({
        ok: true,
        value: [],
      });

      const result = await service.getLessonsByUnit('unit-1');

      expect(result.ok).toBe(true);
      expect(mockRepository.getLessonsByUnit).toHaveBeenCalledWith('unit-1');
    });
  });

  describe('getPublishedLessons', () => {
    it('gets published lessons by unit', async () => {
      mockRepository.getPublishedLessons.mockResolvedValue({
        ok: true,
        value: [],
      });

      const result = await service.getPublishedLessons('unit-1');

      expect(result.ok).toBe(true);
      expect(mockRepository.getPublishedLessons).toHaveBeenCalledWith('unit-1');
    });
  });

  describe('searchLessons', () => {
    it('searches lessons', async () => {
      mockRepository.searchLessons.mockResolvedValue({
        ok: true,
        value: { items: [], nextCursor: null },
      });

      const result = await service.searchLessons('hello', { limit: 20 });

      expect(result.ok).toBe(true);
      expect(mockRepository.searchLessons).toHaveBeenCalledWith('hello', { limit: 20 });
    });
  });

  describe('getPreviousLesson', () => {
    it('gets previous lesson', async () => {
      mockRepository.getPreviousLesson.mockResolvedValue({
        ok: true,
        value: null,
      });

      const result = await service.getPreviousLesson('unit-1', 2);

      expect(result.ok).toBe(true);
      expect(mockRepository.getPreviousLesson).toHaveBeenCalledWith('unit-1', 2);
    });
  });

  describe('getNextLesson', () => {
    it('gets next lesson', async () => {
      mockRepository.getNextLesson.mockResolvedValue({
        ok: true,
        value: null,
      });

      const result = await service.getNextLesson('unit-1', 1);

      expect(result.ok).toBe(true);
      expect(mockRepository.getNextLesson).toHaveBeenCalledWith('unit-1', 1);
    });
  });

  describe('softDeleteLesson', () => {
    it('soft deletes lesson', async () => {
      mockRepository.softDeleteLesson.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.softDeleteLesson('lesson-1', 'delete-1');

      expect(result.ok).toBe(true);
      expect(mockRepository.softDeleteLesson).toHaveBeenCalledWith('lesson-1', 'delete-1');
    });
  });

  describe('restoreLesson', () => {
    it('restores lesson', async () => {
      mockRepository.restoreLesson.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.restoreLesson('lesson-1', 'restore-1');

      expect(result.ok).toBe(true);
      expect(mockRepository.restoreLesson).toHaveBeenCalledWith('lesson-1', 'restore-1');
    });
  });

  describe('archiveLesson', () => {
    it('archives lesson', async () => {
      mockRepository.archiveLesson.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.archiveLesson('lesson-1', 'archive-1');

      expect(result.ok).toBe(true);
      expect(mockRepository.archiveLesson).toHaveBeenCalledWith('lesson-1', 'archive-1');
    });
  });

  describe('publishLesson', () => {
    it('publishes lesson', async () => {
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

      mockRepository.publishLesson.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.publishLesson('lesson-1', 'publish-1');

      expect(result.ok).toBe(true);
      expect(mockRepository.publishLesson).toHaveBeenCalledWith('lesson-1', 'publish-1');
    });
  });

  describe('unpublishLesson', () => {
    it('unpublishes lesson', async () => {
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

      mockRepository.unpublishLesson.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.unpublishLesson('lesson-1', 'unpublish-1');

      expect(result.ok).toBe(true);
      expect(mockRepository.unpublishLesson).toHaveBeenCalledWith('lesson-1', 'unpublish-1');
    });
  });

  describe('changeOrder', () => {
    it('changes order', async () => {
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

      mockRepository.changeOrder.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.changeOrder('lesson-1', 5, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.displayOrder).toBe(5);
      }
      expect(mockRepository.changeOrder).toHaveBeenCalledWith('lesson-1', 5, 0);
    });
  });

  describe('getRepository', () => {
    it('returns the underlying repository', () => {
      expect(service.getRepository()).toBe(mockRepository);
    });
  });
});
