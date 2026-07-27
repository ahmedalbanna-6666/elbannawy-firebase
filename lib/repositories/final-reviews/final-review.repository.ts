import { Timestamp } from 'firebase-admin/firestore';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type {
  IFinalReviewRepository, IFinalReview, IFinalReviewUnit, IFinalReviewLesson,
  IFinalReviewQuestion, IFinalReviewAttempt, IFinalReviewAnswer, IFinalReviewFilter,
  IFinalReviewProgress,
} from '../contracts';

const REVIEWS = 'finalReviews';
const UNITS = 'finalReviewUnits';
const LESSONS = 'finalReviewLessons';
const QUESTIONS = 'finalReviewQuestions';
const ATTEMPTS = 'finalReviewAttempts';
const ANSWERS = 'finalReviewAnswers';
const PROGRESS = 'finalReviewProgress';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): Record<string, unknown> | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id };
}

export class FinalReviewRepository implements IFinalReviewRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore { return getFirestoreInstance(); }

  async create(input: Partial<IFinalReview>): Promise<RepositoryResult<IFinalReview>> {
    try {
      const rid = input.id;
      if (!rid) return { ok: false, error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: '' } };
      const db = this.getDb();
      const docRef = db.collection(REVIEWS).doc(rid);
      const doc = { ...input, createdAt: Timestamp.now(), updatedAt: Timestamp.now(), deletedAt: null };
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IFinalReview };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getById(id: string): Promise<RepositoryResult<IFinalReview | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(REVIEWS).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc || (doc as Record<string, unknown>).deletedAt) return { ok: true, value: null };
      return { ok: true, value: doc as unknown as IFinalReview };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReview | null>;
    }
  }

  async update(id: string, input: Partial<IFinalReview>): Promise<RepositoryResult<IFinalReview>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(REVIEWS).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Final review not found: ${id}`, retryable: false, requestId: '' } };
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      for (const [key, val] of Object.entries(input)) {
        updateData[key] = val;
      }
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found after update', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IFinalReview };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(REVIEWS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Final review not found: ${id}`, retryable: false, requestId: '' } };
      await docRef.update({ deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async restore(id: string, requestId: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(REVIEWS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Final review not found: ${id}`, retryable: false, requestId } };
      await docRef.update({ deletedAt: null, updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async list(filter: IFinalReviewFilter): Promise<RepositoryResult<IFinalReview[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      if (filter.gradeId) query.withFilter('gradeId', 'eq', filter.gradeId);
      if (filter.enabled !== undefined) query.withFilter('enabled', 'eq', filter.enabled);
      if (filter.published !== undefined) query.withFilter('published', 'eq', filter.published);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(REVIEWS);
      if (!result.ok) return result as unknown as RepositoryResult<IFinalReview[]>;
      return { ok: true, value: result.value.items as unknown as IFinalReview[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReview[]>;
    }
  }

  async listByGrade(gradeId: string): Promise<RepositoryResult<IFinalReview[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('gradeId', 'eq', gradeId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(REVIEWS);
      if (!result.ok) return result as unknown as RepositoryResult<IFinalReview[]>;
      return { ok: true, value: result.value.items as unknown as IFinalReview[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReview[]>;
    }
  }

  async createUnit(input: Partial<IFinalReviewUnit>): Promise<RepositoryResult<IFinalReviewUnit>> {
    try {
      const uid = input.id;
      if (!uid) return { ok: false, error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: '' } };
      const db = this.getDb();
      const docRef = db.collection(UNITS).doc(uid);
      const doc = { ...input, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IFinalReviewUnit };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getUnitById(id: string): Promise<RepositoryResult<IFinalReviewUnit | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(UNITS).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc) return { ok: true, value: null };
      return { ok: true, value: doc as unknown as IFinalReviewUnit };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReviewUnit | null>;
    }
  }

  async updateUnit(id: string, input: Partial<IFinalReviewUnit>): Promise<RepositoryResult<IFinalReviewUnit>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(UNITS).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Unit not found: ${id}`, retryable: false, requestId: '' } };
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      for (const [key, val] of Object.entries(input)) {
        updateData[key] = val;
      }
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found after update', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IFinalReviewUnit };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async deleteUnit(id: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(UNITS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Unit not found: ${id}`, retryable: false, requestId: '' } };
      await docRef.delete();
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listUnits(finalReviewId: string): Promise<RepositoryResult<IFinalReviewUnit[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('finalReviewId', 'eq', finalReviewId);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(UNITS);
      if (!result.ok) return result as unknown as RepositoryResult<IFinalReviewUnit[]>;
      return { ok: true, value: result.value.items as unknown as IFinalReviewUnit[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReviewUnit[]>;
    }
  }

  async createLesson(input: Partial<IFinalReviewLesson>): Promise<RepositoryResult<IFinalReviewLesson>> {
    try {
      const lid = input.id;
      if (!lid) return { ok: false, error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: '' } };
      const db = this.getDb();
      const docRef = db.collection(LESSONS).doc(lid);
      const doc = { ...input, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IFinalReviewLesson };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getLessonById(id: string): Promise<RepositoryResult<IFinalReviewLesson | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(LESSONS).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc) return { ok: true, value: null };
      return { ok: true, value: doc as unknown as IFinalReviewLesson };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReviewLesson | null>;
    }
  }

  async listLessons(unitId: string): Promise<RepositoryResult<IFinalReviewLesson[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('finalReviewUnitId', 'eq', unitId);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(LESSONS);
      if (!result.ok) return result as unknown as RepositoryResult<IFinalReviewLesson[]>;
      return { ok: true, value: result.value.items as unknown as IFinalReviewLesson[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReviewLesson[]>;
    }
  }

  async createQuestion(input: Partial<IFinalReviewQuestion>): Promise<RepositoryResult<IFinalReviewQuestion>> {
    try {
      const qid = input.id;
      if (!qid) return { ok: false, error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: '' } };
      const db = this.getDb();
      const docRef = db.collection(QUESTIONS).doc(qid);
      const doc = { ...input, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IFinalReviewQuestion };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listQuestions(finalReviewUnitId: string, exam?: boolean): Promise<RepositoryResult<IFinalReviewQuestion[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('finalReviewUnitId', 'eq', finalReviewUnitId);
      if (exam !== undefined) query.withFilter('exam', 'eq', exam);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(QUESTIONS);
      if (!result.ok) return result as unknown as RepositoryResult<IFinalReviewQuestion[]>;
      return { ok: true, value: result.value.items as unknown as IFinalReviewQuestion[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReviewQuestion[]>;
    }
  }

  async deleteQuestion(id: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(QUESTIONS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Question not found: ${id}`, retryable: false, requestId: '' } };
      await docRef.delete();
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async createAttempt(input: IFinalReviewAttempt): Promise<RepositoryResult<IFinalReviewAttempt>> {
    try {
      const aid = input.id;
      if (!aid) return { ok: false, error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: '' } };
      const db = this.getDb();
      const docRef = db.collection(ATTEMPTS).doc(aid);
      const doc = { ...input, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IFinalReviewAttempt };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getAttempt(id: string): Promise<RepositoryResult<IFinalReviewAttempt | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(ATTEMPTS).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc) return { ok: true, value: null };
      return { ok: true, value: doc as unknown as IFinalReviewAttempt };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReviewAttempt | null>;
    }
  }

  async updateAttempt(id: string, input: Partial<IFinalReviewAttempt>): Promise<RepositoryResult<IFinalReviewAttempt>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(ATTEMPTS).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Attempt not found: ${id}`, retryable: false, requestId: '' } };
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      for (const [key, val] of Object.entries(input)) {
        updateData[key] = val;
      }
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found after update', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IFinalReviewAttempt };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listAttempts(studentId: string, finalReviewId: string): Promise<RepositoryResult<IFinalReviewAttempt[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('studentId', 'eq', studentId);
      query.withFilter('finalReviewId', 'eq', finalReviewId);
      query.withOrderBy('attemptNumber', 'asc');
      const result = await query.execute(ATTEMPTS);
      if (!result.ok) return result as unknown as RepositoryResult<IFinalReviewAttempt[]>;
      return { ok: true, value: result.value.items as unknown as IFinalReviewAttempt[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReviewAttempt[]>;
    }
  }

  async createAnswer(input: IFinalReviewAnswer): Promise<RepositoryResult<IFinalReviewAnswer>> {
    try {
      const aid = input.id;
      if (!aid) return { ok: false, error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: '' } };
      const db = this.getDb();
      const docRef = db.collection(ANSWERS).doc(aid);
      const doc = { ...input, createdAt: Timestamp.now() };
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IFinalReviewAnswer };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listAnswers(attemptId: string): Promise<RepositoryResult<IFinalReviewAnswer[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('attemptId', 'eq', attemptId);
      const result = await query.execute(ANSWERS);
      if (!result.ok) return result as unknown as RepositoryResult<IFinalReviewAnswer[]>;
      return { ok: true, value: result.value.items as unknown as IFinalReviewAnswer[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReviewAnswer[]>;
    }
  }

  async getProgress(studentId: string, finalReviewId: string): Promise<RepositoryResult<IFinalReviewProgress | null>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('studentId', 'eq', studentId);
      query.withFilter('finalReviewId', 'eq', finalReviewId);
      query.withLimit(1);
      const result = await query.execute(PROGRESS);
      if (!result.ok) return result as unknown as RepositoryResult<IFinalReviewProgress | null>;
      const item = result.value.items[0];
      if (!item) return { ok: true, value: null };
      return { ok: true, value: item as unknown as IFinalReviewProgress };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReviewProgress | null>;
    }
  }

  async upsertProgress(input: IFinalReviewProgress): Promise<RepositoryResult<IFinalReviewProgress>> {
    try {
      const db = this.getDb();
      const now = Timestamp.now();
      if (input.id) {
        const existing = await db.collection(PROGRESS).doc(input.id).get();
        if (existing.exists) {
          await existing.ref.update({ ...input, updatedAt: now } as Record<string, unknown>);
          const saved = await existing.ref.get();
          return { ok: true, value: { ...saved.data(), id: saved.id } as unknown as IFinalReviewProgress };
        }
      }
      const docRef = input.id ? db.collection(PROGRESS).doc(input.id) : db.collection(PROGRESS).doc();
      const doc = { ...input, id: docRef.id, createdAt: now, updatedAt: now };
      await docRef.set(doc);
      return { ok: true, value: doc as unknown as IFinalReviewProgress };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listStudentProgress(studentId: string): Promise<RepositoryResult<IFinalReviewProgress[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('studentId', 'eq', studentId);
      const result = await query.execute(PROGRESS);
      if (!result.ok) return result as unknown as RepositoryResult<IFinalReviewProgress[]>;
      return { ok: true, value: result.value.items as unknown as IFinalReviewProgress[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IFinalReviewProgress[]>;
    }
  }
}
