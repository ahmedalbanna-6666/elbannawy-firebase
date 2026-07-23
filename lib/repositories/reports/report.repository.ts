import { getFirestoreInstance, toRepositoryError } from '../firestore/firestore.service';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IReportRepository, IReport, IReportFilter } from '../contracts';

const COLLECTION = 'reports';

export class ReportRepository implements IReportRepository {
  private db() { return getFirestoreInstance(); }

  async getStudentReport(studentId: string, periodStart: string, periodEnd: string): Promise<RepositoryResult<IReport | null>> {
    try {
      const snap = await this.db().collection(COLLECTION).where('studentId', '==', studentId).where('periodStart', '==', periodStart).where('periodEnd', '==', periodEnd).limit(1).get();
      if (snap.empty) return { ok: true, value: null };
      return { ok: true, value: snap.docs[0]!.data() as IReport };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IReport | null>; }
  }

  async list(filter: IReportFilter): Promise<RepositoryResult<IReport[]>> {
    try {
      let query: FirebaseFirestore.Query = this.db().collection(COLLECTION);
      if (filter.studentId) query = query.where('studentId', '==', filter.studentId);
      if (filter.periodType) query = query.where('periodType', '==', filter.periodType);
      if (filter.periodStart) query = query.where('periodStart', '>=', filter.periodStart);
      if (filter.periodEnd) query = query.where('periodEnd', '<=', filter.periodEnd);
      query = query.orderBy('generatedAt', 'desc');
      const snap = await query.get();
      return { ok: true, value: snap.docs.map((d) => d.data() as IReport) };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } } as unknown as RepositoryResult<IReport[]>; }
  }

  async generateReport(studentId: string, periodType: string, periodStart: string, periodEnd: string): Promise<RepositoryResult<IReport>> {
    try {
      const db = this.db();
      const [progressSnap, quizSnap, homeworkSnap, xpSnap, walletSnap, achievementsSnap] = await Promise.all([
        db.collection('lessonProgress').where('studentId', '==', studentId).get(),
        db.collection('quizAttempts').where('studentId', '==', studentId).get(),
        db.collection('homeworkAttempts').where('studentId', '==', studentId).get(),
        db.collection('xpAccounts').doc(studentId).get(),
        db.collection('wallets').doc(studentId).get(),
        db.collection('userAchievements').where('studentId', '==', studentId).get(),
      ]);

      const completedLessons = progressSnap.docs.filter((d) => d.data().status === 'completed').length;
      const totalLessons = progressSnap.size;

      let totalQuizScore = 0;
      let quizCount = 0;
      quizSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.score !== undefined && data.maxScore !== undefined && data.maxScore > 0) {
          totalQuizScore += (data.score / data.maxScore) * 100;
          quizCount++;
        }
      });
      const averageQuizScore = quizCount > 0 ? Math.round(totalQuizScore / quizCount) : 0;

      let completedHomework = 0;
      homeworkSnap.docs.forEach((d) => {
        if (d.data().status === 'completed' || d.data().submittedAt) completedHomework++;
      });
      const homeworkCompletionRate = totalLessons > 0 ? Math.round((completedHomework / totalLessons) * 100) : 0;

      const xpData = xpSnap.exists ? (xpSnap.data() as { totalXp?: number }) : null;
      const walletData = walletSnap.exists ? (walletSnap.data() as { balance?: number }) : null;

      const now = new Date().toISOString();
      const id = `${studentId}_${periodType}_${periodStart}_${periodEnd}`;
      const report: IReport = {
        id,
        studentId,
        periodType: periodType as IReport['periodType'],
        periodStart,
        periodEnd,
        completedLessons,
        averageQuizScore,
        homeworkCompletionRate,
        attendanceRate: 0,
        totalXpGained: xpData?.totalXp ?? 0,
        totalCoinsGained: walletData?.balance ?? 0,
        achievementsEarned: achievementsSnap.size,
        strengths: [],
        weaknesses: [],
        recommendations: [],
        generatedAt: now,
        createdAt: now,
      };

      await db.collection(COLLECTION).doc(id).set(report);
      return { ok: true, value: report };
    } catch (error) { return { ok: false, error: { ...toRepositoryError(error) } }; }
  }
}
