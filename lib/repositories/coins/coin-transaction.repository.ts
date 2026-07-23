import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { ICoinTransactionRepository, ICoinTransaction } from '../contracts';

const COLLECTION = 'coinTransactions';

export class CoinTransactionRepository implements ICoinTransactionRepository {
  private db() { return getFirestoreInstance(); }

  async create(input: ICoinTransaction): Promise<RepositoryResult<ICoinTransaction>> {
    try {
      await this.db().collection(COLLECTION).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async listByStudent(studentId: string, limit = 50): Promise<RepositoryResult<ICoinTransaction[]>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('studentId', '==', studentId).orderBy('occurredAt', 'desc').limit(limit).get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ICoinTransaction) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICoinTransaction[]>; }
  }
}
