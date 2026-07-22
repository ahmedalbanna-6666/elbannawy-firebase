import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { UnitRepository } from '../../repositories/units/unit.repository';

/**
 * Integration tests for UnitRepository against Firebase Emulator.
 *
 * These tests require the Firebase Emulator Suite to be running locally.
 * Skip these tests if the emulator is not available.
 *
 * To run: firebase emulators:start --only firestore
 * Then: npx jest --testPathPattern=integration
 */

const isEmulatorAvailable = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

const testIntegration = isEmulatorAvailable ? describe : describe.skip;
testIntegration('UnitRepository Integration Tests', () => {
  let repository: UnitRepository;
  const termId = `integration-term-${Date.now()}`;
  const unitId = `integration-unit-${Date.now()}`;

  beforeAll(async () => {
    repository = new UnitRepository();
  });

  afterAll(async () => {
    if (repository && isEmulatorAvailable) {
      await repository.softDeleteUnit(unitId, 'cleanup');
    }
  });

  describe('Create Unit', () => {
    it('creates a unit in Firestore', async () => {
      const result = await repository.createUnit({
        id: unitId,
        academicTermId: termId,
        name: 'Integration Test Unit',
        nameAr: 'وحدة اختبار تكاملي',
        order: 1,
        isPremium: false,
        published: false,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(unitId);
        expect(result.value.academicTermId).toBe(termId);
        expect(result.value.name).toBe('Integration Test Unit');
        expect(result.value.isActive).toBe(true);
        expect(result.value.isPremium).toBe(false);
        expect(result.value.published).toBe(false);
      }
    });

    it('retrieves the created unit by id', async () => {
      const result = await repository.getUnitById(unitId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(unitId);
        expect(result.value.name).toBe('Integration Test Unit');
      }
    });

    it('lists units', async () => {
      const result = await repository.listUnits({}, { limit: 20 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.value.items)).toBe(true);
        expect(result.value.items.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('returns ALREADY_EXISTS for duplicate id', async () => {
      const result = await repository.createUnit({
        id: unitId,
        academicTermId: termId,
        name: 'Duplicate',
        nameAr: 'مكرر',
        order: 1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ALREADY_EXISTS');
      }
    });
  });

  describe('Update Unit', () => {
    it('updates unit name and published status', async () => {
      const result = await repository.updateUnit(unitId, { name: 'Updated Unit', published: true }, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Updated Unit');
        expect(result.value.published).toBe(true);
      }
    });

    it('retrieves updated values', async () => {
      const result = await repository.getUnitById(unitId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Updated Unit');
        expect(result.value.published).toBe(true);
      }
    });
  });

  describe('List by Term', () => {
    it('retrieves units by term', async () => {
      const result = await repository.getUnitsByTerm(termId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(1);
        expect(result.value[0].academicTermId).toBe(termId);
      }
    });
  });

  describe('Soft Delete & Restore', () => {
    it('soft deletes a unit', async () => {
      const result = await repository.softDeleteUnit(unitId, `delete-${Date.now()}`);

      expect(result.ok).toBe(true);
    });

    it('returns not found after soft delete', async () => {
      const result = await repository.getUnitById(unitId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('restores soft-deleted unit', async () => {
      const restoreResult = await repository.restoreUnit(unitId, `restore-${Date.now()}`);
      expect(restoreResult.ok).toBe(true);

      const unit = await repository.getUnitById(unitId);
      expect(unit.ok).toBe(true);
      if (unit.ok) {
        expect(unit.value.id).toBe(unitId);
      }
    });
  });

  describe('Pagination', () => {
    it('supports cursor pagination on units', async () => {
      const page1 = await repository.listUnits({}, { limit: 1 });

      expect(page1.ok).toBe(true);
      if (page1.ok) {
        const page2 = await repository.listUnits(
          {},
          { limit: 1, cursor: page1.value.nextCursor ?? undefined },
        );
        expect(page2.ok).toBe(true);
      }
    });

    it('filters by isActive', async () => {
      const result = await repository.listUnits({ isActive: true }, { limit: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        result.value.items.forEach((unit) => {
          expect(unit.isActive).toBe(true);
        });
      }
    });

    it('filters by published', async () => {
      const result = await repository.listUnits({ published: true }, { limit: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        result.value.items.forEach((unit) => {
          expect(unit.published).toBe(true);
        });
      }
    });

    it('filters by academicTermId', async () => {
      const result = await repository.listUnits({ academicTermId: termId }, { limit: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        result.value.items.forEach((unit) => {
          expect(unit.academicTermId).toBe(termId);
        });
      }
    });

    it('returns empty list for non-matching filters', async () => {
      const result = await repository.listUnits(
        { isPremium: true },
        { limit: 10 },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
        expect(result.value.nextCursor).toBeNull();
      }
    });
  });

  describe('Error Handling', () => {
    it('handles not found for non-existent unit', async () => {
      const result = await repository.getUnitById('non-existent-id-12345');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('handles update of non-existent unit', async () => {
      const result = await repository.updateUnit('non-existent-unit', { name: 'Test' }, 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('handles soft delete of non-existent document', async () => {
      const result = await repository.softDeleteUnit('non-existent-doc', 'req-test');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
