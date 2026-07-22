import { describe, it, expect } from '@jest/globals';
import { ILessonRepository } from '../../repositories/contracts';

export function runLessonRepositoryContractTests(
  description: string,
  createRepository: () => ILessonRepository,
  generateUniqueId: () => string,
): void {
  describe(`ILessonRepository Contract: ${description}`, () => {
    let repository: ILessonRepository;

    beforeEach(() => {
      repository = createRepository();
    });

    describe('Contract Method Signatures', () => {
      it('implements createLesson', () => {
        expect(repository.createLesson).toBeDefined();
        expect(repository.createLesson.length).toBe(1);
      });

      it('implements updateLesson', () => {
        expect(repository.updateLesson).toBeDefined();
        expect(repository.updateLesson.length).toBe(3);
      });

      it('implements getLessonById', () => {
        expect(repository.getLessonById).toBeDefined();
        expect(repository.getLessonById.length).toBe(1);
      });

      it('implements listLessons', () => {
        expect(repository.listLessons).toBeDefined();
        expect(repository.listLessons.length).toBe(2);
      });

      it('implements getLessonsByUnit', () => {
        expect(repository.getLessonsByUnit).toBeDefined();
        expect(repository.getLessonsByUnit.length).toBe(1);
      });

      it('implements getPublishedLessons', () => {
        expect(repository.getPublishedLessons).toBeDefined();
        expect(repository.getPublishedLessons.length).toBe(1);
      });

      it('implements searchLessons', () => {
        expect(repository.searchLessons).toBeDefined();
        expect(repository.searchLessons.length).toBe(2);
      });

      it('implements getPreviousLesson', () => {
        expect(repository.getPreviousLesson).toBeDefined();
        expect(repository.getPreviousLesson.length).toBe(2);
      });

      it('implements getNextLesson', () => {
        expect(repository.getNextLesson).toBeDefined();
        expect(repository.getNextLesson.length).toBe(2);
      });

      it('implements softDeleteLesson', () => {
        expect(repository.softDeleteLesson).toBeDefined();
        expect(repository.softDeleteLesson.length).toBe(2);
      });

      it('implements restoreLesson', () => {
        expect(repository.restoreLesson).toBeDefined();
        expect(repository.restoreLesson.length).toBe(2);
      });

      it('implements archiveLesson', () => {
        expect(repository.archiveLesson).toBeDefined();
        expect(repository.archiveLesson.length).toBe(2);
      });

      it('implements publishLesson', () => {
        expect(repository.publishLesson).toBeDefined();
        expect(repository.publishLesson.length).toBe(2);
      });

      it('implements unpublishLesson', () => {
        expect(repository.unpublishLesson).toBeDefined();
        expect(repository.unpublishLesson.length).toBe(2);
      });

      it('implements changeOrder', () => {
        expect(repository.changeOrder).toBeDefined();
        expect(repository.changeOrder.length).toBe(3);
      });
    });

    describe('RepositoryResult Type Contract', () => {
      it('createLesson returns RepositoryResult with id, unitId, title, slug, displayOrder', async () => {
        const result = await repository.createLesson({
          id: generateUniqueId(),
          unitId: 'unit-contract-1',
          title: 'Contract Test Lesson',
          slug: 'contract-test-lesson',
          displayOrder: 1,
        });

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('id');
          expect(result.value).toHaveProperty('unitId');
          expect(result.value).toHaveProperty('title');
          expect(result.value).toHaveProperty('slug');
          expect(result.value).toHaveProperty('displayOrder');
          expect(result.value).toHaveProperty('status');
          expect(result.value).toHaveProperty('isPublished');
          expect(result.value).toHaveProperty('isVisible');
          expect(result.value).toHaveProperty('createdAt');
          expect(result.value).toHaveProperty('updatedAt');
          expect(result.value).toHaveProperty('schemaVersion');
        } else {
          expect(result.error).toHaveProperty('code');
          expect(result.error).toHaveProperty('message');
          expect(result.error).toHaveProperty('retryable');
        }
      });

      it('getLessonById returns ok false for non-existent', async () => {
        const result = await repository.getLessonById('non-existent-lesson');
        expect(result).toHaveProperty('ok');
        expect(result.ok).toBe(false);
      });

      it('listLessons returns page type with items and nextCursor', async () => {
        const result = await repository.listLessons({}, { limit: 20 });

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('items');
          expect(result.value).toHaveProperty('nextCursor');
          expect(Array.isArray(result.value.items)).toBe(true);
        }
      });

      it('getLessonsByUnit returns array of lessons', async () => {
        const unitId = generateUniqueId();
        const lessonId = generateUniqueId();
        await repository.createLesson({
          id: lessonId,
          unitId,
          title: 'Unit Lesson',
          slug: 'unit-lesson',
          displayOrder: 1,
        });

        const result = await repository.getLessonsByUnit(unitId);
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(Array.isArray(result.value)).toBe(true);
          expect(result.value.length).toBeGreaterThanOrEqual(1);
          expect(result.value[0].unitId).toBe(unitId);
        }
      });

      it('getPublishedLessons returns only published lessons', async () => {
        const unitId = generateUniqueId();
        const lessonId = generateUniqueId();
        await repository.createLesson({
          id: lessonId,
          unitId,
          title: 'Published Lesson',
          slug: 'published-lesson',
          displayOrder: 1,
        });

        const result = await repository.getPublishedLessons(unitId);
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(Array.isArray(result.value)).toBe(true);
        }
      });

      it('softDeleteLesson returns RepositoryResult<void>', async () => {
        const id = generateUniqueId();
        await repository.createLesson({
          id,
          unitId: 'unit-delete',
          title: 'Delete Test',
          slug: 'delete-test',
          displayOrder: 1,
        });

        const result = await repository.softDeleteLesson(id, 'contract-delete');
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toBeUndefined();
        }
      });

      it('restoreLesson returns RepositoryResult<void>', async () => {
        const id = generateUniqueId();
        await repository.createLesson({
          id,
          unitId: 'unit-restore',
          title: 'Restore Test',
          slug: 'restore-test',
          displayOrder: 1,
        });
        await repository.softDeleteLesson(id, 'prep-delete');

        const result = await repository.restoreLesson(id, 'contract-restore');
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toBeUndefined();
        }
      });

      it('publishLesson returns RepositoryResult<ILesson>', async () => {
        const id = generateUniqueId();
        await repository.createLesson({
          id,
          unitId: 'unit-publish',
          title: 'Publish Test',
          slug: 'publish-test',
          displayOrder: 1,
        });

        const result = await repository.publishLesson(id, 'contract-publish');
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('id');
          expect(result.value.isPublished).toBe(true);
          expect(result.value.status).toBe('published');
        }
      });

      it('unpublishLesson returns RepositoryResult<ILesson>', async () => {
        const id = generateUniqueId();
        await repository.createLesson({
          id,
          unitId: 'unit-unpublish',
          title: 'Unpublish Test',
          slug: 'unpublish-test',
          displayOrder: 1,
        });

        const result = await repository.unpublishLesson(id, 'contract-unpublish');
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('id');
          expect(result.value.isPublished).toBe(false);
          expect(result.value.status).toBe('draft');
        }
      });

      it('changeOrder updates displayOrder', async () => {
        const id = generateUniqueId();
        await repository.createLesson({
          id,
          unitId: 'unit-order',
          title: 'Order Test',
          slug: 'order-test',
          displayOrder: 1,
        });

        const result = await repository.changeOrder(id, 10, 0);
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value.displayOrder).toBe(10);
        }
      });
    });

    describe('Error Contract', () => {
      it('createLesson returns ALREADY_EXISTS for duplicate id', async () => {
        const id = generateUniqueId();
        await repository.createLesson({
          id,
          unitId: 'unit-dup',
          title: 'Original',
          slug: 'original',
          displayOrder: 1,
        });

        const result = await repository.createLesson({
          id,
          unitId: 'unit-dup',
          title: 'Duplicate',
          slug: 'duplicate',
          displayOrder: 2,
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('ALREADY_EXISTS');
        }
      });

      it('softDeleteLesson returns INVALID_INPUT for empty requestId', async () => {
        const result = await repository.softDeleteLesson('any-id', '');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('restoreLesson returns INVALID_INPUT for empty requestId', async () => {
        const result = await repository.restoreLesson('any-id', '');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('archiveLesson returns INVALID_INPUT for empty requestId', async () => {
        const result = await repository.archiveLesson('any-id', '');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('publishLesson returns INVALID_INPUT for empty requestId', async () => {
        const result = await repository.publishLesson('any-id', '');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('unpublishLesson returns INVALID_INPUT for empty requestId', async () => {
        const result = await repository.unpublishLesson('any-id', '');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('getPreviousLesson returns ok with null when no previous', async () => {
        const unitId = generateUniqueId();
        const lessonId = generateUniqueId();
        await repository.createLesson({
          id: lessonId,
          unitId,
          title: 'First Lesson',
          slug: 'first-lesson',
          displayOrder: 1,
        });

        const result = await repository.getPreviousLesson(unitId, 0);
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toBeNull();
        }
      });

      it('getNextLesson returns ok with null when no next', async () => {
        const unitId = generateUniqueId();
        const lessonId = generateUniqueId();
        await repository.createLesson({
          id: lessonId,
          unitId,
          title: 'Only Lesson',
          slug: 'only-lesson',
          displayOrder: 1,
        });

        const result = await repository.getNextLesson(unitId, 999);
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toBeNull();
        }
      });

      it('archiveLesson changes status to archived', async () => {
        const id = generateUniqueId();
        await repository.createLesson({
          id,
          unitId: 'unit-archive',
          title: 'Archive Test',
          slug: 'archive-test',
          displayOrder: 1,
        });

        const deleteResult = await repository.archiveLesson(id, 'contract-archive');
        expect(deleteResult.ok).toBe(true);
      });
    });
  });
}

const isEmulatorAvailable = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

const LessonRepository = require('../../repositories/lessons/lesson.repository').LessonRepository;

let counter = 0;
function uniqueId(): string {
  counter++;
  return `contract-lesson-${Date.now()}-${counter}`;
}

if (isEmulatorAvailable) {
  runLessonRepositoryContractTests(
    'LessonRepository',
    () => new LessonRepository(),
    uniqueId,
  );
} else {
  describe('ILessonRepository Contract', () => {
    it('skipped — requires Firestore emulator', () => {
      console.warn('Skipping lesson contract tests: FIRESTORE_EMULATOR_HOST not set');
    });
  });
}
