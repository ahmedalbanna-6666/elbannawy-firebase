import { NextRequest, NextResponse } from 'next/server';
import { LessonVideoRepository, CreateLessonVideoInputSchema } from '@el-bannawy/lib';

const videoRepository = new LessonVideoRepository();

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

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
  let body: { youtubeUrl?: string };
  try {
    body = await request.json() as { youtubeUrl?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' }, timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  const youtubeUrl = body.youtubeUrl?.trim();
  if (!youtubeUrl) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'youtubeUrl is required' }, timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  const providerVideoId = extractYouTubeId(youtubeUrl);
  if (!providerVideoId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid YouTube URL' }, timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  const existingList = await videoRepository.listByLesson(id);
  const nextOrder = existingList.ok
    ? existingList.value.reduce((max, v) => Math.max(max, v.displayOrder), -1) + 1
    : 0;

  const parsed = CreateLessonVideoInputSchema.safeParse({
    id: `${id}_${providerVideoId}`,
    lessonId: id,
    title: `Video ${String(nextOrder + 1)}`,
    provider: 'youtube',
    providerVideoId,
    providerUrl: youtubeUrl,
    durationSeconds: 0,
    displayOrder: nextOrder,
  });

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
