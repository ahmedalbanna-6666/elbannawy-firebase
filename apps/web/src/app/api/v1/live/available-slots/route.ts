import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { LiveRepository } from '@el-bannawy/lib';

const liveRepo = new LiveRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId') ?? decoded.uid;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0];

    const [availResult, blocksResult, sessionsResult] = await Promise.all([
      liveRepo.getTeacherAvailability(teacherId),
      liveRepo.listDateBlocks(teacherId),
      liveRepo.listSessions({ teacherId, dateFrom, dateTo }),
    ]);

    if (!availResult.ok) {
      return NextResponse.json({ success: false, error: availResult.error }, { status: 500 });
    }

    const availability = availResult.value;
    const dateBlocks = blocksResult.ok ? blocksResult.value : [];
    const existingSessions = sessionsResult.ok ? sessionsResult.value : [];

    const blockedDates = new Set(dateBlocks.map(b => b.blockedDate));
    const existingSessionKeys = new Set(
      existingSessions
        .filter(s => s.status !== 'CANCELLED' && s.status !== 'ARCHIVED')
        .map(s => `${s.date}_${s.startTime}`),
    );

    const availableSlots: Array<{
      date: string;
      startTime: string;
      endTime: string;
      availabilitySlotId: string;
      dayOfWeek: number;
    }> = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T').at(0) ?? '';
      const dayOfWeek = date.getDay();

      if (blockedDates.has(dateStr)) continue;

      for (const slot of availability) {
        if (slot.dayOfWeek !== dayOfWeek) continue;
        if (slot.effectiveFrom && dateStr < slot.effectiveFrom) continue;
        if (slot.effectiveTo && dateStr > slot.effectiveTo) continue;

        const slotKey = `${dateStr}_${slot.startTime}`;
        if (existingSessionKeys.has(slotKey)) continue;

        availableSlots.push({
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          availabilitySlotId: slot.id,
          dayOfWeek,
        });
      }
    }

    return NextResponse.json({ success: true, data: availableSlots });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
