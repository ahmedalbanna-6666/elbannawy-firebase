import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IAchievementRepository, IAchievement } from '../contracts';

const COLLECTION = 'achievements';

export class AchievementRepository implements IAchievementRepository {
  private db() { return getFirestoreInstance(); }

  async listActive(): Promise<RepositoryResult<IAchievement[]>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('active', '==', true).get();
      return { ok: true, value: snap.docs.map((d) => d.data() as IAchievement) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IAchievement[]>; }
  }

  async getByCode(code: string): Promise<RepositoryResult<IAchievement | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('code', '==', code).limit(1).get();
      if (snap.empty) return { ok: true, value: null };
      return { ok: true, value: snap.docs[0]!.data() as IAchievement };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IAchievement | null>; }
  }
}
