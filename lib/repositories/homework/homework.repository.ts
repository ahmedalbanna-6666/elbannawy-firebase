import { Timestamp } from 'firebase-admin/firestore';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { HomeworkFirestoreMapper, HomeworkFirestoreDoc } from './homework-firestore-mapper';
import type { IHomeworkRepository, IHomework, CreateHomeworkInput, UpdateHomeworkInput } from '../contracts';

const COLLECTION = 'homework';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): HomeworkFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as HomeworkFirestoreDoc;
}

export class HomeworkRepository implements IHomeworkRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore { return getFirestoreInstance(); }

  async create(input: CreateHomeworkInput): Promise<RepositoryResult<IHomework>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const doc = HomeworkFirestoreMapper.toCreate({
        id: input.id, lessonId: input.lessonId, title: input.title,
        instructions: input.instructions ?? null, passingScore: input.passingScore ?? 50,
        maxAttempts: input.maxAttempts ?? 3, unlimitedAttempts: input.unlimitedAttempts ?? false,
        published: input.published ?? false, allowRetry: input.allowRetry ?? true,
        showAnswers: input.showAnswers ?? false, xpReward: input.xpReward ?? 10,
      });
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: HomeworkFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getById(id: string): Promise<RepositoryResult<IHomework | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(COLLECTION).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc || doc.deletedAt) return { ok: true, value: null };
      return { ok: true, value: HomeworkFirestoreMapper.toDomain(doc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IHomework | null>;
    }
  }

  async getByLessonId(lessonId: string): Promise<RepositoryResult<IHomework | null>> {
    try {
      const query = new QueryBuilder<HomeworkFirestoreDoc>(this.transactionManager);
      query.withFilter('lessonId', 'eq', lessonId);
      query.withFilter('deletedAt', 'eq', null);
      query.withLimit(1);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<IHomework | null>;
      const item = result.value.items[0];
      if (!item) return { ok: true, value: null };
      return { ok: true, value: HomeworkFirestoreMapper.toDomain(item) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IHomework | null>;
    }
  }

  async update(id: string, input: UpdateHomeworkInput, _expectedVersion: number): Promise<RepositoryResult<IHomework>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Homework not found: ${id}`, retryable: false, requestId: '' } };
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.instructions !== undefined) updateData.instructions = input.instructions ?? null;
      if (input.passingScore !== undefined) updateData.passingScore = input.passingScore;
      if (input.maxAttempts !== undefined) updateData.maxAttempts = input.maxAttempts;
      if (input.unlimitedAttempts !== undefined) updateData.unlimitedAttempts = input.unlimitedAttempts;
      if (input.published !== undefined) updateData.published = input.published;
      if (input.allowRetry !== undefined) updateData.allowRetry = input.allowRetry;
      if (input.showAnswers !== undefined) updateData.showAnswers = input.showAnswers;
      if (input.xpReward !== undefined) updateData.xpReward = input.xpReward;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found after update', retryable: false, requestId: '' } };
      return { ok: true, value: HomeworkFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Homework not found: ${id}`, retryable: false, requestId: '' } };
      await docRef.update({ deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listByLessonIds(lessonIds: string[]): Promise<RepositoryResult<IHomework[]>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(COLLECTION).where('lessonId', 'in', lessonIds).where('deletedAt', '==', null).get();
      const items = snap.docs.map((d) => HomeworkFirestoreMapper.toDomain(formatDoc(d)!));
      return { ok: true, value: items };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IHomework[]>;
    }
  }
}
