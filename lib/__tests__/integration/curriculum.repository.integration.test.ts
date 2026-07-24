import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { CurriculumRepository } from '../../repositories/curriculum/curriculum.repository';

/**
 * Integration tests for CurriculumRepository against Firebase Emulator.
 *
 * These tests require the Firebase Emulator Suite to be running locally.
 * Static entities (educational systems, stages, grades) are tested from constants.
 * Dynamic entities (academic years, terms) are tested against Firestore.
 */

const isEmulatorAvailable = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

const testIntegration = isEmulatorAvailable ? describe : describe.skip;
testIntegration('CurriculumRepository Integration Tests', () => {
  let repository: CurriculumRepository;
  const yearId = `integration-year-${Date.now()}`;
  const termId = `integration-term-${Date.now()}`;

  beforeAll(async () => {
    repository = new CurriculumRepository();
  });

  afterAll(async () => {
    if (repository && isEmulatorAvailable) {
      await repository.softDeleteCurriculum(termId, 'academicTerms', 'cleanup');
      await repository.softDeleteCurriculum(yearId, 'academicYears', 'cleanup');
    }
  });

  describe('Educational System (Static Constants)', () => {
    it('returns GENERAL system from constants', async () => {
      const result = await repository.getEducationalSystemById('GENERAL');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.nameAr).toBe('عام');
      }
    });

    it('returns all systems from constants', async () => {
      const result = await repository.listEducationalSystems({}, { limit: 20 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items.length).toBe(3);
      }
    });

    it('returns NOT_FOUND for non-existent system', async () => {
      const result = await repository.getEducationalSystemById('non-existent-id-12345');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('Stage (Static Constants)', () => {
    it('returns PRIMARY stage from constants', async () => {
      const result = await repository.getStageById('PRIMARY');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.nameAr).toBe('ابتدائي');
      }
    });

    it('returns stages by system from constants', async () => {
      const result = await repository.getStagesBySystem('GENERAL');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('returns NOT_FOUND for non-existent stage', async () => {
      const result = await repository.getStageById('non-existent-stage');
      expect(result.ok).toBe(false);
    });
  });

  describe('Grade (Static Constants)', () => {
    it('returns GRADE_1 from constants', async () => {
      const result = await repository.getGradeById('GRADE_1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.stageId).toBe('PRIMARY');
      }
    });

    it('returns grades by stage from constants', async () => {
      const result = await repository.getGradesByStage('PRIMARY');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(6);
      }
    });
  });

  describe('Academic Year (Dynamic - Firestore)', () => {
    it('creates an academic year in Firestore', async () => {
      const result = await repository.createAcademicYear({
        id: yearId,
        educationalSystemId: 'GENERAL',
        name: '2025-2026',
        nameAr: '2025-2026',
        startDate: '2025-09-01',
        endDate: '2026-06-30',
        isCurrent: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.educationalSystemId).toBe('GENERAL');
        expect(result.value.isCurrent).toBe(true);
      }
    });

    it('retrieves current academic year', async () => {
      const result = await repository.getCurrentAcademicYear();

      expect(result.ok).toBe(true);
      if (result.ok && result.value) {
        expect(result.value.educationalSystemId).toBe('GENERAL');
      }
    });
  });

  describe('Academic Term (Dynamic - Firestore)', () => {
    it('creates an academic term in Firestore', async () => {
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
        expect(result.value.academicYear).toBeDefined();
        expect(result.value.academicTerm).toBeDefined();
      }
    });
  });

  describe('Soft Delete & Restore (Academic Years)', () => {
    it('soft deletes an academic year', async () => {
      const result = await repository.softDeleteCurriculum(yearId, 'academicYears', `delete-${Date.now()}`);
      expect(result.ok).toBe(true);
    });

    it('restores soft-deleted academic year', async () => {
      const restoreResult = await repository.restoreCurriculum(yearId, 'academicYears', `restore-${Date.now()}`);
      expect(restoreResult.ok).toBe(true);

      const year = await repository.getAcademicYearById(yearId);
      expect(year.ok).toBe(true);
      if (year.ok) {
        expect(year.value.id).toBe(yearId);
      }
    });
  });

  describe('Error Handling', () => {
    it('handles soft delete of non-existent document in academicYears', async () => {
      const result = await repository.softDeleteCurriculum('non-existent-doc', 'academicYears', 'req-test');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('handles not found for non-existent educational system', async () => {
      const result = await repository.getEducationalSystemById('non-existent-id-12345');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('handles not found for non-existent grade', async () => {
      const result = await repository.getGradeById('non-existent-grade');
      expect(result.ok).toBe(false);
    });
  });
});
