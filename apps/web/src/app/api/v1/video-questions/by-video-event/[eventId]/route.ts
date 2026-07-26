import { NextRequest, NextResponse } from 'next/server';
import { TimelineEventRepository, ActivityRepository } from '@el-bannawy/lib';

const eventRepository = new TimelineEventRepository();
const activityRepository = new ActivityRepository();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
): Promise<NextResponse> {
  const { eventId } = await params;
  try {
    const eventResult = await eventRepository.getById(eventId);
    if (!eventResult.ok || !eventResult.value) {
      return NextResponse.json({ success: true, data: null });
    }

    const event = eventResult.value;
    const activityResult = await activityRepository.getActivityById(event.activityId);
    if (!activityResult.ok || !activityResult.value) {
      return NextResponse.json({ success: true, data: null });
    }

    const activity = activityResult.value;
    const configData = activity.config?.data as {
      options?: { id: string; text: string; isCorrect: boolean; displayOrder?: number }[];
    } | undefined;

    return NextResponse.json({
      success: true,
      data: {
        id: activity.id,
        title: activity.title,
        type: activity.type,
        options: (configData?.options ?? []).map((o, idx) => ({
          id: o.id ?? `opt_${idx}`,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      },
    });
  } catch {
    return NextResponse.json({ success: true, data: null });
  }
}
