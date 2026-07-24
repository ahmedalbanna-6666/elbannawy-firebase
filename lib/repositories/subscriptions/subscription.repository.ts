import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { ISubscriptionRepository, ISubscription, ISubscriptionFilter } from '../contracts';

const COLLECTION = 'subscriptions';

export class SubscriptionRepository implements ISubscriptionRepository {
  private db() { return getFirestoreInstance(); }

  async create(input: ISubscription): Promise<RepositoryResult<ISubscription>> {
    try {
      await this.db().collection(COLLECTION).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getById(id: string): Promise<RepositoryResult<ISubscription | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as ISubscription };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ISubscription | null>; }
  }

  async getActiveByStudent(studentId: string): Promise<RepositoryResult<ISubscription | null>> {
    try {
      const snap = await this.db().collection(COLLECTION)
        .where('studentId', '==', studentId)
        .where('status', 'in', ['TRIAL', 'ACTIVE', 'GRACE'])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      if (snap.empty) return { ok: true, value: null };
      return { ok: true, value: snap.docs[0]!.data() as ISubscription };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ISubscription | null>; }
  }

  async listByStudent(studentId: string): Promise<RepositoryResult<ISubscription[]>> {
    try {
      const snap = await this.db().collection(COLLECTION)
        .where('studentId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ISubscription) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ISubscription[]>; }
  }

  async listByPlan(planId: string): Promise<RepositoryResult<ISubscription[]>> {
    try {
      const snap = await this.db().collection(COLLECTION)
        .where('planId', '==', planId)
        .where('status', '==', 'ACTIVE')
        .get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ISubscription) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ISubscription[]>; }
  }

  async listExpiring(withinDays: number): Promise<RepositoryResult<ISubscription[]>> {
    try {
      const now = new Date();
      const future = new Date(now.getTime() + withinDays * 86400000).toISOString();
      const snap = await this.db().collection(COLLECTION)
        .where('status', 'in', ['TRIAL', 'ACTIVE'])
        .where('currentPeriodEnd', '<=', future)
        .get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ISubscription) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ISubscription[]>; }
  }

  async listExpired(): Promise<RepositoryResult<ISubscription[]>> {
    try {
      const now = new Date().toISOString();
      const snap = await this.db().collection(COLLECTION)
        .where('status', 'in', ['TRIAL', 'ACTIVE', 'GRACE'])
        .where('currentPeriodEnd', '<=', now)
        .get();
      return { ok: true, value: snap.docs.map((d) => d.data() as ISubscription) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<ISubscription[]>; }
  }

  async update(id: string, input: Partial<ISubscription>): Promise<RepositoryResult<ISubscription>> {
    try {
      const ref = this.db().collection(COLLECTION).doc(id);
      await ref.update({ ...input, updatedAt: new Date().toISOString() });
      const snap = await ref.get();
      return { ok: true, value: snap.data() as ISubscription };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async cancel(id: string): Promise<RepositoryResult<ISubscription>> {
    try {
      const ref = this.db().collection(COLLECTION).doc(id);
      await ref.update({
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
        autoRenew: false,
        updatedAt: new Date().toISOString(),
      });
      const snap = await ref.get();
      return { ok: true, value: snap.data() as ISubscription };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
