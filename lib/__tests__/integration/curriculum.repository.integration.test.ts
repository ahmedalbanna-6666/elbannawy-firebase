import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { CurriculumRepository } from '../../repositories/curriculum/curriculum.repository';
import { CurriculumCollection } from '../../repositories/contracts';

/**
 * Integration tests for CurriculumRepository against Firebase Emulator.
 *
 * These tests require the Firebase Emulator Suite to be running locally.
 * Skip these tests if the emulator is not available.
 *
 * To run: firebase emulators:start --only firestore
 * Then: npx jest --testPathPattern=integration
 */

const isEmulatorAvailable = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

const testIntegration = isEmulatorAvailable ? describe : describe.skip;
testIntegration('CurriculumRepository Integration Tests', () => {
  let repository: CurriculumRepository;
  const systemId = `integration-sys-${Date.now()}`;
  const stageId = `integration-stage-${Date.now()}`;
  const gradeId = `integration-grade-${Date.now()}`;
  const yearId = `integration-year-${Date.now()}`;
  const termId = `integration-term-${Date.now()}`;

  beforeAll(async () => {
    repository = new CurriculumRepository();
  });

  afterAll(async () => {
    if (repository && isEmulatorAvailable) {
      await repository.softDeleteCurriculum(termId, 'academicTerms', 'cleanup');
      await repository.softDeleteCurriculum(yearId, 'academicYears', 'cleanup');
      await repository.softDeleteCurriculum(gradeId, 'grades', 'cleanup');
      await repository.softDeleteCurriculum(stageId, 'stages', 'cleanup');
      await repository.softDeleteCurriculum(systemId, 'educationalSystems', 'cleanup');
    }
  });

  describe('Educational System', () => {
    it('creates an educational system in Firestore', async () => {
      const result = await repository.createEducationalSystem({
        id: systemId,
        name: 'Integration Test System',
        nameAr: 'نظام اختبار تكاملي',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(systemId);
        expect(result.value.name).toBe('Integration Test System');
        expect(result.value.isActive).toBe(true);
      }
    });

    it('retrieves the created educational system by id', async () => {
      const result = await repository.getEducationalSystemById(systemId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(systemId);
        expect(result.value.name).toBe('Integration Test System');
      }
    });

    it('lists educational systems', async () => {
      const result = await repository.listEducationalSystems({}, { limit: 20 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.value.items)).toBe(true);
        expect(result.value.items.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('returns ALREADY_EXISTS for duplicate id', async () => {
      const result = await repository.createEducationalSystem({
        id: systemId,
        name: 'Duplicate',
        nameAr: 'مكرر',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ALREADY_EXISTS');
      }
    });
  });

  describe('Stage', () => {
    it('creates a stage', async () => {
      const result = await repository.createStage({
        id: stageId,
        educationalSystemId: systemId,
        name: 'Primary',
        nameAr: 'ابتدائي',
        order: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.educationalSystemId).toBe(systemId);
        expect(result.value.order).toBe(1);
      }
    });

    it('retrieves stages by system', async () => {
      const result = await repository.getStagesBySystem(systemId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(1);
        expect(result.value[0].educationalSystemId).toBe(systemId);
      }
    });
  });

  describe('Grade', () => {
    it('creates a grade', async () => {
      const result = await repository.createGrade({
        id: gradeId,
        educationalSystemId: systemId,
        stageId,
        name: 'Grade 1',
        nameAr: 'الصف الأول',
        order: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.stageId).toBe(stageId);
      }
    });

    it('retrieves grades by stage', async () => {
      const result = await repository.getGradesByStage(stageId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Academic Year', () => {
    it('creates an academic year', async () => {
      const result = await repository.createAcademicYear({
        id: yearId,
        educationalSystemId: systemId,
        name: '2025-2026',
        nameAr: '2025-2026',
        startDate: '2025-09-01',
        endDate: '2026-06-30',
        isCurrent: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.educationalSystemId).toBe(systemId);
        expect(result.value.isCurrent).toBe(true);
      }
    });

    it('retrieves current academic year', async () => {
      const result = await repository.getCurrentAcademicYear();

      expect(result.ok).toBe(true);
      if (result.ok && result.value) {
        expect(result.value.educationalSystemId).toBe(systemId);
      }
    });
  });

  describe('Academic Term', () => {
    it('creates an academic term', async () => {
      const result = await repository.createAcademicTerm({
        id: termId,
        academicYearId: yearId,
        name: 'First Term',
        nameAr: 'الفصل الأول',
        order: 1,
        startDate: '2025-09-01',
        endDate: '2026-01-31',
        isCurrent: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.academicYearId).toBe(yearId);
        expect(result.value.isCurrent).toBe(true);
      }
    });

    it('retrieves terms by academic year', async () => {
      const result = await repository.getTermsByAcademicYear(yearId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('retrieves current academic context', async () => {
      const result = await repository.getCurrentAcademicContext();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.academicYear).toBeNull();
        expect(result.value.academicTerm).toBeNull();
      }
    });
  });

  describe('Soft Delete & Restore', () => {
    it('soft deletes an educational system', async () => {
      const result = await repository.softDeleteCurriculum(systemId, 'educationalSystems', `delete-${Date.now()}`);

      expect(result.ok).toBe(true);
    });

    it('returns not found after soft delete', async () => {
      const result = await repository.getEducationalSystemById(systemId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('restores soft-deleted educational system', async () => {
      const restoreResult = await repository.restoreCurriculum(systemId, 'educationalSystems', `restore-${Date.now()}`);
      expect(restoreResult.ok).toBe(true);

      const system = await repository.getEducationalSystemById(systemId);
      expect(system.ok).toBe(true);
      if (system.ok) {
        expect(system.value.id).toBe(systemId);
      }
    });
  });

  describe('Pagination', () => {
    it('supports cursor pagination on educational systems', async () => {
      const page1 = await repository.listEducationalSystems({}, { limit: 1 });

      expect(page1.ok).toBe(true);
      if (page1.ok) {
        const page2 = await repository.listEducationalSystems(
          {},
          { limit: 1, cursor: page1.value.nextCursor ?? undefined },
        );
        expect(page2.ok).toBe(true);
      }
    });

    it('filters by isActive', async () => {
      const result = await repository.listEducationalSystems({ isActive: true }, { limit: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        result.value.items.forEach((system) => {
          expect(system.isActive).toBe(true);
        });
      }
    });

    it('returns empty list for non-matching filters', async () => {
      const result = await repository.listEducationalSystems(
        { isActive: false },
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
    it('handles not found for non-existent educational system', async () => {
      const result = await repository.getEducationalSystemById('non-existent-id-12345');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('handles not found for non-existent stage', async () => {
      const result = await repository.getStageById('non-existent-stage');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('handles soft delete of non-existent document', async () => {
      const result = await repository.softDeleteCurriculum('non-existent-doc', 'educationalSystems', 'req-test');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
