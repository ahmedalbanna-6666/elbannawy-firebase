import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { LessonVideoRepository, VideoProgressRepository } from '@el-bannawy/lib';

const videoRepository = new LessonVideoRepository();
const progressRepository = new VideoProgressRepository();

export async function GET(
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

    const progressResult = await progressRepository.getByUserAndVideo(decoded.uid, id);
    const progress = progressResult.ok && progressResult.value ? progressResult.value : null;

    return NextResponse.json({
      success: true,
      data: {
        resumePosition: progress?.lastPositionSeconds ?? 0,
        completed: progress?.completed ?? false,
        watchPercent: videoResult.value.durationSeconds > 0
          ? Math.round(((progress?.watchedSeconds ?? 0) / videoResult.value.durationSeconds) * 100)
          : 0,
        watchedSeconds: progress?.watchedSeconds ?? 0,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
}
