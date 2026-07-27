import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';
import { LiveRepository, NotificationDispatcher } from '@el-bannawy/lib';

const liveRepo = new LiveRepository();
const dispatcher = new NotificationDispatcher();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const role = (userDoc.data() as { role?: string })?.role ?? 'student';
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Only teachers and admins can start sessions' } }, { status: 403 });
    }

    const { id } = await params;

    const result = await liveRepo.updateSession(id, {
      status: 'LIVE' as any,
      liveAt: new Date().toISOString(),
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    try {
      const bookingsSnap = await db.collection('liveBookings').where('liveSessionId', '==', id).where('status', '==', 'CONFIRMED').select('studentId').get();
      const bookedUserIds = bookingsSnap.docs.map((d) => (d.data() as any).studentId);
      if (bookedUserIds.length > 0) {
        await dispatcher.liveSessionStarted(bookedUserIds, result.value?.title || 'حصّة مباشرة', id);
      }
    } catch {
    }

    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
