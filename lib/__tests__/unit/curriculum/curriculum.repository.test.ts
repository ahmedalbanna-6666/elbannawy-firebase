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

describe('CurriculumRepository', () => {
  let repository: CurriculumRepository;
  let mockDoc: ReturnType<typeof createMockDoc>;

  beforeEach(() => {
    mockDoc = createMockDoc();
    (getFirestoreInstance as jest.Mock).mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => mockDoc),
      })),
    });
    repository = new CurriculumRepository();
  });

  describe('createEducationalSystem', () => {
    it('creates educational system successfully', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            name: 'Egyptian National',
            nameAr: 'مصري وطني',
            description: null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'sys-1',
        });

      const result = await repository.createEducationalSystem({
        id: 'sys-1',
        name: 'Egyptian National',
        nameAr: 'مصري وطني',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Egyptian National');
      }
    });
  });

  describe('getEducationalSystemById', () => {
    it('returns NOT_FOUND for non-existent system', async () => {
      const result = await repository.getEducationalSystemById('non-existent');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('listEducationalSystems', () => {
    it('returns empty list when no systems match', async () => {
      const result = await repository.listEducationalSystems({}, { limit: 20 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
        expect(result.value.nextCursor).toBeNull();
      }
    });
  });

  describe('createStage', () => {
    it('creates stage successfully', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            educationalSystemId: 'sys-1',
            name: 'Primary',
            nameAr: 'ابتدائي',
            order: 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'stage-1',
        });

      const result = await repository.createStage({
        id: 'stage-1',
        educationalSystemId: 'sys-1',
        name: 'Primary',
        nameAr: 'ابتدائي',
        order: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.order).toBe(1);
      }
    });
  });

  describe('getStageById', () => {
    it('returns NOT_FOUND for non-existent stage', async () => {
      const result = await repository.getStageById('non-existent');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('listStages', () => {
    it('returns empty list when no stages match', async () => {
      const result = await repository.listStages({}, { limit: 20 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
      }
    });
  });

  describe('getStagesBySystem', () => {
    it('returns empty list for system with no stages', async () => {
      const result = await repository.getStagesBySystem('sys-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('createGrade', () => {
    it('creates grade successfully', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            educationalSystemId: 'sys-1',
            stageId: 'stage-1',
            name: 'Grade 1',
            nameAr: 'الصف الأول',
            order: 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'grade-1',
        });

      const result = await repository.createGrade({
        id: 'grade-1',
        educationalSystemId: 'sys-1',
        stageId: 'stage-1',
        name: 'Grade 1',
        nameAr: 'الصف الأول',
        order: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.stageId).toBe('stage-1');
      }
    });
  });

  describe('getGradeById', () => {
    it('returns NOT_FOUND for non-existent grade', async () => {
      const result = await repository.getGradeById('non-existent');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('listGrades', () => {
    it('returns empty list when no grades match', async () => {
      const result = await repository.listGrades({}, { limit: 20 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
      }
    });
  });

  describe('getGradesByStage', () => {
    it('returns empty list for stage with no grades', async () => {
      const result = await repository.getGradesByStage('stage-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('createAcademicYear', () => {
    it('creates academic year successfully', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            educationalSystemId: 'sys-1',
            name: '2025-2026',
            nameAr: '2025-2026',
            startDate: '2025-09-01',
            endDate: '2026-06-30',
            isCurrent: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'year-1',
        });

      const result = await repository.createAcademicYear({
        id: 'year-1',
        educationalSystemId: 'sys-1',
        name: '2025-2026',
        nameAr: '2025-2026',
        startDate: '2025-09-01',
        endDate: '2026-06-30',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.startDate).toBe('2025-09-01');
      }
    });
  });

  describe('getAcademicYearById', () => {
    it('returns NOT_FOUND for non-existent academic year', async () => {
      const result = await repository.getAcademicYearById('non-existent');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('listAcademicYears', () => {
    it('returns empty list when no academic years match', async () => {
      const result = await repository.listAcademicYears({}, { limit: 20 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
      }
    });
  });

  describe('createAcademicTerm', () => {
    it('creates academic term successfully', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            academicYearId: 'year-1',
            name: 'First Term',
            nameAr: 'الفصل الأول',
            order: 1,
            startDate: '2025-09-01',
            endDate: '2026-01-31',
            isCurrent: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'term-1',
        });

      const result = await repository.createAcademicTerm({
        id: 'term-1',
        academicYearId: 'year-1',
        name: 'First Term',
        nameAr: 'الفصل الأول',
        order: 1,
        startDate: '2025-09-01',
        endDate: '2026-01-31',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('First Term');
      }
    });
  });

  describe('getAcademicTermById', () => {
    it('returns NOT_FOUND for non-existent academic term', async () => {
      const result = await repository.getAcademicTermById('non-existent');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('listAcademicTerms', () => {
    it('returns empty list when no academic terms match', async () => {
      const result = await repository.listAcademicTerms({}, { limit: 20 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
      }
    });
  });

  describe('getTermsByAcademicYear', () => {
    it('returns empty list for year with no terms', async () => {
      const result = await repository.getTermsByAcademicYear('year-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('getCurrentAcademicYear', () => {
    it('returns null when no current year', async () => {
      const result = await repository.getCurrentAcademicYear();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('getCurrentAcademicTerm', () => {
    it('returns null when no current term', async () => {
      const result = await repository.getCurrentAcademicTerm('year-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('getCurrentAcademicContext', () => {
    it('returns context with null fields by default', async () => {
      const result = await repository.getCurrentAcademicContext();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.educationalSystem).toBeNull();
        expect(result.value.stage).toBeNull();
        expect(result.value.grade).toBeNull();
        expect(result.value.academicYear).toBeNull();
        expect(result.value.academicTerm).toBeNull();
      }
    });
  });

  describe('softDeleteCurriculum', () => {
    it('returns INVALID_INPUT for empty requestId', async () => {
      const result = await repository.softDeleteCurriculum('sys-1', 'educationalSystems', '');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns NOT_FOUND for non-existent document', async () => {
      const result = await repository.softDeleteCurriculum('non-existent', 'educationalSystems', 'req-1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('restoreCurriculum', () => {
    it('returns INVALID_INPUT for empty requestId', async () => {
      const result = await repository.restoreCurriculum('sys-1', 'educationalSystems', '');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns NOT_FOUND for non-existent document', async () => {
      const result = await repository.restoreCurriculum('non-existent', 'educationalSystems', 'req-1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
