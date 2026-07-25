import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { LessonProgressRepository, LessonRepository } from '@el-bannawy/lib';

const progressRepository = new LessonProgressRepository();
const lessonRepository = new LessonRepository();

async function authenticateStudent(request: NextRequest): Promise<{ studentId: string } | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
  try {
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { studentId: decoded.uid };
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
): Promise<NextResponse> {
  const auth = await authenticateStudent(request);
  if (auth instanceof NextResponse) return auth;
  const { studentId } = auth;

  try {
    const { lessonId } = await params;

    const lessonResult = await lessonRepository.getLessonById(lessonId);
    if (!lessonResult.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Lesson not found' } },
        { status: 404 },
      );
    }

    const result = await progressRepository.getStudentLessonProgress(studentId, lessonId);

    if (!result.ok || !result.value) {
      return NextResponse.json({
        success: true,
        data: {
          studentId,
          lessonId,
          status: 'not_started',
          completedActivities: 0,
          totalActivities: 0,
          percentage: 0,
        },
      });
    }

    return NextResponse.json({ success: true, data: result.value });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
): Promise<NextResponse> {
  const auth = await authenticateStudent(request);
  if (auth instanceof NextResponse) return auth;
  const { studentId } = auth;

  try {
    const { lessonId } = await params;

    const body = (await request.json()) as Record<string, unknown>;

    const lessonResult = await lessonRepository.getLessonById(lessonId);
    if (!lessonResult.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Lesson not found' } },
        { status: 404 },
      );
    }

    const existing = await progressRepository.getStudentLessonProgress(studentId, lessonId);

    if (!existing.ok || !existing.value) {
      const progressId = `${studentId}_${lessonId}`;
      const unitId = lessonResult.value.unitId;

      const createResult = await progressRepository.createProgress({
        id: progressId,
        studentId,
        lessonId,
        unitId,
        totalActivities: (body.totalActivities as number) ?? 0,
      });

      if (!createResult.ok) {
        return NextResponse.json(
          { success: false, error: createResult.error },
          { status: 500 },
        );
      }

      const updateResult = await progressRepository.updateProgress(progressId, {
        status: (body.status as 'not_started' | 'in_progress' | 'completed') ?? 'in_progress',
        completedActivities: body.completedActivities as number | undefined,
        totalActivities: body.totalActivities as number | undefined,
        score: body.score as number | undefined,
        startedAt: body.startedAt as string | undefined,
      });

      if (!updateResult.ok) {
        return NextResponse.json(
          { success: false, error: updateResult.error },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, data: updateResult.value });
    }

    const updateResult = await progressRepository.updateProgress(existing.value.id, {
      status: body.status as 'not_started' | 'in_progress' | 'completed' | undefined,
      completedActivities: body.completedActivities as number | undefined,
      totalActivities: body.totalActivities as number | undefined,
      score: body.score as number | undefined,
      startedAt: body.startedAt as string | undefined,
      completedAt: body.completedAt as string | undefined,
    });

    if (!updateResult.ok) {
      return NextResponse.json(
        { success: false, error: updateResult.error },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: updateResult.value });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}
