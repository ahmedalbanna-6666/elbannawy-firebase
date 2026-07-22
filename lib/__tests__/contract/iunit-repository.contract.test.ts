import { describe, it, expect } from '@jest/globals';
import { IUnitRepository } from '../../repositories/contracts';
import { Page } from '../../shared/types/pagination.types';

/**
 * Contract Tests for IUnitRepository.
 *
 * These tests validate that a UnitRepository implementation satisfies
 * the IUnitRepository contract. Any implementation must pass these tests.
 */

export function runUnitRepositoryContractTests(
  description: string,
  createRepository: () => IUnitRepository,
  generateUniqueId: () => string,
): void {
  describe(`IUnitRepository Contract: ${description}`, () => {
    let repository: IUnitRepository;

    beforeEach(() => {
      repository = createRepository();
    });

    describe('Contract Method Signatures', () => {
      it('implements createUnit', () => {
        expect(repository.createUnit).toBeDefined();
        expect(repository.createUnit.length).toBe(1);
      });

      it('implements updateUnit', () => {
        expect(repository.updateUnit).toBeDefined();
        expect(repository.updateUnit.length).toBe(3);
      });

      it('implements getUnitById', () => {
        expect(repository.getUnitById).toBeDefined();
        expect(repository.getUnitById.length).toBe(1);
      });

      it('implements listUnits', () => {
        expect(repository.listUnits).toBeDefined();
        expect(repository.listUnits.length).toBe(2);
      });

      it('implements getUnitsByTerm', () => {
        expect(repository.getUnitsByTerm).toBeDefined();
        expect(repository.getUnitsByTerm.length).toBe(1);
      });

      it('implements softDeleteUnit', () => {
        expect(repository.softDeleteUnit).toBeDefined();
        expect(repository.softDeleteUnit.length).toBe(2);
      });

      it('implements restoreUnit', () => {
        expect(repository.restoreUnit).toBeDefined();
        expect(repository.restoreUnit.length).toBe(2);
      });
    });

    describe('RepositoryResult Type Contract', () => {
      it('createUnit returns RepositoryResult with id, name, nameAr, academicTermId, order', async () => {
        const result = await repository.createUnit({
          id: generateUniqueId(),
          academicTermId: 'term-contract-1',
          name: 'Contract Test Unit',
          nameAr: 'وحدة اختبار',
          order: 1,
        });

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('id');
          expect(result.value).toHaveProperty('academicTermId');
          expect(result.value).toHaveProperty('name');
          expect(result.value).toHaveProperty('nameAr');
          expect(result.value).toHaveProperty('order');
          expect(result.value).toHaveProperty('isActive');
          expect(result.value).toHaveProperty('isPremium');
          expect(result.value).toHaveProperty('published');
          expect(result.value).toHaveProperty('createdAt');
          expect(result.value).toHaveProperty('updatedAt');
          expect(result.value).toHaveProperty('schemaVersion');
        } else {
          expect(result.error).toHaveProperty('code');
          expect(result.error).toHaveProperty('message');
          expect(result.error).toHaveProperty('retryable');
        }
      });

      it('getUnitById returns ok false for non-existent', async () => {
        const result = await repository.getUnitById('non-existent-unit');
        expect(result).toHaveProperty('ok');
        expect(result.ok).toBe(false);
      });

      it('listUnits returns page type with items and nextCursor', async () => {
        const result = await repository.listUnits({}, { limit: 20 });

        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toHaveProperty('items');
          expect(result.value).toHaveProperty('nextCursor');
          expect(Array.isArray(result.value.items)).toBe(true);
        }
      });

      it('getUnitsByTerm returns array of units', async () => {
        const termId = generateUniqueId();
        const unitId = generateUniqueId();
        await repository.createUnit({
          id: unitId,
          academicTermId: termId,
          name: 'Term Unit',
          nameAr: 'وحدة فصل',
          order: 1,
        });

        const result = await repository.getUnitsByTerm(termId);
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(Array.isArray(result.value)).toBe(true);
          expect(result.value.length).toBeGreaterThanOrEqual(1);
          expect(result.value[0].academicTermId).toBe(termId);
        }
      });

      it('softDeleteUnit returns RepositoryResult<void>', async () => {
        const id = generateUniqueId();
        await repository.createUnit({
          id,
          academicTermId: 'term-delete',
          name: 'Delete Test',
          nameAr: 'حذف',
          order: 1,
        });

        const result = await repository.softDeleteUnit(id, 'contract-delete');
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toBeUndefined();
        }
      });

      it('restoreUnit returns RepositoryResult<void>', async () => {
        const id = generateUniqueId();
        await repository.createUnit({
          id,
          academicTermId: 'term-restore',
          name: 'Restore Test',
          nameAr: 'استعادة',
          order: 1,
        });
        await repository.softDeleteUnit(id, 'prep-delete');

        const result = await repository.restoreUnit(id, 'contract-restore');
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          expect(result.value).toBeUndefined();
        }
      });
    });

    describe('Error Contract', () => {
      it('createUnit returns ALREADY_EXISTS for duplicate id', async () => {
        const id = generateUniqueId();
        await repository.createUnit({
          id,
          academicTermId: 'term-dup',
          name: 'Original',
          nameAr: 'أصلي',
          order: 1,
        });

        const result = await repository.createUnit({
          id,
          academicTermId: 'term-dup',
          name: 'Duplicate',
          nameAr: 'مكرر',
          order: 2,
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('ALREADY_EXISTS');
        }
      });

      it('getUnitById returns non-throwing result for empty id', async () => {
        const result = await repository.getUnitById('');
        expect(result).toBeDefined();
      });

      it('listUnits uses IUnitRepository return type', async () => {
        const result = await repository.listUnits({}, { limit: 20 });
        expect(result).toHaveProperty('ok');
        if (result.ok) {
          const page: Page<any> = result.value;
          expect(page.items).toBeDefined();
          expect(page.nextCursor).toBeDefined();
        }
      });

      it('softDeleteUnit returns INVALID_INPUT for empty requestId', async () => {
        const result = await repository.softDeleteUnit('any-id', '');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });

      it('restoreUnit returns INVALID_INPUT for empty requestId', async () => {
        const result = await repository.restoreUnit('any-id', '');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('INVALID_INPUT');
        }
      });
    });
  });
}

const isEmulatorAvailable = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

const UnitRepository = require('../../repositories/units/unit.repository').UnitRepository;

let counter = 0;
function uniqueId(): string {
  counter++;
  return `contract-unit-${Date.now()}-${counter}`;
}

if (isEmulatorAvailable) {
  runUnitRepositoryContractTests(
    'UnitRepository',
    () => new UnitRepository(),
    uniqueId,
  );
} else {
  describe('IUnitRepository Contract', () => {
    it('skipped — requires Firestore emulator', () => {
      console.warn('Skipping unit contract tests: FIRESTORE_EMULATOR_HOST not set');
    });
  });
}
