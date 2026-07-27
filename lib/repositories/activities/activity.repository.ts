import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { Page, PageQuery } from '../../shared/types/pagination.types';
import { ActivityFirestoreMapper, ActivityFirestoreDoc } from './activity-firestore-mapper';
import type {
  IActivityRepository,
  IActivity,
  IActivitySummary,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityFilter,
} from '../contracts';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { ICursor } from '../../shared/types/cursor.types';
import { CreateActivityInputSchema, UpdateActivityInputSchema } from '../validators';

const COLLECTION = 'activities';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): ActivityFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as ActivityFirestoreDoc;
}

export class ActivityRepository implements IActivityRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async createActivity(input: CreateActivityInput): Promise<RepositoryResult<IActivity>> {
    const parsed = CreateActivityInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues.map((i) => i.message).join('; '), retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Activity already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const doc = ActivityFirestoreMapper.toCreate(input);
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: ActivityFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async updateActivity(id: string, input: UpdateActivityInput, _expectedVersion: number): Promise<RepositoryResult<IActivity>> {
    const parsed = UpdateActivityInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues.map((i) => i.message).join('; '), retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.subtitle !== undefined) updateData.subtitle = input.subtitle ?? null;
      if (input.instructions !== undefined) updateData.instructions = input.instructions ?? null;
      if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
      if (input.config !== undefined) updateData.config = input.config;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.isRequired !== undefined) updateData.isRequired = input.isRequired;
      if (input.isScorable !== undefined) updateData.isScorable = input.isScorable;
      if (input.isPractice !== undefined) updateData.isPractice = input.isPractice;
      if (input.timeLimit !== undefined) updateData.timeLimit = input.timeLimit ?? null;
      if (input.maxAttempts !== undefined) updateData.maxAttempts = input.maxAttempts ?? null;
      if (input.retryable !== undefined) updateData.retryable = input.retryable;
      if (input.prerequisiteActivityIds !== undefined) updateData.prerequisiteActivityIds = input.prerequisiteActivityIds;
      if (input.metadata !== undefined) updateData.metadata = {
        estimatedDuration: input.metadata.estimatedDuration ?? null,
        skill: input.metadata.skill ?? null,
        difficulty: input.metadata.difficulty ?? null,
        tags: input.metadata.tags ?? [],
        bloomLevel: input.metadata.bloomLevel ?? null,
        aiGenerated: input.metadata.aiGenerated ?? false,
      };
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: ActivityFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getActivityById(id: string): Promise<RepositoryResult<IActivity>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId: '' } };
      }
      const doc = formatDoc(snap);
      if (!doc) return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId: '' } };
      if (doc.deletedAt) return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: ActivityFirestoreMapper.toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listActivities(filter: ActivityFilter, page: PageQuery): Promise<RepositoryResult<Page<IActivitySummary>>> {
    try {
      const query = new QueryBuilder<ActivityFirestoreDoc>(this.transactionManager);
      query.withFilter('deletedAt', 'eq', null);
      if (filter.lessonId) query.withFilter('lessonId', 'eq', filter.lessonId);
      if (filter.type) query.withFilter('type', 'eq', filter.type);
      if (filter.status) query.withFilter('status', 'eq', filter.status);
      if (filter.isRequired !== undefined) query.withFilter('isRequired', 'eq', filter.isRequired);
      if (filter.isScorable !== undefined) query.withFilter('isScorable', 'eq', filter.isScorable);
      if (filter.isPractice !== undefined) query.withFilter('isPractice', 'eq', filter.isPractice);
      query.withOrderBy('displayOrder', 'asc');
      query.withLimit(page.limit);
      if (page.cursor) {
        try { const cursor = JSON.parse(page.cursor) as ICursor; query.withCursor(cursor); } catch { return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid cursor', retryable: false, requestId: '' } }; }
      }
      query.withProjections(['lessonId', 'type', 'title', 'subtitle', 'displayOrder', 'status', 'isRequired', 'isScorable', 'isPractice', 'metadata', 'createdAt']);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result;
      const items = result.value.items.map((d) => ActivityFirestoreMapper.toSummary(d));
      return { ok: true, value: { items, nextCursor: result.value.nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Page<IActivitySummary>>;
    }
  }

  async getActivitiesByLesson(lessonId: string): Promise<RepositoryResult<IActivity[]>> {
    try {
      const query = new QueryBuilder<ActivityFirestoreDoc>(this.transactionManager);
      query.withFilter('lessonId', 'eq', lessonId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result;
      const items = result.value.items.map((d) => ActivityFirestoreMapper.toDomain(d));
      return { ok: true, value: items };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<IActivity[]>;
    }
  }

  async searchActivities(searchTerm: string, page: PageQuery): Promise<RepositoryResult<Page<IActivitySummary>>> {
    try {
      const allResults = await this.listActivities({}, { limit: 1000 });
      if (!allResults.ok) return allResults;
      const term = searchTerm.toLowerCase();
      const filtered = allResults.value.items.filter((a) =>
        a.title.toLowerCase().includes(term) || a.type.toLowerCase().includes(term),
      );
      const startIndex = page.cursor ? Number(page.cursor) : 0;
      const sliced = filtered.slice(startIndex, startIndex + page.limit);
      const nextCursor = (startIndex + page.limit < filtered.length) ? String(startIndex + page.limit) : null;
      return { ok: true, value: { items: sliced, nextCursor } };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } } as unknown as RepositoryResult<Page<IActivitySummary>>;
    }
  }

  async softDeleteActivity(id: string, requestId: string): Promise<RepositoryResult<void>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async restoreActivity(id: string, requestId: string): Promise<RepositoryResult<void>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ deletedAt: null, updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async publishActivity(id: string, requestId: string): Promise<RepositoryResult<IActivity>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ status: 'published', updatedAt: Timestamp.now() });
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found after publish: ${id}`, retryable: false, requestId } };
      return { ok: true, value: ActivityFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async unpublishActivity(id: string, requestId: string): Promise<RepositoryResult<IActivity>> {
    if (!requestId) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: 'Request ID is required', retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found: ${id}`, retryable: false, requestId } };
      }
      await docRef.update({ status: 'draft', updatedAt: Timestamp.now() });
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: `Activity not found after unpublish: ${id}`, retryable: false, requestId } };
      return { ok: true, value: ActivityFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err, requestId } };
    }
  }

  async changeActivityOrder(id: string, newOrder: number, _expectedVersion: number): Promise<RepositoryResult<IActivity>> {
    return this.updateActivity(id, { displayOrder: newOrder }, _expectedVersion);
  }
}
