import { NextRequest, NextResponse } from 'next/server';
import { LessonService, LessonApplicationService } from '@el-bannawy/lib';

const lessonService = new LessonService();
const applicationService = new LessonApplicationService(lessonService);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  let body: { displayOrder?: number };
  try {
    body = await request.json() as { displayOrder?: number };
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
  }
  try {
    const result = await applicationService.changeOrder(id, { displayOrder: body.displayOrder }, 0);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
