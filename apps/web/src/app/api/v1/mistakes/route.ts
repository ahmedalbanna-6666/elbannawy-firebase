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
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') ?? 'all';
    const source = searchParams.get('source');
    const unitIds = searchParams.getAll('unitIds');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    let query: FirebaseFirestore.Query = db.collection('mistakes').where('studentId', '==', decoded.uid);

    if (source) query = query.where('sourceType', '==', source);
    if (scope === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.where('firstIncorrectAt', '>=', today.toISOString());
    }
    if (unitIds.length > 0) query = query.where('unitId', 'in', unitIds);

    const totalSnap = await query.count().get();
    const total = totalSnap.data().count;

    const snap = await query.orderBy('firstIncorrectAt', 'desc').offset((page - 1) * limit).limit(limit).select('questionId', 'sourceType', 'questionSnapshot', 'correctAnswerSnapshot', 'studentAnswer', 'explanationSnapshot', 'firstIncorrectAt', 'sourceId', 'unitId', 'lessonId').get();

    const items = snap.docs.map((d) => {
      const data = d.data();
      return {
        questionId: data.questionId,
        source: data.sourceType,
        question: data.questionSnapshot?.prompt ?? '',
        options: data.questionSnapshot?.options ?? [],
        correctAnswer: data.correctAnswerSnapshot?.answer ?? '',
        studentAnswer: data.studentAnswer?.answer ?? null,
        explanation: data.explanationSnapshot ?? null,
        answeredAt: data.firstIncorrectAt,
        attemptId: data.sourceId,
        unitId: data.unitId ?? null,
        lessonId: data.lessonId ?? null,
        storyId: null,
        chapterId: null,
        unitTitle: null,
        lessonTitle: null,
        storyTitle: null,
        chapterTitle: null,
        termId: null,
      };
    });

    return NextResponse.json({
      success: true,
      data: { items, total, page, limit, sourceCounts: {} },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }
}
