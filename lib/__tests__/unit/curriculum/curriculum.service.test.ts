import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CurriculumService } from '../../../services/curriculum/curriculum.service';
import { RepositoryResult } from '../../../shared/types/repository.types';

const mockRepository = {
  getEducationalSystemById: jest.fn<(id: string) => Promise<RepositoryResult<any>>>(),
  listEducationalSystems: jest.fn<(filter: any, page: any) => Promise<RepositoryResult<any>>>(),
  getStageById: jest.fn<(id: string) => Promise<RepositoryResult<any>>>(),
  listStages: jest.fn<(filter: any, page: any) => Promise<RepositoryResult<any>>>(),
  getStagesBySystem: jest.fn<(systemId: string) => Promise<RepositoryResult<any>>>(),
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

  describe('getEducationalSystemById', () => {
    it('returns system when found', async () => {
      const mockResult = {
        id: 'GENERAL',
        name: 'General',
        nameAr: 'عام',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
        deletedAt: null,
      };

      mockRepository.getEducationalSystemById.mockResolvedValue({ ok: true, value: mockResult });

      const result = await service.getEducationalSystemById('GENERAL');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('GENERAL');
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
        items: [{ id: 'GENERAL', name: 'General', nameAr: 'عام', isActive: true, createdAt: new Date().toISOString() }],
        nextCursor: null,
      };

      mockRepository.listEducationalSystems.mockResolvedValue({ ok: true, value: mockPage });

      const result = await service.listEducationalSystems({}, { limit: 20 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(1);
      }
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

      const result = await service.getStagesBySystem('GENERAL');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('getGradesByStage', () => {
    it('returns grades for stage', async () => {
      mockRepository.getGradesByStage.mockResolvedValue({ ok: true, value: [] });

      const result = await service.getGradesByStage('PRIMARY');
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
        educationalSystemId: 'GENERAL',
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

      const result = await service.softDeleteCurriculum('year-1', 'academicYears', 'req-1');
      expect(result.ok).toBe(true);
      expect(mockRepository.softDeleteCurriculum).toHaveBeenCalledWith('year-1', 'academicYears', 'req-1');
    });
  });

  describe('restoreCurriculum', () => {
    it('restores curriculum entity successfully', async () => {
      mockRepository.restoreCurriculum.mockResolvedValue({ ok: true, value: undefined });

      const result = await service.restoreCurriculum('year-1', 'academicYears', 'req-1');
      expect(result.ok).toBe(true);
      expect(mockRepository.restoreCurriculum).toHaveBeenCalledWith('year-1', 'academicYears', 'req-1');
    });
  });

  describe('getRepository', () => {
    it('returns the injected repository', () => {
      const repo = service.getRepository();
      expect(repo).toBe(mockRepository);
    });
  });
});
