import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CurriculumRepository } from '../../../repositories/curriculum/curriculum.repository';

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
      value: { items: [], nextCursor: null },
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

describe('CurriculumRepository - Static Educational Entities', () => {
  let repository: CurriculumRepository;

  beforeEach(() => {
    repository = new CurriculumRepository();
  });

  describe('getEducationalSystemById', () => {
    it('returns GENERAL system', async () => {
      const result = await repository.getEducationalSystemById('GENERAL');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('GENERAL');
        expect(result.value.nameAr).toBe('عام');
      }
    });

    it('returns LANGUAGE system', async () => {
      const result = await repository.getEducationalSystemById('LANGUAGE');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('LANGUAGE');
        expect(result.value.nameAr).toBe('لغات');
      }
    });

    it('returns INTERNATIONAL system', async () => {
      const result = await repository.getEducationalSystemById('INTERNATIONAL');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('INTERNATIONAL');
        expect(result.value.nameAr).toBe('دولي');
      }
    });

    it('returns NOT_FOUND for invalid id', async () => {
      const result = await repository.getEducationalSystemById('INVALID');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('listEducationalSystems', () => {
    it('returns all active systems', async () => {
      const result = await repository.listEducationalSystems({}, { limit: 100 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items.length).toBe(3);
        expect(result.value.items[0].id).toBe('GENERAL');
      }
    });
  });

  describe('getStageById', () => {
    it('returns PRIMARY stage', async () => {
      const result = await repository.getStageById('PRIMARY');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('PRIMARY');
        expect(result.value.nameAr).toBe('ابتدائي');
      }
    });

    it('returns PREPARATORY stage', async () => {
      const result = await repository.getStageById('PREPARATORY');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('PREPARATORY');
        expect(result.value.nameAr).toBe('إعدادي');
      }
    });

    it('returns SECONDARY stage', async () => {
      const result = await repository.getStageById('SECONDARY');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('SECONDARY');
        expect(result.value.nameAr).toBe('ثانوي');
      }
    });

    it('returns NOT_FOUND for invalid id', async () => {
      const result = await repository.getStageById('INVALID');
      expect(result.ok).toBe(false);
    });
  });

  describe('listStages', () => {
    it('returns all stages', async () => {
      const result = await repository.listStages({}, { limit: 100 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items.length).toBe(3);
      }
    });

    it('filters by educationalSystemId', async () => {
      const result = await repository.listStages({ educationalSystemId: 'GENERAL' }, { limit: 100 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items.every((s) => s.educationalSystemId === 'GENERAL')).toBe(true);
      }
    });
  });

  describe('getStagesBySystem', () => {
    it('returns stages for GENERAL system', async () => {
      const result = await repository.getStagesBySystem('GENERAL');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(3);
      }
    });
  });

  describe('getGradeById', () => {
    it('returns GRADE_1', async () => {
      const result = await repository.getGradeById('GRADE_1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('GRADE_1');
        expect(result.value.nameAr).toBe('الصف الأول الابتدائي');
        expect(result.value.stageId).toBe('PRIMARY');
      }
    });

    it('returns GRADE_12', async () => {
      const result = await repository.getGradeById('GRADE_12');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('GRADE_12');
        expect(result.value.stageId).toBe('SECONDARY');
      }
    });

    it('returns NOT_FOUND for invalid id', async () => {
      const result = await repository.getGradeById('INVALID');
      expect(result.ok).toBe(false);
    });
  });

  describe('listGrades', () => {
    it('returns all grades', async () => {
      const result = await repository.listGrades({}, { limit: 100 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items.length).toBe(12);
      }
    });

    it('filters by stageId', async () => {
      const result = await repository.listGrades({ stageId: 'PRIMARY' }, { limit: 100 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items.length).toBe(6);
        expect(result.value.items.every((g) => g.stageId === 'PRIMARY')).toBe(true);
      }
    });
  });

  describe('getGradesByStage', () => {
    it('returns grades for PRIMARY', async () => {
      const result = await repository.getGradesByStage('PRIMARY');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(6);
      }
    });

    it('returns grades for PREPARATORY', async () => {
      const result = await repository.getGradesByStage('PREPARATORY');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(3);
      }
    });

    it('returns grades for SECONDARY', async () => {
      const result = await repository.getGradesByStage('SECONDARY');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(3);
      }
    });
  });
});
