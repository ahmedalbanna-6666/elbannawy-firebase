import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { HomeworkQuestionFirestoreMapper, HomeworkQuestionFirestoreDoc } from './homework-question-firestore-mapper';
import type { IHomeworkQuestionRepository, IHomeworkQuestion, CreateHomeworkQuestionInput } from '../contracts';

const COLLECTION = 'homeworkQuestions';

function formatDoc(snap: FirebaseFirestore.DocumentSnapshot): HomeworkQuestionFirestoreDoc | null {
  if (!snap.exists) return null;
  return { ...snap.data(), id: snap.id } as HomeworkQuestionFirestoreDoc;
}

export class HomeworkQuestionRepository implements IHomeworkQuestionRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore { return getFirestoreInstance(); }

  async create(input: CreateHomeworkQuestionInput): Promise<RepositoryResult<IHomeworkQuestion>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const doc = HomeworkQuestionFirestoreMapper.toCreate({
        id: input.id, homeworkId: input.homeworkId, questionType: input.questionType,
        prompt: input.prompt, instructions: input.instructions ?? null,
        explanation: input.explanation ?? null, options: input.options ?? null,
        points: input.points ?? 1, displayOrder: input.displayOrder,
      });
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = formatDoc(saved);
      if (!savedDoc) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to read back', retryable: false, requestId: '' } };
      return { ok: true, value: HomeworkQuestionFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listByHomework(homeworkId: string): Promise<RepositoryResult<IHomeworkQuestion[]>> {
    try {
      const query = new QueryBuilder<HomeworkQuestionFirestoreDoc>(this.transactionManager);
      query.withFilter('homeworkId', 'eq', homeworkId);
      query.withOrderBy('displayOrder', 'asc');
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<IHomeworkQuestion[]>;
      return { ok: true, value: result.value.items.map((d) => HomeworkQuestionFirestoreMapper.toDomain(d)) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IHomeworkQuestion[]>;
    }
  }

  async getById(id: string): Promise<RepositoryResult<IHomeworkQuestion | null>> {
    try {
      const db = this.getDb();
      const snap = await db.collection(COLLECTION).doc(id).get();
      const doc = formatDoc(snap);
      if (!doc) return { ok: true, value: null };
      return { ok: true, value: HomeworkQuestionFirestoreMapper.toDomain(doc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IHomeworkQuestion | null>;
    }
  }

  async deleteByHomework(homeworkId: string): Promise<RepositoryResult<void>> {
    try {
      const query = new QueryBuilder<HomeworkQuestionFirestoreDoc>(this.transactionManager);
      query.withFilter('homeworkId', 'eq', homeworkId);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<void>;
      const db = this.getDb();
      const batch = db.batch();
      result.value.items.forEach((d) => batch.delete(db.collection(COLLECTION).doc(d.id)));
      await batch.commit();
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }
}
