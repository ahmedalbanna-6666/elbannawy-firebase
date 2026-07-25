import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { LessonFirestoreMapper, LessonFirestoreDoc } from './lesson-firestore-mapper';
import type {
  ILessonRepository,
  ILesson,
  ILessonSummary,
  CreateLessonInput,
  UpdateLessonInput,
  LessonFilter,
} from '../contracts';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { ICursor } from '../../shared/types/cursor.types';

const COLLECTION = 'lessons';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): LessonFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as LessonFirestoreDoc;
}

export class LessonRepository implements ILessonRepository {
  private readonly transactionManager = TransactionManager.getInstance();
  private readonly mapper = LessonFirestoreMapper;

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async createLesson(input: CreateLessonInput): Promise<RepositoryResult<ILesson>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Lesson already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const now = Timestamp.now();
      await docRef.set({
        unitId: input.unitId,
        title: input.title,
        slug: input.slug,
        description: input.description ?? null,
        displayOrder: input.displayOrder,
        status: input.status ?? 'draft',
        isPublished: input.isPublished ?? false,
        isVisible: input.isVisible ?? true,
        isPremium: input.isPremium ?? false,
        lockedOverride: input.lockedOverride ?? null,
        homeworkEnabled: input.homeworkEnabled ?? false,
        quizEnabled: input.quizEnabled ?? false,
        estimatedDuration: input.estimatedDuration ?? null,
        createdAt: now,
        updatedAt: now,
        schemaVersion: LessonFirestoreMapper.SCHEMA_VERSION,
        deletedAt: null,
      });
      const saved = await docRef.get();
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async updateLesson(id: string, input: UpdateLessonInput, _expectedVersion: number): Promise<RepositoryResult<ILesson>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.description !== undefined) updateData.description = input.description ?? null;
      if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.isPublished !== undefined) updateData.isPublished = input.isPublished;
      if (input.isVisible !== undefined) updateData.isVisible = input.isVisible;
      if (input.estimatedDuration !== undefined) updateData.estimatedDuration = input.estimatedDuration ?? null;
      if (input.isPremium !== undefined) updateData.isPremium = input.isPremium;
      if (input.lockedOverride !== undefined) updateData.lockedOverride = input.lockedOverride;
      if (input.homeworkEnabled !== undefined) updateData.homeworkEnabled = input.homeworkEnabled;
      if (input.quizEnabled !== undefined) updateData.quizEnabled = input.quizEnabled;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getLessonById(id: string): Promise<RepositoryResult<ILesson>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found: ${id}`, retryable: false, requestId: '' } };
      }
      const doc = formatDoc(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found: ${id}`, retryable: false, requestId: '' } };
      if (doc.deletedAt) return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: this.mapper.toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listLessons(filter: LessonFilter, page: PageQuery): Promise<RepositoryResult<Page<ILessonSummary>>> {
    try {
      const query = new QueryBuilder<LessonFirestoreDoc>(this.transactionManager);
      query.withFilter('deletedAt', 'eq', null);
      if (filter.unitId) query.withFilter('unitId', 'eq', filter.unitId);
      if (filter.status) query.withFilter('status', 'eq', filter.status);
      if (filter.isPublished !== undefined) query.withFilter('isPublished', 'eq', filter.isPublished);
      if (filter.isVisible !== undefined) query.withFilter('isVisible', 'eq', filter.isVisible);
      query.withOrderBy('displayOrder', 'asc');
      query.withLimit(page.limit);
      if (page.cursor) {
        try { const cursor = JSON.parse(page.cursor) as ICursor; query.withCursor(cursor); } catch { return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid cursor', retryable: false, requestId: '' } }; }
      }
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result;
      const items = result.value.items.map((d) => this.mapper.toSummary(d));
      return { ok: true, value: { items, nextCursor: result.value.nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Page<ILessonSummary>>;
    }
  }

  async getLessonsByUnit(unitId: string): Promise<RepositoryResult<ILesson[]>> {
    try {
      const query = new QueryBuilder<LessonFirestoreDoc>(this.transactionManager);
      query.withFilter('unitId', 'eq', unitId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result;
      const items = result.value.items.map((d) => this.mapper.toDomain(d));
      return { ok: true, value: items };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<ILesson[]>;
    }
  }

  async getPublishedLessons(unitId: string): Promise<RepositoryResult<ILesson[]>> {
    try {
      const query = new QueryBuilder<LessonFirestoreDoc>(this.transactionManager);
      query.withFilter('unitId', 'eq', unitId);
      query.withFilter('deletedAt', 'eq', null);
      query.withFilter('isPublished', 'eq', true);
      query.withFilter('status', 'eq', 'published');
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result;
      const items = result.value.items.map((d) => this.mapper.toDomain(d));
      return { ok: true, value: items };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<ILesson[]>;
    }
  }

  async getPublishedLessonCounts(unitIds: string[]): Promise<RepositoryResult<Map<string, number>>> {
    try {
      if (unitIds.length === 0) return { ok: true, value: new Map() };
      const db = this.getDb();
      const counts = new Map<string, number>();
      for (let i = 0; i < unitIds.length; i += 10) {
        const batch = unitIds.slice(i, i + 10);
        const snapshot = await db.collection(COLLECTION)
          .where('unitId', 'in', batch)
          .where('deletedAt', '==', null)
          .get();
        const batchCounts = new Map<string, number>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          const uid = data.unitId as string;
          if (data.isPublished === true || data.status === 'published') {
            batchCounts.set(uid, (batchCounts.get(uid) ?? 0) + 1);
          }
        });
        for (const [uid, c] of batchCounts) {
          counts.set(uid, c);
        }
      }
      return { ok: true, value: counts };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Map<string, number>>;
    }
  }

  async getPublishedLessonsByUnitIds(unitIds: string[]): Promise<RepositoryResult<Map<string, ILesson[]>>> {
    try {
      if (unitIds.length === 0) return { ok: true, value: new Map() };
      const db = this.getDb();
      const grouped = new Map<string, ILesson[]>();
      for (let i = 0; i < unitIds.length; i += 10) {
        const batch = unitIds.slice(i, i + 10);
        const snapshot = await db.collection(COLLECTION)
          .where('unitId', 'in', batch)
          .where('deletedAt', '==', null)
          .where('isPublished', '==', true)
          .where('status', '==', 'published')
          .get();
        snapshot.forEach((doc) => {
          const data = { ...doc.data(), id: doc.id } as LessonFirestoreDoc;
          const lesson = this.mapper.toDomain(data);
          const uid = data.unitId;
          if (!grouped.has(uid)) grouped.set(uid, []);
          grouped.get(uid)!.push(lesson);
        });
      }
      for (const [, lessons] of grouped) {
        lessons.sort((a, b) => a.displayOrder - b.displayOrder);
      }
      return { ok: true, value: grouped };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Map<string, ILesson[]>>;
    }
  }

  async searchLessons(searchTerm: string, page: PageQuery): Promise<RepositoryResult<Page<ILessonSummary>>> {
    try {
      const allResults = await this.listLessons({}, { limit: 1000 });
      if (!allResults.ok) return allResults;
      const term = searchTerm.toLowerCase();
      const filtered = allResults.value.items.filter((l) =>
        l.title.toLowerCase().includes(term) || l.slug.toLowerCase().includes(term),
      );
      const startIndex = page.cursor ? Number(page.cursor) : 0;
      const sliced = filtered.slice(startIndex, startIndex + page.limit);
      const nextCursor = (startIndex + page.limit < filtered.length) ? String(startIndex + page.limit) : null;
      return { ok: true, value: { items: sliced, nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Page<ILessonSummary>>;
    }
  }

  async getPreviousLesson(unitId: string, currentDisplayOrder: number): Promise<RepositoryResult<ILesson | null>> {
    try {
      const lessons = await this.getLessonsByUnit(unitId);
      if (!lessons.ok) return lessons;
      const previous = lessons.value
        .filter((l) => l.displayOrder < currentDisplayOrder)
        .sort((a, b) => b.displayOrder - a.displayOrder)[0] ?? null;
      return { ok: true, value: previous };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getNextLesson(unitId: string, currentDisplayOrder: number): Promise<RepositoryResult<ILesson | null>> {
    try {
      const lessons = await this.getLessonsByUnit(unitId);
      if (!lessons.ok) return lessons;
      const next = lessons.value
        .filter((l) => l.displayOrder > currentDisplayOrder)
        .sort((a, b) => a.displayOrder - b.displayOrder)[0] ?? null;
      return { ok: true, value: next };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async softDeleteLesson(id: string, requestId: string): Promise<RepositoryResult<void>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async restoreLesson(id: string, requestId: string): Promise<RepositoryResult<void>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ deletedAt: null, updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async archiveLesson(id: string, requestId: string): Promise<RepositoryResult<void>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ status: 'archived', isPublished: false, isVisible: false, updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async publishLesson(id: string, requestId: string): Promise<RepositoryResult<ILesson>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ status: 'published', isPublished: true, updatedAt: Timestamp.now() });
      const saved = await docRef.get();
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found after publish: ${id}`, retryable: false, requestId } };
      return { ok: true, value: this.mapper.toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async unpublishLesson(id: string, requestId: string): Promise<RepositoryResult<ILesson>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ status: 'draft', isPublished: false, updatedAt: Timestamp.now() });
      const saved = await docRef.get();
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson not found after unpublish: ${id}`, retryable: false, requestId } };
      return { ok: true, value: this.mapper.toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async changeOrder(id: string, newOrder: number, _expectedVersion: number): Promise<RepositoryResult<ILesson>> {
    return this.updateLesson(id, { displayOrder: newOrder }, _expectedVersion);
  }
}
