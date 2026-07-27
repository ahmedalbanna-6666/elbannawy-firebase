import { FinalReviewService } from './final-review.service';
import { IFinalReview } from '../../repositories/contracts';
import type { RepositoryResult, RepositoryError } from '../../shared/types/repository.types';
import {
  CreateFinalReviewInputSchema,
  UpdateFinalReviewInputSchema,
  FinalReviewFilterSchema,
  FinalReviewIdSchema,
} from '../../repositories/validators/final-review.validator';
import {
  FinalReviewOutput,
  FinalReviewSummaryOutput,
  FinalReviewListOutput,
} from './dto/final-review-response.dto';
import { checkVersion, incrementVersion } from '../../shared/concurrency/optimistic-lock';
import { encodeCursor, decodeCursor } from '../../shared/pagination/cursor-pagination';
import { monitor } from '../../shared/observability/monitoring';
import { logger } from '../../shared/observability/logger';

function mapReview(entity: IFinalReview): FinalReviewOutput {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    coverImageUrl: entity.coverImageUrl,
    gradeId: entity.gradeId,
    stageId: entity.stageId,
    displayOrder: entity.displayOrder,
    enabled: entity.enabled,
    published: entity.published,
    isPremium: entity.isPremium ?? false,
    priceCoins: entity.priceCoins,
    lockedOverride: entity.lockedOverride ?? null,
    createdBy: entity.createdBy,
    contentVersion: entity.contentVersion ?? 1,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function mapReviewSummary(entity: IFinalReview): FinalReviewSummaryOutput {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    coverImageUrl: entity.coverImageUrl,
    gradeId: entity.gradeId,
    stageId: entity.stageId,
    displayOrder: entity.displayOrder,
    enabled: entity.enabled,
    published: entity.published,
    isPremium: entity.isPremium ?? false,
    lockedOverride: entity.lockedOverride ?? null,
    createdAt: entity.createdAt,
  };
}

const MODULE = 'FinalReviewApplicationService';

function createError(code: RepositoryError['code'], message: string, requestId = ''): RepositoryResult<never> {
  return { ok: false, error: { code, message, retryable: false, requestId } };
}

export class FinalReviewApplicationService {
  constructor(private readonly reviewService: FinalReviewService) {}

  async create(input: Record<string, unknown>): Promise<RepositoryResult<FinalReviewOutput>> {
    return monitor('create', MODULE, async () => {
      const withId = input.id ? input : { ...input, id: crypto.randomUUID() };
      const parsed = CreateFinalReviewInputSchema.safeParse(withId);
      if (!parsed.success) return createError('INVALID_INPUT', parsed.error.message);
      const result = await this.reviewService.create(parsed.data as unknown as Partial<IFinalReview>);
      if (!result.ok) return result as unknown as RepositoryResult<FinalReviewOutput>;
      logger.info('Final review created', { module: MODULE, metadata: { reviewId: result.value.id } });
      return { ok: true, value: mapReview(result.value!) };
    });
  }

  async update(id: string, input: Record<string, unknown>, expectedVersion = 0): Promise<RepositoryResult<FinalReviewOutput>> {
    return monitor('update', MODULE, async () => {
      const parsedId = FinalReviewIdSchema.safeParse(id);
      if (!parsedId.success) return createError('INVALID_INPUT', parsedId.error.message);
      const parsed = UpdateFinalReviewInputSchema.safeParse(input);
      if (!parsed.success) return createError('INVALID_INPUT', parsed.error.message);
      if (expectedVersion > 0) {
        const current = await this.reviewService.getById(parsedId.data);
        if (!current.ok) return current as unknown as RepositoryResult<FinalReviewOutput>;
        const versionCheck = checkVersion(current.value, expectedVersion, 'FinalReview', '');
        if (!versionCheck.ok) return versionCheck as unknown as RepositoryResult<FinalReviewOutput>;
      }
      const updateData = { ...parsed.data, contentVersion: incrementVersion(expectedVersion || 1) };
      const result = await this.reviewService.update(parsedId.data, updateData as unknown as Partial<IFinalReview>);
      if (!result.ok) return result as unknown as RepositoryResult<FinalReviewOutput>;
      return { ok: true, value: mapReview(result.value!) };
    });
  }

  async getById(id: string): Promise<RepositoryResult<FinalReviewOutput>> {
    return monitor('getById', MODULE, async () => {
      const parsedId = FinalReviewIdSchema.safeParse(id);
      if (!parsedId.success) return createError('INVALID_INPUT', parsedId.error.message);
      const result = await this.reviewService.getById(parsedId.data);
      if (!result.ok) return result as unknown as RepositoryResult<FinalReviewOutput>;
      if (!result.value) return createError('NOT_FOUND', 'Final review not found');
      return { ok: true, value: mapReview(result.value) };
    });
  }

  async list(filter: Record<string, unknown>, page?: { limit?: number; cursor?: string }): Promise<RepositoryResult<FinalReviewListOutput<FinalReviewSummaryOutput>>> {
    return monitor('list', MODULE, async () => {
      const parsedFilter = FinalReviewFilterSchema.safeParse(filter);
      if (!parsedFilter.success) return createError('INVALID_INPUT', parsedFilter.error.message);
      const limit = Math.min(Math.max(page?.limit ?? 20, 1), 100);
      const result = await this.reviewService.list(parsedFilter.data);
      if (!result.ok) return result as unknown as RepositoryResult<FinalReviewListOutput<FinalReviewSummaryOutput>>;
      let items = result.value.map(mapReviewSummary);
      let nextCursor: string | null = null;
      if (page?.cursor) {
        const decoded = decodeCursor(page.cursor);
        if (decoded) {
          const cursorIdx = items.findIndex((i) => i.id === decoded.value);
          if (cursorIdx >= 0) items = items.slice(cursorIdx + 1);
        }
      }
      if (items.length > limit) {
        const lastItem = items[limit - 1];
        if (lastItem) {
          nextCursor = encodeCursor(lastItem.id, 'id');
          items = items.slice(0, limit);
        }
      }
      return { ok: true, value: { items, nextCursor } };
    });
  }

  async listByGrade(gradeId: string): Promise<RepositoryResult<FinalReviewOutput[]>> {
    const result = await this.reviewService.listByGrade(gradeId);
    if (!result.ok) return result as unknown as RepositoryResult<FinalReviewOutput[]>;
    return { ok: true, value: result.value.map(mapReview) };
  }

  async softDelete(id: string, requestId: string): Promise<RepositoryResult<void>> {
    return monitor('softDelete', MODULE, async () => {
      const parsedId = FinalReviewIdSchema.safeParse(id);
      if (!parsedId.success) return createError('INVALID_INPUT', parsedId.error.message);
      const result = await this.reviewService.delete(parsedId.data);
      if (result.ok) logger.info('Final review deleted', { module: MODULE, metadata: { reviewId: id, requestId } });
      return result;
    });
  }

  async restore(id: string, requestId: string): Promise<RepositoryResult<void>> {
    return monitor('restore', MODULE, async () => {
      const parsedId = FinalReviewIdSchema.safeParse(id);
      if (!parsedId.success) return createError('INVALID_INPUT', parsedId.error.message);
      const result = await this.reviewService.restore(parsedId.data, requestId);
      if (result.ok) logger.info('Final review restored', { module: MODULE, metadata: { reviewId: id, requestId } });
      return result;
    });
  }
}
