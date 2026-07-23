import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IWalletRepository, IWallet } from '../contracts';

const COLLECTION = 'wallets';

export class WalletRepository implements IWalletRepository {
  private db() { return getFirestoreInstance(); }

  async getByStudentId(studentId: string): Promise<RepositoryResult<IWallet | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(studentId).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as IWallet };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IWallet | null>; }
  }

  async upsert(studentId: string, balance: number, totalPurchased: number, totalEarned: number, totalSpent: number, pending: number): Promise<RepositoryResult<IWallet>> {
    try {
      const ref = this.db().collection(COLLECTION).doc(studentId);
      const data: IWallet = { id: studentId, studentId, balance, totalPurchased, totalEarned, totalSpent, pending, updatedAt: new Date().toISOString(), projectionVersion: 1 };
      await ref.set(data, { merge: true });
      return { ok: true, value: data };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
