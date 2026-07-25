import { UnitService } from './unit.service';
import {
  IUnit,
  IUnitSummary,
} from '../../repositories/contracts';
import { RepositoryResult } from '../../shared/types/repository.types';
import {
  CreateUnitInputSchema,
  UpdateUnitInputSchema,
  UnitFilterSchema,
  UnitIdSchema,
} from '../../repositories/validators/unit.validator';
import { PageQuerySchema } from '../../repositories/validators';
import {
  UnitOutput,
  UnitSummaryOutput,
  UnitListOutput,
} from './dto/unit-response.dto';

function mapUnit(entity: IUnit): UnitOutput {
  return {
    id: entity.id,
    academicTermId: entity.academicTermId,
    name: entity.name,
    nameAr: entity.nameAr,
    description: entity.description,
    order: entity.order,
    isActive: entity.isActive,
    isPremium: entity.isPremium,
    published: entity.published,
    lockedOverride: entity.lockedOverride,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function mapUnitSummary(entity: IUnitSummary): UnitSummaryOutput {
  return {
    id: entity.id,
    academicTermId: entity.academicTermId,
    name: entity.name,
    nameAr: entity.nameAr,
    order: entity.order,
    isActive: entity.isActive,
    isPremium: entity.isPremium,
    published: entity.published,
    lockedOverride: entity.lockedOverride,
    createdAt: entity.createdAt,
  };
}

export class UnitApplicationService {
  constructor(private readonly unitService: UnitService) {}

  async createUnit(input: Record<string, unknown>): Promise<RepositoryResult<UnitOutput>> {
    const parsed = CreateUnitInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.unitService.createUnit(parsed.data);
    if (!result.ok) return result as RepositoryResult<UnitOutput>;
    return { ok: true, value: mapUnit(result.value) };
  }

  async updateUnit(id: string, input: Record<string, unknown>, expectedVersion: number): Promise<RepositoryResult<UnitOutput>> {
    const parsedId = UnitIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const parsed = UpdateUnitInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.unitService.updateUnit(parsedId.data, parsed.data, expectedVersion);
    if (!result.ok) return result as RepositoryResult<UnitOutput>;
    return { ok: true, value: mapUnit(result.value) };
  }

  async getUnitById(id: string): Promise<RepositoryResult<UnitOutput>> {
    const parsedId = UnitIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.unitService.getUnitById(parsedId.data);
    if (!result.ok) return result as RepositoryResult<UnitOutput>;
    return { ok: true, value: mapUnit(result.value) };
  }

  async listUnits(filter: Record<string, unknown>, page: Record<string, unknown>): Promise<RepositoryResult<UnitListOutput<UnitSummaryOutput>>> {
    const parsedFilter = UnitFilterSchema.safeParse(filter);
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
    const result = await this.unitService.listUnits(parsedFilter.data, parsedPage.data);
    if (!result.ok) return result as unknown as RepositoryResult<UnitListOutput<UnitSummaryOutput>>;
    return {
      ok: true,
      value: {
        items: result.value.items.map(mapUnitSummary),
        nextCursor: result.value.nextCursor,
      },
    };
  }

  async getUnitsByTerm(academicTermId: string): Promise<RepositoryResult<UnitOutput[]>> {
    const parsedId = UnitIdSchema.safeParse(academicTermId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.unitService.getUnitsByTerm(parsedId.data);
    if (!result.ok) return result as RepositoryResult<UnitOutput[]>;
    return { ok: true, value: result.value.map(mapUnit) };
  }

  async softDeleteUnit(id: string, requestId: string): Promise<RepositoryResult<void>> {
    const parsedId = UnitIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    return this.unitService.softDeleteUnit(parsedId.data, requestId);
  }

  async restoreUnit(id: string, requestId: string): Promise<RepositoryResult<void>> {
    const parsedId = UnitIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    return this.unitService.restoreUnit(parsedId.data, requestId);
  }
}
