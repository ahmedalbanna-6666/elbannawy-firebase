import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IDeviceTokenRepository, IDeviceToken, IDeviceTokenFilter } from '../contracts';

const COLLECTION = 'deviceTokens';

export class DeviceTokenRepository implements IDeviceTokenRepository {
  private db() { return getFirestoreInstance(); }

  async create(input: IDeviceToken): Promise<RepositoryResult<IDeviceToken>> {
    try {
      await this.db().collection(COLLECTION).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getById(id: string): Promise<RepositoryResult<IDeviceToken | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as IDeviceToken };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IDeviceToken | null>; }
  }

  async list(filter: IDeviceTokenFilter): Promise<RepositoryResult<IDeviceToken[]>> {
    try {
      let query: FirebaseFirestore.Query = this.db().collection(COLLECTION);
      if (filter.userId) query = query.where('userId', '==', filter.userId);
      if (filter.active !== undefined) query = query.where('active', '==', filter.active);
      const snap = await query.get();
      return { ok: true, value: snap.docs.map((d) => d.data() as IDeviceToken) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IDeviceToken[]>; }
  }

  async deactivate(id: string): Promise<RepositoryResult<void>> {
    try {
      await this.db().collection(COLLECTION).doc(id).update({ active: false, updatedAt: new Date().toISOString() });
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }

  async deactivateByUser(userId: string): Promise<RepositoryResult<void>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('userId', '==', userId).where('active', '==', true).get();
      const batch = this.db().batch();
      const now = new Date().toISOString();
      snap.docs.forEach((doc) => batch.update(doc.ref, { active: false, updatedAt: now }));
      if (snap.docs.length > 0) await batch.commit();
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }

  async deactivateByToken(token: string): Promise<RepositoryResult<void>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('token', '==', token).where('active', '==', true).get();
      const batch = this.db().batch();
      const now = new Date().toISOString();
      snap.docs.forEach((doc) => batch.update(doc.ref, { active: false, updatedAt: now }));
      if (snap.docs.length > 0) await batch.commit();
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }
}
