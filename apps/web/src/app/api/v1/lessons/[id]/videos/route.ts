import { NextRequest, NextResponse } from 'next/server';
import { LessonVideoRepository, CreateLessonVideoInputSchema } from '@el-bannawy/lib';

const videoRepository = new LessonVideoRepository();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const result = await videoRepository.listByLesson(id);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { success: true, data: { items: result.value }, timestamp: new Date().toISOString() },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }, timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  const parsed = CreateLessonVideoInputSchema.safeParse({ ...body, lessonId: id });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: parsed.error.message }, timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  try {
    const result = await videoRepository.create({
      id: parsed.data.id,
      lessonId: parsed.data.lessonId,
      title: parsed.data.title,
      provider: parsed.data.provider,
      providerVideoId: parsed.data.providerVideoId,
      providerUrl: parsed.data.providerUrl,
      durationSeconds: parsed.data.durationSeconds,
      thumbnailUrl: parsed.data.thumbnailUrl,
      displayOrder: parsed.data.displayOrder,
      enabled: parsed.data.enabled,
      interactiveTimelineEnabled: parsed.data.interactiveTimelineEnabled,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error, timestamp: new Date().toISOString() },
        { status: result.error.code === 'ALREADY_EXISTS' ? 409 : 500 },
      );
    }
    return NextResponse.json(
      { success: true, data: result.value, timestamp: new Date().toISOString() },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
