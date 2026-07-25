import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { LiveRepository } from '@el-bannawy/lib';
import { getAdminDb } from '@/lib/firebase/admin';

const liveRepo = new LiveRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const result = await liveRepo.listBookings({ studentId: decoded.uid });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    // Populate session data for each booking
    const db = getAdminDb();
    const bookings: Record<string, unknown>[] = result.value ?? [];
    const enriched = await Promise.all(bookings.map(async (b) => {
      const sid = b.sessionId as string | undefined;
      if (!sid) return { ...b, session: null };
      const snap = await db.collection('liveSessions').doc(sid).get();
      let sessionData: Record<string, unknown> | null = null;
      if (snap.exists) {
        sessionData = { id: snap.id, ...snap.data(), teacher: null } as Record<string, unknown>;
        const tId = sessionData.teacherId as string | undefined;
        if (tId) {
          const tSnap = await db.collection('users').doc(tId).get();
          const tData = tSnap.data();
          sessionData.teacher = tData ? { id: tId, name: (tData.fullName ?? tData.name ?? '') as string } : { id: tId, name: '' };
        }
      }
      return { ...b as Record<string, unknown>, session: sessionData };
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
