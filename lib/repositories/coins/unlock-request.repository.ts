import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IUnlockRequestRepository, IUnlockRequest } from '../contracts';

const COLLECTION = 'unlockRequests';

export class UnlockRequestRepository implements IUnlockRequestRepository {
  private db() { return getFirestoreInstance(); }

  async create(input: IUnlockRequest): Promise<RepositoryResult<IUnlockRequest>> {
    try {
      await this.db().collection(COLLECTION).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getById(id: string): Promise<RepositoryResult<IUnlockRequest | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as IUnlockRequest };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IUnlockRequest | null>; }
  }

  async list(filter: { status?: string; studentId?: string }): Promise<RepositoryResult<IUnlockRequest[]>> {
    try {
      let query: FirebaseFirestore.Query = this.db().collection(COLLECTION);
      if (filter.studentId) query = query.where('studentId', '==', filter.studentId);
      if (filter.status) query = query.where('status', '==', filter.status);
      query = query.orderBy('createdAt', 'desc');
      const snap = await query.get();
      return { ok: true, value: snap.docs.map((d) => d.data() as IUnlockRequest) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IUnlockRequest[]>; }
  }

  async update(id: string, input: Partial<IUnlockRequest>): Promise<RepositoryResult<IUnlockRequest>> {
    try {
      const ref = this.db().collection(COLLECTION).doc(id);
      const data = { ...input, updatedAt: new Date().toISOString() };
      await ref.set(data, { merge: true });
      const snap = await ref.get();
      return { ok: true, value: snap.data() as IUnlockRequest };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
