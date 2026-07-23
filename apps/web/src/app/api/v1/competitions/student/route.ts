import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';
import { CompetitionRepository } from '@el-bannawy/lib';

const competitionRepo = new CompetitionRepository();

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

    const filter: Record<string, unknown> = { status: 'OPEN' };
    const gradeId = await getUserGradeId(decoded.uid);
    if (gradeId) filter.gradeId = gradeId;

    const result = await competitionRepo.list(filter as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
