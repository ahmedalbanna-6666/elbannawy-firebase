import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { LessonRepository } from '../../../repositories/lessons/lesson.repository';

const isEmulatorAvailable = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

const testIntegration = isEmulatorAvailable ? describe : describe.skip;
testIntegration('LessonRepository Integration Tests', () => {
  let repository: LessonRepository;
  const unitId = `integration-unit-${Date.now()}`;
  const lessonId = `integration-lesson-${Date.now()}`;
  const lesson2Id = `integration-lesson-2-${Date.now()}`;

  beforeAll(async () => {
    repository = new LessonRepository();
  });

  afterAll(async () => {
    if (repository && isEmulatorAvailable) {
      await repository.softDeleteLesson(lessonId, 'cleanup');
      await repository.softDeleteLesson(lesson2Id, 'cleanup');
    }
  });

  describe('Create Lesson', () => {
    it('creates a lesson in Firestore', async () => {
      const result = await repository.createLesson({
        id: lessonId,
        unitId,
        title: 'Integration Test Lesson',
        slug: 'integration-test-lesson',
        displayOrder: 1,
        isPublished: false,
        isVisible: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(lessonId);
        expect(result.value.unitId).toBe(unitId);
        expect(result.value.title).toBe('Integration Test Lesson');
        expect(result.value.slug).toBe('integration-test-lesson');
        expect(result.value.displayOrder).toBe(1);
        expect(result.value.status).toBe('draft');
        expect(result.value.isPublished).toBe(false);
        expect(result.value.isVisible).toBe(true);
      }
    });

    it('creates a second lesson for ordering tests', async () => {
      const result = await repository.createLesson({
        id: lesson2Id,
        unitId,
        title: 'Integration Test Lesson 2',
        slug: 'integration-test-lesson-2',
        displayOrder: 2,
        isPublished: true,
        status: 'published',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(lesson2Id);
        expect(result.value.status).toBe('published');
        expect(result.value.isPublished).toBe(true);
      }
    });

    it('retrieves the created lesson by id', async () => {
      const result = await repository.getLessonById(lessonId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(lessonId);
        expect(result.value.title).toBe('Integration Test Lesson');
      }
    });

    it('returns ALREADY_EXISTS for duplicate id', async () => {
      const result = await repository.createLesson({
        id: lessonId,
        unitId,
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

  describe('Update Lesson', () => {
    it('updates lesson title and published status', async () => {
      const result = await repository.updateLesson(lessonId, { title: 'Updated Lesson', isPublished: true }, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.title).toBe('Updated Lesson');
        expect(result.value.isPublished).toBe(true);
      }
    });

    it('retrieves updated values', async () => {
      const result = await repository.getLessonById(lessonId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.title).toBe('Updated Lesson');
        expect(result.value.isPublished).toBe(true);
      }
    });
  });

  describe('List by Unit', () => {
    it('retrieves lessons by unit', async () => {
      const result = await repository.getLessonsByUnit(unitId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(2);
        expect(result.value[0].unitId).toBe(unitId);
        expect(result.value[0].displayOrder).toBeLessThan(result.value[1].displayOrder);
      }
    });

    it('retrieves published lessons only', async () => {
      const result = await repository.getPublishedLessons(unitId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(1);
        result.value.forEach((lesson) => {
          expect(lesson.isPublished).toBe(true);
          expect(lesson.status).toBe('published');
        });
      }
    });
  });

  describe('Previous & Next Navigation', () => {
    it('gets next lesson from lesson 1', async () => {
      const result = await repository.getNextLesson(unitId, 1);

      expect(result.ok).toBe(true);
      if (result.ok && result.value) {
        expect(result.value.displayOrder).toBe(2);
        expect(result.value.id).toBe(lesson2Id);
      }
    });

    it('gets previous lesson from lesson 2', async () => {
      const result = await repository.getPreviousLesson(unitId, 2);

      expect(result.ok).toBe(true);
      if (result.ok && result.value) {
        expect(result.value.id).toBe(lessonId);
      }
    });

    it('returns null for previous of first lesson', async () => {
      const result = await repository.getPreviousLesson(unitId, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('returns null for next of last lesson', async () => {
      const result = await repository.getNextLesson(unitId, 999);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('Publish & Unpublish', () => {
    it('publishes a lesson', async () => {
      const result = await repository.publishLesson(lessonId, `publish-${Date.now()}`);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isPublished).toBe(true);
        expect(result.value.status).toBe('published');
      }
    });

    it('unpublishes a lesson', async () => {
      const result = await repository.unpublishLesson(lessonId, `unpublish-${Date.now()}`);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isPublished).toBe(false);
        expect(result.value.status).toBe('draft');
      }
    });
  });

  describe('Change Order', () => {
    it('changes lesson display order', async () => {
      const result = await repository.changeOrder(lesson2Id, 10, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.displayOrder).toBe(10);
      }
    });
  });

  describe('Archive', () => {
    it('archives a lesson', async () => {
      const result = await repository.archiveLesson(lesson2Id, `archive-${Date.now()}`);

      expect(result.ok).toBe(true);
    });
  });

  describe('Soft Delete & Restore', () => {
    it('soft deletes a lesson', async () => {
      const result = await repository.softDeleteLesson(lessonId, `delete-${Date.now()}`);

      expect(result.ok).toBe(true);
    });

    it('returns not found after soft delete', async () => {
      const result = await repository.getLessonById(lessonId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('restores soft-deleted lesson', async () => {
      const restoreResult = await repository.restoreLesson(lessonId, `restore-${Date.now()}`);
      expect(restoreResult.ok).toBe(true);

      const lesson = await repository.getLessonById(lessonId);
      expect(lesson.ok).toBe(true);
      if (lesson.ok) {
        expect(lesson.value.id).toBe(lessonId);
      }
    });
  });

  describe('Pagination', () => {
    it('supports cursor pagination on lessons', async () => {
      const page1 = await repository.listLessons({}, { limit: 1 });

      expect(page1.ok).toBe(true);
      if (page1.ok) {
        const page2 = await repository.listLessons(
          {},
          { limit: 1, cursor: page1.value.nextCursor ?? undefined },
        );
        expect(page2.ok).toBe(true);
      }
    });

    it('filters by unitId', async () => {
      const result = await repository.listLessons({ unitId }, { limit: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        result.value.items.forEach((lesson) => {
          expect(lesson.unitId).toBe(unitId);
        });
      }
    });

    it('filters by isPublished', async () => {
      const result = await repository.listLessons({ isPublished: true }, { limit: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        result.value.items.forEach((lesson) => {
          expect(lesson.isPublished).toBe(true);
        });
      }
    });

    it('returns empty list for non-matching filters', async () => {
      const result = await repository.listLessons({ unitId: 'non-existent-unit' }, { limit: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
        expect(result.value.nextCursor).toBeNull();
      }
    });
  });

  describe('Error Handling', () => {
    it('handles not found for non-existent lesson', async () => {
      const result = await repository.getLessonById('non-existent-id-12345');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('handles update of non-existent lesson', async () => {
      const result = await repository.updateLesson('non-existent-lesson', { title: 'Test' }, 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('handles soft delete of non-existent document', async () => {
      const result = await repository.softDeleteLesson('non-existent-doc', 'req-test');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
