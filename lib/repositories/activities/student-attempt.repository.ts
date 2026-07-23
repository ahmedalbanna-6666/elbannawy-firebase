import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { StudentAttemptFirestoreMapper, StudentAttemptFirestoreDoc } from './student-attempt-firestore-mapper';
import type {
  IStudentAttemptRepository,
  IStudentAttempt,
  IStudentAttemptSummary,
  CreateAttemptInput,
  UpdateAttemptInput,
  AttemptFilter,
} from '../contracts';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { ICursor } from '../../shared/types/cursor.types';

const COLLECTION = 'studentAttempts';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): StudentAttemptFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as StudentAttemptFirestoreDoc;
}

export class StudentAttemptRepository implements IStudentAttemptRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async createAttempt(input: CreateAttemptInput): Promise<RepositoryResult<IStudentAttempt>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Attempt already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const doc = StudentAttemptFirestoreMapper.toCreate(input);
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: StudentAttemptFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async updateAttempt(id: string, input: UpdateAttemptInput): Promise<RepositoryResult<IStudentAttempt>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Attempt not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.answer !== undefined) updateData.answer = input.answer;
      if (input.score !== undefined) updateData.score = input.score;
      if (input.percentage !== undefined) updateData.percentage = input.percentage;
      if (input.passed !== undefined) updateData.passed = input.passed;
      if (input.feedback !== undefined) updateData.feedback = input.feedback;
      if (input.correctAnswer !== undefined) updateData.correctAnswer = input.correctAnswer;
      if (input.submittedAt !== undefined) updateData.submittedAt = input.submittedAt;
      if (input.timeSpent !== undefined) updateData.timeSpent = input.timeSpent;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.state !== undefined) updateData.state = input.state;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: `Attempt not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: StudentAttemptFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getAttemptById(id: string): Promise<RepositoryResult<IStudentAttempt>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Attempt not found: ${id}`, retryable: false, requestId: '' } };
      }
      const doc = formatDoc(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Attempt not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: StudentAttemptFirestoreMapper.toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getStudentAttempt(activityId: string, studentId: string): Promise<RepositoryResult<IStudentAttempt | null>> {
    try {
      const query = new QueryBuilder<StudentAttemptFirestoreDoc>(this.transactionManager);
      query.withFilter('activityId', 'eq', activityId);
      query.withFilter('studentId', 'eq', studentId);
      query.withOrderBy('attemptNumber', 'desc');
      query.withLimit(1);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result;
      const item = result.value.items[0];
      const attempt = item ? StudentAttemptFirestoreMapper.toDomain(item) : null;
      return { ok: true, value: attempt };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<IStudentAttempt | null>;
    }
  }

  async getLatestAttempt(activityId: string, studentId: string): Promise<RepositoryResult<IStudentAttempt | null>> {
    return this.getStudentAttempt(activityId, studentId);
  }

  async listAttempts(filter: AttemptFilter, page: PageQuery): Promise<RepositoryResult<Page<IStudentAttemptSummary>>> {
    try {
      const query = new QueryBuilder<StudentAttemptFirestoreDoc>(this.transactionManager);
      if (filter.activityId) query.withFilter('activityId', 'eq', filter.activityId);
      if (filter.studentId) query.withFilter('studentId', 'eq', filter.studentId);
      if (filter.lessonId) query.withFilter('lessonId', 'eq', filter.lessonId);
      if (filter.unitId) query.withFilter('unitId', 'eq', filter.unitId);
      if (filter.status) query.withFilter('status', 'eq', filter.status);
      if (filter.gradingMethod) query.withFilter('gradingMethod', 'eq', filter.gradingMethod);
      query.withOrderBy('createdAt', 'desc');
      query.withLimit(page.limit);
      if (page.cursor) {
        try { const cursor = JSON.parse(page.cursor) as ICursor; query.withCursor(cursor); } catch { return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid cursor', retryable: false, requestId: '' } }; }
      }
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result;
      const items = result.value.items.map((d) => StudentAttemptFirestoreMapper.toSummary(d));
      return { ok: true, value: { items, nextCursor: result.value.nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Page<IStudentAttemptSummary>>;
    }
  }

  async getAttemptsByActivity(activityId: string): Promise<RepositoryResult<IStudentAttempt[]>> {
    try {
      const query = new QueryBuilder<StudentAttemptFirestoreDoc>(this.transactionManager);
      query.withFilter('activityId', 'eq', activityId);
      query.withOrderBy('createdAt', 'desc');
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result;
      const items = result.value.items.map((d) => StudentAttemptFirestoreMapper.toDomain(d));
      return { ok: true, value: items };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<IStudentAttempt[]>;
    }
  }

  async getAttemptsByStudent(studentId: string, page: PageQuery): Promise<RepositoryResult<Page<IStudentAttemptSummary>>> {
    return this.listAttempts({ studentId }, page);
  }
}
