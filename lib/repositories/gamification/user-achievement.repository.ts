import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IUserAchievementRepository, IUserAchievement } from '../contracts';

const COLLECTION = 'userAchievements';

export class UserAchievementRepository implements IUserAchievementRepository {
  private db() { return getFirestoreInstance(); }

  async listByStudent(studentId: string): Promise<RepositoryResult<IUserAchievement[]>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('studentId', '==', studentId).orderBy('earnedAt', 'desc').get();
      return { ok: true, value: snap.docs.map((d) => d.data() as IUserAchievement) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IUserAchievement[]>; }
  }

  async award(input: IUserAchievement): Promise<RepositoryResult<IUserAchievement>> {
    try {
      await this.db().collection(COLLECTION).doc(input.id).set(input);
      return { ok: true, value: input };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
