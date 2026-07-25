import { NextRequest, NextResponse } from 'next/server';
import { LessonService, LessonApplicationService, UnitService, UserService, NotificationDispatcher, GRADES } from '@el-bannawy/lib';

const lessonService = new LessonService();
const applicationService = new LessonApplicationService(lessonService);
const unitService = new UnitService();
const userService = new UserService();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const requestId = `publish-${id}-${String(Date.now())}`;

  try {
    const result = await applicationService.publishLesson(id, requestId);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: 400 },
      );
    }

    const lesson = result.value;

    Promise.resolve().then(async () => {
      try {
        const unitResult = await unitService.getUnitById(lesson.unitId);
        if (!unitResult.ok || !unitResult.value.gradeId) return;

        const gradeId = unitResult.value.gradeId;
        const grade = GRADES.find((g) => g.id === gradeId);
        const gradeName = grade?.nameAr ?? gradeId;

        const studentsResult = await userService.listUsers(
          { gradeId, role: ['student'], isActive: true },
          { limit: 1000 },
        );

        if (studentsResult.ok && studentsResult.value.items.length > 0) {
          const studentIds = studentsResult.value.items.map((s) => s.id);
          const dispatcher = new NotificationDispatcher();
          await dispatcher.newLessonAdded(studentIds, lesson.title, gradeName);
        }
      } catch {
        console.error('[Notification] Failed to dispatch new lesson notification');
      }
    });

    return NextResponse.json(
      { success: true, data: result.value, timestamp: new Date().toISOString() },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
