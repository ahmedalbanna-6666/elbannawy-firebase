import { NextRequest, NextResponse } from 'next/server';
import { LessonService, LessonApplicationService, NotificationDispatcher, GRADES } from '@el-bannawy/lib';
import { getAdminDb } from '@/lib/firebase/admin';

const lessonService = new LessonService();
const applicationService = new LessonApplicationService(lessonService);
const dispatcher = new NotificationDispatcher();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const requestId = 'publish-' + id + '-' + String(Date.now());
  try {
    const result = await applicationService.publishLesson(id, requestId);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });

    try {
      const lesson = result.value;
      if (lesson && (lesson as any).gradeId) {
        const db = getAdminDb();
        const gradeId = (lesson as any).gradeId;
        const grade = GRADES.find((g) => g.id === gradeId);
        const gradeName = grade?.name ?? '';
        const studentSnap = await db.collection('users').where('gradeId', '==', gradeId).where('role', '==', 'student').get();
        const studentIds = studentSnap.docs.map((d) => d.id);
        if (studentIds.length > 0) {
          await dispatcher.newLessonAdded(studentIds, (lesson as any).title || 'درس جديد', gradeName);
        }
      }
    } catch {
    }

    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
