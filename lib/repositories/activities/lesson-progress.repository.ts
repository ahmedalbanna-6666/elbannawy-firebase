import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { LessonProgressFirestoreMapper, LessonProgressFirestoreDoc } from './lesson-progress-firestore-mapper';
import type {
  ILessonProgressRepository,
  ILessonProgress,
  CreateLessonProgressInput,
  UpdateLessonProgressInput,
} from '../contracts';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';

const COLLECTION = 'lessonProgress';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): LessonProgressFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as LessonProgressFirestoreDoc;
}

export class LessonProgressRepository implements ILessonProgressRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async createProgress(input: CreateLessonProgressInput): Promise<RepositoryResult<ILessonProgress>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Progress already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const doc = LessonProgressFirestoreMapper.toCreate(input);
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: LessonProgressFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getProgress(id: string): Promise<RepositoryResult<ILessonProgress>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Progress not found: ${id}`, retryable: false, requestId: '' } };
      }
      const doc = formatDoc(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Progress not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: LessonProgressFirestoreMapper.toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getStudentLessonProgress(studentId: string, lessonId: string): Promise<RepositoryResult<ILessonProgress | null>> {
    try {
      const query = new QueryBuilder<LessonProgressFirestoreDoc>(this.transactionManager);
      query.withFilter('studentId', 'eq', studentId);
      query.withFilter('lessonId', 'eq', lessonId);
      query.withLimit(1);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result;
      const item = result.value.items[0];
      const progress = item ? LessonProgressFirestoreMapper.toDomain(item) : null;
      return { ok: true, value: progress };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<ILessonProgress | null>;
    }
  }

  async updateProgress(id: string, input: UpdateLessonProgressInput): Promise<RepositoryResult<ILessonProgress>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Progress not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.status !== undefined) updateData.status = input.status;
      if (input.completedActivities !== undefined) updateData.completedActivities = input.completedActivities;
      if (input.totalActivities !== undefined) updateData.totalActivities = input.totalActivities;
      if (input.score !== undefined) updateData.score = input.score;
      if (input.maxScore !== undefined) updateData.maxScore = input.maxScore;
      if (input.lastActivityId !== undefined) updateData.lastActivityId = input.lastActivityId;
      if (input.startedAt !== undefined) updateData.startedAt = input.startedAt;
      if (input.completedAt !== undefined) updateData.completedAt = input.completedAt;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: `Progress not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: LessonProgressFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listStudentProgress(studentId: string, unitId?: string): Promise<RepositoryResult<ILessonProgress[]>> {
    try {
      const query = new QueryBuilder<LessonProgressFirestoreDoc>(this.transactionManager);
      query.withFilter('studentId', 'eq', studentId);
      if (unitId) query.withFilter('unitId', 'eq', unitId);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result;
      const items = result.value.items.map((d) => LessonProgressFirestoreMapper.toDomain(d));
      return { ok: true, value: items };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<ILessonProgress[]>;
    }
  }
}
