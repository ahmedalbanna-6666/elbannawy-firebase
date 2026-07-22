import type { IActivityRepository, IActivity, Page, ActivityFilter, IActivitySummary } from '../../repositories/contracts';
import type { PageQuery } from '../../shared/types/pagination.types';

export function runActivityRepositoryContractTests(
  suiteName: string,
  factory: () => IActivityRepository,
): void {
  describe(`Activity Repository Contract: ${suiteName}`, () => {
    let repo: IActivityRepository;
    const requestId = 'test-request-id';

    beforeEach(() => {
      repo = factory();
    });

    describe('createActivity', () => {
      it('creates and returns an activity', async () => {
        const result = await repo.createActivity({
          id: 'contract-act-001',
          lessonId: 'contract-lesson-001',
          type: 'multiple-choice',
          title: 'Contract Test Activity',
          displayOrder: 1,
          config: { schemaVersion: 1, data: { options: ['A', 'B'] } },
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.id).toBe('contract-act-001');
          expect(result.value.status).toBe('draft');
        }
      });

      it('rejects duplicate id', async () => {
        await repo.createActivity({
          id: 'contract-act-002',
          lessonId: 'l-1', type: 'mcq', title: 'First', displayOrder: 1,
          config: { schemaVersion: 1, data: {} },
        });
        const result = await repo.createActivity({
          id: 'contract-act-002',
          lessonId: 'l-1', type: 'mcq', title: 'Duplicate', displayOrder: 2,
          config: { schemaVersion: 1, data: {} },
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('ALREADY_EXISTS');
      });
    });

    describe('getActivityById', () => {
      it('retrieves an existing activity', async () => {
        await repo.createActivity({
          id: 'contract-act-003',
          lessonId: 'l-1', type: 'mcq', title: 'Get Test', displayOrder: 1,
          config: { schemaVersion: 1, data: {} },
        });
        const result = await repo.getActivityById('contract-act-003');
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value.title).toBe('Get Test');
      });

      it('returns not found for missing activity', async () => {
        const result = await repo.getActivityById('nonexistent');
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
      });

      it('returns not found for deleted activity', async () => {
        await repo.createActivity({
          id: 'contract-act-deleted',
          lessonId: 'l-1', type: 'mcq', title: 'Delete Me', displayOrder: 1,
          config: { schemaVersion: 1, data: {} },
        });
        await repo.softDeleteActivity('contract-act-deleted', requestId);
        const result = await repo.getActivityById('contract-act-deleted');
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
      });
    });

    describe('updateActivity', () => {
      it('updates activity fields', async () => {
        await repo.createActivity({
          id: 'contract-act-004',
          lessonId: 'l-1', type: 'mcq', title: 'Original', displayOrder: 1,
          config: { schemaVersion: 1, data: {} },
        });
        const result = await repo.updateActivity('contract-act-004', { title: 'Updated' }, 1);
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value.title).toBe('Updated');
      });

      it('returns not found for missing activity', async () => {
        const result = await repo.updateActivity('nonexistent', { title: 'Nope' }, 1);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
      });
    });

    describe('listActivities', () => {
      it('lists activities with filtering', async () => {
        await repo.createActivity({
          id: 'contract-listing-1',
          lessonId: 'listing-lesson',
          type: 'mcq', title: 'Listing A', displayOrder: 1,
          config: { schemaVersion: 1, data: {} },
        });
        await repo.createActivity({
          id: 'contract-listing-2',
          lessonId: 'listing-lesson',
          type: 'fill-blank', title: 'Listing B', displayOrder: 2,
          config: { schemaVersion: 1, data: {} },
        });
        const result = await repo.listActivities({ lessonId: 'listing-lesson' }, { limit: 10 });
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value.items.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('publishActivity', () => {
      it('publishes a draft activity', async () => {
        await repo.createActivity({
          id: 'contract-pub-1',
          lessonId: 'l-1', type: 'mcq', title: 'Publish Me', displayOrder: 1,
          config: { schemaVersion: 1, data: {} },
        });
        const result = await repo.publishActivity('contract-pub-1', requestId);
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value.status).toBe('published');
      });

      it('rejects publish for missing activity', async () => {
        const result = await repo.publishActivity('nonexistent', requestId);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
      });
    });

    describe('unpublishActivity', () => {
      it('unpublishes an activity', async () => {
        await repo.createActivity({
          id: 'contract-unpub-1',
          lessonId: 'l-1', type: 'mcq', title: 'Unpublish Me', displayOrder: 1,
          config: { schemaVersion: 1, data: {} },
        });
        await repo.publishActivity('contract-unpub-1', requestId);
        const result = await repo.unpublishActivity('contract-unpub-1', requestId);
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value.status).toBe('draft');
      });
    });

    describe('softDelete / restore', () => {
      it('soft deletes an activity', async () => {
        await repo.createActivity({
          id: 'contract-del-1',
          lessonId: 'l-1', type: 'mcq', title: 'Delete Me', displayOrder: 1,
          config: { schemaVersion: 1, data: {} },
        });
        const result = await repo.softDeleteActivity('contract-del-1', requestId);
        expect(result.ok).toBe(true);
        const getResult = await repo.getActivityById('contract-del-1');
        expect(getResult.ok).toBe(false);
      });

      it('restores a deleted activity', async () => {
        await repo.createActivity({
          id: 'contract-restore-1',
          lessonId: 'l-1', type: 'mcq', title: 'Restore Me', displayOrder: 1,
          config: { schemaVersion: 1, data: {} },
        });
        await repo.softDeleteActivity('contract-restore-1', requestId);
        await repo.restoreActivity('contract-restore-1', requestId);
        const result = await repo.getActivityById('contract-restore-1');
        expect(result.ok).toBe(true);
      });
    });

    describe('changeActivityOrder', () => {
      it('changes display order', async () => {
        await repo.createActivity({
          id: 'contract-order-1',
          lessonId: 'l-1', type: 'mcq', title: 'Order Me', displayOrder: 1,
          config: { schemaVersion: 1, data: {} },
        });
        const result = await repo.changeActivityOrder('contract-order-1', 5, 1);
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value.displayOrder).toBe(5);
      });
    });
  });
}
