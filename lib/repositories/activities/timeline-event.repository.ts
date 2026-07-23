import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { TimelineEventFirestoreMapper, TimelineEventFirestoreDoc } from './timeline-event-firestore-mapper';
import type { ITimelineEventRepository, ITimelineEvent, CreateTimelineEventInput, UpdateTimelineEventInput } from '../contracts';

const COLLECTION = 'timelineEvents';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): TimelineEventFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as TimelineEventFirestoreDoc;
}

export class TimelineEventRepository implements ITimelineEventRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async create(input: CreateTimelineEventInput): Promise<RepositoryResult<ITimelineEvent>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Timeline event already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const doc = TimelineEventFirestoreMapper.toCreate({
        id: input.id, videoId: input.videoId, lessonId: input.lessonId,
        activityId: input.activityId, timestampSeconds: input.timestampSeconds,
        eventType: input.eventType, required: input.required ?? true,
        enabled: input.enabled ?? true, displayOrder: input.displayOrder,
      });
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: TimelineEventFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getById(id: string): Promise<RepositoryResult<ITimelineEvent | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(COLLECTION).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc || doc.deletedAt) return { ok: true, value: null };
      return { ok: true, value: TimelineEventFirestoreMapper.toDomain(doc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ITimelineEvent | null>;
    }
  }

  async update(id: string, input: UpdateTimelineEventInput, _expectedVersion: number): Promise<RepositoryResult<ITimelineEvent>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Timeline event not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.timestampSeconds !== undefined) updateData.timestampSeconds = input.timestampSeconds;
      if (input.eventType !== undefined) updateData.eventType = input.eventType;
      if (input.required !== undefined) updateData.required = input.required;
      if (input.enabled !== undefined) updateData.enabled = input.enabled;
      if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: 'Timeline event not found after update', retryable: false, requestId: '' } };
      return { ok: true, value: TimelineEventFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listByVideo(videoId: string): Promise<RepositoryResult<ITimelineEvent[]>> {
    try {
      const query = new QueryBuilder<TimelineEventFirestoreDoc>(this.transactionManager);
      query.withFilter('videoId', 'eq', videoId);
      query.withFilter('deletedAt', 'eq', null);
      query.withFilter('enabled', 'eq', true);
      query.withOrderBy('timestampSeconds', 'asc');
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<ITimelineEvent[]>;
      const items = result.value.items.map((d) => TimelineEventFirestoreMapper.toDomain(d));
      return { ok: true, value: items };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ITimelineEvent[]>;
    }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Timeline event not found: ${id}`, retryable: false, requestId: '' } };
      }
      await docRef.update({ deletedAt: new Date(), updatedAt: new Date() });
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }
}
