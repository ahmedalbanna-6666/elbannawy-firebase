import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { StoryRepository } from '@el-bannawy/lib';

const storyRepo = new StoryRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.data() as Record<string, unknown> | undefined;
    const role = userData?.role as string | undefined;

    if (role !== 'admin' && role !== 'teacher') {
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
