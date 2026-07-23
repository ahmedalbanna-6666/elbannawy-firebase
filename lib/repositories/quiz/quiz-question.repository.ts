import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { QuizQuestionFirestoreMapper, QuizQuestionFirestoreDoc } from './quiz-firestore-mapper';
import type { IQuizQuestionRepository, IQuizQuestion, CreateQuizQuestionInput } from '../contracts';

const COLLECTION = 'quizQuestions';
function fmt(snap: FirebaseFirestore.DocumentSnapshot): QuizQuestionFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as QuizQuestionFirestoreDoc;
}

export class QuizQuestionRepository implements IQuizQuestionRepository {
  private readonly tm = TransactionManager.getInstance();
  private db() { return getFirestoreInstance(); }

  async create(input: CreateQuizQuestionInput): Promise<RepositoryResult<IQuizQuestion>> {
    try {
      const docRef = this.db().collection(COLLECTION).doc(input.id);
      await docRef.set(QuizQuestionFirestoreMapper.toCreate(input as unknown as Record<string, unknown>));
      const saved = fmt(await docRef.get());
      if (!saved) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: QuizQuestionFirestoreMapper.toDomain(saved) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async listByQuiz(quizId: string): Promise<RepositoryResult<IQuizQuestion[]>> {
    try {
      const q = new QueryBuilder<QuizQuestionFirestoreDoc>(this.tm);
      q.withFilter('quizId', 'eq', quizId).withOrderBy('displayOrder', 'asc');
      const r = await q.execute(COLLECTION);
      if (!r.ok) return r as unknown as RepositoryResult<IQuizQuestion[]>;
      return { ok: true, value: r.value.items.map((d) => QuizQuestionFirestoreMapper.toDomain(d)) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IQuizQuestion[]>; }
  }

  async getById(id: string): Promise<RepositoryResult<IQuizQuestion | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(id).get();
      const doc = fmt(snap);
      if (!doc) return { ok: true, value: null };
      return { ok: true, value: QuizQuestionFirestoreMapper.toDomain(doc) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IQuizQuestion | null>; }
  }

  async deleteByQuiz(quizId: string): Promise<RepositoryResult<void>> {
    try {
      const q = new QueryBuilder<QuizQuestionFirestoreDoc>(this.tm);
      q.withFilter('quizId', 'eq', quizId);
      const r = await q.execute(COLLECTION);
      if (!r.ok) return r as unknown as RepositoryResult<void>;
      const b = this.db().batch();
      r.value.items.forEach((d) => b.delete(this.db().collection(COLLECTION).doc(d.id)));
      await b.commit();
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
