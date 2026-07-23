import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';
import { LiveRepository } from '@el-bannawy/lib';

const liveRepo = new LiveRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const role = (userDoc.data() as { role?: string })?.role ?? 'student';
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Only teachers and admins can publish sessions' } }, { status: 403 });
    }

    const { id } = await params;

    const result = await liveRepo.updateSession(id, {
      status: 'PUBLISHED' as any,
      publishedAt: new Date().toISOString(),
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
