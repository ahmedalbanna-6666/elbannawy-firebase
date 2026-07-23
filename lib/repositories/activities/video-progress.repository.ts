import { Timestamp } from 'firebase-admin/firestore';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { VideoProgressFirestoreMapper, VideoProgressFirestoreDoc } from './video-progress-firestore-mapper';
import type { IVideoProgressRepository, IVideoProgress, CreateVideoProgressInput, UpdateVideoProgressInput } from '../contracts';

const COLLECTION = 'videoProgress';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): VideoProgressFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as VideoProgressFirestoreDoc;
}

export class VideoProgressRepository implements IVideoProgressRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async getByUserAndVideo(userId: string, videoId: string): Promise<RepositoryResult<IVideoProgress | null>> {
    try {
      const query = new QueryBuilder<VideoProgressFirestoreDoc>(this.transactionManager);
      query.withFilter('userId', 'eq', userId);
      query.withFilter('videoId', 'eq', videoId);
      query.withLimit(1);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<IVideoProgress | null>;
      const item = result.value.items[0];
      if (!item) return { ok: true, value: null };
      return { ok: true, value: VideoProgressFirestoreMapper.toDomain(item) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IVideoProgress | null>;
    }
  }

  async upsert(id: string, input: CreateVideoProgressInput | UpdateVideoProgressInput): Promise<RepositoryResult<IVideoProgress>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      const now = Timestamp.now();

      if (existing.exists) {
        const updateData: Record<string, unknown> = { updatedAt: now, lastActiveAt: now };
        if ('lastPositionSeconds' in input && input.lastPositionSeconds !== undefined) updateData.lastPositionSeconds = input.lastPositionSeconds;
        if ('watchedSeconds' in input && input.watchedSeconds !== undefined) updateData.watchedSeconds = input.watchedSeconds;
        if ('completed' in input && input.completed !== undefined) {
          updateData.completed = input.completed;
          updateData.completedAt = input.completed ? now : null;
        }
        if ('completedAt' in input && input.completedAt !== undefined) updateData.completedAt = input.completedAt;
        await docRef.update(updateData);
      } else {
        const createInput = input as CreateVideoProgressInput;
        const doc = VideoProgressFirestoreMapper.toCreate({
          id: createInput.id,
          userId: createInput.userId,
          videoId: createInput.videoId,
          lessonId: createInput.lessonId,
          lastPositionSeconds: createInput.lastPositionSeconds ?? 0,
          watchedSeconds: createInput.watchedSeconds ?? 0,
        });
        await docRef.set(doc);
      }

      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back document', retryable: false, requestId: '' } };
      return { ok: true, value: VideoProgressFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listByUserAndLesson(userId: string, lessonId: string): Promise<RepositoryResult<IVideoProgress[]>> {
    try {
      const query = new QueryBuilder<VideoProgressFirestoreDoc>(this.transactionManager);
      query.withFilter('userId', 'eq', userId);
      query.withFilter('lessonId', 'eq', lessonId);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<IVideoProgress[]>;
      const items = result.value.items.map((d) => VideoProgressFirestoreMapper.toDomain(d));
      return { ok: true, value: items };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IVideoProgress[]>;
    }
  }
}
