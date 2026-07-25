import { LessonService } from './lesson.service';
import { ILesson, ILessonSummary } from '../../repositories/contracts';
import { RepositoryResult } from '../../shared/types/repository.types';
import {
  CreateLessonInputSchema,
  UpdateLessonInputSchema,
  LessonFilterSchema,
  LessonIdSchema,
  ChangeOrderSchema,
} from '../../repositories/validators/lesson.validator';
import { PageQuerySchema } from '../../repositories/validators';
import {
  LessonOutput,
  LessonSummaryOutput,
  LessonListOutput,
} from './dto/lesson-response.dto';

function mapLesson(entity: ILesson): LessonOutput {
  return {
    id: entity.id,
    unitId: entity.unitId,
    title: entity.title,
    slug: entity.slug,
    description: entity.description,
    displayOrder: entity.displayOrder,
    status: entity.status,
    isPublished: entity.isPublished,
    isVisible: entity.isVisible,
    isPremium: entity.isPremium,
    lockedOverride: entity.lockedOverride,
    homeworkEnabled: entity.homeworkEnabled,
    quizEnabled: entity.quizEnabled,
    estimatedDuration: entity.estimatedDuration,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function mapLessonSummary(entity: ILessonSummary): LessonSummaryOutput {
  return {
    id: entity.id,
    unitId: entity.unitId,
    title: entity.title,
    slug: entity.slug,
    displayOrder: entity.displayOrder,
    status: entity.status,
    isPublished: entity.isPublished,
    isVisible: entity.isVisible,
    isPremium: entity.isPremium,
    lockedOverride: entity.lockedOverride,
    homeworkEnabled: entity.homeworkEnabled,
    quizEnabled: entity.quizEnabled,
    estimatedDuration: entity.estimatedDuration,
    createdAt: entity.createdAt,
  };
}

export class LessonApplicationService {
  constructor(private readonly lessonService: LessonService) {}

  async createLesson(input: Record<string, unknown>): Promise<RepositoryResult<LessonOutput>> {
    const parsed = CreateLessonInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.lessonService.createLesson(parsed.data);
    if (!result.ok) return result;
    return { ok: true, value: mapLesson(result.value) };
  }

  async updateLesson(id: string, input: Record<string, unknown>, expectedVersion: number): Promise<RepositoryResult<LessonOutput>> {
    const parsedId = LessonIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const parsed = UpdateLessonInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsed.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.lessonService.updateLesson(parsedId.data, parsed.data, expectedVersion);
    if (!result.ok) return result;
    return { ok: true, value: mapLesson(result.value) };
  }

  async getLessonById(id: string): Promise<RepositoryResult<LessonOutput>> {
    const parsedId = LessonIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.lessonService.getLessonById(parsedId.data);
    if (!result.ok) return result;
    return { ok: true, value: mapLesson(result.value) };
  }

  async listLessons(filter: Record<string, unknown>, page: Record<string, unknown>): Promise<RepositoryResult<LessonListOutput<LessonSummaryOutput>>> {
    const parsedFilter = LessonFilterSchema.safeParse(filter);
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
    const result = await this.lessonService.listLessons(parsedFilter.data, parsedPage.data);
    if (!result.ok) return result;
    return {
      ok: true,
      value: {
        items: result.value.items.map(mapLessonSummary),
        nextCursor: result.value.nextCursor,
      },
    };
  }

  async getLessonsByUnit(unitId: string): Promise<RepositoryResult<LessonOutput[]>> {
    const parsedId = LessonIdSchema.safeParse(unitId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.lessonService.getLessonsByUnit(parsedId.data);
    if (!result.ok) return result;
    return { ok: true, value: result.value.map(mapLesson) };
  }

  async getPublishedLessons(unitId: string): Promise<RepositoryResult<LessonOutput[]>> {
    const parsedId = LessonIdSchema.safeParse(unitId);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.lessonService.getPublishedLessons(parsedId.data);
    if (!result.ok) return result;
    return { ok: true, value: result.value.map(mapLesson) };
  }

  async searchLessons(searchTerm: string, page: Record<string, unknown>): Promise<RepositoryResult<LessonListOutput<LessonSummaryOutput>>> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: 'Search term is required', retryable: false, requestId: '' },
      };
    }
    const parsedPage = PageQuerySchema.safeParse(page);
    if (!parsedPage.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedPage.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.lessonService.searchLessons(searchTerm, parsedPage.data);
    if (!result.ok) return result;
    return {
      ok: true,
      value: {
        items: result.value.items.map(mapLessonSummary),
        nextCursor: result.value.nextCursor,
      },
    };
  }

  async getPreviousLesson(unitId: string, displayOrder: number): Promise<RepositoryResult<LessonOutput | null>> {
    const result = await this.lessonService.getPreviousLesson(unitId, displayOrder);
    if (!result.ok) return result;
    return { ok: true, value: result.value ? mapLesson(result.value) : null };
  }

  async getNextLesson(unitId: string, displayOrder: number): Promise<RepositoryResult<LessonOutput | null>> {
    const result = await this.lessonService.getNextLesson(unitId, displayOrder);
    if (!result.ok) return result;
    return { ok: true, value: result.value ? mapLesson(result.value) : null };
  }

  async softDeleteLesson(id: string, requestId: string): Promise<RepositoryResult<void>> {
    const parsedId = LessonIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    return this.lessonService.softDeleteLesson(parsedId.data, requestId);
  }

  async restoreLesson(id: string, requestId: string): Promise<RepositoryResult<void>> {
    const parsedId = LessonIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    return this.lessonService.restoreLesson(parsedId.data, requestId);
  }

  async archiveLesson(id: string, requestId: string): Promise<RepositoryResult<void>> {
    const parsedId = LessonIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    return this.lessonService.archiveLesson(parsedId.data, requestId);
  }

  async publishLesson(id: string, requestId: string): Promise<RepositoryResult<LessonOutput>> {
    const parsedId = LessonIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.lessonService.publishLesson(parsedId.data, requestId);
    if (!result.ok) return result;
    return { ok: true, value: mapLesson(result.value) };
  }

  async unpublishLesson(id: string, requestId: string): Promise<RepositoryResult<LessonOutput>> {
    const parsedId = LessonIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.lessonService.unpublishLesson(parsedId.data, requestId);
    if (!result.ok) return result;
    return { ok: true, value: mapLesson(result.value) };
  }

  async changeOrder(id: string, input: Record<string, unknown>, expectedVersion: number): Promise<RepositoryResult<LessonOutput>> {
    const parsedId = LessonIdSchema.safeParse(id);
    if (!parsedId.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedId.error.message, retryable: false, requestId: '' },
      };
    }
    const parsedOrder = ChangeOrderSchema.safeParse(input);
    if (!parsedOrder.success) {
      return {
        ok: false,
        error: { code: 'INVALID_INPUT', message: parsedOrder.error.message, retryable: false, requestId: '' },
      };
    }
    const result = await this.lessonService.changeOrder(parsedId.data, parsedOrder.data.displayOrder, expectedVersion);
    if (!result.ok) return result;
    return { ok: true, value: mapLesson(result.value) };
  }
}
