import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { LessonDocumentFirestoreMapper, LessonDocumentFirestoreDoc } from './lesson-document-firestore-mapper';
import type { ILessonDocumentRepository, ILessonDocument, CreateLessonDocumentInput, UpdateLessonDocumentInput } from '../contracts';

const COLLECTION = 'lessonDocuments';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): LessonDocumentFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as LessonDocumentFirestoreDoc;
}

export class LessonDocumentRepository implements ILessonDocumentRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async create(input: CreateLessonDocumentInput): Promise<RepositoryResult<ILessonDocument>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Lesson document already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const doc = LessonDocumentFirestoreMapper.toCreate({
        id: input.id,
        lessonId: input.lessonId,
        storagePath: input.storagePath,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        sha256: input.sha256,
        processingStatus: input.processingStatus ?? 'pending',
        downloadable: input.downloadable ?? false,
      });
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created document', retryable: false, requestId: '' } };
      return { ok: true, value: LessonDocumentFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getByLessonId(lessonId: string): Promise<RepositoryResult<ILessonDocument | null>> {
    try {
      const query = new QueryBuilder<LessonDocumentFirestoreDoc>(this.transactionManager);
      query.withFilter('lessonId', 'eq', lessonId);
      query.withFilter('deletedAt', 'eq', null);
      query.withLimit(1);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<ILessonDocument | null>;
      const item = result.value.items[0];
      if (!item) return { ok: true, value: null };
      return { ok: true, value: LessonDocumentFirestoreMapper.toDomain(item) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ILessonDocument | null>;
    }
  }

  async update(lessonId: string, input: UpdateLessonDocumentInput, _expectedVersion: number): Promise<RepositoryResult<ILessonDocument>> {
    try {
      const existing = await this.getByLessonId(lessonId);
      if (!existing.ok || !existing.value) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson document not found: ${lessonId}`, retryable: false, requestId: '' } };
      }
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(existing.value.id);
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.processingStatus !== undefined) updateData.processingStatus = input.processingStatus;
      if (input.downloadable !== undefined) updateData.downloadable = input.downloadable;
      if (input.extractedAt !== undefined) updateData.extractedAt = input.extractedAt;
      if (input.errorCode !== undefined) updateData.errorCode = input.errorCode ?? null;
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: 'Lesson document not found after update', retryable: false, requestId: '' } };
      return { ok: true, value: LessonDocumentFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async delete(lessonId: string): Promise<RepositoryResult<void>> {
    try {
      const existing = await this.getByLessonId(lessonId);
      if (!existing.ok || !existing.value) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Lesson document not found: ${lessonId}`, retryable: false, requestId: '' } };
      }
      const db = this.getDb();
      await db.collection(COLLECTION).doc(existing.value.id).update({ deletedAt: new Date(), updatedAt: new Date() });
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }
}
