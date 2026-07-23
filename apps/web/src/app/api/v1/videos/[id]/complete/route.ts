import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { LessonVideoRepository, VideoProgressRepository } from '@el-bannawy/lib';

const videoRepository = new LessonVideoRepository();
const progressRepository = new VideoProgressRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const { id } = await params;

    const videoResult = await videoRepository.getById(id);
    if (!videoResult.ok || !videoResult.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Video not found' } }, { status: 404 });
    }

    const progressId = `${decoded.uid}_${id}`;
    const result = await progressRepository.upsert(progressId, {
      id: progressId,
      userId: decoded.uid,
      videoId: id,
      lessonId: videoResult.value.lessonId,
      lastPositionSeconds: videoResult.value.durationSeconds,
      watchedSeconds: videoResult.value.durationSeconds,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    await progressRepository.upsert(progressId, {
      completed: true,
      completedAt: new Date().toISOString(),
    });

    const updated = await progressRepository.getByUserAndVideo(decoded.uid, id);
    return NextResponse.json({ success: true, data: updated.ok ? updated.value : null });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
}
