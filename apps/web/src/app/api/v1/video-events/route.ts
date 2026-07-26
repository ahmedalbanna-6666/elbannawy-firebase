import { NextRequest, NextResponse } from 'next/server';
import { TimelineEventRepository } from '@el-bannawy/lib';

const eventRepository = new TimelineEventRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'videoId is required' } }, { status: 400 });
  }

  try {
    const result = await eventRepository.listByVideo(videoId);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    const data = (result.value ?? []).map((evt) => ({
      id: evt.id,
      videoId: evt.videoId,
      timestamp: evt.timestampSeconds,
      type: evt.eventType,
      title: evt.eventType === 'QUESTION' ? '' : '',
    }));
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
