import { FinalReviewRepository } from '../../repositories/final-reviews/final-review.repository';
import {
  IFinalReview, IFinalReviewUnit, IFinalReviewLesson, IFinalReviewQuestion,
  IFinalReviewAttempt, IFinalReviewAnswer, IFinalReviewFilter, IFinalReviewProgress,
} from '../../repositories/contracts';
import { RepositoryResult } from '../../shared/types/repository.types';

export class FinalReviewService {
  constructor(private readonly reviewRepository: FinalReviewRepository = new FinalReviewRepository()) {}

  async create(input: Partial<IFinalReview>): Promise<RepositoryResult<IFinalReview>> {
    return this.reviewRepository.create(input);
  }

  async getById(id: string): Promise<RepositoryResult<IFinalReview | null>> {
    return this.reviewRepository.getById(id);
  }

  async update(id: string, input: Partial<IFinalReview>): Promise<RepositoryResult<IFinalReview>> {
    return this.reviewRepository.update(id, input);
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    return this.reviewRepository.delete(id);
  }

  async restore(id: string, requestId: string): Promise<RepositoryResult<void>> {
    return this.reviewRepository.restore(id, requestId);
  }

  async list(filter: IFinalReviewFilter): Promise<RepositoryResult<IFinalReview[]>> {
    return this.reviewRepository.list(filter);
  }

  async listByGrade(gradeId: string): Promise<RepositoryResult<IFinalReview[]>> {
    return this.reviewRepository.listByGrade(gradeId);
  }

  async createUnit(input: Partial<IFinalReviewUnit>): Promise<RepositoryResult<IFinalReviewUnit>> {
    return this.reviewRepository.createUnit(input);
  }

  async getUnitById(id: string): Promise<RepositoryResult<IFinalReviewUnit | null>> {
    return this.reviewRepository.getUnitById(id);
  }

  async updateUnit(id: string, input: Partial<IFinalReviewUnit>): Promise<RepositoryResult<IFinalReviewUnit>> {
    return this.reviewRepository.updateUnit(id, input);
  }

  async deleteUnit(id: string): Promise<RepositoryResult<void>> {
    return this.reviewRepository.deleteUnit(id);
  }

  async listUnits(finalReviewId: string): Promise<RepositoryResult<IFinalReviewUnit[]>> {
    return this.reviewRepository.listUnits(finalReviewId);
  }

  async createLesson(input: Partial<IFinalReviewLesson>): Promise<RepositoryResult<IFinalReviewLesson>> {
    return this.reviewRepository.createLesson(input);
  }

  async getLessonById(id: string): Promise<RepositoryResult<IFinalReviewLesson | null>> {
    return this.reviewRepository.getLessonById(id);
  }

  async listLessons(unitId: string): Promise<RepositoryResult<IFinalReviewLesson[]>> {
    return this.reviewRepository.listLessons(unitId);
  }

  async createQuestion(input: Partial<IFinalReviewQuestion>): Promise<RepositoryResult<IFinalReviewQuestion>> {
    return this.reviewRepository.createQuestion(input);
  }

  async listQuestions(finalReviewUnitId: string, exam?: boolean): Promise<RepositoryResult<IFinalReviewQuestion[]>> {
    return this.reviewRepository.listQuestions(finalReviewUnitId, exam);
  }

  async deleteQuestion(id: string): Promise<RepositoryResult<void>> {
    return this.reviewRepository.deleteQuestion(id);
  }

  async createAttempt(input: IFinalReviewAttempt): Promise<RepositoryResult<IFinalReviewAttempt>> {
    return this.reviewRepository.createAttempt(input);
  }

  async getAttempt(id: string): Promise<RepositoryResult<IFinalReviewAttempt | null>> {
    return this.reviewRepository.getAttempt(id);
  }

  async updateAttempt(id: string, input: Partial<IFinalReviewAttempt>): Promise<RepositoryResult<IFinalReviewAttempt>> {
    return this.reviewRepository.updateAttempt(id, input);
  }

  async listAttempts(studentId: string, finalReviewId: string): Promise<RepositoryResult<IFinalReviewAttempt[]>> {
    return this.reviewRepository.listAttempts(studentId, finalReviewId);
  }

  async createAnswer(input: IFinalReviewAnswer): Promise<RepositoryResult<IFinalReviewAnswer>> {
    return this.reviewRepository.createAnswer(input);
  }

  async listAnswers(attemptId: string): Promise<RepositoryResult<IFinalReviewAnswer[]>> {
    return this.reviewRepository.listAnswers(attemptId);
  }

  async getProgress(studentId: string, finalReviewId: string): Promise<RepositoryResult<IFinalReviewProgress | null>> {
    return this.reviewRepository.getProgress(studentId, finalReviewId);
  }

  async upsertProgress(input: IFinalReviewProgress): Promise<RepositoryResult<IFinalReviewProgress>> {
    return this.reviewRepository.upsertProgress(input);
  }

  async listStudentProgress(studentId: string): Promise<RepositoryResult<IFinalReviewProgress[]>> {
    return this.reviewRepository.listStudentProgress(studentId);
  }

  getRepository(): FinalReviewRepository {
    return this.reviewRepository;
  }
}
