import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    const { id: activityId } = await params;

    const db = getAdminDb();

    const [activitySnap, attemptsSnap] = await Promise.all([
      db.collection('activities').doc(activityId).get(),
      db.collection('studentAttempts')
        .where('activityId', '==', activityId)
        .where('studentId', '==', decoded.uid)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get(),
    ]);

    if (!activitySnap.exists) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Activity not found' } }, { status: 404 });
    }

    const latestAttempt = attemptsSnap.docs[0]?.data();
    const status = latestAttempt ? latestAttempt.status : 'not_started';
    const score = latestAttempt?.score ?? null;
    const attemptCount = attemptsSnap.size;

    return NextResponse.json({
      success: true,
      data: {
        activityId,
        studentId: decoded.uid,
        status,
        score,
        attemptCount,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }
}
