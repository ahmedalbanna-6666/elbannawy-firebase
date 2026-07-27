import { NextRequest, NextResponse } from 'next/server';
import { LessonService, LessonApplicationService } from '@el-bannawy/lib';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

const lessonService = new LessonService();
const applicationService = new LessonApplicationService(lessonService);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const result = await applicationService.getLessonById(id);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    const lesson = result.value;

    const summary = {
      id: lesson.id,
      title: lesson.title,
      unitId: lesson.unitId,
      displayOrder: lesson.displayOrder,
      estimatedDuration: lesson.estimatedDuration ?? 30,
      isPremium: !!lesson.isPremium,
      hasVideo: false,
      hasHomework: !!lesson.homeworkEnabled,
      hasQuiz: !!lesson.quizEnabled,
      status: lesson.status,
      updatedAt: lesson.updatedAt,
    };

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 },
    );
  }
}
