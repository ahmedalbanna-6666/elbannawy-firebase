import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { FinalReviewRepository } from '@el-bannawy/lib';

const reviewRepo = new FinalReviewRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    let body: { answers?: Array<{ questionId: string; answer: string }> };
    try {
      body = await request.json() as { answers?: Array<{ questionId: string; answer: string }> };
    } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const { id: finalReviewId, attemptId } = await params;

    const attemptResult = await reviewRepo.getAttempt(attemptId);
    if (!attemptResult.ok) {
      return NextResponse.json({ success: false, error: attemptResult.error }, { status: 500 });
    }
    if (!attemptResult.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Attempt not found' } }, { status: 404 });
    }
    if (attemptResult.value.studentId !== decoded.uid) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your attempt' } }, { status: 403 });
    }
    if (attemptResult.value.status !== 'in_progress') {
      return NextResponse.json({ success: false, error: { code: 'CONFLICT', message: 'Attempt already submitted' } }, { status: 409 });
    }

    const answers = body.answers ?? [];
    let totalScore = 0;
    let maxScore = attemptResult.value.maxScore;

    const answerResults: Array<Record<string, unknown>> = [];

    for (const ans of answers) {
      const answerId = crypto.randomUUID();

      const questionSnap = await reviewRepo.listQuestions(finalReviewId, undefined);
      const question = questionSnap.ok
        ? questionSnap.value.find((q) => q.id === ans.questionId)
        : undefined;

      const isCorrect = question
        ? question.correctAnswer?.toLowerCase() === ans.answer.toLowerCase()
        : false;
      const score = isCorrect ? (question?.points ?? 0) : 0;
      totalScore += score;

      const answerEntry = {
        id: answerId,
        attemptId,
        studentId: decoded.uid,
        finalReviewId,
        questionId: ans.questionId,
        answer: ans.answer,
        isCorrect,
        score,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const createResult = await reviewRepo.createAnswer(answerEntry);
      if (createResult.ok) {
        answerResults.push(createResult.value as unknown as Record<string, unknown>);
      }
    }

    const now = new Date();
    const startedAt = new Date(attemptResult.value.startedAt).getTime();
    const timeSpentSeconds = Math.round((now.getTime() - startedAt) / 1000);

    const updateResult = await reviewRepo.updateAttempt(attemptId, {
      status: 'submitted',
      score: totalScore,
      maxScore,
      passed: totalScore >= maxScore * 0.5,
      submittedAt: now.toISOString(),
      gradedAt: now.toISOString(),
      timeSpentSeconds,
    });

    if (!updateResult.ok) {
      return NextResponse.json({ success: false, error: updateResult.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        attempt: updateResult.value,
        answers: answerResults,
        summary: {
          totalScore,
          maxScore,
          passed: totalScore >= maxScore * 0.5,
          answeredCount: answers.length,
          correctCount: answerResults.filter((a) => a.isCorrect).length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
