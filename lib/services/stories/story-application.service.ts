import { StoryService } from './story.service';
import { IStory } from '../../repositories/contracts';
import type { RepositoryResult, RepositoryError } from '../../shared/types/repository.types';
import {
  CreateStoryInputSchema,
  UpdateStoryInputSchema,
  StoryFilterSchema,
  StoryIdSchema,
} from '../../repositories/validators/story.validator';
import {
  StoryOutput,
  StorySummaryOutput,
  StoryListOutput,
} from './dto/story-response.dto';
import { checkVersion, incrementVersion } from '../../shared/concurrency/optimistic-lock';
import { encodeCursor, decodeCursor } from '../../shared/pagination/cursor-pagination';
import { monitor } from '../../shared/observability/monitoring';
import { logger } from '../../shared/observability/logger';

function mapStory(entity: IStory): StoryOutput {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    coverImageUrl: entity.coverImageUrl,
    gradeId: entity.gradeId,
    stageId: entity.stageId,
    displayOrder: entity.displayOrder,
    published: entity.published,
    isPremium: entity.isPremium ?? false,
    priceCoins: entity.priceCoins,
    lockedOverride: entity.lockedOverride ?? null,
    contentVersion: entity.contentVersion ?? 1,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function mapStorySummary(entity: IStory): StorySummaryOutput {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    coverImageUrl: entity.coverImageUrl,
    gradeId: entity.gradeId,
    stageId: entity.stageId,
    displayOrder: entity.displayOrder,
    published: entity.published,
    isPremium: entity.isPremium ?? false,
    lockedOverride: entity.lockedOverride ?? null,
    createdAt: entity.createdAt,
  };
}

const MODULE = 'StoryApplicationService';

function createError(code: RepositoryError['code'], message: string, requestId = ''): RepositoryResult<never> {
  return { ok: false, error: { code, message, retryable: false, requestId } };
}

export class StoryApplicationService {
  constructor(private readonly storyService: StoryService) {}

  async create(input: Record<string, unknown>): Promise<RepositoryResult<StoryOutput>> {
    return monitor('create', MODULE, async () => {
      const withId = input.id ? input : { ...input, id: crypto.randomUUID() };
      const parsed = CreateStoryInputSchema.safeParse(withId);
      if (!parsed.success) return createError('INVALID_INPUT', parsed.error.message);
      const result = await this.storyService.create(parsed.data as unknown as Partial<IStory>);
      if (!result.ok) return result as unknown as RepositoryResult<StoryOutput>;
      logger.info('Story created', { module: MODULE, metadata: { storyId: result.value.id } });
      return { ok: true, value: mapStory(result.value!) };
    });
  }

  async update(id: string, input: Record<string, unknown>, expectedVersion = 0): Promise<RepositoryResult<StoryOutput>> {
    return monitor('update', MODULE, async () => {
      const parsedId = StoryIdSchema.safeParse(id);
      if (!parsedId.success) return createError('INVALID_INPUT', parsedId.error.message);
      const parsed = UpdateStoryInputSchema.safeParse(input);
      if (!parsed.success) return createError('INVALID_INPUT', parsed.error.message);
      if (expectedVersion > 0) {
        const current = await this.storyService.getById(parsedId.data);
        if (!current.ok) return current as unknown as RepositoryResult<StoryOutput>;
        const versionCheck = checkVersion(current.value, expectedVersion, 'Story', '');
        if (!versionCheck.ok) return versionCheck as unknown as RepositoryResult<StoryOutput>;
      }
      const updateData = { ...parsed.data, contentVersion: incrementVersion(expectedVersion || 1) };
      const result = await this.storyService.update(parsedId.data, updateData as unknown as Partial<IStory>);
      if (!result.ok) return result as unknown as RepositoryResult<StoryOutput>;
      return { ok: true, value: mapStory(result.value!) };
    });
  }

  async getById(id: string): Promise<RepositoryResult<StoryOutput>> {
    return monitor('getById', MODULE, async () => {
      const parsedId = StoryIdSchema.safeParse(id);
      if (!parsedId.success) return createError('INVALID_INPUT', parsedId.error.message);
      const result = await this.storyService.getById(parsedId.data);
      if (!result.ok) return result as unknown as RepositoryResult<StoryOutput>;
      if (!result.value) return createError('NOT_FOUND', 'Story not found');
      return { ok: true, value: mapStory(result.value) };
    });
  }

  async list(filter: Record<string, unknown>, page?: { limit?: number; cursor?: string }): Promise<RepositoryResult<StoryListOutput<StorySummaryOutput>>> {
    return monitor('list', MODULE, async () => {
      const parsedFilter = StoryFilterSchema.safeParse(filter);
      if (!parsedFilter.success) return createError('INVALID_INPUT', parsedFilter.error.message);
      const limit = Math.min(Math.max(page?.limit ?? 20, 1), 100);
      const result = await this.storyService.list(parsedFilter.data);
      if (!result.ok) return result as unknown as RepositoryResult<StoryListOutput<StorySummaryOutput>>;
      let items = result.value.map(mapStorySummary);
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

  async listByGrade(gradeId: string): Promise<RepositoryResult<StoryOutput[]>> {
    const result = await this.storyService.listByGrade(gradeId);
    if (!result.ok) return result as unknown as RepositoryResult<StoryOutput[]>;
    return { ok: true, value: result.value.map(mapStory) };
  }

  async softDelete(id: string, requestId: string): Promise<RepositoryResult<void>> {
    return monitor('softDelete', MODULE, async () => {
      const parsedId = StoryIdSchema.safeParse(id);
      if (!parsedId.success) return createError('INVALID_INPUT', parsedId.error.message);
      const result = await this.storyService.delete(parsedId.data);
      if (result.ok) logger.info('Story deleted', { module: MODULE, metadata: { storyId: id, requestId } });
      return result;
    });
  }

  async restore(id: string, requestId: string): Promise<RepositoryResult<void>> {
    return monitor('restore', MODULE, async () => {
      const parsedId = StoryIdSchema.safeParse(id);
      if (!parsedId.success) return createError('INVALID_INPUT', parsedId.error.message);
      const result = await this.storyService.restore(parsedId.data, requestId);
      if (result.ok) logger.info('Story restored', { module: MODULE, metadata: { storyId: id, requestId } });
      return result;
    });
  }
}
