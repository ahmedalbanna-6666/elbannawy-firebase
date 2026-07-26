import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { TimelineEventRepository, ActivityRepository, LessonVideoRepository } from '@el-bannawy/lib';

const eventRepository = new TimelineEventRepository();
const activityRepository = new ActivityRepository();
const videoRepository = new LessonVideoRepository();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const body = (await request.json()) as {
      videoId: string;
      timestamp: number;
      title: string;
      description?: string;
      required?: boolean;
      type: string;
      options: { text: string; isCorrect: boolean; displayOrder?: number }[];
    };

    if (!body.videoId || body.timestamp === undefined || !body.title || !body.options?.length) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'videoId, timestamp, title, and options are required' } }, { status: 400 });
    }

    const videoResult = await videoRepository.getById(body.videoId);
    if (!videoResult.ok || !videoResult.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Video not found' } }, { status: 404 });
    }

    const lessonId = videoResult.value.lessonId;
    const questionId = `vq_${Date.now()}`;
    const eventId = `te_${Date.now()}`;

    const activityResult = await activityRepository.createActivity({
      id: questionId,
      lessonId,
      type: 'MULTIPLE_CHOICE',
      title: body.title,
      instructions: body.description ?? undefined,
      displayOrder: 0,
      config: {
        schemaVersion: 1,
        data: {
          questionType: 'video',
          options: body.options.map((opt, idx) => ({
            id: `opt_${questionId}_${idx}`,
            text: opt.text,
            isCorrect: opt.isCorrect,
            displayOrder: opt.displayOrder ?? idx,
          })),
        },
      },
      isRequired: body.required ?? true,
      isScorable: true,
      isPractice: false,
      retryable: false,
      status: 'published',
    });

    if (!activityResult.ok) {
      return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create question activity' } }, { status: 500 });
    }

    const eventResult = await eventRepository.create({
      id: eventId,
      videoId: body.videoId,
      lessonId,
      activityId: questionId,
      timestampSeconds: body.timestamp,
      eventType: 'QUESTION',
      required: body.required ?? true,
      enabled: true,
      displayOrder: 0,
    });

    if (!eventResult.ok) {
      return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create timeline event' } }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: questionId,
        eventId,
        videoId: body.videoId,
        timestamp: body.timestamp,
        title: body.title,
        type: 'MULTIPLE_CHOICE',
        options: body.options.map((opt, idx) => ({
          id: `opt_${questionId}_${idx}`,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Failed to create question' } }, { status: 500 });
  }
}
