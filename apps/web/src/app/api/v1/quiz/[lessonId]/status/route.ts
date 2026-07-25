import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { QuizService } from '@el-bannawy/lib';

const s = new QuizService();
export async function GET(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }): Promise<NextResponse> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  let uid: string;
  try { const d = await getAdminAuth().verifyIdToken(auth.slice(7)); uid = d.uid; } catch { return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 }); }
  try {
    const r = await s.getQuiz((await params).lessonId);
    if (!r.ok || !r.value) return NextResponse.json({ success: true, data: { hasQuiz: false, latestAttempt: null, totalAttempts: 0 } });
    const [attempts, count] = await Promise.all([s['attemptRepo'].listByStudentAndQuiz(uid, r.value.id), s['attemptRepo'].countByStudentAndQuiz(uid, r.value.id)]);
    return NextResponse.json({ success: true, data: { hasQuiz: true, latestAttempt: attempts.ok && attempts.value.length > 0 ? (attempts.value[0] ?? null) : null, totalAttempts: count.ok ? count.value : 0 } });
  } catch { return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 }); }
}
