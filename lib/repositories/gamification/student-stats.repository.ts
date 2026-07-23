import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IStudentStatsRepository, IStudentStats } from '../contracts';

const COLLECTION = 'studentStats';

export class StudentStatsRepository implements IStudentStatsRepository {
  private db() { return getFirestoreInstance(); }

  async getByStudentId(studentId: string): Promise<RepositoryResult<IStudentStats | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).doc(studentId).get();
      if (!snap.exists) return { ok: true, value: null };
      return { ok: true, value: snap.data() as IStudentStats };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IStudentStats | null>; }
  }

  async computeAndSave(studentId: string): Promise<RepositoryResult<IStudentStats>> {
    try {
      const db = this.db();
      const [progressSnap, xpSnap, walletSnap] = await Promise.all([
        db.collection('lessonProgress').where('studentId', '==', studentId).get(),
        db.collection('xpAccounts').doc(studentId).get(),
        db.collection('wallets').doc(studentId).get(),
      ]);

      const totalLessons = progressSnap.size;
      const completedLessons = progressSnap.docs.filter((d) => d.data().status === 'completed').length;
      const xpData = xpSnap.exists ? (xpSnap.data() as { totalXp?: number }) : null;
      const walletData = walletSnap.exists ? (walletSnap.data() as { balance?: number }) : null;

      const stats: IStudentStats = {
        id: studentId,
        studentId,
        completedLessons,
        completedUnits: 0,
        averageQuizScore: 0,
        homeworkCompletionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        currentXp: xpData?.totalXp ?? 0,
        currentCoins: walletData?.balance ?? 0,
        streakDays: 0,
        lastActiveAt: new Date().toISOString(),
        projectionVersion: 1,
      };

      await db.collection(COLLECTION).doc(studentId).set(stats, { merge: true });
      return { ok: true, value: stats };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
