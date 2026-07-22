import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { LessonRepository } from '../../../repositories/lessons/lesson.repository';

jest.mock('../../../repositories/transactions/transaction-manager', () => ({
  TransactionManager: {
    getInstance: jest.fn(() => ({
      runTransaction: jest.fn((fn: Function) => fn({ firestore: { collection: jest.fn() } })),
      generateTransactionId: jest.fn(() => 'txn-123'),
    })),
  },
}));

jest.mock('../../../repositories/query-builder', () => ({
  QueryBuilder: jest.fn().mockImplementation(() => ({
    withFilter: jest.fn().mockReturnThis(),
    withOrderBy: jest.fn().mockReturnThis(),
    withLimit: jest.fn().mockReturnThis(),
    withCursor: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({
      ok: true,
      value: {
        items: [],
        nextCursor: null,
      },
    }),
  })),
}));

jest.mock('../../../repositories/firestore/firestore.service', () => ({
  getFirestoreInstance: jest.fn(),
  formatFirestoreTimestamp: jest.fn((value: unknown) => {
    if (typeof value === 'string') return value;
    return '2026-01-01T00:00:00.000Z';
  }),
  toRepositoryError: jest.fn((error: unknown) => ({
    code: 'INTERNAL',
    message: (error as Error).message,
    retryable: true,
    requestId: '',
  })),
}));

import { getFirestoreInstance } from '../../../repositories/firestore/firestore.service';

const now = '2026-01-01T00:00:00.000Z';

function createMockDoc() {
  const mockDoc = {
    get: jest.fn().mockResolvedValue({ exists: false }),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
  };
  return mockDoc;
}

describe('LessonRepository', () => {
  let repository: LessonRepository;
  let mockDoc: ReturnType<typeof createMockDoc>;

  beforeEach(() => {
    mockDoc = createMockDoc();
    (getFirestoreInstance as jest.Mock).mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => mockDoc),
      })),
    });
    repository = new LessonRepository();
  });

  describe('createLesson', () => {
    it('creates lesson successfully', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            unitId: 'unit-1',
            title: 'Test Lesson',
            slug: 'test-lesson',
            description: null,
            displayOrder: 1,
            status: 'draft',
            isPublished: false,
            isVisible: true,
            estimatedDuration: null,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'lesson-1',
        });

      const result = await repository.createLesson({
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
        expect(result.value.status).toBe('draft');
        expect(result.value.isPublished).toBe(false);
        expect(result.value.isVisible).toBe(true);
      }
    });

    it('returns ALREADY_EXISTS for duplicate id', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: true });

      const result = await repository.createLesson({
        id: 'lesson-1',
        unitId: 'unit-1',
        title: 'Duplicate',
        slug: 'duplicate',
        displayOrder: 1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ALREADY_EXISTS');
      }
    });
  });

  describe('getLessonById', () => {
    it('returns lesson by id', async () => {
      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          unitId: 'unit-1',
          title: 'Test Lesson',
          slug: 'test-lesson',
          description: null,
          displayOrder: 1,
          status: 'draft',
          isPublished: false,
          isVisible: true,
          estimatedDuration: null,
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
          deletedAt: null,
        }),
        id: 'lesson-1',
      });

      const result = await repository.getLessonById('lesson-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('lesson-1');
      }
    });

    it('returns NOT_FOUND for non-existent id', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: false });

      const result = await repository.getLessonById('non-existent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('returns NOT_FOUND for soft-deleted lesson', async () => {
      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          deletedAt: now,
          unitId: 'unit-1',
          title: 'Deleted Lesson',
          slug: 'deleted-lesson',
          displayOrder: 1,
          status: 'draft',
          isPublished: false,
          isVisible: true,
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
        }),
        id: 'lesson-1',
      });

      const result = await repository.getLessonById('lesson-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('listLessons', () => {
    it('returns empty list', async () => {
      const result = await repository.listLessons({}, { limit: 20 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
        expect(result.value.nextCursor).toBeNull();
      }
    });
  });

  describe('updateLesson', () => {
    it('updates lesson successfully', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            unitId: 'unit-1',
            title: 'Updated Lesson',
            slug: 'updated-lesson',
            description: null,
            displayOrder: 1,
            status: 'published',
            isPublished: true,
            isVisible: true,
            estimatedDuration: null,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'lesson-1',
        });

      const result = await repository.updateLesson('lesson-1', { title: 'Updated Lesson', isPublished: true }, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.title).toBe('Updated Lesson');
        expect(result.value.isPublished).toBe(true);
      }
    });

    it('returns NOT_FOUND for non-existent lesson', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: false });

      const result = await repository.updateLesson('non-existent', { title: 'Test' }, 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('getLessonsByUnit', () => {
    it('returns lessons for unit', async () => {
      const result = await repository.getLessonsByUnit('unit-1');

      expect(result.ok).toBe(true);
    });
  });

  describe('getPublishedLessons', () => {
    it('returns published lessons for unit', async () => {
      const result = await repository.getPublishedLessons('unit-1');

      expect(result.ok).toBe(true);
    });
  });

  describe('searchLessons', () => {
    it('returns empty list for no matches', async () => {
      const result = await repository.searchLessons('nonexistent', { limit: 20 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
      }
    });
  });

  describe('getPreviousLesson', () => {
    it('returns null when no previous lesson', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: false });
      (getFirestoreInstance as jest.Mock).mockReturnValue({
        collection: jest.fn(() => ({
          doc: jest.fn(() => mockDoc),
        })),
      });

      const result = await repository.getPreviousLesson('unit-1', 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('getNextLesson', () => {
    it('returns null when no next lesson', async () => {
      const result = await repository.getNextLesson('unit-1', 999);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('softDeleteLesson', () => {
    it('soft deletes lesson', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: true });

      const result = await repository.softDeleteLesson('lesson-1', 'delete-request');

      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for empty requestId', async () => {
      const result = await repository.softDeleteLesson('lesson-1', '');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns NOT_FOUND for non-existent lesson', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: false });

      const result = await repository.softDeleteLesson('non-existent', 'request-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('restoreLesson', () => {
    it('restores soft-deleted lesson', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: true });

      const result = await repository.restoreLesson('lesson-1', 'restore-request');

      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for empty requestId', async () => {
      const result = await repository.restoreLesson('lesson-1', '');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns NOT_FOUND for non-existent lesson', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: false });

      const result = await repository.restoreLesson('non-existent', 'request-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('archiveLesson', () => {
    it('archives lesson', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: true });

      const result = await repository.archiveLesson('lesson-1', 'archive-request');

      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for empty requestId', async () => {
      const result = await repository.archiveLesson('lesson-1', '');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns NOT_FOUND for non-existent lesson', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: false });

      const result = await repository.archiveLesson('non-existent', 'request-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('publishLesson', () => {
    it('publishes lesson', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            unitId: 'unit-1',
            title: 'Test Lesson',
            slug: 'test-lesson',
            displayOrder: 1,
            status: 'published',
            isPublished: true,
            isVisible: true,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'lesson-1',
        });

      const result = await repository.publishLesson('lesson-1', 'publish-request');

      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for empty requestId', async () => {
      const result = await repository.publishLesson('lesson-1', '');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('unpublishLesson', () => {
    it('unpublishes lesson', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            unitId: 'unit-1',
            title: 'Test Lesson',
            slug: 'test-lesson',
            displayOrder: 1,
            status: 'draft',
            isPublished: false,
            isVisible: true,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'lesson-1',
        });

      const result = await repository.unpublishLesson('lesson-1', 'unpublish-request');

      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for empty requestId', async () => {
      const result = await repository.unpublishLesson('lesson-1', '');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('changeOrder', () => {
    it('changes order', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            unitId: 'unit-1',
            title: 'Test Lesson',
            slug: 'test-lesson',
            displayOrder: 5,
            status: 'draft',
            isPublished: false,
            isVisible: true,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'lesson-1',
        });

      const result = await repository.changeOrder('lesson-1', 5, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.displayOrder).toBe(5);
      }
    });
  });
});
