import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UnitRepository } from '../../../repositories/units/unit.repository';

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

describe('UnitRepository', () => {
  let repository: UnitRepository;
  let mockDoc: ReturnType<typeof createMockDoc>;

  beforeEach(() => {
    mockDoc = createMockDoc();
    (getFirestoreInstance as jest.Mock).mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => mockDoc),
      })),
    });
    repository = new UnitRepository();
  });

  describe('createUnit', () => {
    it('creates unit successfully', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            academicTermId: 'term-1',
            name: 'Test Unit',
            nameAr: 'وحدة اختبار',
            description: null,
            order: 1,
            isActive: true,
            isPremium: false,
            published: false,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'unit-1',
        });

      const result = await repository.createUnit({
        id: 'unit-1',
        academicTermId: 'term-1',
        name: 'Test Unit',
        nameAr: 'وحدة اختبار',
        order: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('unit-1');
        expect(result.value.name).toBe('Test Unit');
        expect(result.value.isActive).toBe(true);
        expect(result.value.isPremium).toBe(false);
        expect(result.value.published).toBe(false);
      }
    });

    it('creates unit with gradeId', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            academicTermId: 'term-1',
            gradeId: 'GRADE_7',
            academicYearId: 'year-2025',
            educationalSystemId: 'GENERAL',
            name: 'Grade 7 Unit',
            nameAr: 'وحدة الصف السابع',
            description: null,
            order: 1,
            isActive: true,
            isPremium: false,
            published: false,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'unit-grade7',
        });

      const result = await repository.createUnit({
        id: 'unit-grade7',
        academicTermId: 'term-1',
        gradeId: 'GRADE_7',
        academicYearId: 'year-2025',
        educationalSystemId: 'GENERAL',
        name: 'Grade 7 Unit',
        nameAr: 'وحدة الصف السابع',
        order: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('unit-grade7');
        expect(result.value.gradeId).toBe('GRADE_7');
        expect(result.value.academicYearId).toBe('year-2025');
        expect(result.value.educationalSystemId).toBe('GENERAL');
      }
    });

    it('returns ALREADY_EXISTS for duplicate id', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: true });

      const result = await repository.createUnit({
        id: 'unit-1',
        academicTermId: 'term-1',
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

  describe('getUnitById', () => {
    it('returns unit by id', async () => {
      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          academicTermId: 'term-1',
          name: 'Test Unit',
          nameAr: 'وحدة اختبار',
          description: null,
          order: 1,
          isActive: true,
          isPremium: false,
          published: false,
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
          deletedAt: null,
        }),
        id: 'unit-1',
      });

      const result = await repository.getUnitById('unit-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('unit-1');
      }
    });

    it('returns NOT_FOUND for non-existent id', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: false });

      const result = await repository.getUnitById('non-existent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('returns NOT_FOUND for soft-deleted unit', async () => {
      mockDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          deletedAt: now,
          academicTermId: 'term-1',
          name: 'Deleted Unit',
          nameAr: 'وحدة محذوفة',
          order: 1,
          isActive: true,
          isPremium: false,
          published: false,
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
        }),
        id: 'unit-1',
      });

      const result = await repository.getUnitById('unit-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('listUnits', () => {
    it('returns empty list', async () => {
      const result = await repository.listUnits({}, { limit: 20 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
        expect(result.value.nextCursor).toBeNull();
      }
    });

    it('filters by gradeId', async () => {
      const filter = { gradeId: 'GRADE_7' };
      const result = await repository.listUnits(filter, { limit: 20 });

      expect(result.ok).toBe(true);
    });

    it('filters by academicTermId', async () => {
      const filter = { academicTermId: 'term-1' };
      const result = await repository.listUnits(filter, { limit: 20 });

      expect(result.ok).toBe(true);
    });

    it('filters by gradeId and academicTermId together', async () => {
      const filter = { gradeId: 'GRADE_7', academicTermId: 'term-1' };
      const result = await repository.listUnits(filter, { limit: 20 });

      expect(result.ok).toBe(true);
    });
  });

  describe('updateUnit', () => {
    it('updates unit successfully', async () => {
      mockDoc.get
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({
            academicTermId: 'term-1',
            name: 'Updated Unit',
            nameAr: 'وحدة محدثة',
            description: null,
            order: 1,
            isActive: true,
            isPremium: false,
            published: true,
            createdAt: now,
            updatedAt: now,
            schemaVersion: 1,
            deletedAt: null,
          }),
          id: 'unit-1',
        });

      const result = await repository.updateUnit('unit-1', { name: 'Updated Unit', published: true }, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Updated Unit');
        expect(result.value.published).toBe(true);
      }
    });

    it('returns NOT_FOUND for non-existent unit', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: false });

      const result = await repository.updateUnit('non-existent', { name: 'Test' }, 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('getUnitsByTerm', () => {
    it('returns units for term', async () => {
      const result = await repository.getUnitsByTerm('term-1');

      expect(result.ok).toBe(true);
    });
  });

  describe('softDeleteUnit', () => {
    it('soft deletes unit', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: true });

      const result = await repository.softDeleteUnit('unit-1', 'delete-request');

      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for empty requestId', async () => {
      const result = await repository.softDeleteUnit('unit-1', '');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns NOT_FOUND for non-existent unit', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: false });

      const result = await repository.softDeleteUnit('non-existent', 'request-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('restoreUnit', () => {
    it('restores soft-deleted unit', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: true });

      const result = await repository.restoreUnit('unit-1', 'restore-request');

      expect(result.ok).toBe(true);
    });

    it('returns INVALID_INPUT for empty requestId', async () => {
      const result = await repository.restoreUnit('unit-1', '');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('returns NOT_FOUND for non-existent unit', async () => {
      mockDoc.get.mockResolvedValueOnce({ exists: false });

      const result = await repository.restoreUnit('non-existent', 'request-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
