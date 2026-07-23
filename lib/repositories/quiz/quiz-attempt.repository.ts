import { Timestamp } from 'firebase-admin/firestore';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { QuizAttemptFirestoreMapper, QuizAttemptFirestoreDoc } from './quiz-firestore-mapper';
import type { IQuizAttemptRepository, IQuizAttempt, CreateQuizAttemptInput, UpdateQuizAttemptInput } from '../contracts';

const COLLECTION = 'quizAttempts';
function fmt(snap: FirebaseFirestore.DocumentSnapshot): QuizAttemptFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as QuizAttemptFirestoreDoc;
}

export class QuizAttemptRepository implements IQuizAttemptRepository {
  private readonly tm = TransactionManager.getInstance();
  private db() { return getFirestoreInstance(); }

  async create(input: CreateQuizAttemptInput): Promise<RepositoryResult<IQuizAttempt>> {
    try {
      const docRef = this.db().collection(COLLECTION).doc(input.id);
      await docRef.set(QuizAttemptFirestoreMapper.toCreate(input));
      const saved = fmt(await docRef.get());
      if (!saved) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: QuizAttemptFirestoreMapper.toDomain(saved) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getById(id: string): Promise<RepositoryResult<IQuizAttempt | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(id).get();
      const doc = fmt(snap);
      if (!doc) return { ok: true, value: null };
      return { ok: true, value: QuizAttemptFirestoreMapper.toDomain(doc) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IQuizAttempt | null>; }
  }

  async getActive(studentId: string, quizId: string): Promise<RepositoryResult<IQuizAttempt | null>> {
    try {
      const q = new QueryBuilder<QuizAttemptFirestoreDoc>(this.tm);
      q.withFilter('studentId', 'eq', studentId).withFilter('quizId', 'eq', quizId).withFilter('status', 'eq', 'in_progress').withLimit(1);
      const r = await q.execute(COLLECTION);
      if (!r.ok) return r as unknown as RepositoryResult<IQuizAttempt | null>;
      const item = r.value.items[0];
      if (!item) return { ok: true, value: null };
      return { ok: true, value: QuizAttemptFirestoreMapper.toDomain(item) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IQuizAttempt | null>; }
  }

  async update(id: string, input: UpdateQuizAttemptInput): Promise<RepositoryResult<IQuizAttempt>> {
    try {
      const docRef = this.db().collection(COLLECTION).doc(id);
      if (!(await docRef.get()).exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Attempt not found: ${id}`, retryable: false, requestId: '' } };
      const u: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.status !== undefined) u.status = input.status;
      if (input.score !== undefined) u.score = input.score;
      if (input.passed !== undefined) u.passed = input.passed;
      if (input.submittedAt !== undefined) u.submittedAt = input.submittedAt;
      if (input.gradedAt !== undefined) u.gradedAt = input.gradedAt;
      if (input.timeSpentSeconds !== undefined) u.timeSpentSeconds = input.timeSpentSeconds;
      await docRef.update(u);
      const saved = fmt(await docRef.get());
      if (!saved) return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found after update', retryable: false, requestId: '' } };
      return { ok: true, value: QuizAttemptFirestoreMapper.toDomain(saved) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async listByStudentAndQuiz(studentId: string, quizId: string): Promise<RepositoryResult<IQuizAttempt[]>> {
    try {
      const q = new QueryBuilder<QuizAttemptFirestoreDoc>(this.tm);
      q.withFilter('studentId', 'eq', studentId).withFilter('quizId', 'eq', quizId).withOrderBy('attemptNumber', 'desc');
      const r = await q.execute(COLLECTION);
      if (!r.ok) return r as unknown as RepositoryResult<IQuizAttempt[]>;
      return { ok: true, value: r.value.items.map((d) => QuizAttemptFirestoreMapper.toDomain(d)) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IQuizAttempt[]>; }
  }

  async countByStudentAndQuiz(studentId: string, quizId: string): Promise<RepositoryResult<number>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('studentId', '==', studentId).where('quizId', '==', quizId).count().get();
      return { ok: true, value: snap.data().count };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<number>; }
  }
}
