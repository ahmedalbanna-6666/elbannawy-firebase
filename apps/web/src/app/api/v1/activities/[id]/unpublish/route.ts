import { NextRequest, NextResponse } from 'next/server';
import { ActivityService, ActivityRepository, StudentAttemptRepository, LessonProgressRepository } from '@el-bannawy/lib';
const service = new ActivityService(
  new ActivityRepository(),
  new StudentAttemptRepository(),
  new LessonProgressRepository(),
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const result = await service.unpublishActivity(id, requestId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
