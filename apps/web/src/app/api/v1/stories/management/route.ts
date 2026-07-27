import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest, normalizeRole } from '@/lib/firebase/auth-helper';
import { StoryRepository } from '@el-bannawy/lib';

const storyRepo = new StoryRepository();

async function isAdminOrTeacher(uid: string): Promise<boolean> {
  try {
    const db = getAdminDb();
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) return false;
    const data = doc.data()!;
    const roleVal = (data as Record<string, unknown>).role;
    let rawRole: string;
    if (typeof roleVal === 'string') rawRole = roleVal;
    else if (roleVal && typeof roleVal === 'object') rawRole = (roleVal as Record<string, unknown>).role as string || '';
    else return false;
    const normalized = normalizeRole(rawRole);
    return normalized === 'administrator' || normalized === 'teacher';
  } catch { return false; }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }
    if (!(await isAdminOrTeacher(decoded.uid))) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = {};
    if (searchParams.get('gradeId')) filter.gradeId = searchParams.get('gradeId');
    if (searchParams.get('published') !== null) filter.published = searchParams.get('published') === 'true';
    const result = await storyRepo.list(filter as { gradeId?: string; published?: boolean });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
