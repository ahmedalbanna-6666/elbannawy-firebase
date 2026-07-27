import { StoryRepository } from '../../repositories/stories/story.repository';
import {
  IStory, IStoryChapter, IStoryLesson, IStoryProgress,
  IStoryFilter,
} from '../../repositories/contracts';
import { RepositoryResult } from '../../shared/types/repository.types';

export class StoryService {
  constructor(private readonly storyRepository: StoryRepository = new StoryRepository()) {}

  async create(input: Partial<IStory>): Promise<RepositoryResult<IStory>> {
    return this.storyRepository.create(input);
  }

  async getById(id: string): Promise<RepositoryResult<IStory | null>> {
    return this.storyRepository.getById(id);
  }

  async update(id: string, input: Partial<IStory>): Promise<RepositoryResult<IStory>> {
    return this.storyRepository.update(id, input);
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    return this.storyRepository.delete(id);
  }

  async restore(id: string, requestId: string): Promise<RepositoryResult<void>> {
    return this.storyRepository.restore(id, requestId);
  }

  async list(filter: IStoryFilter): Promise<RepositoryResult<IStory[]>> {
    return this.storyRepository.list(filter);
  }

  async listByGrade(gradeId: string): Promise<RepositoryResult<IStory[]>> {
    return this.storyRepository.listByGrade(gradeId);
  }

  async createChapter(input: Partial<IStoryChapter>): Promise<RepositoryResult<IStoryChapter>> {
    return this.storyRepository.createChapter(input);
  }

  async getChapterById(id: string): Promise<RepositoryResult<IStoryChapter | null>> {
    return this.storyRepository.getChapterById(id);
  }

  async updateChapter(id: string, input: Partial<IStoryChapter>): Promise<RepositoryResult<IStoryChapter>> {
    return this.storyRepository.updateChapter(id, input);
  }

  async deleteChapter(id: string): Promise<RepositoryResult<void>> {
    return this.storyRepository.deleteChapter(id);
  }

  async listChapters(storyId: string): Promise<RepositoryResult<IStoryChapter[]>> {
    return this.storyRepository.listChapters(storyId);
  }

  async createLesson(input: Partial<IStoryLesson>): Promise<RepositoryResult<IStoryLesson>> {
    return this.storyRepository.createLesson(input);
  }

  async getLessonById(id: string): Promise<RepositoryResult<IStoryLesson | null>> {
    return this.storyRepository.getLessonById(id);
  }

  async listLessons(chapterId: string): Promise<RepositoryResult<IStoryLesson[]>> {
    return this.storyRepository.listLessons(chapterId);
  }

  async getProgress(studentId: string, storyId: string): Promise<RepositoryResult<IStoryProgress | null>> {
    return this.storyRepository.getProgress(studentId, storyId);
  }

  async upsertProgress(input: IStoryProgress): Promise<RepositoryResult<IStoryProgress>> {
    return this.storyRepository.upsertProgress(input);
  }

  async listStudentProgress(studentId: string): Promise<RepositoryResult<IStoryProgress[]>> {
    return this.storyRepository.listStudentProgress(studentId);
  }

  getRepository(): StoryRepository {
    return this.storyRepository;
  }
}
