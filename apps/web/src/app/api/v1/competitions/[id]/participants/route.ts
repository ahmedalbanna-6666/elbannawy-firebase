import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { CompetitionRepository, UserService } from '@el-bannawy/lib';

const competitionRepo = new CompetitionRepository();
const userService = new UserService();

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

    const result = await competitionRepo.listParticipants(id);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

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
    if (competition.value.teacherId !== decoded.uid) {
      const caller = await userService.getUserById(decoded.uid);
      if (!caller.ok || caller.value.role !== 'administrator') {
        return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your competition' } }, { status: 403 });
      }
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const studentIds = body.studentIds as string[] || [body.studentId as string].filter(Boolean);
    if (!studentIds.length) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'studentIds or studentId is required' } }, { status: 400 });
    }

    const now = new Date().toISOString();
    const created: Record<string, unknown>[] = [];

    for (const studentId of studentIds) {
      const participant = {
        id: `part_${id}_${studentId}`,
        competitionId: id,
        studentId,
        score: 0,
        status: 'INVITED',
        invitedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      const pResult = await competitionRepo.createParticipant(participant as any);
      if (pResult.ok) created.push(pResult.value as unknown as Record<string, unknown>);
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
