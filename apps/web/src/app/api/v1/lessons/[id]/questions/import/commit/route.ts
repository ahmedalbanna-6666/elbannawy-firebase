import { NextResponse, type NextRequest } from 'next/server';
import type { ImportedActivity } from '@el-bannawy/lib';
import { QuestionImportService } from '@el-bannawy/lib';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const lessonId = (await params).id;
  try {
    const body: { activities?: ImportedActivity[] } = await request.json() as Record<string, unknown>;

    if (!body.activities || body.activities.length === 0) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'No activities to commit' } }, { status: 400 });
    }

    const service = new QuestionImportService();
    const result = await service.commit(lessonId, body.activities);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Commit failed' } }, { status: 500 });
  }
}
