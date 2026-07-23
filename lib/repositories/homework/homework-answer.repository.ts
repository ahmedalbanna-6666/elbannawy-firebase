import { QueryBuilder } from '../query-builder';
import { TransactionManager } from '../transactions/transaction-manager';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import { HomeworkAnswerFirestoreMapper, HomeworkAnswerFirestoreDoc } from './homework-attempt-firestore-mapper';
import type { IHomeworkAnswerRepository, IHomeworkAnswer, CreateHomeworkAnswerInput } from '../contracts';

const COLLECTION = 'homeworkAnswers';

export class HomeworkAnswerRepository implements IHomeworkAnswerRepository {
  private readonly transactionManager = TransactionManager.getInstance();

  private getDb(): FirebaseFirestore.Firestore { return getFirestoreInstance(); }

  async create(input: CreateHomeworkAnswerInput): Promise<RepositoryResult<IHomeworkAnswer>> {
    try {
      const db = this.getDb();
      const docRef = db.collection(COLLECTION).doc(input.id);
      const doc = HomeworkAnswerFirestoreMapper.toCreate({
        id: input.id, attemptId: input.attemptId, studentId: input.studentId,
        homeworkId: input.homeworkId, questionId: input.questionId,
        answer: input.answer, isCorrect: input.isCorrect ?? null,
        score: input.score ?? null, feedback: input.feedback ?? null,
      });
      await docRef.set(doc);
      const saved = await docRef.get();
      const savedDoc = { ...saved.data(), id: saved.id } as HomeworkAnswerFirestoreDoc;
      return { ok: true, value: HomeworkAnswerFirestoreMapper.toDomain(savedDoc) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } };
    }
  }

  async listByAttempt(attemptId: string): Promise<RepositoryResult<IHomeworkAnswer[]>> {
    try {
      const query = new QueryBuilder<HomeworkAnswerFirestoreDoc>(this.transactionManager);
      query.withFilter('attemptId', 'eq', attemptId);
      const result = await query.execute(COLLECTION);
      if (!result.ok) return result as unknown as RepositoryResult<IHomeworkAnswer[]>;
      return { ok: true, value: result.value.items.map((d) => HomeworkAnswerFirestoreMapper.toDomain(d)) };
    } catch (error) {
      return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IHomeworkAnswer[]>;
    }
  }

  async deleteByAttempt(attemptId: string): Promise<RepositoryResult<void>> {
    try {
      const query = new QueryBuilder<HomeworkAnswerFirestoreDoc>(this.transactionManager);
      query.withFilter('attemptId', 'eq', attemptId);
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
