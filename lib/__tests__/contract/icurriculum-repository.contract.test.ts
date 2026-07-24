import { describe, it, expect } from '@jest/globals';
import { ICurriculumRepository } from '../../repositories/contracts';
import { Page } from '../../shared/types/pagination.types';

/**
 * Contract Tests for ICurriculumRepository.
 *
 * These tests validate that a CurriculumRepository implementation satisfies
 * the ICurriculumRepository contract. Any implementation must pass these tests.
 */

export function runCurriculumRepositoryContractTests(
  description: string,
  createRepository: () => ICurriculumRepository,
  generateUniqueId: () => string,
): void {
  describe(`ICurriculumRepository Contract: ${description}`, () => {
    let repository: ICurriculumRepository;

    beforeEach(() => {
      repository = createRepository();
    });

    describe('Contract Method Signatures', () => {
      it('implements getEducationalSystemById', () => {
        expect(repository.getEducationalSystemById).toBeDefined();
        expect(repository.getEducationalSystemById.length).toBe(1);
      });

      it('implements listEducationalSystems', () => {
        expect(repository.listEducationalSystems).toBeDefined();
        expect(repository.listEducationalSystems.length).toBe(2);
      });

      it('implements getStageById', () => {
        expect(repository.getStageById).toBeDefined();
        expect(repository.getStageById.length).toBe(1);
      });

      it('implements listStages', () => {
        expect(repository.listStages).toBeDefined();
        expect(repository.listStages.length).toBe(2);
      });

      it('implements getStagesBySystem', () => {
        expect(repository.getStagesBySystem).toBeDefined();
        expect(repository.getStagesBySystem.length).toBe(1);
      });

      it('implements getGradeById', () => {
        expect(repository.getGradeById).toBeDefined();
        expect(repository.getGradeById.length).toBe(1);
      });

      it('implements listGrades', () => {
        expect(repository.listGrades).toBeDefined();
        expect(repository.listGrades.length).toBe(2);
      });

      it('implements getGradesByStage', () => {
        expect(repository.getGradesByStage).toBeDefined();
        expect(repository.getGradesByStage.length).toBe(1);
      });

      it('implements createAcademicYear', () => {
        expect(repository.createAcademicYear).toBeDefined();
        expect(repository.createAcademicYear.length).toBe(1);
      });

      it('implements updateAcademicYear', () => {
        expect(repository.updateAcademicYear).toBeDefined();
        expect(repository.updateAcademicYear.length).toBe(3);
      });

      it('implements getAcademicYearById', () => {
        expect(repository.getAcademicYearById).toBeDefined();
        expect(repository.getAcademicYearById.length).toBe(1);
      });

      it('implements listAcademicYears', () => {
        expect(repository.listAcademicYears).toBeDefined();
        expect(repository.listAcademicYears.length).toBe(2);
      });

      it('implements createAcademicTerm', () => {
        expect(repository.createAcademicTerm).toBeDefined();
        expect(repository.createAcademicTerm.length).toBe(1);
      });

      it('implements updateAcademicTerm', () => {
        expect(repository.updateAcademicTerm).toBeDefined();
        expect(repository.updateAcademicTerm.length).toBe(3);
      });

      it('implements getAcademicTermById', () => {
        expect(repository.getAcademicTermById).toBeDefined();
        expect(repository.getAcademicTermById.length).toBe(1);
      });

      it('implements listAcademicTerms', () => {
        expect(repository.listAcademicTerms).toBeDefined();
        expect(repository.listAcademicTerms.length).toBe(2);
      });

      it('implements getTermsByAcademicYear', () => {
        expect(repository.getTermsByAcademicYear).toBeDefined();
        expect(repository.getTermsByAcademicYear.length).toBe(1);
      });

      it('implements getCurrentAcademicYear', () => {
        expect(repository.getCurrentAcademicYear).toBeDefined();
        expect(repository.getCurrentAcademicYear.length).toBe(0);
      });

      it('implements getCurrentAcademicTerm', () => {
        expect(repository.getCurrentAcademicTerm).toBeDefined();
        expect(repository.getCurrentAcademicTerm.length).toBe(1);
      });

      it('implements getCurrentAcademicContext', () => {
        expect(repository.getCurrentAcademicContext).toBeDefined();
        expect(repository.getCurrentAcademicContext.length).toBe(0);
      });

      it('implements softDeleteCurriculum', () => {
        expect(repository.softDeleteCurriculum).toBeDefined();
        expect(repository.softDeleteCurriculum.length).toBe(3);
      });

      it('implements restoreCurriculum', () => {
        expect(repository.restoreCurriculum).toBeDefined();
        expect(repository.restoreCurriculum.length).toBe(3);
      });
    });

    describe('RepositoryResult Type Contract', () => {
      it('getEducationalSystemById returns known system', async () => {
        const result = await repository.getEducationalSystemById('GENERAL');
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('id');
          expect(result.value).toHaveProperty('name');
          expect(result.value).toHaveProperty('nameAr');
          expect(result.value).toHaveProperty('isActive');
        }
      });

      it('getEducationalSystemById returns ok false for non-existent', async () => {
        const result = await repository.getEducationalSystemById('non-existent');
        expect(result).toHaveProperty('ok');
        expect(result.ok).toBe(false);
      });

      it('listEducationalSystems returns page type with items and nextCursor', async () => {
        const result = await repository.listEducationalSystems({}, { limit: 20 });

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('items');
          expect(result.value).toHaveProperty('nextCursor');
          expect(Array.isArray(result.value.items)).toBe(true);
        }
      });

      it('getStageById returns known stage', async () => {
        const result = await repository.getStageById('PRIMARY');
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('educationalSystemId');
          expect(result.value).toHaveProperty('order');
        }
      });

      it('getGradeById returns known grade', async () => {
        const result = await repository.getGradeById('GRADE_1');
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('educationalSystemId');
          expect(result.value).toHaveProperty('stageId');
        }
      });

      it('createAcademicYear returns RepositoryResult with dates', async () => {
        const result = await repository.createAcademicYear({
          id: generateUniqueId(),
          educationalSystemId: 'GENERAL',
          name: '2025-2026',
          nameAr: '2025-2026',
          startDate: '2025-09-01',
          endDate: '2026-06-30',
        });

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('startDate');
          expect(result.value).toHaveProperty('endDate');
          expect(result.value).toHaveProperty('isCurrent');
        }
      });

      it('createAcademicTerm returns RepositoryResult with academicYearId', async () => {
        const yearId = generateUniqueId();
        await repository.createAcademicYear({
          id: yearId,
          educationalSystemId: 'GENERAL',
          name: '2025-2026',
          nameAr: '2025-2026',
          startDate: '2025-09-01',
          endDate: '2026-06-30',
        });

        const result = await repository.createAcademicTerm({
          id: generateUniqueId(),
          academicYearId: yearId,
          name: 'First Term',
          nameAr: 'الفصل الأول',
          order: 1,
          startDate: '2025-09-01',
          endDate: '2026-01-31',
        });

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('academicYearId');
          expect(result.value).toHaveProperty('order');
        }
      });

      it('softDeleteCurriculum returns RepositoryResult<void>', async () => {
        const id = generateUniqueId();
        await repository.createAcademicYear({
          id,
          educationalSystemId: 'GENERAL',
          name: '2025-2026',
          nameAr: '2025-2026',
          startDate: '2025-09-01',
          endDate: '2026-06-30',
        });

        const result = await repository.softDeleteCurriculum(id, 'academicYears', 'contract-delete');
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toBeUndefined();
        }
      });

      it('restoreCurriculum returns RepositoryResult<void>', async () => {
        const id = generateUniqueId();
        await repository.createAcademicYear({
          id,
          educationalSystemId: 'GENERAL',
          name: '2025-2026',
          nameAr: '2025-2026',
          startDate: '2025-09-01',
          endDate: '2026-06-30',
        });
        await repository.softDeleteCurriculum(id, 'academicYears', 'prep-delete');

        const result = await repository.restoreCurriculum(id, 'academicYears', 'contract-restore');
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toBeUndefined();
        }
      });
    });

    describe('Error Contract', () => {
      it('getEducationalSystemById returns non-throwing result for empty id', async () => {
        const result = await repository.getEducationalSystemById('');
        expect(result).toBeDefined();
        expect(result.ok).toBe(false);
      });

      it('listStages uses ICurriculumRepository return type', async () => {
        const result = await repository.listStages({}, { limit: 20 });
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          const page: Page<any> = result.value;
          expect(page.items).toBeDefined();
          expect(page.nextCursor).toBeDefined();
        }
      });

      it('softDeleteCurriculum returns INVALID_INPUT for empty requestId', async () => {
        const result = await repository.softDeleteCurriculum('any-id', 'academicYears', '');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('restoreCurriculum returns INVALID_INPUT for empty requestId', async () => {
        const result = await repository.restoreCurriculum('any-id', 'academicYears', '');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });
    });
  });
}

const isEmulatorAvailable = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

const CurriculumRepository = require('../../repositories/curriculum/curriculum.repository').CurriculumRepository;

let counter = 0;
function uniqueId(): string {
  counter++;
  return `contract-curriculum-${Date.now()}-${counter}`;
}

if (isEmulatorAvailable) {
  runCurriculumRepositoryContractTests(
    'CurriculumRepository',
    () => new CurriculumRepository(),
    uniqueId,
  );
} else {
  describe('ICurriculumRepository Contract', () => {
    it('skipped — requires Firestore emulator', () => {
      console.warn('Skipping curriculum contract tests: FIRESTORE_EMULATOR_HOST not set');
    });
  });
}
