import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { ICoinPurchaseRequestRepository, ICoinPurchaseRequest, ICoinPurchaseRequestFilter } from '../contracts';

const COLLECTION = 'coinPurchaseRequests';

export class CoinPurchaseRequestRepository implements ICoinPurchaseRequestRepository {
  private db() { return getFirestoreInstance(); }

  async create(input: ICoinPurchaseRequest): Promise<RepositoryResult<ICoinPurchaseRequest>> {
    try {
      await this.db().collection(COLLECTION).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getById(id: string): Promise<RepositoryResult<ICoinPurchaseRequest | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as ICoinPurchaseRequest };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICoinPurchaseRequest | null>; }
  }

  async list(filter: ICoinPurchaseRequestFilter): Promise<RepositoryResult<ICoinPurchaseRequest[]>> {
    try {
      let query: FirebaseFirestore.Query = this.db().collection(COLLECTION);
      if (filter.studentId) query = query.where('studentId', '==', filter.studentId);
      if (filter.status) query = query.where('status', '==', filter.status);
      query = query.orderBy('createdAt', 'desc');
      const snap = await query.get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ICoinPurchaseRequest) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICoinPurchaseRequest[]>; }
  }

  async update(id: string, input: Partial<ICoinPurchaseRequest>): Promise<RepositoryResult<ICoinPurchaseRequest>> {
    try {
      const ref = this.db().collection(COLLECTION).doc(id);
      const data = { ...input, updatedAt: new Date().toISOString() };
      await ref.set(data, { merge: true });
      const snap = await ref.get();
      return { ok: true, value: snap.data() as ICoinPurchaseRequest };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
