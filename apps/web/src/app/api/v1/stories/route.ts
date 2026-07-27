import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest, normalizeRole } from '@/lib/firebase/auth-helper';
import { StoryRepository } from '@el-bannawy/lib';

const storyRepo = new StoryRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.data() as Record<string, unknown> | undefined;
    const role = userData?.role as string | undefined;
    const gradeId = userData?.gradeId as string | undefined;

    if (role === 'student') {
      if (!gradeId) {
        return NextResponse.json({ success: true, data: [] });
      }
      const result = await storyRepo.list({ gradeId, published: true });
      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: result.value });
    }

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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
    const data = userDoc.data()!;
    const roleVal = (data as Record<string, unknown>).role;
    let rawRole: string;
    if (typeof roleVal === 'string') rawRole = roleVal;
    else if (roleVal && typeof roleVal === 'object') rawRole = (roleVal as Record<string, unknown>).role as string || '';
    else return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
    const normalized = normalizeRole(rawRole);
    if (normalized !== 'administrator' && normalized !== 'teacher') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const result = await storyRepo.create({ ...body, id } as Partial<import('@el-bannawy/lib').IStory>);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
