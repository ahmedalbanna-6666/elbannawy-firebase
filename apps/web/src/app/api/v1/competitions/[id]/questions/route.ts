import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { CompetitionRepository } from '@el-bannawy/lib';

const competitionRepo = new CompetitionRepository();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const competition = await competitionRepo.getById(id);
    if (!competition.ok || !competition.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Competition not found' } }, { status: 404 });
    }

    const result = await competitionRepo.listQuestions(id);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    const questions = result.value.map((q) => {
      const { correctAnswer, ...safe } = q as unknown as Record<string, unknown>;
      return safe;
    });

    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
