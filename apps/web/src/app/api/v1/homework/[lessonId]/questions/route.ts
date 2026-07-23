import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { HomeworkService } from '@el-bannawy/lib';

const homeworkService = new HomeworkService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    const token = authHeader.slice(7);
    await getAdminAuth().verifyIdToken(token);
    const { lessonId } = await params;

    const result = await homeworkService.getQuestions(lessonId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    return NextResponse.json({ success: true, data: { questions: result.value } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
}
