import { NextRequest, NextResponse } from 'next/server';
import { LessonService, LessonApplicationService } from '@el-bannawy/lib';

const lessonService = new LessonService();
const applicationService = new LessonApplicationService(lessonService);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }, timestamp: new Date().toISOString() }, { status: 400 });
  }

  const expectedVersion = Number(body._expectedVersion) || 0;

  try {
    const result = await applicationService.changeOrder(id, body, expectedVersion);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, timestamp: new Date().toISOString() }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result.value, timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
