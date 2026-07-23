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

    const [coursesSnapshot, progressSnapshot] = await Promise.all([
      db.collection('educationalSystems').limit(10).get(),
      db.collection('lessonProgress').where('userId', '==', decoded.uid).limit(10).get(),
    ]);

    const courses = coursesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const recentActivity = progressSnapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        lessonId: data.lessonId,
        status: data.status,
        completedAt: data.completedAt ?? null,
        score: data.score ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        courses: { items: courses, nextCursor: null },
        recentActivity,
        stats: {
          totalLessonsCompleted: progressSnapshot.docs.filter((d) => d.data().status === 'completed').length,
          totalQuizzesPassed: 0,
          currentStreak: 0,
          totalXp: 0,
        },
        continueLearning: [],
        announcements: [],
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }
}
