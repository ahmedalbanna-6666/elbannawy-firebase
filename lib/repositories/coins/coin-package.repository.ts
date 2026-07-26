import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { ICoinPackageRepository, ICoinPackage } from '../contracts';

const COLLECTION = 'coinPackages';

export class CoinPackageRepository implements ICoinPackageRepository {
  private db() { return getFirestoreInstance(); }

  async create(input: ICoinPackage): Promise<RepositoryResult<ICoinPackage>> {
    try {
      await this.db().collection(COLLECTION).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getById(id: string): Promise<RepositoryResult<ICoinPackage | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as ICoinPackage };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICoinPackage | null>; }
  }

  async listActive(): Promise<RepositoryResult<ICoinPackage[]>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('active', '==', true).orderBy('displayOrder', 'asc').get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ICoinPackage) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICoinPackage[]>; }
  }

  async listAll(): Promise<RepositoryResult<ICoinPackage[]>> {
    try {
      const snap = await this.db().collection(COLLECTION).orderBy('displayOrder', 'asc').get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ICoinPackage) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICoinPackage[]>; }
  }

  async update(id: string, input: Partial<ICoinPackage>): Promise<RepositoryResult<ICoinPackage>> {
    try {
      const ref = this.db().collection(COLLECTION).doc(id);
      const data = { ...input, updatedAt: new Date().toISOString() };
      await ref.set(data, { merge: true });
      const snap = await ref.get();
      return { ok: true, value: snap.data() as ICoinPackage };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      await this.db().collection(COLLECTION).doc(id).delete();
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }
}
