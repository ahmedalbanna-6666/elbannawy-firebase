import { NextRequest, NextResponse } from 'next/server';
import { TimelineEventRepository } from '@el-bannawy/lib';

const eventRepository = new TimelineEventRepository();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
): Promise<NextResponse> {
  const { eventId } = await params;
  try {
    const result = await eventRepository.getById(eventId);
    if (!result.ok || !result.value) {
      return NextResponse.json({ success: true, data: null });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch {
    return NextResponse.json({ success: true, data: null });
  }
}
