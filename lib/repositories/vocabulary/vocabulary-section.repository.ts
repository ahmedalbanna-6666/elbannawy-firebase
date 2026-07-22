import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type {
  IVocabularySectionRepository,
  IVocabularySection,
  CreateVocabularySectionInput,
  UpdateVocabularySectionInput,
} from '../contracts';
import { QueryBuilder } from '../query-builder';
import { CreateVocabularySectionInputSchema, UpdateVocabularySectionInputSchema } from '../validators';

const COLLECTION = 'vocabularySections';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): Record<string, unknown> | null {
  if (!snap.exists) return null;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return { ...snap.data(), id: snap.id } as Record<string, unknown>;
}

function str(v: unknown, fallback = ''): string {
  if (v === undefined || v === null) return fallback;
  if (typeof v === 'object' && 'toDate' in (v as Record<string, unknown>)) {
    return (v as { toDate(): Date }).toDate().toISOString();
  }
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v);
  }
  return fallback;
}

function num(v: unknown, fallback = 0): number {
  if (v === undefined || v === null) return fallback;
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
}

function toDomain(data: Record<string, unknown>): IVocabularySection {
  return {
    id: data.id as string,
    lessonId: data.lessonId as string,
    kind: data.kind as IVocabularySection['kind'],
    title: data.title !== undefined ? str(data.title) : null,
    displayOrder: num(data.displayOrder),
    contentVersion: num(data.contentVersion, 1),
    sourceTableIndex: data.sourceTableIndex !== undefined ? num(data.sourceTableIndex) : null,
    sourceTitleRowIndex: data.sourceTitleRowIndex !== undefined ? num(data.sourceTitleRowIndex) : null,
    createdAt: str(data.createdAt),
    updatedAt: str(data.updatedAt),
    schemaVersion: num(data.schemaVersion, 1),
    deletedAt: data.deletedAt ? str(data.deletedAt) : null,
  };
}

export class VocabularySectionRepository implements IVocabularySectionRepository {
  private getDb(): FirebaseFirestore.Firestore {
    return getFirestoreInstance();
  }

  async create(input: CreateVocabularySectionInput): Promise<RepositoryResult<IVocabularySection>> {
    const parsed = CreateVocabularySectionInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues.map(i => i.message).join('; '), retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const existing = await docRef.get();
      if (existing.exists) {
        return { ok: false, error: { code: 'ALREADY_EXISTS', message: `Section already exists: ${input.id}`, retryable: false, requestId: '' } };
      }
      const now = new Date().toISOString();
      await docRef.set({
        ...input,
        contentVersion: 1,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
        deletedAt: null,
      });
      const saved = await docRef.get();
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back created section', retryable: false, requestId: '' } };
      return { ok: true, value: toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async getById(id: string): Promise<RepositoryResult<IVocabularySection | null>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const snap = await docRef.get();
      const doc = formatDoc(snap);
      if (!doc || doc.deletedAt) return { ok: true, value: null };
      return { ok: true, value: toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async update(id: string, input: UpdateVocabularySectionInput, _expectedVersion: number): Promise<RepositoryResult<IVocabularySection>> {
    const parsed = UpdateVocabularySectionInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.issues.map(i => i.message).join('; '), retryable: false, requestId: '' } };
    }
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(id);
      const existing = await docRef.get();
      if (!existing.exists) {
        return { ok: false, error: { code: 'NOT_FOUND', message: `Section not found: ${id}`, retryable: false, requestId: '' } };
      }
      await docRef.update({ ...input, updatedAt: new Date().toISOString() });
      const saved = await docRef.get();
      const doc = formatDoc(saved);
      if (!doc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back updated section', retryable: false, requestId: '' } };
      return { ok: true, value: toDomain(doc) };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async listByLesson(lessonId: string): Promise<RepositoryResult<IVocabularySection[]>> {
    try {
      const query = new QueryBuilder<IVocabularySection>()
        .withFilter('lessonId', 'eq', lessonId)
        .withOrderBy('displayOrder', 'asc');
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result;
      const sections = result.value.items.map(i => toDomain(i as unknown as Record<string, unknown>));
      return { ok: true, value: sections };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }

  async deleteByLesson(lessonId: string): Promise<RepositoryResult<void>> {
    try {
      const db = this.getDb();
      const snapshot = await db.collection(COLLECTION)
        .where('lessonId', '==', lessonId)
        .get();
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return { ok: true, value: undefined };
    } catch (error) {
      const err = toRepositoryError(error);
      return { ok: false, error: { ...err } };
    }
  }
}
