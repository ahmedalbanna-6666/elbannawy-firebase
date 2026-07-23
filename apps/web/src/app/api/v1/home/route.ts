import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const db = getAdminDb();
    const studentId = decoded.uid;

    const [userDoc, progressSnap, xpSnap, walletSnap, statsSnap, achievementsSnap, bookingsSnap] = await Promise.all([
      db.collection('users').doc(studentId).get(),
      db.collection('lessonProgress').where('studentId', '==', studentId).get(),
      db.collection('xpAccounts').doc(studentId).get(),
      db.collection('wallets').doc(studentId).get(),
      db.collection('studentStats').doc(studentId).get(),
      db.collection('userAchievements').where('studentId', '==', studentId).get(),
      db.collection('liveBookings').where('studentId', '==', studentId).where('status', '==', 'confirmed').get(),
    ]);

    const userData = userDoc.data() ?? { fullName: 'User', role: 'student' };
    const xpData = xpSnap.exists ? (xpSnap.data() as { totalXp: number; level: number }) : null;
    const walletData = walletSnap.exists ? (walletSnap.data() as { balance: number }) : null;
    const statsData = statsSnap.exists ? (statsSnap.data() as { completedLessons: number; homeworkCompletionRate: number; averageQuizScore: number; attendanceRate: number }) : null;

    const progressDocs = progressSnap.docs.map((d) => d.data() as { lessonId: string; status: string; percentage: number; unitId: string; completedAt?: string; updatedAt: string });
    const completedLessons = progressDocs.filter((p) => p.status === 'completed').length;
    const inProgress = progressDocs.find((p) => p.status === 'in_progress') ?? null;

    let continueLearning = null;
    if (inProgress) {
      const lessonDoc = await db.collection('lessons').doc(inProgress.lessonId).get().catch(() => null);
      const unitDoc = inProgress.unitId ? await db.collection('units').doc(inProgress.unitId).get().catch(() => null) : null;
      continueLearning = {
        unitName: (unitDoc?.data() as { nameAr?: string; name?: string })?.nameAr ?? 'الوحدة',
        lessonName: (lessonDoc?.data() as { title?: string })?.title ?? 'الدرس',
        progress: inProgress.percentage ?? 0,
        lessonId: inProgress.lessonId,
      };
    } else if (progressDocs.length > 0) {
      const last = progressDocs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      if (last) {
        const lessonDoc = await db.collection('lessons').doc(last.lessonId).get().catch(() => null);
        const unitDoc = last.unitId ? await db.collection('units').doc(last.unitId).get().catch(() => null) : null;
        continueLearning = {
          unitName: (unitDoc?.data() as { nameAr?: string; name?: string })?.nameAr ?? 'الوحدة',
          lessonName: (lessonDoc?.data() as { title?: string })?.title ?? 'الدرس',
          progress: last.percentage ?? 0,
          lessonId: last.lessonId,
        };
      }
    }

    const recentActivity = progressDocs
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 20)
      .map((p) => ({
        id: p.lessonId,
        type: p.status === 'completed' ? 'lesson_completed' : 'lesson_started',
        description: p.status === 'completed' ? 'تم إكمال درس' : 'تم بدء درس',
        createdAt: p.completedAt ?? p.updatedAt,
      }));

    const sessionIds = bookingsSnap.docs.map((d) => (d.data() as { liveSessionId: string }).liveSessionId);
    const sessionDocs = await Promise.all(
      sessionIds.map((sid) => db.collection('liveSessions').doc(sid).get().catch(() => null))
    );
    const upcomingLiveClasses = sessionDocs
      .filter((s): s is FirebaseFirestore.DocumentSnapshot => s !== null && s.exists)
      .map((s) => {
        const data = s.data() as { title: string; scheduledAt: string; teacherId: string; status: string };
        return {
          id: s.id,
          title: data.title ?? 'حصة مباشرة',
          date: data.scheduledAt ?? new Date().toISOString(),
          teacherName: 'المعلم',
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: studentId,
          fullName: (userData as Record<string, unknown>).fullName as string ?? 'User',
          role: (userData as Record<string, unknown>).role as string ?? 'student',
        },
        xp: {
          total: xpData?.totalXp ?? 0,
          level: xpData?.level ?? 1,
          nextLevelXp: (xpData?.level ?? 1) * 1000,
        },
        coins: walletData?.balance ?? 0,
        achievements: achievementsSnap.size,
        streak: statsData?.attendanceRate ?? 0,
        continueLearning,
        recentActivity,
        upcomingLiveClasses,
        stats: {
          completedLessons,
          totalLessons: progressDocs.length,
          homeworkPending: 0,
          quizPassRate: statsData?.averageQuizScore ?? 0,
          attendanceRate: statsData?.attendanceRate ?? 0,
        },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }
}
