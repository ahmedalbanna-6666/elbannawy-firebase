import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';
import { CompetitionRepository, UserService } from '@el-bannawy/lib';

const competitionRepo = new CompetitionRepository();
const userService = new UserService();

async function getUserGradeId(uid: string): Promise<string | null> {
  try {
    const doc = await getAdminDb().collection('users').doc(uid).get();
    if (!doc.exists) return null;
    return (doc.data() as Record<string, unknown>)?.gradeId as string ?? null;
  } catch { return null; }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const caller = await userService.getUserById(decoded.uid);
    if (!caller.ok) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } }, { status: 401 });
    }

    const filter: Record<string, unknown> = {};
    if (caller.value.role === 'student') {
      filter.status = 'OPEN';
      const gradeId = await getUserGradeId(decoded.uid);
      if (gradeId) filter.gradeId = gradeId;
    } else if (caller.value.role === 'teacher') {
      filter.teacherId = decoded.uid;
    }

    const result = await competitionRepo.list(filter as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const caller = await userService.getUserById(decoded.uid);
    if (!caller.ok || (caller.value.role !== 'teacher' && caller.value.role !== 'administrator')) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Teachers only' } }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const now = new Date().toISOString();
    const competition = {
      id: body.id as string || `comp_${Date.now()}`,
      title: body.title as string,
      description: body.description as string | undefined,
      mode: (body.mode as string) || 'QUIZ',
      gradeId: body.gradeId as string,
      academicYearId: body.academicYearId as string,
      termId: body.termId as string,
      teacherId: decoded.uid,
      status: 'DRAFT',
      startsAt: body.startsAt as string | undefined,
      endsAt: body.endsAt as string | undefined,
      xpReward: (body.xpReward as number) || 0,
      coinReward: (body.coinReward as number) || 0,
      maxParticipants: body.maxParticipants as number | undefined,
      published: false,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };

    const result = await competitionRepo.create(competition as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
