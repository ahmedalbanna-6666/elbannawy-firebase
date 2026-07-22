import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UnitService } from '../../../services/units/unit.service';
import { RepositoryResult } from '../../../shared/types/repository.types';

const mockRepository = {
  createUnit: jest.fn<(input: any) => Promise<RepositoryResult<any>>>(),
  updateUnit: jest.fn<(id: string, input: any, version: number) => Promise<RepositoryResult<any>>>(),
  getUnitById: jest.fn<(id: string) => Promise<RepositoryResult<any>>>(),
  listUnits: jest.fn<(filter: any, page: any) => Promise<RepositoryResult<any>>>(),
  getUnitsByTerm: jest.fn<(academicTermId: string) => Promise<RepositoryResult<any>>>(),
  softDeleteUnit: jest.fn<(id: string, requestId: string) => Promise<RepositoryResult<void>>>(),
  restoreUnit: jest.fn<(id: string, requestId: string) => Promise<RepositoryResult<void>>>(),
};

describe('UnitService', () => {
  let service: UnitService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UnitService(mockRepository as any);
  });

  describe('createUnit', () => {
    it('creates unit successfully', async () => {
      const mockResult = {
        id: 'unit-1',
        academicTermId: 'term-1',
        name: 'Test Unit',
        nameAr: 'وحدة اختبار',
        order: 1,
        isActive: true,
        isPremium: false,
        published: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockRepository.createUnit.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.createUnit({
        id: 'unit-1',
        academicTermId: 'term-1',
        name: 'Test Unit',
        nameAr: 'وحدة اختبار',
        order: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockResult);
      }
      expect(mockRepository.createUnit).toHaveBeenCalledWith({
        id: 'unit-1',
        academicTermId: 'term-1',
        name: 'Test Unit',
        nameAr: 'وحدة اختبار',
        order: 1,
      });
    });

    it('forwards repository error', async () => {
      mockRepository.createUnit.mockResolvedValue({
        ok: false,
        error: { code: 'ALREADY_EXISTS', message: 'Unit exists', retryable: false, requestId: '' },
      });

      const result = await service.createUnit({
        id: 'unit-1',
        academicTermId: 'term-1',
        name: 'Test',
        nameAr: 'اختبار',
        order: 1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ALREADY_EXISTS');
      }
    });
  });

  describe('updateUnit', () => {
    it('updates unit successfully', async () => {
      const mockResult = {
        id: 'unit-1',
        academicTermId: 'term-1',
        name: 'Updated',
        nameAr: 'محدثة',
        order: 1,
        isActive: true,
        isPremium: false,
        published: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockRepository.updateUnit.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.updateUnit('unit-1', { name: 'Updated' }, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Updated');
      }
      expect(mockRepository.updateUnit).toHaveBeenCalledWith('unit-1', { name: 'Updated' }, 0);
    });

    it('forwards repository error', async () => {
      mockRepository.updateUnit.mockResolvedValue({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Unit not found', retryable: false, requestId: '' },
      });

      const result = await service.updateUnit('non-existent', { name: 'Test' }, 0);

      expect(result.ok).toBe(false);
    });
  });

  describe('getUnitById', () => {
    it('gets unit by id', async () => {
      const mockResult = {
        id: 'unit-1',
        academicTermId: 'term-1',
        name: 'Test',
        nameAr: 'اختبار',
        order: 1,
        isActive: true,
        isPremium: false,
        published: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockRepository.getUnitById.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.getUnitById('unit-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('unit-1');
      }
    });

    it('forwards not found error', async () => {
      mockRepository.getUnitById.mockResolvedValue({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Unit not found', retryable: false, requestId: '' },
      });

      const result = await service.getUnitById('non-existent');

      expect(result.ok).toBe(false);
    });
  });

  describe('listUnits', () => {
    it('lists units with filter', async () => {
      mockRepository.listUnits.mockResolvedValue({
        ok: true,
        value: { items: [], nextCursor: null },
      });

      const result = await service.listUnits({ academicTermId: 'term-1' }, { limit: 20 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
      }
      expect(mockRepository.listUnits).toHaveBeenCalledWith({ academicTermId: 'term-1' }, { limit: 20 });
    });
  });

  describe('getUnitsByTerm', () => {
    it('gets units by term', async () => {
      mockRepository.getUnitsByTerm.mockResolvedValue({
        ok: true,
        value: [],
      });

      const result = await service.getUnitsByTerm('term-1');

      expect(result.ok).toBe(true);
      expect(mockRepository.getUnitsByTerm).toHaveBeenCalledWith('term-1');
    });
  });

  describe('softDeleteUnit', () => {
    it('soft deletes unit', async () => {
      mockRepository.softDeleteUnit.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.softDeleteUnit('unit-1', 'delete-1');

      expect(result.ok).toBe(true);
      expect(mockRepository.softDeleteUnit).toHaveBeenCalledWith('unit-1', 'delete-1');
    });
  });

  describe('restoreUnit', () => {
    it('restores unit', async () => {
      mockRepository.restoreUnit.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.restoreUnit('unit-1', 'restore-1');

      expect(result.ok).toBe(true);
      expect(mockRepository.restoreUnit).toHaveBeenCalledWith('unit-1', 'restore-1');
    });
  });

  describe('getRepository', () => {
    it('returns the underlying repository', () => {
      expect(service.getRepository()).toBe(mockRepository);
    });
  });
});
