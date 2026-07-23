import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { TimelineEventRepository, TimelineEventProgressRepository } from '@el-bannawy/lib';

const eventRepository = new TimelineEventRepository();
const progressRepository = new TimelineEventProgressRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const { eventId } = await params;

    const eventResult = await eventRepository.getById(eventId);
    if (!eventResult.ok || !eventResult.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Timeline event not found' } }, { status: 404 });
    }

    const event = eventResult.value;
    const progressId = `${decoded.uid}_${eventId}`;

    const upsertResult = await progressRepository.upsert({
      id: progressId,
      userId: decoded.uid,
      videoId: event.videoId,
      lessonId: event.lessonId,
      timelineEventId: eventId,
      activityId: event.activityId,
    });

    if (!upsertResult.ok) {
      return NextResponse.json({ success: false, error: upsertResult.error }, { status: 500 });
    }

    const completeResult = await progressRepository.markCompleted(progressId);
    if (!completeResult.ok) {
      return NextResponse.json({ success: false, error: completeResult.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { completed: true, eventId, resumeVideo: true },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
}
