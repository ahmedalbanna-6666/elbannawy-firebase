import { NextRequest, NextResponse } from 'next/server';
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
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 200);

    const db = getAdminDb();

    const xpSnap = await db.collection('xpAccounts')
      .orderBy('totalXp', 'desc')
      .limit(limit)
      .get();

    const userIds = xpSnap.docs.map((d) => d.id);

    const userDocs = await Promise.all(
      userIds.map((id) => db.collection('users').doc(id).get().catch(() => null)),
    );

    const students = [];
    for (let i = 0; i < xpSnap.docs.length; i++) {
      const xpDoc = xpSnap.docs[i];
      const xp = xpDoc.data() as { totalXp: number; level: number };
      const userDoc = userDocs[i];
      if (!userDoc?.exists) continue;
      const user = userDoc.data() as Record<string, unknown>;

      if (gradeId && user.gradeId !== gradeId) continue;

      students.push({
        id: xpDoc.id,
        fullName: (user.fullName as string) ?? 'طالب',
        mobileNumber: (user.mobileNumber as string) ?? null,
        gradeId: (user.gradeId as string) ?? null,
        xp: xp.totalXp,
        level: xp.level ?? 1,
        rank: students.length + 1,
      });
    }

    const total = students.length;
    const avgXp = total > 0 ? Math.round(students.reduce((s, st) => s + st.xp, 0) / total) : 0;

    return NextResponse.json({
      success: true,
      data: {
        students,
        stats: { total, avgXp },
        gradeId,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to load leaderboard' } }, { status: 500 });
  }
}
