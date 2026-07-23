import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { QuizService } from '@el-bannawy/lib';

const s = new QuizService();
export async function GET(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }): Promise<NextResponse> {
  try {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    await getAdminAuth().verifyIdToken(auth.slice(7));
    const r = await s.getQuiz((await params).lessonId);
    if (!r.ok || !r.value) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Quiz not found' } }, { status: 404 });
    return NextResponse.json({ success: true, data: r.value });
  } catch { return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }); }
}
