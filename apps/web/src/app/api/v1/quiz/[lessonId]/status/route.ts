import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { QuizService } from '@el-bannawy/lib';

const s = new QuizService();
export async function GET(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }): Promise<NextResponse> {
  try {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    const d = await getAdminAuth().verifyIdToken(auth.slice(7));
    const r = await s.getQuiz((await params).lessonId);
    if (!r.ok || !r.value) return NextResponse.json({ success: true, data: { hasQuiz: false, latestAttempt: null, totalAttempts: 0 } });
    const [attempts, count] = await Promise.all([s['attemptRepo'].listByStudentAndQuiz(d.uid, r.value.id), s['attemptRepo'].countByStudentAndQuiz(d.uid, r.value.id)]);
    return NextResponse.json({ success: true, data: { hasQuiz: true, latestAttempt: attempts.ok && attempts.value.length > 0 ? (attempts.value[0] ?? null) : null, totalAttempts: count.ok ? count.value : 0 } });
  } catch { return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }); }
}
