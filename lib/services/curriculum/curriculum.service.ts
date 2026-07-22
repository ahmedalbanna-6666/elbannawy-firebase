import {
  ICurriculumRepository,
  IEducationalSystem,
  IStage,
  IGrade,
  IAcademicYear,
  IAcademicTerm,
  IEducationalSystemSummary,
  IStageSummary,
  IGradeSummary,
  IAcademicYearSummary,
  IAcademicTermSummary,
  ICurrentAcademicContext,
  CreateEducationalSystemInput,
  UpdateEducationalSystemInput,
  CreateStageInput,
  UpdateStageInput,
  CreateGradeInput,
  UpdateGradeInput,
  CreateAcademicYearInput,
  UpdateAcademicYearInput,
  CreateAcademicTermInput,
  UpdateAcademicTermInput,
  CurriculumFilter,
  CurriculumCollection,
} from '../../repositories/contracts';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { CurriculumRepository } from '../../repositories/curriculum/curriculum.repository';

export class CurriculumService {
  constructor(private readonly curriculumRepository: ICurriculumRepository = new CurriculumRepository()) {}

  async createEducationalSystem(input: CreateEducationalSystemInput): Promise<RepositoryResult<IEducationalSystem>> {
    return this.curriculumRepository.createEducationalSystem(input);
  }

  async updateEducationalSystem(id: string, input: UpdateEducationalSystemInput, expectedVersion: number): Promise<RepositoryResult<IEducationalSystem>> {
    return this.curriculumRepository.updateEducationalSystem(id, input, expectedVersion);
  }

  async getEducationalSystemById(id: string): Promise<RepositoryResult<IEducationalSystem>> {
    return this.curriculumRepository.getEducationalSystemById(id);
  }

  async listEducationalSystems(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IEducationalSystemSummary>>> {
    return this.curriculumRepository.listEducationalSystems(filter, page);
  }

  async createStage(input: CreateStageInput): Promise<RepositoryResult<IStage>> {
    return this.curriculumRepository.createStage(input);
  }

  async updateStage(id: string, input: UpdateStageInput, expectedVersion: number): Promise<RepositoryResult<IStage>> {
    return this.curriculumRepository.updateStage(id, input, expectedVersion);
  }

  async getStageById(id: string): Promise<RepositoryResult<IStage>> {
    return this.curriculumRepository.getStageById(id);
  }

  async listStages(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IStageSummary>>> {
    return this.curriculumRepository.listStages(filter, page);
  }

  async getStagesBySystem(systemId: string): Promise<RepositoryResult<IStage[]>> {
    return this.curriculumRepository.getStagesBySystem(systemId);
  }

  async createGrade(input: CreateGradeInput): Promise<RepositoryResult<IGrade>> {
    return this.curriculumRepository.createGrade(input);
  }

  async updateGrade(id: string, input: UpdateGradeInput, expectedVersion: number): Promise<RepositoryResult<IGrade>> {
    return this.curriculumRepository.updateGrade(id, input, expectedVersion);
  }

  async getGradeById(id: string): Promise<RepositoryResult<IGrade>> {
    return this.curriculumRepository.getGradeById(id);
  }

  async listGrades(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IGradeSummary>>> {
    return this.curriculumRepository.listGrades(filter, page);
  }

  async getGradesByStage(stageId: string): Promise<RepositoryResult<IGrade[]>> {
    return this.curriculumRepository.getGradesByStage(stageId);
  }

  async createAcademicYear(input: CreateAcademicYearInput): Promise<RepositoryResult<IAcademicYear>> {
    return this.curriculumRepository.createAcademicYear(input);
  }

  async updateAcademicYear(id: string, input: UpdateAcademicYearInput, expectedVersion: number): Promise<RepositoryResult<IAcademicYear>> {
    return this.curriculumRepository.updateAcademicYear(id, input, expectedVersion);
  }

  async getAcademicYearById(id: string): Promise<RepositoryResult<IAcademicYear>> {
    return this.curriculumRepository.getAcademicYearById(id);
  }

  async listAcademicYears(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IAcademicYearSummary>>> {
    return this.curriculumRepository.listAcademicYears(filter, page);
  }

  async createAcademicTerm(input: CreateAcademicTermInput): Promise<RepositoryResult<IAcademicTerm>> {
    return this.curriculumRepository.createAcademicTerm(input);
  }

  async updateAcademicTerm(id: string, input: UpdateAcademicTermInput, expectedVersion: number): Promise<RepositoryResult<IAcademicTerm>> {
    return this.curriculumRepository.updateAcademicTerm(id, input, expectedVersion);
  }

  async getAcademicTermById(id: string): Promise<RepositoryResult<IAcademicTerm>> {
    return this.curriculumRepository.getAcademicTermById(id);
  }

  async listAcademicTerms(filter: CurriculumFilter, page: PageQuery): Promise<RepositoryResult<Page<IAcademicTermSummary>>> {
    return this.curriculumRepository.listAcademicTerms(filter, page);
  }

  async getTermsByAcademicYear(academicYearId: string): Promise<RepositoryResult<IAcademicTerm[]>> {
    return this.curriculumRepository.getTermsByAcademicYear(academicYearId);
  }

  async getCurrentAcademicYear(): Promise<RepositoryResult<IAcademicYear | null>> {
    return this.curriculumRepository.getCurrentAcademicYear();
  }

  async getCurrentAcademicTerm(academicYearId: string): Promise<RepositoryResult<IAcademicTerm | null>> {
    return this.curriculumRepository.getCurrentAcademicTerm(academicYearId);
  }

  async getCurrentAcademicContext(): Promise<RepositoryResult<ICurrentAcademicContext>> {
    return this.curriculumRepository.getCurrentAcademicContext();
  }

  async softDeleteCurriculum(id: string, collection: CurriculumCollection, requestId: string): Promise<RepositoryResult<void>> {
    return this.curriculumRepository.softDeleteCurriculum(id, collection, requestId);
  }

  async restoreCurriculum(id: string, collection: CurriculumCollection, requestId: string): Promise<RepositoryResult<void>> {
    return this.curriculumRepository.restoreCurriculum(id, collection, requestId);
  }

  getRepository(): ICurriculumRepository {
    return this.curriculumRepository;
  }
}
