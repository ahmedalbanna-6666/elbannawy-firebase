import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { QuizAnswerFirestoreMapper, QuizAnswerFirestoreDoc } from './quiz-firestore-mapper';
import type { IQuizAnswerRepository, IQuizAnswer, CreateQuizAnswerInput } from '../contracts';

const COLLECTION = 'quizAnswers';
export class QuizAnswerRepository implements IQuizAnswerRepository {
  private readonly tm = TransactionManager.getInstance();
  private db() { return getFirestoreInstance(); }

  async create(input: CreateQuizAnswerInput): Promise<RepositoryResult<IQuizAnswer>> {
    try {
      const docRef = this.db().collection(COLLECTION).doc(input.id);
      await docRef.set(QuizAnswerFirestoreMapper.toCreate(input as unknown as Record<string, unknown>));
      const snap = await docRef.get();
      return { ok: true, value: QuizAnswerFirestoreMapper.toDomain({ ...snap.data(), id: snap.id } as QuizAnswerFirestoreDoc) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async listByAttempt(attemptId: string): Promise<RepositoryResult<IQuizAnswer[]>> {
    try {
      const q = new QueryBuilder<QuizAnswerFirestoreDoc>(this.tm);
      q.withFilter('attemptId', 'eq', attemptId);
      const r = await q.execute(COLLECTION);
      if (!r.ok) return r as unknown as RepositoryResult<IQuizAnswer[]>;
      return { ok: true, value: r.value.items.map((d) => QuizAnswerFirestoreMapper.toDomain(d)) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IQuizAnswer[]>; }
  }

  async deleteByAttempt(attemptId: string): Promise<RepositoryResult<void>> {
    try {
      const q = new QueryBuilder<QuizAnswerFirestoreDoc>(this.tm);
      q.withFilter('attemptId', 'eq', attemptId);
      const r = await q.execute(COLLECTION);
      if (!r.ok) return r as unknown as RepositoryResult<void>;
      const b = this.db().batch();
      r.value.items.forEach((d) => b.delete(this.db().collection(COLLECTION).doc(d.id)));
      await b.commit();
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
