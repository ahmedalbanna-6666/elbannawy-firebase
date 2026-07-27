import { NextRequest, NextResponse } from 'next/server';
import { ActivityService, ActivityRepository, StudentAttemptRepository, LessonProgressRepository } from '@el-bannawy/lib';

const service = new ActivityService(
  new ActivityRepository(),
  new StudentAttemptRepository(),
  new LessonProgressRepository(),
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId') ?? undefined;
    const cursor = searchParams.get('cursor') ?? undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;

    if (lessonId) {
      const result = await service.getActivitiesByLesson(lessonId);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json({ data: result.data });
    }

    const result = await service.listActivities(undefined, { cursor, limit });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await service.createActivity(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
