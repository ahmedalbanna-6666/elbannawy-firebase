import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { LessonProgressRepository } from '@el-bannawy/lib';

const progressRepo = new LessonProgressRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const lessonId = (await params).id;
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const studentId = decoded.uid;

    const existing = await progressRepo.getStudentLessonProgress(studentId, lessonId);
    if (existing.ok && existing.value) {
      await progressRepo.updateProgress(existing.value.id, { status: 'completed', completedAt: new Date().toISOString() });
    } else {
      await progressRepo.createProgress({ id: 'progress-' + studentId + '-' + lessonId, studentId, lessonId, unitId: '', totalActivities: 0 });
    }

    return NextResponse.json({ success: true, data: { lessonId, completed: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Failed to complete lesson' } }, { status: 500 });
  }
}
