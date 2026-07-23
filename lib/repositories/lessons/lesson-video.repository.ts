import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { LessonVideoFirestoreMapper, LessonVideoFirestoreDoc } from './lesson-video-firestore-mapper';
import type { ILessonVideoRepository, ILessonVideo, CreateLessonVideoInput, UpdateLessonVideoInput } from '../contracts';

const COLLECTION = 'lessonVideos';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): LessonVideoFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as LessonVideoFirestoreDoc;
}

export class LessonVideoRepository implements ILessonVideoRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async create(input: CreateLessonVideoInput): Promise<RepositoryResult<ILessonVideo>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Lesson video already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const doc = LessonVideoFirestoreMapper.toCreate({
        id: input.id,
        lessonId: input.lessonId,
        title: input.title,
        provider: input.provider,
        providerVideoId: input.providerVideoId,
        providerUrl: input.providerUrl,
        durationSeconds: input.durationSeconds,
        thumbnailUrl: input.thumbnailUrl,
        displayOrder: input.displayOrder,
        enabled: input.enabled ?? true,
        interactiveTimelineEnabled: input.interactiveTimelineEnabled ?? false,
      });
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: LessonVideoFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getById(id: string): Promise<RepositoryResult<ILessonVideo | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(COLLECTION).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc || doc.deletedAt) return { ok: true, value: null };
      return { ok: true, value: LessonVideoFirestoreMapper.toDomain(doc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ILessonVideo | null>;
    }
  }

  async update(id: string, input: UpdateLessonVideoInput, _expectedVersion: number): Promise<RepositoryResult<ILessonVideo>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson video not found: ${id}`, retryable: false, requestId: '' } };
      }
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.provider !== undefined) updateData.provider = input.provider;
      if (input.providerVideoId !== undefined) updateData.providerVideoId = input.providerVideoId;
      if (input.providerUrl !== undefined) updateData.providerUrl = input.providerUrl;
      if (input.durationSeconds !== undefined) updateData.durationSeconds = input.durationSeconds;
      if (input.thumbnailUrl !== undefined) updateData.thumbnailUrl = input.thumbnailUrl ?? null;
      if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
      if (input.enabled !== undefined) updateData.enabled = input.enabled;
      if (input.interactiveTimelineEnabled !== undefined) updateData.interactiveTimelineEnabled = input.interactiveTimelineEnabled;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson video not found after update: ${id}`, retryable: false, requestId: '' } };
      return { ok: true, value: LessonVideoFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listByLesson(lessonId: string): Promise<RepositoryResult<ILessonVideo[]>> {
    try {
      const query = new QueryBuilder<LessonVideoFirestoreDoc>(this.transactionManager);
      query.withFilter('lessonId', 'eq', lessonId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<ILessonVideo[]>;
      const items = result.value.items.map((d) => LessonVideoFirestoreMapper.toDomain(d));
      return { ok: true, value: items };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ILessonVideo[]>;
    }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson video not found: ${id}`, retryable: false, requestId: '' } };
      }
      await docRef.update({ deletedAt: new Date(), updatedAt: new Date() });
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }
}
