import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { LessonVideoRepository } from '@el-bannawy/lib';

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

    // Document ID is deterministic: userId_videoId
    const progressId = `${decoded.uid}_${videoId}`;
    const db = getAdminDb();
    const snap = await db.collection('videoProgress').doc(progressId).get();
    if (!snap.exists) {
      return NextResponse.json({ success: true, data: { watchedSeconds: 0, completed: false, lastPositionSeconds: 0 } });
    }
    const data = snap.data() as { watchedSeconds?: number; completed?: boolean; lastPositionSeconds?: number };
    return NextResponse.json({
      success: true,
      data: {
        watchedSeconds: data.watchedSeconds ?? 0,
        completed: data.completed ?? false,
        lastPositionSeconds: data.lastPositionSeconds ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Failed to fetch progress' } }, { status: 500 });
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
    const db = getAdminDb();
    const docRef = db.collection('videoProgress').doc(progressId);
    const existing = await docRef.get();

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      userId: decoded.uid,
      videoId,
      lessonId,
      lastPositionSeconds: (body.lastPosition as number) ?? (body.lastPositionSeconds as number) ?? 0,
      watchedSeconds: (body.watchedSeconds as number) ?? 0,
      updatedAt: now,
      lastActiveAt: now,
    };

    if (!existing.exists) {
      updateData.createdAt = now;
      updateData.completed = false;
      updateData.watchedSeconds = 0;
    }

    if (body.completed) {
      updateData.completed = true;
      updateData.completedAt = now;
    }

    await docRef.set(updateData, { merge: true });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Failed to save progress' } }, { status: 500 });
  }
}
