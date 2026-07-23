import { NextResponse, type NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('gradeId');
    const db = getAdminDb();

    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.data() as Record<string, unknown> | undefined;
    const role = userData
      ? typeof userData.role === 'object'
        ? (userData.role as Record<string, unknown>)?.role
        : userData.role
      : null;

    if (role !== 'teacher' && role !== 'administrator') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Teachers only' } }, { status: 403 });
    }

    let totalStudents = 0;
    let totalUnits = 0;
    let totalLessons = 0;
    let activeStudents = 0;

    if (gradeId) {
      const studentsSnap = await db.collection('users')
        .where('gradeId', '==', gradeId)
        .where('deletedAt', '==', null)
        .get();
      totalStudents = studentsSnap.size;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      activeStudents = studentsSnap.docs.filter((d) => {
        const u = d.data() as Record<string, unknown>;
        const lastActive = u.lastActiveAt as string | undefined;
        return lastActive && lastActive >= thirtyDaysAgo;
      }).length;

      const unitsSnap = await db.collection('units')
        .where('gradeId', '==', gradeId)
        .where('deletedAt', '==', null)
        .get();
      totalUnits = unitsSnap.size;

      const lessonIds: string[] = [];
      unitsSnap.docs.forEach((d) => {
        const unit = d.data() as { lessonIds?: string[] };
        if (unit.lessonIds) lessonIds.push(...unit.lessonIds);
      });
      totalLessons = lessonIds.length;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        totalUnits,
        totalLessons,
        gradeId,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to load stats' } }, { status: 500 });
  }
}
