import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { QuizService, QuizQuestionRepository } from '@el-bannawy/lib';

const s = new QuizService();
const qRepo = new QuizQuestionRepository();

export async function GET(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }): Promise<NextResponse> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  try { await getAdminAuth().verifyIdToken(auth.slice(7)); } catch { return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }); }
  try {
    const r = await s.getQuiz((await params).lessonId);
    if (!r.ok || !r.value) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Quiz not found' } }, { status: 404 });
    const quiz = r.value;
    const questionsResult = await qRepo.listByQuiz(quiz.id);
    const questionCount = questionsResult.ok ? questionsResult.value.length : 0;
    return NextResponse.json({ success: true, data: { ...quiz, _count: { questions: questionCount } } });
  } catch { return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 }); }
}
