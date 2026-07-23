import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { QuizService } from '@el-bannawy/lib';

const s = new QuizService();
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }): Promise<NextResponse> {
  try {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    const d = await getAdminAuth().verifyIdToken(auth.slice(7));
    const body = await request.json() as { answers?: Record<string, unknown>[] };
    const r = await s.saveProgress(d.uid, (await params).lessonId, body.answers ?? []);
    if (!r.ok) return NextResponse.json({ success: false, error: r.error }, { status: 404 });
    return NextResponse.json({ success: true, data: null });
  } catch { return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }); }
}
