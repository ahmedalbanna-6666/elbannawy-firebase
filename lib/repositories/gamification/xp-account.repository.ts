import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IXpAccountRepository, IXpAccount } from '../contracts';

const COLLECTION = 'xpAccounts';

export class XpAccountRepository implements IXpAccountRepository {
  private db() { return getFirestoreInstance(); }

  async getByStudentId(studentId: string): Promise<RepositoryResult<IXpAccount | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(studentId).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as IXpAccount };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IXpAccount | null>; }
  }

  async upsert(studentId: string, totalXp: number, level: number): Promise<RepositoryResult<IXpAccount>> {
    try {
      const ref = this.db().collection(COLLECTION).doc(studentId);
      const data = { id: studentId, studentId, totalXp, level, updatedAt: new Date().toISOString(), projectionVersion: 1 };
      await ref.set(data, { merge: true });
      return { ok: true, value: data };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getLeaderboard(limit: number): Promise<RepositoryResult<IXpAccount[]>> {
    try {
      const snap = await this.db().collection(COLLECTION).orderBy('totalXp', 'desc').limit(limit).get();
      return { ok: true, value: snap.docs.map((d) => d.data() as IXpAccount) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IXpAccount[]>; }
  }
}
