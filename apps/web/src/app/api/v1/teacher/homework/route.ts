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

    const db = getAdminDb();
    const homeworkSnap = await db.collection('homework')
      .where('deletedAt', '==', null)
      .limit(100)
      .get();

    const homeworkList = [];
    for (const doc of homeworkSnap.docs) {
      const hw = doc.data() as Record<string, unknown>;
      if (gradeId && hw.gradeId !== gradeId) continue;

      const lessonId = hw.lessonId as string;
      let lessonTitle = '';
      if (lessonId) {
        const lessonDoc = await db.collection('lessons').doc(lessonId).get().catch(() => null);
        if (lessonDoc?.exists) {
          lessonTitle = (lessonDoc.data() as Record<string, unknown>)?.title as string ?? '';
        }
      }

      homeworkList.push({
        id: doc.id,
        lessonId,
        lessonTitle,
        title: hw.title as string ?? '',
        published: hw.published ?? false,
        passingScore: hw.passingScore ?? 50,
        maxAttempts: hw.maxAttempts ?? 3,
        unlimitedAttempts: hw.unlimitedAttempts ?? false,
        xpReward: hw.xpReward ?? 10,
        createdAt: (hw.createdAt as string) ?? '',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        items: homeworkList,
        total: homeworkList.length,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to load homework' } }, { status: 500 });
  }
}
