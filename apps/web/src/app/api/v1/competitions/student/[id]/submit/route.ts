import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { CompetitionRepository } from '@el-bannawy/lib';

const competitionRepo = new CompetitionRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const competition = await competitionRepo.getById(id);
    if (!competition.ok || !competition.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Competition not found' } }, { status: 404 });
    }
    if (competition.value.status !== 'OPEN') {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'Competition is not open' } }, { status: 412 });
    }

    const participant = await competitionRepo.getParticipant(id, decoded.uid);
    if (!participant.ok || !participant.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'You are not a participant' } }, { status: 404 });
    }
    if (participant.value.status !== 'ACCEPTED') {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'You have not accepted the invitation' } }, { status: 412 });
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const answers = body.answers as Record<string, string>;
    if (!answers) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'answers are required' } }, { status: 400 });
    }

    const questions = await competitionRepo.listQuestions(id);
    if (!questions.ok || !questions.value.length) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'No questions found' } }, { status: 404 });
    }

    let score = 0;
    let maxScore = 0;
    for (const q of questions.value) {
      maxScore += q.points;
      if (answers[q.id] && answers[q.id] === q.correctAnswer) {
        score += q.points;
      }
    }

    const now = new Date().toISOString();
    const attempt = {
      id: `catt_${id}_${decoded.uid}_${Date.now()}`,
      competitionId: id,
      studentId: decoded.uid,
      answers,
      score,
      maxScore,
      passed: score >= maxScore * 0.5,
      startedAt: body.startedAt as string || now,
      submittedAt: now,
      timeSpentSeconds: body.timeSpentSeconds as number | undefined,
      createdAt: now,
      updatedAt: now,
    };

    const attemptResult = await competitionRepo.createAttempt(attempt as any);
    if (!attemptResult.ok) {
      return NextResponse.json({ success: false, error: attemptResult.error }, { status: 500 });
    }

    await competitionRepo.updateParticipant(participant.value.id, {
      status: 'SUBMITTED',
      score,
      submittedAt: now,
    });

    return NextResponse.json({ success: true, data: { attempt: attemptResult.value, score, maxScore } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
