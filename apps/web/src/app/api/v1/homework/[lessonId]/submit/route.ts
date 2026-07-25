import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { HomeworkService } from '@el-bannawy/lib';

const homeworkService = new HomeworkService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
): Promise<NextResponse> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  let decoded: { uid: string };
  try {
    const token = authHeader.slice(7);
    decoded = await getAdminAuth().verifyIdToken(token);
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
  const { lessonId } = await params;

  try {
    const body = (await request.json()) as { answers?: Record<string, unknown>[]; timeSpentSeconds?: number };
    const result = await homeworkService.submitHomework(decoded.uid, lessonId, body.answers ?? [], body.timeSpentSeconds);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.error.code === 'FORBIDDEN' ? 403 : 404 });
    return NextResponse.json({ success: true, data: result.value });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } }, { status: 500 });
  }
}
