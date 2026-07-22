import {
  ILessonRepository,
  ILesson,
  ILessonSummary,
  CreateLessonInput,
  UpdateLessonInput,
  LessonFilter,
} from '../../repositories/contracts';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { LessonRepository } from '../../repositories/lessons/lesson.repository';

export class LessonService {
  constructor(private readonly lessonRepository: ILessonRepository = new LessonRepository()) {}

  async createLesson(input: CreateLessonInput): Promise<RepositoryResult<ILesson>> {
    return this.lessonRepository.createLesson(input);
  }

  async updateLesson(id: string, input: UpdateLessonInput, expectedVersion: number): Promise<RepositoryResult<ILesson>> {
    return this.lessonRepository.updateLesson(id, input, expectedVersion);
  }

  async getLessonById(id: string): Promise<RepositoryResult<ILesson>> {
    return this.lessonRepository.getLessonById(id);
  }

  async listLessons(filter: LessonFilter, page: PageQuery): Promise<RepositoryResult<Page<ILessonSummary>>> {
    return this.lessonRepository.listLessons(filter, page);
  }

  async getLessonsByUnit(unitId: string): Promise<RepositoryResult<ILesson[]>> {
    return this.lessonRepository.getLessonsByUnit(unitId);
  }

  async getPublishedLessons(unitId: string): Promise<RepositoryResult<ILesson[]>> {
    return this.lessonRepository.getPublishedLessons(unitId);
  }

  async searchLessons(searchTerm: string, page: PageQuery): Promise<RepositoryResult<Page<ILessonSummary>>> {
    return this.lessonRepository.searchLessons(searchTerm, page);
  }

  async getPreviousLesson(unitId: string, currentDisplayOrder: number): Promise<RepositoryResult<ILesson | null>> {
    return this.lessonRepository.getPreviousLesson(unitId, currentDisplayOrder);
  }

  async getNextLesson(unitId: string, currentDisplayOrder: number): Promise<RepositoryResult<ILesson | null>> {
    return this.lessonRepository.getNextLesson(unitId, currentDisplayOrder);
  }

  async softDeleteLesson(id: string, requestId: string): Promise<RepositoryResult<void>> {
    return this.lessonRepository.softDeleteLesson(id, requestId);
  }

  async restoreLesson(id: string, requestId: string): Promise<RepositoryResult<void>> {
    return this.lessonRepository.restoreLesson(id, requestId);
  }

  async archiveLesson(id: string, requestId: string): Promise<RepositoryResult<void>> {
    return this.lessonRepository.archiveLesson(id, requestId);
  }

  async publishLesson(id: string, requestId: string): Promise<RepositoryResult<ILesson>> {
    return this.lessonRepository.publishLesson(id, requestId);
  }

  async unpublishLesson(id: string, requestId: string): Promise<RepositoryResult<ILesson>> {
    return this.lessonRepository.unpublishLesson(id, requestId);
  }

  async changeOrder(id: string, newOrder: number, expectedVersion: number): Promise<RepositoryResult<ILesson>> {
    return this.lessonRepository.changeOrder(id, newOrder, expectedVersion);
  }

  getRepository(): ILessonRepository {
    return this.lessonRepository;
  }
}
