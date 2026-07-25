import { describe, it, expect } from '@jest/globals';
import { CurriculumFirestoreMapper } from '../../../repositories/curriculum/curriculum-firestore-mapper';
import type {
  AcademicYearFirestoreDoc,
  AcademicTermFirestoreDoc,
} from '../../../repositories/curriculum/curriculum-firestore-mapper';

const ts = '2026-01-01T00:00:00.000Z';

const mockAcademicYearDoc: AcademicYearFirestoreDoc = {
  id: 'year-1',
  educationalSystemId: 'GENERAL',
  name: '2025-2026',
  nameAr: '2025-2026',
  startDate: '2025-09-01',
  endDate: '2026-06-30',
  isCurrent: true,
  isActive: true,
  createdAt: ts,
  updatedAt: ts,
  schemaVersion: 1,
  deletedAt: null,
};

const mockAcademicTermDoc: AcademicTermFirestoreDoc = {
  id: 'term-1',
  academicYearId: 'year-1',
  name: 'First Term',
  nameAr: 'الفصل الأول',
  order: 1,
  startDate: '2025-09-01',
  endDate: '2026-01-31',
  isCurrent: true,
  isActive: true,
  createdAt: ts,
  updatedAt: ts,
  schemaVersion: 1,
  deletedAt: null,
};

describe('CurriculumFirestoreMapper', () => {
  describe('academicYearToDomain', () => {
    it('maps academic year doc to domain entity', () => {
      const domain = CurriculumFirestoreMapper.academicYearToDomain(mockAcademicYearDoc);

      expect(domain.id).toBe('year-1');
      expect(domain.educationalSystemId).toBe('GENERAL');
      expect(domain.name).toBe('2025-2026');
      expect(domain.nameAr).toBe('2025-2026');
      expect(domain.startDate).toBe('2025-09-01');
      expect(domain.endDate).toBe('2026-06-30');
      expect(domain.isCurrent).toBe(true);
      expect(domain.isActive).toBe(true);
      expect(domain.createdAt).toBe(ts);
      expect(domain.updatedAt).toBe(ts);
      expect(domain.schemaVersion).toBe(1);
      expect(domain.deletedAt).toBeNull();
    });
  });

  describe('academicYearToSummary', () => {
    it('maps academic year doc to summary', () => {
      const summary = CurriculumFirestoreMapper.academicYearToSummary(mockAcademicYearDoc);

      expect(summary.id).toBe('year-1');
      expect(summary.name).toBe('2025-2026');
      expect(summary.isCurrent).toBe(true);
      expect(summary.startDate).toBe('2025-09-01');
      expect(summary.endDate).toBe('2026-06-30');
      expect(summary.createdAt).toBe(ts);
    });
  });

  describe('academicTermToDomain', () => {
    it('maps academic term doc to domain entity', () => {
      const domain = CurriculumFirestoreMapper.academicTermToDomain(mockAcademicTermDoc);

      expect(domain.id).toBe('term-1');
      expect(domain.academicYearId).toBe('year-1');
      expect(domain.name).toBe('First Term');
      expect(domain.nameAr).toBe('الفصل الأول');
      expect(domain.order).toBe(1);
      expect(domain.startDate).toBe('2025-09-01');
      expect(domain.endDate).toBe('2026-01-31');
      expect(domain.isCurrent).toBe(true);
      expect(domain.isActive).toBe(true);
      expect(domain.createdAt).toBe(ts);
      expect(domain.updatedAt).toBe(ts);
      expect(domain.schemaVersion).toBe(1);
      expect(domain.deletedAt).toBeNull();
    });
  });

  describe('academicTermToSummary', () => {
    it('maps academic term doc to summary', () => {
      const summary = CurriculumFirestoreMapper.academicTermToSummary(mockAcademicTermDoc);

      expect(summary.id).toBe('term-1');
      expect(summary.academicYearId).toBe('year-1');
      expect(summary.name).toBe('First Term');
      expect(summary.nameAr).toBe('الفصل الأول');
      expect(summary.order).toBe(1);
      expect(summary.isCurrent).toBe(true);
      expect(summary.createdAt).toBe(ts);
    });
  });
});
