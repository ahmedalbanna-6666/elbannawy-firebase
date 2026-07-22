import { NextRequest, NextResponse } from 'next/server';
import { LessonService, LessonApplicationService } from '@el-bannawy/lib';

const lessonService = new LessonService();
const applicationService = new LessonApplicationService(lessonService);

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
