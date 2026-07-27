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

    const [userAchievementsSnap, achievementsSnap] = await Promise.all([
      db.collection('userAchievements').where('studentId', '==', decoded.uid).select('achievementId', 'studentId', 'earnedAt').get(),
      db.collection('achievements').where('active', '==', true).get(),
    ]);

    const achievementMap = new Map<string, Record<string, unknown>>();
    for (const doc of achievementsSnap.docs) {
      achievementMap.set(doc.id, doc.data());
    }

    const achievements = userAchievementsSnap.docs.map((doc) => {
      const data = doc.data();
      const achievementDef = achievementMap.get(data.achievementId) ?? {};
      return {
        id: doc.id,
        userId: data.studentId,
        type: (achievementDef as Record<string, unknown>).code as string ?? 'achievement',
        title: (achievementDef as Record<string, unknown>).title as string ?? 'إنجاز',
        description: (achievementDef as Record<string, unknown>).description as string | null ?? null,
        icon: (achievementDef as Record<string, unknown>).iconPath as string | null ?? null,
        earnedAt: data.earnedAt,
      };
    });

    return NextResponse.json({ success: true, data: achievements });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }
}
