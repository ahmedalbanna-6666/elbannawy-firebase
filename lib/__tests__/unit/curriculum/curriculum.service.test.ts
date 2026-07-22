import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CurriculumService } from '../../../services/curriculum/curriculum.service';
import { RepositoryResult } from '../../../shared/types/repository.types';

const mockRepository = {
  createEducationalSystem: jest.fn<(input: any) => Promise<RepositoryResult<any>>>(),
  updateEducationalSystem: jest.fn<(id: string, input: any, version: number) => Promise<RepositoryResult<any>>>(),
  getEducationalSystemById: jest.fn<(id: string) => Promise<RepositoryResult<any>>>(),
  listEducationalSystems: jest.fn<(filter: any, page: any) => Promise<RepositoryResult<any>>>(),
  createStage: jest.fn<(input: any) => Promise<RepositoryResult<any>>>(),
  updateStage: jest.fn<(id: string, input: any, version: number) => Promise<RepositoryResult<any>>>(),
  getStageById: jest.fn<(id: string) => Promise<RepositoryResult<any>>>(),
  listStages: jest.fn<(filter: any, page: any) => Promise<RepositoryResult<any>>>(),
  getStagesBySystem: jest.fn<(systemId: string) => Promise<RepositoryResult<any>>>(),
  createGrade: jest.fn<(input: any) => Promise<RepositoryResult<any>>>(),
  updateGrade: jest.fn<(id: string, input: any, version: number) => Promise<RepositoryResult<any>>>(),
  getGradeById: jest.fn<(id: string) => Promise<RepositoryResult<any>>>(),
  listGrades: jest.fn<(filter: any, page: any) => Promise<RepositoryResult<any>>>(),
  getGradesByStage: jest.fn<(stageId: string) => Promise<RepositoryResult<any>>>(),
  createAcademicYear: jest.fn<(input: any) => Promise<RepositoryResult<any>>>(),
  updateAcademicYear: jest.fn<(id: string, input: any, version: number) => Promise<RepositoryResult<any>>>(),
  getAcademicYearById: jest.fn<(id: string) => Promise<RepositoryResult<any>>>(),
  listAcademicYears: jest.fn<(filter: any, page: any) => Promise<RepositoryResult<any>>>(),
  createAcademicTerm: jest.fn<(input: any) => Promise<RepositoryResult<any>>>(),
  updateAcademicTerm: jest.fn<(id: string, input: any, version: number) => Promise<RepositoryResult<any>>>(),
  getAcademicTermById: jest.fn<(id: string) => Promise<RepositoryResult<any>>>(),
  listAcademicTerms: jest.fn<(filter: any, page: any) => Promise<RepositoryResult<any>>>(),
  getTermsByAcademicYear: jest.fn<(academicYearId: string) => Promise<RepositoryResult<any>>>(),
  getCurrentAcademicYear: jest.fn<() => Promise<RepositoryResult<any | null>>>(),
  getCurrentAcademicTerm: jest.fn<(academicYearId: string) => Promise<RepositoryResult<any | null>>>(),
  getCurrentAcademicContext: jest.fn<() => Promise<RepositoryResult<any>>>(),
  softDeleteCurriculum: jest.fn<(id: string, collection: string, requestId: string) => Promise<RepositoryResult<void>>>(),
  restoreCurriculum: jest.fn<(id: string, collection: string, requestId: string) => Promise<RepositoryResult<void>>>(),
};

describe('CurriculumService', () => {
  let service: CurriculumService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CurriculumService(mockRepository as any);
  });

  describe('createEducationalSystem', () => {
    it('creates educational system successfully', async () => {
      const mockResult = {
        id: 'sys-1',
        name: 'Egyptian National',
        nameAr: 'مصري وطني',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockRepository.createEducationalSystem.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.createEducationalSystem({
        id: 'sys-1',
        name: 'Egyptian National',
        nameAr: 'مصري وطني',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockResult);
      }
      expect(mockRepository.createEducationalSystem).toHaveBeenCalledWith({
        id: 'sys-1',
        name: 'Egyptian National',
        nameAr: 'مصري وطني',
      });
    });

    it('forwards repository error', async () => {
      mockRepository.createEducationalSystem.mockResolvedValue({
        ok: false,
        error: { code: 'ALREADY_EXISTS', message: 'System exists', retryable: false, requestId: '' },
      });

      const result = await service.createEducationalSystem({
        id: 'sys-1',
        name: 'Egyptian National',
        nameAr: 'مصري وطني',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ALREADY_EXISTS');
      }
    });
  });

  describe('getEducationalSystemById', () => {
    it('returns system when found', async () => {
      const mockResult = {
        id: 'sys-1',
        name: 'Egyptian National',
        nameAr: 'مصري وطني',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockRepository.getEducationalSystemById.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.getEducationalSystemById('sys-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('sys-1');
      }
    });

    it('forwards not found error', async () => {
      mockRepository.getEducationalSystemById.mockResolvedValue({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Not found', retryable: false, requestId: '' },
      });

      const result = await service.getEducationalSystemById('invalid');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('listEducationalSystems', () => {
    it('returns paginated systems', async () => {
      const mockPage = {
        items: [{ id: 'sys-1', name: 'Egyptian National', nameAr: 'مصري وطني', isActive: true, createdAt: new Date().toISOString() }],
        nextCursor: null,
      };

      mockRepository.listEducationalSystems.mockResolvedValue({ ok: true, value: mockPage });

      const result = await service.listEducationalSystems({}, { limit: 20 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(1);
      }
    });

    it('forwards repository error', async () => {
      mockRepository.listEducationalSystems.mockResolvedValue({
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid', retryable: false, requestId: '' },
      });

      const result = await service.listEducationalSystems({}, { limit: 20 });
      expect(result.ok).toBe(false);
    });
  });

  describe('createStage', () => {
    it('creates stage successfully', async () => {
      mockRepository.createStage.mockResolvedValue({ ok: true, value: { id: 'stage-1' } });

      const result = await service.createStage({
        id: 'stage-1',
        educationalSystemId: 'sys-1',
        name: 'Primary',
        nameAr: 'ابتدائي',
        order: 1,
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('getStageById', () => {
    it('forwards not found error', async () => {
      mockRepository.getStageById.mockResolvedValue({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Not found', retryable: false, requestId: '' },
      });

      const result = await service.getStageById('invalid');
      expect(result.ok).toBe(false);
    });
  });

  describe('getStagesBySystem', () => {
    it('returns stages for system', async () => {
      mockRepository.getStagesBySystem.mockResolvedValue({ ok: true, value: [] });

      const result = await service.getStagesBySystem('sys-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('createGrade', () => {
    it('creates grade successfully', async () => {
      mockRepository.createGrade.mockResolvedValue({ ok: true, value: { id: 'grade-1' } });

      const result = await service.createGrade({
        id: 'grade-1',
        educationalSystemId: 'sys-1',
        stageId: 'stage-1',
        name: 'Grade 1',
        nameAr: 'الصف الأول',
        order: 1,
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('getGradesByStage', () => {
    it('returns grades for stage', async () => {
      mockRepository.getGradesByStage.mockResolvedValue({ ok: true, value: [] });

      const result = await service.getGradesByStage('stage-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('createAcademicYear', () => {
    it('creates academic year successfully', async () => {
      mockRepository.createAcademicYear.mockResolvedValue({ ok: true, value: { id: 'year-1' } });

      const result = await service.createAcademicYear({
        id: 'year-1',
        educationalSystemId: 'sys-1',
        name: '2025-2026',
        nameAr: '2025-2026',
        startDate: '2025-09-01',
        endDate: '2026-06-30',
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('createAcademicTerm', () => {
    it('creates academic term successfully', async () => {
      mockRepository.createAcademicTerm.mockResolvedValue({ ok: true, value: { id: 'term-1' } });

      const result = await service.createAcademicTerm({
        id: 'term-1',
        academicYearId: 'year-1',
        name: 'First Term',
        nameAr: 'الفصل الأول',
        order: 1,
        startDate: '2025-09-01',
        endDate: '2026-01-31',
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('getTermsByAcademicYear', () => {
    it('returns terms for academic year', async () => {
      mockRepository.getTermsByAcademicYear.mockResolvedValue({ ok: true, value: [] });

      const result = await service.getTermsByAcademicYear('year-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('getCurrentAcademicYear', () => {
    it('returns null when no current year', async () => {
      mockRepository.getCurrentAcademicYear.mockResolvedValue({ ok: true, value: null });

      const result = await service.getCurrentAcademicYear();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('getCurrentAcademicTerm', () => {
    it('returns null when no current term', async () => {
      mockRepository.getCurrentAcademicTerm.mockResolvedValue({ ok: true, value: null });

      const result = await service.getCurrentAcademicTerm('year-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('getCurrentAcademicContext', () => {
    it('returns academic context', async () => {
      const mockContext = {
        educationalSystem: null,
        stage: null,
        grade: null,
        academicYear: null,
        academicTerm: null,
      };

      mockRepository.getCurrentAcademicContext.mockResolvedValue({ ok: true, value: mockContext });

      const result = await service.getCurrentAcademicContext();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.educationalSystem).toBeNull();
      }
    });
  });

  describe('softDeleteCurriculum', () => {
    it('deletes curriculum entity successfully', async () => {
      mockRepository.softDeleteCurriculum.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.softDeleteCurriculum('sys-1', 'educationalSystems', 'req-1');
      expect(result.ok).toBe(true);
      expect(mockRepository.softDeleteCurriculum).toHaveBeenCalledWith('sys-1', 'educationalSystems', 'req-1');
    });
  });

  describe('restoreCurriculum', () => {
    it('restores curriculum entity successfully', async () => {
      mockRepository.restoreCurriculum.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.restoreCurriculum('sys-1', 'educationalSystems', 'req-1');
      expect(result.ok).toBe(true);
      expect(mockRepository.restoreCurriculum).toHaveBeenCalledWith('sys-1', 'educationalSystems', 'req-1');
    });
  });

  describe('getRepository', () => {
    it('returns the injected repository', () => {
      const repo = service.getRepository();
      expect(repo).toBe(mockRepository);
    });
  });
});
