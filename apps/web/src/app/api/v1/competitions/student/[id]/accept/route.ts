import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { CompetitionRepository } from '@el-bannawy/lib';

const competitionRepo = new CompetitionRepository();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const participant = await competitionRepo.getParticipant(id, decoded.uid);
    if (!participant.ok || !participant.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Invitation not found' } }, { status: 404 });
    }
    if (participant.value.status !== 'INVITED') {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'Invitation is not pending' } }, { status: 412 });
    }

    const now = new Date().toISOString();
    const result = await competitionRepo.updateParticipant(participant.value.id, {
      status: 'ACCEPTED',
      acceptedAt: now,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
