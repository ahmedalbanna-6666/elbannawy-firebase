import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { QuizService } from '@el-bannawy/lib';

const s = new QuizService();
export async function GET(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }): Promise<NextResponse> {
  try {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    const d = await getAdminAuth().verifyIdToken(auth.slice(7));
    const r = await s.getHistory(d.uid, (await params).lessonId);
    return NextResponse.json({ success: true, data: { attempts: r.ok ? r.value : [] } });
  } catch { return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }); }
}
