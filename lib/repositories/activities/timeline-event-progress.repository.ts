import { Timestamp } from 'firebase-admin/firestore';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { TimelineEventProgressFirestoreMapper, TimelineEventProgressFirestoreDoc } from './timeline-event-progress-firestore-mapper';
import type { ITimelineEventProgressRepository, ITimelineEventProgress, CreateTimelineEventProgressInput } from '../contracts';

const COLLECTION = 'timelineEventProgress';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): TimelineEventProgressFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as TimelineEventProgressFirestoreDoc;
}

export class TimelineEventProgressRepository implements ITimelineEventProgressRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async getByUserAndEvent(userId: string, timelineEventId: string): Promise<RepositoryResult<ITimelineEventProgress | null>> {
    try {
      const query = new QueryBuilder<TimelineEventProgressFirestoreDoc>(this.transactionManager);
      query.withFilter('userId', 'eq', userId);
      query.withFilter('timelineEventId', 'eq', timelineEventId);
      query.withLimit(1);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<ITimelineEventProgress | null>;
      const item = result.value.items[0];
      if (!item) return { ok: true, value: null };
      return { ok: true, value: TimelineEventProgressFirestoreMapper.toDomain(item) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ITimelineEventProgress | null>;
    }
  }

  async upsert(input: CreateTimelineEventProgressInput): Promise<RepositoryResult<ITimelineEventProgress>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const existing = await docRef.get();
      const now = Timestamp.now();

      if (existing.exists) {
        await docRef.update({ updatedAt: now, lastActiveAt: now });
      } else {
        const doc = TimelineEventProgressFirestoreMapper.toCreate({
          id: input.id, userId: input.userId, videoId: input.videoId,
          lessonId: input.lessonId, timelineEventId: input.timelineEventId, activityId: input.activityId,
        });
        await docRef.set(doc);
      }

      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back document', retryable: false, requestId: '' } };
      return { ok: true, value: TimelineEventProgressFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async markCompleted(id: string): Promise<RepositoryResult<ITimelineEventProgress>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Timeline event progress not found: ${id}`, retryable: false, requestId: '' } };
      }
      const now = Timestamp.now();
      await docRef.update({ completed: true, completedAt: now, updatedAt: now });
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back after update', retryable: false, requestId: '' } };
      return { ok: true, value: TimelineEventProgressFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listByUserAndVideo(userId: string, videoId: string): Promise<RepositoryResult<ITimelineEventProgress[]>> {
    try {
      const query = new QueryBuilder<TimelineEventProgressFirestoreDoc>(this.transactionManager);
      query.withFilter('userId', 'eq', userId);
      query.withFilter('videoId', 'eq', videoId);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<ITimelineEventProgress[]>;
      const items = result.value.items.map((d) => TimelineEventProgressFirestoreMapper.toDomain(d));
      return { ok: true, value: items };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ITimelineEventProgress[]>;
    }
  }
}
