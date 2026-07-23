import { XpAccountRepository } from '../../repositories/gamification/xp-account.repository';
import { StudentStatsRepository } from '../../repositories/gamification/student-stats.repository';
import { RepositoryResult } from '../../shared/types/repository.types';

export class HomeService {
  private readonly xpRepo = new XpAccountRepository();
  private readonly statsRepo = new StudentStatsRepository();

  async getDashboard(studentId: string): Promise<RepositoryResult<{
    stats: { completedLessons: number; averageQuizScore: number; currentXp: number; currentCoins: number; streakDays: number };
    xp: { totalXp: number; level: number } | null;
    recentActivity: Array<{ type: string; date: string }>;
  }>> {
    const [statsResult, xpResult] = await Promise.all([
      this.statsRepo.computeAndSave(studentId),
      this.xpRepo.getByStudentId(studentId),
    ]);

    const stats = statsResult.ok ? statsResult.value : null;
    const xp = xpResult.ok && xpResult.value ? { totalXp: xpResult.value.totalXp, level: xpResult.value.level } : null;

    return {
      ok: true,
      value: {
        stats: {
          completedLessons: stats?.completedLessons ?? 0,
          averageQuizScore: stats?.averageQuizScore ?? 0,
          currentXp: stats?.currentXp ?? 0,
          currentCoins: stats?.currentCoins ?? 0,
          streakDays: stats?.streakDays ?? 0,
        },
        xp,
        recentActivity: [],
      },
    };
  }

  async getLeaderboard(limit = 20): Promise<RepositoryResult<Array<{ studentId: string; totalXp: number; level: number }>>> {
    const result = await this.xpRepo.getLeaderboard(limit);
    if (!result.ok) return { ok: false, error: result.error } as unknown as RepositoryResult<Array<{ studentId: string; totalXp: number; level: number }>>;
    return { ok: true, value: result.value.map((a) => ({ studentId: a.studentId, totalXp: a.totalXp, level: a.level })) };
  }
}
