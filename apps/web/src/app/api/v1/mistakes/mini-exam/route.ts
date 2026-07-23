import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { searchParams, pathname } = new URL(request.url);
    if (pathname.endsWith('/history')) {
      const db = getAdminDb();
      const snap = await db.collection('mistakeReviews')
        .where('studentId', '==', decoded.uid)
        .orderBy('reviewedAt', 'desc')
        .limit(50)
        .get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ success: true, data: { items, total: snap.size } });
    }

    const examId = searchParams.get('examId');
    if (!examId) {
      return NextResponse.json({ success: true, data: null });
    }

    const db = getAdminDb();
    const examDoc = await db.collection('mistakeReviews').doc(examId).get();
    if (!examDoc.exists) {
      return NextResponse.json({ success: true, data: null });
    }
    return NextResponse.json({ success: true, data: { id: examDoc.id, ...examDoc.data() } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { questionCount = 10, durationMinutes = 10 } = body;

    const db = getAdminDb();
    let mistakesQuery: FirebaseFirestore.Query = db.collection('mistakes')
      .where('studentId', '==', decoded.uid)
      .where('status', '==', 'ACTIVE');

    const unitIds = body.unitIds as string[] | undefined;
    if (unitIds && unitIds.length > 0) {
      mistakesQuery = mistakesQuery.where('unitId', 'in', unitIds);
    }
    const source = body.source as string | undefined;
    if (source) {
      mistakesQuery = mistakesQuery.where('sourceType', '==', source);
    }

    const snap = await mistakesQuery.limit(Math.min(questionCount as number, 50)).get();
    const questions = snap.docs.map((d) => {
      const data = d.data();
      return {
        questionId: data.questionId,
        source: data.sourceType,
        question: data.questionSnapshot?.prompt ?? '',
        options: data.questionSnapshot?.options ?? [],
        explanation: data.explanationSnapshot ?? null,
      };
    });

    const exam = {
      id: `mini_${decoded.uid}_${Date.now()}`,
      studentId: decoded.uid,
      questionCount: questions.length,
      durationMinutes,
      poolSize: snap.size,
      status: 'in_progress',
      score: null,
      maxScore: null,
      passed: null,
      createdAt: new Date().toISOString(),
      submittedAt: null,
      questions,
    };

    await db.collection('mistakeReviews').doc(exam.id).set(exam);

    return NextResponse.json({ success: true, data: exam }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }
}
