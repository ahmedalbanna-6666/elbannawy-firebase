import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { VideoProgressRepository, LessonVideoRepository } from '@el-bannawy/lib';

const progressRepository = new VideoProgressRepository();
const videoRepository = new LessonVideoRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const videoId = (await params).id;
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);

    const result = await progressRepository.getByUserAndVideo(decoded.uid, videoId);
    if (!result.ok || !result.value) {
      return NextResponse.json({ success: true, data: { watchedSeconds: 0, completed: false, lastPositionSeconds: 0 } });
    }
    return NextResponse.json({
      success: true,
      data: {
        watchedSeconds: result.value.watchedSeconds,
        completed: result.value.completed,
        lastPositionSeconds: result.value.lastPositionSeconds,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch progress' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const videoId = (await params).id;
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const body = (await request.json()) as Record<string, unknown>;

    const videoResult = await videoRepository.getById(videoId);
    const lessonId = (videoResult.ok && videoResult.value) ? videoResult.value.lessonId : '';

    const progressId = `${decoded.uid}_${videoId}`;
    const result = await progressRepository.upsert(progressId, {
      id: progressId,
      userId: decoded.uid,
      videoId,
      lessonId,
      lastPositionSeconds: (body.lastPosition as number) ?? body.lastPositionSeconds as number ?? 0,
      watchedSeconds: (body.watchedSeconds as number) ?? 0,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    if (body.completed) {
      await progressRepository.upsert(progressId, { completed: true, completedAt: new Date().toISOString() });
    }

    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to save progress' } }, { status: 500 });
  }
}
