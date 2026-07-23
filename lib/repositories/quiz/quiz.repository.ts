import { Timestamp } from 'firebase-admin/firestore';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { QuizFirestoreMapper, QuizFirestoreDoc } from './quiz-firestore-mapper';
import type { IQuizRepository, IQuiz, CreateQuizInput, UpdateQuizInput } from '../contracts';

const COLLECTION = 'quizzes';
function fmt(snap: FirebaseFirestore.DocumentSnapshot): QuizFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as QuizFirestoreDoc;
}

export class QuizRepository implements IQuizRepository {
  private readonly tm = TransactionManager.getInstance();
  private db() { return getFirestoreInstance(); }

  async create(input: CreateQuizInput): Promise<RepositoryResult<IQuiz>> {
    try {
      const docRef = this.db().collection(COLLECTION).doc(input.id);
      await docRef.set(QuizFirestoreMapper.toCreate(input as unknown as Record<string, unknown>));
      const saved = fmt(await docRef.get());
      if (!saved) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: QuizFirestoreMapper.toDomain(saved) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getById(id: string): Promise<RepositoryResult<IQuiz | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(id).get();
      const doc = fmt(snap);
      if (!doc || doc.deletedAt) return { ok: true, value: null };
      return { ok: true, value: QuizFirestoreMapper.toDomain(doc) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IQuiz | null>; }
  }

  async getByLessonId(lessonId: string): Promise<RepositoryResult<IQuiz | null>> {
    try {
      const q = new QueryBuilder<QuizFirestoreDoc>(this.tm);
      q.withFilter('lessonId', 'eq', lessonId).withFilter('deletedAt', 'eq', null).withLimit(1);
      const r = await q.execute(COLLECTION);
      if (!r.ok) return r as unknown as RepositoryResult<IQuiz | null>;
      const item = r.value.items[0];
      if (!item) return { ok: true, value: null };
      return { ok: true, value: QuizFirestoreMapper.toDomain(item) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IQuiz | null>; }
  }

  async update(id: string, input: UpdateQuizInput, _v: number): Promise<RepositoryResult<IQuiz>> {
    try {
      const docRef = this.db().collection(COLLECTION).doc(id);
      if (!(await docRef.get()).exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Quiz not found: ${id}`, retryable: false, requestId: '' } };
      const u: Record<string, unknown> = { updatedAt: Timestamp.now() };
      ['title', 'instructions', 'passingScore', 'maxAttempts', 'unlimitedAttempts', 'published', 'allowRetry', 'showAnswers', 'xpReward', 'requiredForCompletion'].forEach((k) => { if ((input as Record<string, unknown>)[k] !== undefined) u[k] = (input as Record<string, unknown>)[k]; });
      await docRef.update(u);
      const saved = fmt(await docRef.get());
      if (!saved) return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found after update', retryable: false, requestId: '' } };
      return { ok: true, value: QuizFirestoreMapper.toDomain(saved) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const docRef = this.db().collection(COLLECTION).doc(id);
      if (!(await docRef.get()).exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Quiz not found: ${id}`, retryable: false, requestId: '' } };
      await docRef.update({ deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
