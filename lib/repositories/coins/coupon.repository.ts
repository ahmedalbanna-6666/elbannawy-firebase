import { FieldValue } from 'firebase-admin/firestore';
import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { ICouponRepository, ICoupon } from '../contracts';

const COLLECTION = 'coupons';

export class CouponRepository implements ICouponRepository {
  private db() { return getFirestoreInstance(); }

  async getByCode(code: string): Promise<RepositoryResult<ICoupon | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('code', '==', code).limit(1).get();
      if (snap.empty) return { ok: true, value: null };
      return { ok: true, value: snap.docs[0]!.data() as ICoupon };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICoupon | null>; }
  }

  async getById(id: string): Promise<RepositoryResult<ICoupon | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as ICoupon };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICoupon | null>; }
  }

  async incrementUseCount(id: string): Promise<RepositoryResult<void>> {
    try {
      const ref = this.db().collection(COLLECTION).doc(id);
      await ref.update({ useCount: FieldValue.increment(1), updatedAt: new Date().toISOString() });
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }

  async create(input: ICoupon): Promise<RepositoryResult<ICoupon>> {
    try {
      await this.db().collection(COLLECTION).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async update(id: string, input: Partial<ICoupon>): Promise<RepositoryResult<ICoupon>> {
    try {
      const ref = this.db().collection(COLLECTION).doc(id);
      const data = { ...input, updatedAt: new Date().toISOString() };
      await ref.set(data, { merge: true });
      const snap = await ref.get();
      return { ok: true, value: snap.data() as ICoupon };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      await this.db().collection(COLLECTION).doc(id).delete();
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }

  async list(): Promise<RepositoryResult<ICoupon[]>> {
    try {
      const snap = await this.db().collection(COLLECTION).orderBy('createdAt', 'desc').limit(100).get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ICoupon) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ICoupon[]>; }
  }
}
