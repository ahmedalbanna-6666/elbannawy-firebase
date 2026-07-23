import { Timestamp } from 'firebase-admin/firestore';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { HomeworkAttemptFirestoreMapper, HomeworkAttemptFirestoreDoc } from './homework-attempt-firestore-mapper';
import type { IHomeworkAttemptRepository, IHomeworkAttempt, CreateHomeworkAttemptInput, UpdateHomeworkAttemptInput } from '../contracts';

const COLLECTION = 'homeworkAttempts';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): HomeworkAttemptFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as HomeworkAttemptFirestoreDoc;
}

export class HomeworkAttemptRepository implements IHomeworkAttemptRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore { return getFirestoreInstance(); }

  async create(input: CreateHomeworkAttemptInput): Promise<RepositoryResult<IHomeworkAttempt>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const doc = HomeworkAttemptFirestoreMapper.toCreate(input);
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: HomeworkAttemptFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getById(id: string): Promise<RepositoryResult<IHomeworkAttempt | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(COLLECTION).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc) return { ok: true, value: null };
      return { ok: true, value: HomeworkAttemptFirestoreMapper.toDomain(doc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IHomeworkAttempt | null>;
    }
  }

  async getActive(studentId: string, homeworkId: string): Promise<RepositoryResult<IHomeworkAttempt | null>> {
    try {
      const query = new QueryBuilder<HomeworkAttemptFirestoreDoc>(this.transactionManager);
      query.withFilter('studentId', 'eq', studentId);
      query.withFilter('homeworkId', 'eq', homeworkId);
      query.withFilter('status', 'eq', 'in_progress');
      query.withLimit(1);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<IHomeworkAttempt | null>;
      const item = result.value.items[0];
      if (!item) return { ok: true, value: null };
      return { ok: true, value: HomeworkAttemptFirestoreMapper.toDomain(item) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IHomeworkAttempt | null>;
    }
  }

  async update(id: string, input: UpdateHomeworkAttemptInput): Promise<RepositoryResult<IHomeworkAttempt>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Attempt not found: ${id}`, retryable: false, requestId: '' } };
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.status !== undefined) updateData.status = input.status;
      if (input.score !== undefined) updateData.score = input.score;
      if (input.passed !== undefined) updateData.passed = input.passed;
      if (input.submittedAt !== undefined) updateData.submittedAt = input.submittedAt;
      if (input.gradedAt !== undefined) updateData.gradedAt = input.gradedAt;
      if (input.timeSpentSeconds !== undefined) updateData.timeSpentSeconds = input.timeSpentSeconds;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found after update', retryable: false, requestId: '' } };
      return { ok: true, value: HomeworkAttemptFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listByStudentAndHomework(studentId: string, homeworkId: string): Promise<RepositoryResult<IHomeworkAttempt[]>> {
    try {
      const query = new QueryBuilder<HomeworkAttemptFirestoreDoc>(this.transactionManager);
      query.withFilter('studentId', 'eq', studentId);
      query.withFilter('homeworkId', 'eq', homeworkId);
      query.withOrderBy('attemptNumber', 'desc');
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<IHomeworkAttempt[]>;
      return { ok: true, value: result.value.items.map((d) => HomeworkAttemptFirestoreMapper.toDomain(d)) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IHomeworkAttempt[]>;
    }
  }

  async countByStudentAndHomework(studentId: string, homeworkId: string): Promise<RepositoryResult<number>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(COLLECTION).where('studentId', '==', studentId).where('homeworkId', '==', homeworkId).count().get();
      return { ok: true, value: snap.data().count };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<number>;
    }
  }
}
