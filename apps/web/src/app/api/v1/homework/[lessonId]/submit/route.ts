import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { HomeworkService } from '@el-bannawy/lib';

const homeworkService = new HomeworkService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const { lessonId } = await params;

    const body = (await request.json()) as { answers?: Record<string, unknown>[]; timeSpentSeconds?: number };
    const result = await homeworkService.submitHomework(decoded.uid, lessonId, body.answers ?? [], body.timeSpentSeconds);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.error.code === 'FORBIDDEN' ? 403 : 404 });
    return NextResponse.json({ success: true, data: result.value });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
}
