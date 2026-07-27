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
    const mistakesSnap = await db.collection('mistakes').where('studentId', '==', decoded.uid).select('unitId', 'lessonId', 'sourceType').get();

    const unitIds = new Set<string>();
    const lessonIds = new Set<string>();
    const sources = new Set<string>();

    for (const doc of mistakesSnap.docs) {
      const d = doc.data();
      if (d.unitId) unitIds.add(d.unitId);
      if (d.lessonId) lessonIds.add(d.lessonId);
      if (d.sourceType) sources.add(d.sourceType);
    }

    const units = unitIds.size > 0
      ? (await Promise.all([...unitIds].map((id) => db.collection('units').doc(id).get().catch(() => null))))
          .filter((s): s is FirebaseFirestore.DocumentSnapshot => s !== null && s.exists)
          .map((s) => ({ id: s.id, title: s.data()?.nameAr ?? s.data()?.title ?? s.id }))
      : [];

    const lessons = lessonIds.size > 0
      ? (await Promise.all([...lessonIds].map((id) => db.collection('lessons').doc(id).get().catch(() => null))))
          .filter((s): s is FirebaseFirestore.DocumentSnapshot => s !== null && s.exists)
          .map((s) => ({ id: s.id, title: s.data()?.title ?? s.id }))
      : [];

    return NextResponse.json({
      success: true,
      data: {
        units,
        lessons,
        stories: [],
        chapters: [],
        sources: [...sources],
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }
}
