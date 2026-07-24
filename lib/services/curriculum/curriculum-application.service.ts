import { CurriculumService } from './curriculum.service';
import {
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
  CurriculumCollection,
} from '../../repositories/contracts';
import { RepositoryResult } from '../../shared/types/repository.types';
import {
  CreateEducationalSystemInputSchema,
  UpdateEducationalSystemInputSchema,
  CreateStageInputSchema,
  UpdateStageInputSchema,
  CreateGradeInputSchema,
  UpdateGradeInputSchema,
  CreateAcademicYearInputSchema,
  UpdateAcademicYearInputSchema,
  CreateAcademicTermInputSchema,
  UpdateAcademicTermInputSchema,
  CurriculumFilterSchema,
  CurriculumIdSchema,
} from '../../repositories/validators/curriculum.validator';
import { PageQuerySchema } from '../../repositories/validators';
import {
  EducationalSystemOutput,
  EducationalSystemSummaryOutput,
  StageOutput,
  StageSummaryOutput,
  GradeOutput,
  GradeSummaryOutput,
  AcademicYearOutput,
  AcademicYearSummaryOutput,
  AcademicTermOutput,
  AcademicTermSummaryOutput,
  CurrentAcademicContextOutput,
  CurriculumListOutput,
} from './dto/curriculum-response.dto';

function mapEducationalSystem(entity: IEducationalSystem): EducationalSystemOutput {
  return {
    id: entity.id,
    name: entity.name,
    nameAr: entity.nameAr,
    description: entity.description,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function mapEducationalSystemSummary(entity: IEducationalSystemSummary): EducationalSystemSummaryOutput {
  return {
    id: entity.id,
    name: entity.name,
    nameAr: entity.nameAr,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
  };
}

function mapStage(entity: IStage): StageOutput {
  return {
    id: entity.id,
    educationalSystemId: entity.educationalSystemId,
    name: entity.name,
    nameAr: entity.nameAr,
    order: entity.order,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function mapStageSummary(entity: IStageSummary): StageSummaryOutput {
  return {
    id: entity.id,
    educationalSystemId: entity.educationalSystemId,
    name: entity.name,
    nameAr: entity.nameAr,
    order: entity.order,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
  };
}

function mapGrade(entity: IGrade): GradeOutput {
  return {
    id: entity.id,
    educationalSystemId: entity.educationalSystemId,
    stageId: entity.stageId,
    name: entity.name,
    nameAr: entity.nameAr,
    order: entity.order,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function mapGradeSummary(entity: IGradeSummary): GradeSummaryOutput {
  return {
    id: entity.id,
    educationalSystemId: entity.educationalSystemId,
    stageId: entity.stageId,
    name: entity.name,
    nameAr: entity.nameAr,
    order: entity.order,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
  };
}

function mapAcademicYear(entity: IAcademicYear): AcademicYearOutput {
  return {
    id: entity.id,
    educationalSystemId: entity.educationalSystemId,
    name: entity.name,
    nameAr: entity.nameAr,
    startDate: entity.startDate,
    endDate: entity.endDate,
    isCurrent: entity.isCurrent,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function mapAcademicYearSummary(entity: IAcademicYearSummary): AcademicYearSummaryOutput {
  return {
    id: entity.id,
    name: entity.name,
    isCurrent: entity.isCurrent,
    startDate: entity.startDate,
    endDate: entity.endDate,
    createdAt: entity.createdAt,
  };
}

function mapAcademicTerm(entity: IAcademicTerm): AcademicTermOutput {
  return {
    id: entity.id,
    academicYearId: entity.academicYearId,
    name: entity.name,
    nameAr: entity.nameAr,
    order: entity.order,
    startDate: entity.startDate,
    endDate: entity.endDate,
    isCurrent: entity.isCurrent,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function mapAcademicTermSummary(entity: IAcademicTermSummary): AcademicTermSummaryOutput {
  return {
    id: entity.id,
    academicYearId: entity.academicYearId,
    name: entity.name,
    nameAr: entity.nameAr,
    order: entity.order,
    isCurrent: entity.isCurrent,
    createdAt: entity.createdAt,
  };
}

function mapCurrentContext(context: ICurrentAcademicContext): CurrentAcademicContextOutput {
  return {
    educationalSystem: context.educationalSystem ? mapEducationalSystem(context.educationalSystem) : null,
    stage: context.stage ? mapStage(context.stage) : null,
    grade: context.grade ? mapGrade(context.grade) : null,
    academicYear: context.academicYear ? mapAcademicYear(context.academicYear) : null,
    academicTerm: context.academicTerm ? mapAcademicTerm(context.academicTerm) : null,
  };
}

export class CurriculumApplicationService {
  constructor(private readonly curriculumService: CurriculumService) {}

  async createEducationalSystem(input: Record<string, unknown>): Promise<RepositoryResult<EducationalSystemOutput>> {
    const parsed = CreateEducationalSystemInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.createEducationalSystem(parsed.data);
    if (!result.ok) return result as RepositoryResult<EducationalSystemOutput>;
    return { ok: true, value: mapEducationalSystem(result.value) };
  }

  async updateEducationalSystem(id: string, input: Record<string, unknown>, expectedVersion: number): Promise<RepositoryResult<EducationalSystemOutput>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const parsed = UpdateEducationalSystemInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.updateEducationalSystem(parsedId.data, parsed.data, expectedVersion);
    if (!result.ok) return result as RepositoryResult<EducationalSystemOutput>;
    return { ok: true, value: mapEducationalSystem(result.value) };
  }

  async getEducationalSystemById(id: string): Promise<RepositoryResult<EducationalSystemOutput>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.getEducationalSystemById(parsedId.data);
    if (!result.ok) return result as RepositoryResult<EducationalSystemOutput>;
    return { ok: true, value: mapEducationalSystem(result.value) };
  }

  async listEducationalSystems(filter: Record<string, unknown>, page: Record<string, unknown>): Promise<RepositoryResult<CurriculumListOutput<EducationalSystemSummaryOutput>>> {
    const parsedFilter = CurriculumFilterSchema.safeParse(filter);
    if (!parsedFilter.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedFilter.error.message, retryable: false, requestId: '' },
      };
    }
    const parsedPage = PageQuerySchema.safeParse(page);
    if (!parsedPage.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedPage.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.listEducationalSystems(parsedFilter.data, parsedPage.data);
    if (!result.ok) return result as unknown as RepositoryResult<CurriculumListOutput<EducationalSystemSummaryOutput>>;
    return {
      ok: true,
      value: {
        items: result.value.items.map(mapEducationalSystemSummary),
        nextCursor: result.value.nextCursor,
      },
    };
  }

  async createStage(input: Record<string, unknown>): Promise<RepositoryResult<StageOutput>> {
    const parsed = CreateStageInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.createStage(parsed.data);
    if (!result.ok) return result as RepositoryResult<StageOutput>;
    return { ok: true, value: mapStage(result.value) };
  }

  async updateStage(id: string, input: Record<string, unknown>, expectedVersion: number): Promise<RepositoryResult<StageOutput>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const parsed = UpdateStageInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.updateStage(parsedId.data, parsed.data, expectedVersion);
    if (!result.ok) return result as RepositoryResult<StageOutput>;
    return { ok: true, value: mapStage(result.value) };
  }

  async getStageById(id: string): Promise<RepositoryResult<StageOutput>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.getStageById(parsedId.data);
    if (!result.ok) return result as RepositoryResult<StageOutput>;
    return { ok: true, value: mapStage(result.value) };
  }

  async listStages(filter: Record<string, unknown>, page: Record<string, unknown>): Promise<RepositoryResult<CurriculumListOutput<StageSummaryOutput>>> {
    const parsedFilter = CurriculumFilterSchema.safeParse(filter);
    if (!parsedFilter.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedFilter.error.message, retryable: false, requestId: '' },
      };
    }
    const parsedPage = PageQuerySchema.safeParse(page);
    if (!parsedPage.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedPage.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.listStages(parsedFilter.data, parsedPage.data);
    if (!result.ok) return result as unknown as RepositoryResult<CurriculumListOutput<StageSummaryOutput>>;
    return {
      ok: true,
      value: {
        items: result.value.items.map(mapStageSummary),
        nextCursor: result.value.nextCursor,
      },
    };
  }

  async getStagesBySystem(systemId: string): Promise<RepositoryResult<StageOutput[]>> {
    const parsedId = CurriculumIdSchema.safeParse(systemId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.getStagesBySystem(parsedId.data);
    if (!result.ok) return result as RepositoryResult<StageOutput[]>;
    return { ok: true, value: result.value.map(mapStage) };
  }

  async createGrade(input: Record<string, unknown>): Promise<RepositoryResult<GradeOutput>> {
    const parsed = CreateGradeInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.createGrade(parsed.data);
    if (!result.ok) return result as RepositoryResult<GradeOutput>;
    return { ok: true, value: mapGrade(result.value) };
  }

  async updateGrade(id: string, input: Record<string, unknown>, expectedVersion: number): Promise<RepositoryResult<GradeOutput>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const parsed = UpdateGradeInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.updateGrade(parsedId.data, parsed.data, expectedVersion);
    if (!result.ok) return result as RepositoryResult<GradeOutput>;
    return { ok: true, value: mapGrade(result.value) };
  }

  async getGradeById(id: string): Promise<RepositoryResult<GradeOutput>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.getGradeById(parsedId.data);
    if (!result.ok) return result as RepositoryResult<GradeOutput>;
    return { ok: true, value: mapGrade(result.value) };
  }

  async listGrades(filter: Record<string, unknown>, page: Record<string, unknown>): Promise<RepositoryResult<CurriculumListOutput<GradeSummaryOutput>>> {
    const parsedFilter = CurriculumFilterSchema.safeParse(filter);
    if (!parsedFilter.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedFilter.error.message, retryable: false, requestId: '' },
      };
    }
    const parsedPage = PageQuerySchema.safeParse(page);
    if (!parsedPage.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedPage.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.listGrades(parsedFilter.data, parsedPage.data);
    if (!result.ok) return result as unknown as RepositoryResult<CurriculumListOutput<GradeSummaryOutput>>;
    return {
      ok: true,
      value: {
        items: result.value.items.map(mapGradeSummary),
        nextCursor: result.value.nextCursor,
      },
    };
  }

  async getGradesByStage(stageId: string): Promise<RepositoryResult<GradeOutput[]>> {
    const parsedId = CurriculumIdSchema.safeParse(stageId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.getGradesByStage(parsedId.data);
    if (!result.ok) return result as RepositoryResult<GradeOutput[]>;
    return { ok: true, value: result.value.map(mapGrade) };
  }

  async createAcademicYear(input: Record<string, unknown>): Promise<RepositoryResult<AcademicYearOutput>> {
    const parsed = CreateAcademicYearInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.createAcademicYear(parsed.data);
    if (!result.ok) return result as RepositoryResult<AcademicYearOutput>;
    return { ok: true, value: mapAcademicYear(result.value) };
  }

  async updateAcademicYear(id: string, input: Record<string, unknown>, expectedVersion: number): Promise<RepositoryResult<AcademicYearOutput>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const parsed = UpdateAcademicYearInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.updateAcademicYear(parsedId.data, parsed.data, expectedVersion);
    if (!result.ok) return result as RepositoryResult<AcademicYearOutput>;
    return { ok: true, value: mapAcademicYear(result.value) };
  }

  async getAcademicYearById(id: string): Promise<RepositoryResult<AcademicYearOutput>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.getAcademicYearById(parsedId.data);
    if (!result.ok) return result as RepositoryResult<AcademicYearOutput>;
    return { ok: true, value: mapAcademicYear(result.value) };
  }

  async listAcademicYears(filter: Record<string, unknown>, page: Record<string, unknown>): Promise<RepositoryResult<CurriculumListOutput<AcademicYearSummaryOutput>>> {
    const parsedFilter = CurriculumFilterSchema.safeParse(filter);
    if (!parsedFilter.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedFilter.error.message, retryable: false, requestId: '' },
      };
    }
    const parsedPage = PageQuerySchema.safeParse(page);
    if (!parsedPage.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedPage.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.listAcademicYears(parsedFilter.data, parsedPage.data);
    if (!result.ok) return result as unknown as RepositoryResult<CurriculumListOutput<AcademicYearSummaryOutput>>;
    return {
      ok: true,
      value: {
        items: result.value.items.map(mapAcademicYearSummary),
        nextCursor: result.value.nextCursor,
      },
    };
  }

  async createAcademicTerm(input: Record<string, unknown>): Promise<RepositoryResult<AcademicTermOutput>> {
    const parsed = CreateAcademicTermInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.createAcademicTerm(parsed.data);
    if (!result.ok) return result as RepositoryResult<AcademicTermOutput>;
    return { ok: true, value: mapAcademicTerm(result.value) };
  }

  async updateAcademicTerm(id: string, input: Record<string, unknown>, expectedVersion: number): Promise<RepositoryResult<AcademicTermOutput>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const parsed = UpdateAcademicTermInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.updateAcademicTerm(parsedId.data, parsed.data, expectedVersion);
    if (!result.ok) return result as RepositoryResult<AcademicTermOutput>;
    return { ok: true, value: mapAcademicTerm(result.value) };
  }

  async getAcademicTermById(id: string): Promise<RepositoryResult<AcademicTermOutput>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.getAcademicTermById(parsedId.data);
    if (!result.ok) return result as RepositoryResult<AcademicTermOutput>;
    return { ok: true, value: mapAcademicTerm(result.value) };
  }

  async listAcademicTerms(filter: Record<string, unknown>, page: Record<string, unknown>): Promise<RepositoryResult<CurriculumListOutput<AcademicTermSummaryOutput>>> {
    const parsedFilter = CurriculumFilterSchema.safeParse(filter);
    if (!parsedFilter.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedFilter.error.message, retryable: false, requestId: '' },
      };
    }
    const parsedPage = PageQuerySchema.safeParse(page);
    if (!parsedPage.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedPage.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.listAcademicTerms(parsedFilter.data, parsedPage.data);
    if (!result.ok) return result as unknown as RepositoryResult<CurriculumListOutput<AcademicTermSummaryOutput>>;
    return {
      ok: true,
      value: {
        items: result.value.items.map(mapAcademicTermSummary),
        nextCursor: result.value.nextCursor,
      },
    };
  }

  async getTermsByAcademicYear(academicYearId: string): Promise<RepositoryResult<AcademicTermOutput[]>> {
    const parsedId = CurriculumIdSchema.safeParse(academicYearId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.getTermsByAcademicYear(parsedId.data);
    if (!result.ok) return result as RepositoryResult<AcademicTermOutput[]>;
    return { ok: true, value: result.value.map(mapAcademicTerm) };
  }

  async getCurrentAcademicYear(): Promise<RepositoryResult<AcademicYearOutput | null>> {
    const result = await this.curriculumService.getCurrentAcademicYear();
    if (!result.ok) return result as RepositoryResult<AcademicYearOutput | null>;
    return { ok: true, value: result.value ? mapAcademicYear(result.value) : null };
  }

  async getCurrentAcademicTerm(academicYearId: string): Promise<RepositoryResult<AcademicTermOutput | null>> {
    const parsedId = CurriculumIdSchema.safeParse(academicYearId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.curriculumService.getCurrentAcademicTerm(parsedId.data);
    if (!result.ok) return result as RepositoryResult<AcademicTermOutput | null>;
    return { ok: true, value: result.value ? mapAcademicTerm(result.value) : null };
  }

  async getCurrentAcademicContext(userId?: string): Promise<RepositoryResult<CurrentAcademicContextOutput>> {
    const result = await this.curriculumService.getCurrentAcademicContext(userId);
    if (!result.ok) return result as RepositoryResult<CurrentAcademicContextOutput>;
    return { ok: true, value: mapCurrentContext(result.value) };
  }

  async softDeleteCurriculum(id: string, collection: CurriculumCollection, requestId: string): Promise<RepositoryResult<void>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    return this.curriculumService.softDeleteCurriculum(parsedId.data, collection, requestId);
  }

  async restoreCurriculum(id: string, collection: CurriculumCollection, requestId: string): Promise<RepositoryResult<void>> {
    const parsedId = CurriculumIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    return this.curriculumService.restoreCurriculum(parsedId.data, collection, requestId);
  }
}
