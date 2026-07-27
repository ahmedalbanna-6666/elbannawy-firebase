import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { INotificationRepository, INotification, INotificationFilter, INotificationPreference } from '../contracts';

const COLLECTION_NOTIFICATIONS = 'notifications';
const COLLECTION_PREFERENCES = 'notificationPreferences';

export class NotificationRepository implements INotificationRepository {
  private db() { return getFirestoreInstance(); }

  async create(input: INotification): Promise<RepositoryResult<INotification>> {
    try {
      await this.db().collection(COLLECTION_NOTIFICATIONS).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }

  async getById(id: string): Promise<RepositoryResult<INotification | null>> {
    try {
      const snap = await this.db().collection(COLLECTION_NOTIFICATIONS).doc(id).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as INotification };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<INotification | null>; }
  }

  async list(filter: INotificationFilter): Promise<RepositoryResult<INotification[]>> {
    try {
      let query: FirebaseFirestore.Query = this.db().collection(COLLECTION_NOTIFICATIONS);
      if (filter.userId) query = query.where('userId', '==', filter.userId);
      if (filter.read !== undefined) query = query.where('read', '==', filter.read);
      if (filter.type) query = query.where('type', '==', filter.type);
      query = query.orderBy('createdAt', 'desc').limit(50);
      const snap = await query.get();
      return { ok: true, value: snap.docs.map((d) => d.data() as INotification) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<INotification[]>; }
  }

  async markRead(id: string): Promise<RepositoryResult<void>> {
    try {
      await this.db().collection(COLLECTION_NOTIFICATIONS).doc(id).update({ read: true, readAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }

  async markAllRead(userId: string): Promise<RepositoryResult<void>> {
    try {
      const snap = await this.db().collection(COLLECTION_NOTIFICATIONS).where('userId', '==', userId).where('read', '==', false).get();
      const batch = this.db().batch();
      const now = new Date().toISOString();
      snap.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true, readAt: now, updatedAt: now });
      });
      await batch.commit();
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      await this.db().collection(COLLECTION_NOTIFICATIONS).doc(id).delete();
      return { ok: true, value: undefined };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<void>; }
  }

  async getPreferences(userId: string): Promise<RepositoryResult<INotificationPreference | null>> {
    try {
      const snap = await this.db().collection(COLLECTION_PREFERENCES).doc(userId).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as INotificationPreference };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<INotificationPreference | null>; }
  }

  async upsertPreferences(input: INotificationPreference): Promise<RepositoryResult<INotificationPreference>> {
    try {
      const ref = this.db().collection(COLLECTION_PREFERENCES).doc(input.id);
      const data = { ...input, updatedAt: new Date().toISOString() };
      await ref.set(data, { merge: true });
      return { ok: true, value: data };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
