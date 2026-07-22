import { describe, it, expect } from '@jest/globals';
import { UnitFirestoreMapper, UnitFirestoreDoc } from '../../../repositories/units/unit-firestore-mapper';

const ts = '2026-01-01T00:00:00.000Z';

const mockUnitDoc: UnitFirestoreDoc = {
  id: 'unit-1',
  academicTermId: 'term-1',
  name: 'Unit 1: Greetings',
  nameAr: 'الوحدة الأولى: التحيات',
  description: 'Introduction to basic greetings',
  order: 1,
  isActive: true,
  isPremium: false,
  published: true,
  createdAt: ts,
  updatedAt: ts,
  schemaVersion: 1,
  deletedAt: null,
};

describe('UnitFirestoreMapper', () => {
  describe('toDomain', () => {
    it('maps unit doc to domain entity', () => {
      const domain = UnitFirestoreMapper.toDomain(mockUnitDoc);

      expect(domain.id).toBe('unit-1');
      expect(domain.academicTermId).toBe('term-1');
      expect(domain.name).toBe('Unit 1: Greetings');
      expect(domain.nameAr).toBe('الوحدة الأولى: التحيات');
      expect(domain.description).toBe('Introduction to basic greetings');
      expect(domain.order).toBe(1);
      expect(domain.isActive).toBe(true);
      expect(domain.isPremium).toBe(false);
      expect(domain.published).toBe(true);
      expect(domain.createdAt).toBe(ts);
      expect(domain.updatedAt).toBe(ts);
      expect(domain.schemaVersion).toBe(1);
      expect(domain.deletedAt).toBeNull();
    });

    it('handles null description', () => {
      const domain = UnitFirestoreMapper.toDomain({
        ...mockUnitDoc,
        description: null,
      });

      expect(domain.description).toBeUndefined();
    });

    it('handles null deletedAt', () => {
      const domain = UnitFirestoreMapper.toDomain(mockUnitDoc);

      expect(domain.deletedAt).toBeNull();
    });
  });

  describe('toSummary', () => {
    it('maps unit doc to summary', () => {
      const summary = UnitFirestoreMapper.toSummary(mockUnitDoc);

      expect(summary.id).toBe('unit-1');
      expect(summary.academicTermId).toBe('term-1');
      expect(summary.name).toBe('Unit 1: Greetings');
      expect(summary.nameAr).toBe('الوحدة الأولى: التحيات');
      expect(summary.order).toBe(1);
      expect(summary.isActive).toBe(true);
      expect(summary.isPremium).toBe(false);
      expect(summary.published).toBe(true);
      expect(summary.createdAt).toBe(ts);
    });
  });

  describe('SCHEMA_VERSION', () => {
    it('is set to 1', () => {
      expect(UnitFirestoreMapper.SCHEMA_VERSION).toBe(1);
    });
  });
});
