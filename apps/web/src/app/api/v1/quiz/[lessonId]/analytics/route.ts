import { NextRequest, NextResponse } from 'next/server';
import { QuizService } from '@el-bannawy/lib';

const s = new QuizService();
export async function GET(_request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }): Promise<NextResponse> {
  const { lessonId } = await params;
  try {
    const quiz = await s.getQuiz(lessonId);
    if (!quiz.ok || !quiz.value) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Quiz not found' } }, { status: 404 });
    return NextResponse.json({ success: true, data: { id: quiz.value.id, title: quiz.value.title, passingScore: quiz.value.passingScore, requiredForCompletion: quiz.value.requiredForCompletion, totalQuestions: 0, averageScore: 0, totalAttempts: 0, passRate: 0 } });
  } catch (error) { return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 }); }
}
