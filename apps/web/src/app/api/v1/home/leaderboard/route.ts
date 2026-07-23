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
    const limit = 20;

    const xpSnap = await db.collection('xpAccounts')
      .orderBy('totalXp', 'desc')
      .limit(limit)
      .get();

    const userIds = xpSnap.docs.map((d) => d.id);

    const userDocs = await Promise.all(
      userIds.map((id) => db.collection('users').doc(id).get().catch(() => null))
    );

    const userMap = new Map<string, Record<string, unknown>>();
    for (const doc of userDocs) {
      if (doc?.exists) userMap.set(doc.id, doc.data() as Record<string, unknown>);
    }

    const top = xpSnap.docs.map((doc, index) => {
      const xp = doc.data() as { totalXp: number; level: number };
      const user = userMap.get(doc.id);
      return {
        id: doc.id,
        fullName: (user?.fullName as string) ?? 'طالب',
        avatarUrl: null,
        xp: xp.totalXp,
        level: xp.level,
        coins: 0,
        rank: index + 1,
      };
    });

    const myRank = top.find((e) => e.id === decoded.uid) ?? null;

    return NextResponse.json({
      success: true,
      data: {
        scope: { gradeId: null, academicYearId: null, termId: null, educationalSystem: null },
        top,
        me: myRank ? { ...myRank, total: top.length } : null,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }
}
