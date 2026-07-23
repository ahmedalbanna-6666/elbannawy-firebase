import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { LessonVideoRepository, TimelineEventRepository, VideoProgressRepository } from '@el-bannawy/lib';

const videoRepository = new LessonVideoRepository();
const eventRepository = new TimelineEventRepository();
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

    const [eventsResult, progressResult] = await Promise.all([
      eventRepository.listByVideo(id),
      progressRepository.getByUserAndVideo(decoded.uid, id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        video: videoResult.value,
        timelineEvents: eventsResult.ok ? eventsResult.value : [],
        progress: progressResult.ok && progressResult.value ? progressResult.value : null,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
}
