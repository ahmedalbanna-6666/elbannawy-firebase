import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { NotificationRepository } from '@el-bannawy/lib';

const notificationRepo = new NotificationRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const result = await notificationRepo.getPreferences(decoded.uid);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const now = new Date().toISOString();
    const preferences = {
      id: decoded.uid,
      userId: decoded.uid,
      lessonReminders: body.lessonReminders ?? true,
      homeworkReminders: body.homeworkReminders ?? true,
      liveSessionReminders: body.liveSessionReminders ?? true,
      achievementNotifications: body.achievementNotifications ?? true,
      motivationalMessages: body.motivationalMessages ?? true,
      studyTips: body.studyTips ?? true,
      teacherAnnouncements: body.teacherAnnouncements ?? true,
      pushEnabled: body.pushEnabled ?? true,
      emailEnabled: body.emailEnabled ?? false,
      whatsappEnabled: body.whatsappEnabled ?? false,
      updatedAt: now,
    };

    const result = await notificationRepo.upsertPreferences(preferences as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
