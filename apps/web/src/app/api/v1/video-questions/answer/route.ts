import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const body: { questionId?: string; answer?: unknown; correct?: boolean } = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const now = new Date().toISOString();
    await db.collection('videoQuestionAnswers').add({
      userId: decoded.uid,
      questionId: body.questionId ?? '',
      answer: body.answer ?? null,
      correct: body.correct ?? false,
      createdAt: now,
    });
    return NextResponse.json({ success: true, data: { correct: body.correct ?? false } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to submit answer' } }, { status: 500 });
  }
}
