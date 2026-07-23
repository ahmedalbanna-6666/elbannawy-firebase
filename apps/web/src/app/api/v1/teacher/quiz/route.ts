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
    const quizSnap = await db.collection('quizzes')
      .where('deletedAt', '==', null)
      .limit(100)
      .get();

    const quizList = [];
    for (const doc of quizSnap.docs) {
      const q = doc.data() as Record<string, unknown>;
      if (gradeId && q.gradeId !== gradeId) continue;

      const lessonId = q.lessonId as string;
      let lessonTitle = '';
      if (lessonId) {
        const lessonDoc = await db.collection('lessons').doc(lessonId).get().catch(() => null);
        if (lessonDoc?.exists) {
          lessonTitle = (lessonDoc.data() as Record<string, unknown>)?.title as string ?? '';
        }
      }

      quizList.push({
        id: doc.id,
        lessonId,
        lessonTitle,
        title: q.title as string ?? '',
        published: q.published ?? false,
        passingScore: q.passingScore ?? 50,
        maxAttempts: q.maxAttempts ?? 3,
        unlimitedAttempts: q.unlimitedAttempts ?? false,
        xpReward: q.xpReward ?? 10,
        requiredForCompletion: q.requiredForCompletion ?? true,
        createdAt: (q.createdAt as string) ?? '',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        items: quizList,
        total: quizList.length,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to load quizzes' } }, { status: 500 });
  }
}
