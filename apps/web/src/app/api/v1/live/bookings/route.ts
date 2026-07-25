import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { LiveRepository } from '@el-bannawy/lib';
import { getAdminDb } from '@/lib/firebase/admin';

const liveRepo = new LiveRepository();

function mapErrorCode(code: string): number {
  switch (code) {
    case 'INVALID_INPUT': return 400;
    case 'NOT_FOUND': return 404;
    case 'ALREADY_EXISTS': return 409;
    default: return 500;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    let body: { sessionId?: string; slotId?: string; date?: string; startTime?: string; endTime?: string; teacherId?: string };
    try {
      body = await request.json() as typeof body;
    } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const sessionId = body.sessionId;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'sessionId is required' } }, { status: 400 });
    }

    // Check session exists and has capacity
    const db = getAdminDb();
    const sessionSnap = await db.collection('liveSessions').doc(sessionId).get();
    if (!sessionSnap.exists) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } }, { status: 404 });
    }
    const sessionData = sessionSnap.data() as { maxStudents?: number; status?: string; teacherId?: string };

    if (sessionData.status === 'CANCELLED' || sessionData.status === 'COMPLETED' || sessionData.status === 'ARCHIVED') {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Session is not available for booking' } }, { status: 400 });
    }

    // Check duplicate booking
    const existingBookings = await db.collection('liveBookings')
      .where('sessionId', '==', sessionId)
      .where('studentId', '==', decoded.uid)
      .where('status', '==', 'CONFIRMED')
      .get();
    if (!existingBookings.empty) {
      return NextResponse.json({ success: false, error: { code: 'ALREADY_EXISTS', message: 'Already booked this session' } }, { status: 409 });
    }

    // Check capacity
    const allBookings = await db.collection('liveBookings')
      .where('sessionId', '==', sessionId)
      .where('status', '==', 'CONFIRMED')
      .get();
    if (sessionData.maxStudents && allBookings.size >= sessionData.maxStudents) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Session is full' } }, { status: 400 });
    }

    const bookingId = 'bk-' + sessionId + '-' + decoded.uid;
    const result = await liveRepo.createBooking({
      id: bookingId,
      sessionId,
      studentId: decoded.uid,
      subscriptionId: null,
      status: 'CONFIRMED',
      bookedAt: new Date().toISOString(),
      cancelledAt: null,
      cancelReason: null,
    } as any);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
    }

    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    let body: { id: string; reason?: string };
    try {
      body = await request.json() as { id: string; reason?: string };
    } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const result = await liveRepo.cancelBooking(body.id, body.reason);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
