import { Timestamp } from 'firebase-admin/firestore';
import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type {
  IStoryRepository, IStory, IStoryChapter, IStoryLesson, IStoryProgress, IStoryFilter,
} from '../contracts';

const STORIES = 'stories';
const CHAPTERS = 'storyChapters';
const LESSONS = 'storyLessons';
const PROGRESS = 'storyProgress';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): Record<string, unknown> | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id };
}

export class StoryRepository implements IStoryRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore { return getFirestoreInstance(); }

  async create(input: Partial<IStory>): Promise<RepositoryResult<IStory>> {
    try {
      const id = input.id;
      if (!id) return { ok: false, error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: '' } };
      const db = this.getDb();
      const docRef = db.collection(STORIES).doc(id);
      const doc = { ...input, createdAt: Timestamp.now(), updatedAt: Timestamp.now(), deletedAt: null };
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IStory };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getById(id: string): Promise<RepositoryResult<IStory | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(STORIES).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc || (doc as Record<string, unknown>).deletedAt) return { ok: true, value: null };
      return { ok: true, value: doc as unknown as IStory };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IStory | null>;
    }
  }

  async update(id: string, input: Partial<IStory>): Promise<RepositoryResult<IStory>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(STORIES).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Story not found: ${id}`, retryable: false, requestId: '' } };
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      for (const [key, val] of Object.entries(input)) {
        updateData[key] = val;
      }
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found after update', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IStory };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(STORIES).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Story not found: ${id}`, retryable: false, requestId: '' } };
      await docRef.update({ deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async list(filter: IStoryFilter): Promise<RepositoryResult<IStory[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      if (filter.gradeId) query.withFilter('gradeId', 'eq', filter.gradeId);
      if (filter.published !== undefined) query.withFilter('published', 'eq', filter.published);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(STORIES);
      if (!result.ok) return result as unknown as RepositoryResult<IStory[]>;
      return { ok: true, value: result.value.items as unknown as IStory[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IStory[]>;
    }
  }

  async listByGrade(gradeId: string): Promise<RepositoryResult<IStory[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('gradeId', 'eq', gradeId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(STORIES);
      if (!result.ok) return result as unknown as RepositoryResult<IStory[]>;
      return { ok: true, value: result.value.items as unknown as IStory[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IStory[]>;
    }
  }

  async createChapter(input: Partial<IStoryChapter>): Promise<RepositoryResult<IStoryChapter>> {
    try {
      const cid = input.id;
      if (!cid) return { ok: false, error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: '' } };
      const db = this.getDb();
      const docRef = db.collection(CHAPTERS).doc(cid);
      const doc = { ...input, createdAt: Timestamp.now(), updatedAt: Timestamp.now(), deletedAt: null };
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IStoryChapter };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getChapterById(id: string): Promise<RepositoryResult<IStoryChapter | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(CHAPTERS).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc || (doc as Record<string, unknown>).deletedAt) return { ok: true, value: null };
      return { ok: true, value: doc as unknown as IStoryChapter };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IStoryChapter | null>;
    }
  }

  async updateChapter(id: string, input: Partial<IStoryChapter>): Promise<RepositoryResult<IStoryChapter>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(CHAPTERS).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Chapter not found: ${id}`, retryable: false, requestId: '' } };
      const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
      for (const [key, val] of Object.entries(input)) {
        updateData[key] = val;
      }
      await docRef.update(updateData);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'NOT_FOUND', message: 'Not found after update', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IStoryChapter };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async deleteChapter(id: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(CHAPTERS).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) return { ok: false, error: { code: 'NOT_FOUND', message: `Chapter not found: ${id}`, retryable: false, requestId: '' } };
      await docRef.update({ deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listChapters(storyId: string): Promise<RepositoryResult<IStoryChapter[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('storyId', 'eq', storyId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(CHAPTERS);
      if (!result.ok) return result as unknown as RepositoryResult<IStoryChapter[]>;
      return { ok: true, value: result.value.items as unknown as IStoryChapter[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IStoryChapter[]>;
    }
  }

  async createLesson(input: Partial<IStoryLesson>): Promise<RepositoryResult<IStoryLesson>> {
    try {
      const lid = input.id;
      if (!lid) return { ok: false, error: { code: 'INVALID_INPUT', message: 'Document ID is required', retryable: false, requestId: '' } };
      const db = this.getDb();
      const docRef = db.collection(LESSONS).doc(lid);
      const doc = { ...input, createdAt: Timestamp.now(), updatedAt: Timestamp.now(), deletedAt: null };
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: savedDoc as unknown as IStoryLesson };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async getLessonById(id: string): Promise<RepositoryResult<IStoryLesson | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(LESSONS).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc || (doc as Record<string, unknown>).deletedAt) return { ok: true, value: null };
      return { ok: true, value: doc as unknown as IStoryLesson };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IStoryLesson | null>;
    }
  }

  async listLessons(chapterId: string): Promise<RepositoryResult<IStoryLesson[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('chapterId', 'eq', chapterId);
      query.withFilter('deletedAt', 'eq', null);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(LESSONS);
      if (!result.ok) return result as unknown as RepositoryResult<IStoryLesson[]>;
      return { ok: true, value: result.value.items as unknown as IStoryLesson[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IStoryLesson[]>;
    }
  }

  async getProgress(studentId: string, storyId: string): Promise<RepositoryResult<IStoryProgress | null>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('studentId', 'eq', studentId);
      query.withFilter('storyId', 'eq', storyId);
      query.withLimit(1);
      const result = await query.execute(PROGRESS);
      if (!result.ok) return result as unknown as RepositoryResult<IStoryProgress | null>;
      const item = result.value.items[0];
      if (!item) return { ok: true, value: null };
      return { ok: true, value: item as unknown as IStoryProgress };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IStoryProgress | null>;
    }
  }

  async upsertProgress(input: IStoryProgress): Promise<RepositoryResult<IStoryProgress>> {
    try {
      const db = this.getDb();
      const now = Timestamp.now();
      if (input.id) {
        const existing = await db.collection(PROGRESS).doc(input.id).get();
        if (existing.exists) {
          await existing.ref.update({ ...input, updatedAt: now } as Record<string, unknown>);
          const saved = await existing.ref.get();
          return { ok: true, value: { ...saved.data(), id: saved.id } as unknown as IStoryProgress };
        }
      }
      const docRef = input.id ? db.collection(PROGRESS).doc(input.id) : db.collection(PROGRESS).doc();
      const doc = { ...input, id: docRef.id, createdAt: now, updatedAt: now };
      await docRef.set(doc);
      return { ok: true, value: doc as unknown as IStoryProgress };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listStudentProgress(studentId: string): Promise<RepositoryResult<IStoryProgress[]>> {
    try {
      const query = new QueryBuilder<Record<string, unknown>>(this.transactionManager);
      query.withFilter('studentId', 'eq', studentId);
      query.withOrderBy('lastActiveAt', 'desc');
      const result = await query.execute(PROGRESS);
      if (!result.ok) return result as unknown as RepositoryResult<IStoryProgress[]>;
      return { ok: true, value: result.value.items as unknown as IStoryProgress[] };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IStoryProgress[]>;
    }
  }
}
