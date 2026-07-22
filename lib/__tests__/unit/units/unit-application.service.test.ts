import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UnitApplicationService } from '../../../services/units/unit-application.service';
import { UnitService } from '../../../services/units/unit.service';

const mockService = {
  createUnit: jest.fn<any>(),
  updateUnit: jest.fn<any>(),
  getUnitById: jest.fn<any>(),
  listUnits: jest.fn<any>(),
  getUnitsByTerm: jest.fn<any>(),
  softDeleteUnit: jest.fn<any>(),
  restoreUnit: jest.fn<any>(),
  getRepository: jest.fn<any>(),
};

describe('UnitApplicationService', () => {
  let appService: UnitApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    appService = new UnitApplicationService(mockService as unknown as UnitService);
  });

  describe('createUnit', () => {
    it('creates unit with valid input', async () => {
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

      mockService.createUnit.mockResolvedValue({ ok: true, value: mockResult });

      const result = await appService.createUnit({
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
      }
    });

    it('rejects invalid input', async () => {
      const result = await appService.createUnit({
        id: '',
        academicTermId: 'term-1',
        name: 'Test',
        nameAr: 'اختبار',
        order: 1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('rejects missing required fields', async () => {
      const result = await appService.createUnit({});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('updateUnit', () => {
    it('updates unit with valid input', async () => {
      const mockResult = {
        id: 'unit-1',
        academicTermId: 'term-1',
        name: 'Updated',
        nameAr: 'محدثة',
        order: 1,
        isActive: true,
        isPremium: false,
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockService.updateUnit.mockResolvedValue({ ok: true, value: mockResult });

      const result = await appService.updateUnit('unit-1', { name: 'Updated', published: true }, 0);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.published).toBe(true);
      }
    });

    it('rejects empty id', async () => {
      const result = await appService.updateUnit('', { name: 'Test' }, 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  describe('getUnitById', () => {
    it('gets unit by valid id', async () => {
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

      mockService.getUnitById.mockResolvedValue({ ok: true, value: mockResult });

      const result = await appService.getUnitById('unit-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty id', async () => {
      const result = await appService.getUnitById('');

      expect(result.ok).toBe(false);
    });
  });

  describe('listUnits', () => {
    it('lists units with valid filter', async () => {
      mockService.listUnits.mockResolvedValue({
        ok: true,
        value: { items: [], nextCursor: null },
      });

      const result = await appService.listUnits({ academicTermId: 'term-1' }, { limit: 20 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
      }
    });
  });

  describe('getUnitsByTerm', () => {
    it('gets units by valid term id', async () => {
      mockService.getUnitsByTerm.mockResolvedValue({ ok: true, value: [] });

      const result = await appService.getUnitsByTerm('term-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty term id', async () => {
      const result = await appService.getUnitsByTerm('');

      expect(result.ok).toBe(false);
    });
  });

  describe('softDeleteUnit', () => {
    it('soft deletes with valid id and requestId', async () => {
      mockService.softDeleteUnit.mockResolvedValue({ ok: true, value: undefined });

      const result = await appService.softDeleteUnit('unit-1', 'delete-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty id', async () => {
      const result = await appService.softDeleteUnit('', 'delete-1');

      expect(result.ok).toBe(false);
    });
  });

  describe('restoreUnit', () => {
    it('restores with valid id and requestId', async () => {
      mockService.restoreUnit.mockResolvedValue({ ok: true, value: undefined });

      const result = await appService.restoreUnit('unit-1', 'restore-1');

      expect(result.ok).toBe(true);
    });

    it('rejects empty id', async () => {
      const result = await appService.restoreUnit('', 'restore-1');

      expect(result.ok).toBe(false);
    });
  });
});
