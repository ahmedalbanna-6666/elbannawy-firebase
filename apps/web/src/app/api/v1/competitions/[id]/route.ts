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

    const result = await competitionRepo.getById(id);
    if (!result.ok || !result.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Competition not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const existing = await competitionRepo.getById(id);
    if (!existing.ok || !existing.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Competition not found' } }, { status: 404 });
    }
    if (existing.value.teacherId !== decoded.uid) {
      const caller = await userService.getUserById(decoded.uid);
      if (!caller.ok || caller.value.role !== 'administrator') {
        return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your competition' } }, { status: 403 });
      }
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const result = await competitionRepo.update(id, body as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
