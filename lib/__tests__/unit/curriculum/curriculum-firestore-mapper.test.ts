import { describe, it, expect } from '@jest/globals';
import { CurriculumFirestoreMapper } from '../../../repositories/curriculum/curriculum-firestore-mapper';
import type {
  EducationalSystemFirestoreDoc,
  StageFirestoreDoc,
  GradeFirestoreDoc,
  AcademicYearFirestoreDoc,
  AcademicTermFirestoreDoc,
} from '../../../repositories/curriculum/curriculum-firestore-mapper';

const ts = '2026-01-01T00:00:00.000Z';

const mockEducationalSystemDoc: EducationalSystemFirestoreDoc = {
  id: 'sys-1',
  name: 'Egyptian National',
  nameAr: 'مصري وطني',
  description: 'The national system',
  isActive: true,
  createdAt: ts,
  updatedAt: ts,
  schemaVersion: 1,
  deletedAt: null,
};

const mockStageDoc: StageFirestoreDoc = {
  id: 'stage-1',
  educationalSystemId: 'sys-1',
  name: 'Primary',
  nameAr: 'ابتدائي',
  order: 1,
  isActive: true,
  createdAt: ts,
  updatedAt: ts,
  schemaVersion: 1,
  deletedAt: null,
};

const mockGradeDoc: GradeFirestoreDoc = {
  id: 'grade-1',
  educationalSystemId: 'sys-1',
  stageId: 'stage-1',
  name: 'Grade 1',
  nameAr: 'الصف الأول',
  order: 1,
  isActive: true,
  createdAt: ts,
  updatedAt: ts,
  schemaVersion: 1,
  deletedAt: null,
};

const mockAcademicYearDoc: AcademicYearFirestoreDoc = {
  id: 'year-1',
  educationalSystemId: 'sys-1',
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
  describe('educationalSystemToDomain', () => {
    it('maps educational system doc to domain entity', () => {
      const domain = CurriculumFirestoreMapper.educationalSystemToDomain(mockEducationalSystemDoc);

      expect(domain.id).toBe('sys-1');
      expect(domain.name).toBe('Egyptian National');
      expect(domain.nameAr).toBe('مصري وطني');
      expect(domain.description).toBe('The national system');
      expect(domain.isActive).toBe(true);
      expect(domain.createdAt).toBe(ts);
      expect(domain.updatedAt).toBe(ts);
      expect(domain.schemaVersion).toBe(1);
      expect(domain.deletedAt).toBeNull();
    });

    it('handles null description', () => {
      const domain = CurriculumFirestoreMapper.educationalSystemToDomain({
        ...mockEducationalSystemDoc,
        description: null,
      });

      expect(domain.description).toBeUndefined();
    });
  });

  describe('educationalSystemToSummary', () => {
    it('maps educational system doc to summary', () => {
      const summary = CurriculumFirestoreMapper.educationalSystemToSummary(mockEducationalSystemDoc);

      expect(summary.id).toBe('sys-1');
      expect(summary.name).toBe('Egyptian National');
      expect(summary.nameAr).toBe('مصري وطني');
      expect(summary.isActive).toBe(true);
      expect(summary.createdAt).toBe(ts);
    });
  });

  describe('stageToDomain', () => {
    it('maps stage doc to domain entity', () => {
      const domain = CurriculumFirestoreMapper.stageToDomain(mockStageDoc);

      expect(domain.id).toBe('stage-1');
      expect(domain.educationalSystemId).toBe('sys-1');
      expect(domain.name).toBe('Primary');
      expect(domain.nameAr).toBe('ابتدائي');
      expect(domain.order).toBe(1);
      expect(domain.isActive).toBe(true);
      expect(domain.schemaVersion).toBe(1);
    });
  });

  describe('stageToSummary', () => {
    it('maps stage doc to summary', () => {
      const summary = CurriculumFirestoreMapper.stageToSummary(mockStageDoc);

      expect(summary.id).toBe('stage-1');
      expect(summary.educationalSystemId).toBe('sys-1');
      expect(summary.name).toBe('Primary');
      expect(summary.nameAr).toBe('ابتدائي');
      expect(summary.order).toBe(1);
      expect(summary.isActive).toBe(true);
    });
  });

  describe('gradeToDomain', () => {
    it('maps grade doc to domain entity', () => {
      const domain = CurriculumFirestoreMapper.gradeToDomain(mockGradeDoc);

      expect(domain.id).toBe('grade-1');
      expect(domain.educationalSystemId).toBe('sys-1');
      expect(domain.stageId).toBe('stage-1');
      expect(domain.name).toBe('Grade 1');
      expect(domain.nameAr).toBe('الصف الأول');
      expect(domain.order).toBe(1);
      expect(domain.isActive).toBe(true);
    });
  });

  describe('gradeToSummary', () => {
    it('maps grade doc to summary', () => {
      const summary = CurriculumFirestoreMapper.gradeToSummary(mockGradeDoc);

      expect(summary.id).toBe('grade-1');
      expect(summary.educationalSystemId).toBe('sys-1');
      expect(summary.stageId).toBe('stage-1');
      expect(summary.name).toBe('Grade 1');
      expect(summary.nameAr).toBe('الصف الأول');
      expect(summary.order).toBe(1);
      expect(summary.isActive).toBe(true);
    });
  });

  describe('academicYearToDomain', () => {
    it('maps academic year doc to domain entity', () => {
      const domain = CurriculumFirestoreMapper.academicYearToDomain(mockAcademicYearDoc);

      expect(domain.id).toBe('year-1');
      expect(domain.educationalSystemId).toBe('sys-1');
      expect(domain.name).toBe('2025-2026');
      expect(domain.nameAr).toBe('2025-2026');
      expect(domain.startDate).toBe('2025-09-01');
      expect(domain.endDate).toBe('2026-06-30');
      expect(domain.isCurrent).toBe(true);
      expect(domain.isActive).toBe(true);
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

  describe('SCHEMA_VERSION', () => {
    it('is set to 1', () => {
      expect(CurriculumFirestoreMapper.SCHEMA_VERSION).toBe(1);
    });
  });
});
