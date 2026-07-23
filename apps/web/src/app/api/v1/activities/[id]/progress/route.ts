import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { ActivityRepository } from '@el-bannawy/lib';

const activityRepo = new ActivityRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const { id } = await params;

    const activityResult = await activityRepo.getActivityById(id);
    if (!activityResult.ok || !activityResult.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Activity not found' } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        activityId: id,
        studentId: decoded.uid,
        status: 'not_started',
        score: null,
        attemptCount: 0,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
}
